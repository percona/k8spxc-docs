# In-cluster failover

A node running Percona XtraDB Cluster can fail at any time — a Pod restart, a node drain, or the primary Pod going down. The rest of the cluster stays up, and Kubernetes, Galera and the proxy in front of the cluster recover the failed node automatically in most cases. The Operator takes part only in [full cluster crash recovery](architecture-workflows.md#full-cluster-crash-recovery).

This page covers what to expect when a node fails and how to confirm recovery completed. For failover when an entire site goes down, see [Set up disaster recovery](dr.md) instead.

## How it works

Restoring a single failed node is fully automatic:

1. The StatefulSet controller recreates the failed Pod. If the Pod ran on a failed Kubernetes node, the controller recreates it only after the Node object is removed or the stuck Pod is force-deleted. See [Who owns what](architecture-responsibilities.md#kubernetes).
2. The recreated Pod rejoins the cluster and catches up on the data it missed while it was down.
3. The proxy reroutes writes to a surviving node after its health check marks the failed node down.

Even though recovery is automatic, there are some behaviors that affect your application. See [What to expect](#what-to-expect) for more details, and [Verify a failover completed](#verify-a-failover-completed) to confirm recovery actually completed.

### Pod recreation

Kubernetes probes drive recovery independently of the proxy. The readiness probe removes a Pod from the `cluster1-pxc` Service, and so from the proxy configuration, after the node has been out of the primary component, or neither `Synced` nor a donor, for about 2.5 minutes. The liveness probe restarts the `pxc` container when the node stays outside the primary component for about 30 seconds. The probe starts 5 minutes after the container starts (`pxc.livenessProbes.initialDelaySeconds: 300`). A node whose container started less than 5 minutes ago can stay outside the primary component until then. See [Health checks and probes](architecture-probes.md).

### Rejoining the cluster

The recreated Pod rejoins the cluster and catches up on the data it missed while it was down. Galera does this via SST (State Snapshot Transfer), making a full data copy from a healthy node acting as donor. When the gap is small enough, Galera uses IST (Incremental State Transfer) as a faster way to catch up. The time it takes to catch up depends on the size of the gap and the network conditions.

The node providing SST is called the *donor*. While it is donating, its `wsrep_local_state_comment` shows `Donor/Desynced`. This also matters during a typical single-node restart. If the gap is large enough to require a full SST, the healthy node that Galera selects as donor will temporarily fail HAProxy's health check, unless it is the only node the proxy knows about or you set `OK_IF_DONOR`. As a result, this donor node can drop out of HAProxy rotation for the entire duration of the SST. This issue affects not only the node that is rejoining, but also the donor node itself.

### Traffic rerouting

Traffic rerouting depends on which proxy is in use.

=== "HAProxy"

    HAProxy always treats `<cluster>-pxc-0` as the only non-backup server. Every other node is a `backup` server that receives traffic only if `pxc-0` fails its health check.

    HAProxy decides only by its health check, an external script. It doesn't mark a node down because a connection attempt failed, and it doesn't resend a failed connection to another node. The check is `check inter 10000 rise 1 fall 2`:

    - It runs every 10 seconds, and HAProxy marks a node down after two failed checks in a row. The check fails only once Galera reports the node as outside the primary component, about 5 seconds after a network failure. Until HAProxy marks the node down 10 to 20 seconds after that, new and existing connections still go to the node and fail with `ERROR 1047 (08S01): WSREP has not yet prepared node for application use`. Queries that don't read a table, such as `SELECT 1`, still succeed on such a node, so don't use them to check whether a connection is usable. If `mysqld` hangs instead of refusing connections, each check can take up to its timeout, 10 seconds by default (`HA_CONNECTION_TIMEOUT` in the Secret named in `haproxy.envVarsSecret`).
    - A node passes the check only when it is in the primary component, `Synced`, has `pxc_maint_mode` set to `DISABLED`, and doesn't reject queries (`wsrep_reject_queries` is `NONE` and `wsrep_sst_donor_rejects_queries` is `OFF`). A donor passes only if it is the only node the proxy knows about, or you set `OK_IF_DONOR` to `1` in the same Secret.
    - When HAProxy marks a node down, it closes the sessions to that node.
    - HAProxy also follows the list of ready database Pods. When a database Pod is deleted, restarted or becomes not ready, the `pxc-monit` container removes it from the HAProxy configuration and reloads HAProxy, usually 2 to 15 seconds later (up to about 35 seconds). When the Pod is ready again, `pxc-monit` adds it back the same way. After a reload, HAProxy closes all sessions still open on the previous configuration after 10 seconds (`hard-stop-after 10s`), including sessions to healthy nodes.
    - Each HAProxy Pod checks the nodes and reloads on its own. For a few seconds during a failover or failback, connections that go through different HAProxy Pods can reach different writers.

=== "ProxySQL, native scheduler mode"

    ProxySQL uses its own built-in Galera support for load balancing: a monitor thread checks each node's state roughly once a second and moves nodes between hostgroups accordingly. ProxySQL always configures a backup-writer hostgroup containing every non-writer node, so a promotion candidate is always available.

    As with HAProxy, the writer is predictable. The Operator sets the weights: `cluster1-pxc-0` gets the highest write weight (1000000), and every other node gets 1000 minus its Pod number. So `pxc-0` is the writer while it is healthy, and the weights decide which node takes over. Reads are weighted the other way: `pxc-0` has the lowest read weight (600, against about 1000 for the others), so it receives fewer reads.

=== "ProxySQL, external scheduler mode"

    When an [external scheduler](proxysql-conf.md#proxysql-scheduler-tech-preview) is enabled, ProxySQL elects a single writer dynamically instead of relying on native Galera hostgroups. It uses settings such as `activeFailover=1`, `singlePrimary=true`, and `maxNumWriters=1`. The same weights as in native mode apply, so `cluster1-pxc-0` is preferred as the writer.

    This mode's single-writer guarantee is not absolute at every instant. During a failover cycle, there can be a brief window where two nodes are both marked online as writer at once. This is a normal, transient part of how the scheduler re-elects a writer, not a malfunction. However, an application that assumes exactly one writer is reachable at all times should not treat this mode's guarantee as instantaneous.

## What to expect

Automatic recovery handles the failure itself. Two behaviors are not obvious from the mechanics above, and both can affect your application directly.

**Failback forcibly closes the active session.** When `pxc-0` recovers, HAProxy does not leave traffic on the backup node it failed over to. It closes the sessions to the backup node as soon as it marks `pxc-0` up again. HAProxy does that at its next check, up to 10 seconds after `pxc-0` is `Synced`. If the `pxc-0` Pod was restarted, failback happens when `pxc-monit` adds the Pod back, 2 to 15 seconds after it becomes ready. Each HAProxy Pod fails back on its own, so the session drops can be spread over several seconds. You may see the following error for a client that was connected to the backup node and then failed:

```{.text .no-copy}
ERROR 2013 (HY000): Lost connection to MySQL server during query
```

This can happen *after* `kubectl get pxc` already reports the cluster as `ready`. Cluster-ready status confirms the Operator reconciled, not that every existing connection is still valid. Design your application to reconnect on error rather than treat a long-lived connection as safe.

**Losing two of three nodes is a Galera-level failure, not just a proxy one.** If a cluster loses two of three nodes at once, the survivor no longer has a majority of the cluster's last known membership, so by default Galera takes it out of the Primary Component. Once that happens, the node stops accepting *any* query, including both reads and writes, and returns an error like this:

```{.text .no-copy}
ERROR 1047 (08S01): WSREP has not yet prepared node for application use
```

This is a Galera quorum issue, and no proxy setting can route around a node that refuses queries at the database layer. What happens next is driven by the probes and the Operator, not by the survivor alone:

1. The survivor's liveness probe fails, because the node is outside the primary component. After about 30 seconds (or, if the container started less than 5 minutes ago, once those 5 minutes have passed), Kubernetes restarts the `pxc` container. See [Health checks and probes](architecture-probes.md#what-this-means-for-users).
2. If no database node is in a primary component when the restarted container starts, and the node has Galera state on its volume, it doesn't start `mysqld`. It logs `FULL_PXC_CLUSTER_CRASH` and its `seqno`, and waits. The recreated Pods do the same.
3. The Operator starts recovery only when all database Pods are `Running` and every one of them is waiting like this. A Pod that is still `Pending`, for example because its Kubernetes node is gone, blocks recovery. Then the Operator picks the node with the highest `seqno` and starts it as a new primary component. The other nodes join it. See [Full cluster crash recovery workflow](architecture-workflows.md#full-cluster-crash-recovery).

The database Pods are recreated one at a time (`OrderedReady`). A Pod that waits for recovery counts as ready, so the next Pod starts. 

This is automatic with `pxc.autoRecovery: true`, the default. If you turned automatic recovery off, or the Operator refused it, follow [Crash recovery](recovery.md).

With `autoRecovery: false`, the Operator emits no events and `kubectl get pxc` stays `initializing`. All database Pods show `Ready` while they wait. The Pod logs still say "Cluster will recover automatically from the crash now". Ignore that line and follow [Crash recovery](recovery.md).

If the other nodes are still running as a primary component, for example after a network partition, the restarted node finds them and rejoins with IST or SST.

While the recovered node sends an SST to the others, it is in the `Donor` state. HAProxy's health check accepts a Donor node only when it is the only node the proxy knows about, or when you set `OK_IF_DONOR` to `1`. See [Rejoining the cluster](#rejoining-the-cluster).

!!! warning

    Don't force a primary component with `SET GLOBAL wsrep_provider_options='pc.bootstrap=YES'` while the Operator is running. The container restart discards the setting, and a manual bootstrap races with the Operator's own recovery. If one of the other nodes is still up as a primary elsewhere, you create two independent clusters with diverging data.

## Take a node out of rotation for maintenance

The behavior above applies to an unplanned failure. To perform maintenance without triggering one, take a node out of rotation deliberately instead of stopping MySQL and forcing a failover.

**With either proxy**, use `pxc_maint_mode`:

```{sql data-prompt="mysql> "}
mysql> SET GLOBAL pxc_maint_mode='MAINTENANCE';
```

With ProxySQL, the proxy stops routing new connections to the node once it is in maintenance mode. The node itself stays online. If it is the current writer, ProxySQL routes writes to a backup-writer node instead.

With HAProxy, the health check fails for a node in maintenance mode, and HAProxy marks the node down 10 to 20 seconds later. From then on, HAProxy sends no new connections to it. When HAProxy marks the node down, it closes the connections that are still open to that node, so your application sees `ERROR 2013 (HY000): Lost connection to MySQL server during query` and must reconnect. The `SET` statement returns after `pxc_maint_transition_period` (10 seconds), which can be before HAProxy has reacted. Wait at least 20 seconds before you stop MySQL. If you maintain `cluster1-pxc-0`, expect the failback session drop when it comes back (see [What to expect](#what-to-expect) above).

Once maintenance is complete, restore the node to normal operation:

```{sql data-prompt="mysql> "}
mysql> SET GLOBAL pxc_maint_mode='DISABLED';
```

`pxc_maint_mode` does not persist across a MySQL restart. If maintenance includes restarting the node, also set the variable in `my.cnf` before the restart, and remove it once the node is back in rotation.

**Without a proxy, on Galera directly**, use `wsrep_desync` to exempt a node from flow control during a long-running operation:

```{sql data-prompt="mysql> "}
mysql> SET GLOBAL wsrep_desync=ON;
-- perform maintenance --
mysql> SET GLOBAL wsrep_desync=OFF;
```

`wsrep_desync` is not a drain command. It doesn't remove the node from the Kubernetes Service, and the Pod stays `Ready`. The node reports the `Donor/Desynced` state. HAProxy's health check rejects it by default, so HAProxy takes the node out of rotation unless it is the only node available or you set `OK_IF_DONOR` to `1`. HAProxy takes such a node out of rotation 10 to 20 seconds after you set `wsrep_desync=ON` and closes its open connections, the same as for maintenance mode. It lets the node fall behind on replication without blocking the rest of the cluster's flow control, which is what makes it safe to run a long operation on that node without stalling everyone else's writes.

## Verify a failover completed

`kubectl get pxc` reporting `ready` confirms the cluster reconciled, not that every node is healthy and reachable from the application's point of view. To confirm a node actually recovered and rejoined:

1. Check the Galera status on every node individually, not just one:

    ```bash
    kubectl exec -it <cluster-name>-pxc-0 -n <namespace> -- mysql -uroot -p -e "
      SHOW STATUS LIKE 'wsrep_cluster_status';
      SHOW STATUS LIKE 'wsrep_cluster_size';
      SHOW STATUS LIKE 'wsrep_local_state_comment';
      SHOW STATUS LIKE 'wsrep_ready';
    "
    ```

    Repeat for `-pxc-1`, `-pxc-2`, and so on. Confirm the following on every node:
    
    - `wsrep_cluster_status = Primary`
    - `wsrep_cluster_size` matches the number of nodes you expect back
    - `wsrep_local_state_comment = Synced`
    - `wsrep_ready = ON`
    
    A node reporting `wsrep_cluster_status = non-Primary` has not rejoined, regardless of what `kubectl get pxc` says.

2. Confirm the proxy serves a write through the same endpoint the application uses, not a direct connection to a single Pod. Use a dedicated check table rather than application data:

    ```{sql data-prompt="mysql> "}
    mysql> CREATE DATABASE IF NOT EXISTS healthcheck;
    mysql> CREATE TABLE IF NOT EXISTS healthcheck.failover_probe (id INT PRIMARY KEY, checked_at TIMESTAMP);
    mysql> REPLACE INTO healthcheck.failover_probe VALUES (1, NOW());
    ```

    A successful write confirms the proxy is routing to a working writer, without touching application tables.

## What not to do

* Do not assume `kubectl get pxc` reporting `ready` means every existing connection is still valid, or that every node has rejoined. See [What to expect](#what-to-expect) and [Verify a failover completed](#verify-a-failover-completed).
* Do not run `pc.bootstrap=YES` or bootstrap a node by hand while the Operator is running. Follow [Crash recovery](recovery.md) instead. A second primary component causes a split brain.

## See also

* [Set up disaster recovery](dr.md) — for losing an entire site, not just a node
* [Configure load balancing](load-balancing.md) — background on how HAProxy and ProxySQL differ
