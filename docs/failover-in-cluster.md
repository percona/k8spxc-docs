# In-cluster failover

A node running Percona XtraDB Cluster can fail at any time — a Pod restart, a node drain, or the primary Pod going down. The rest of the cluster stays up, and the Operator and the proxy in front of it recover the failed node automatically in most cases.

This page covers what to expect when a node fails and how to confirm recovery completed. For failover when an entire site goes down, see [Set up disaster recovery](dr.md) instead.

## How it works

Restoring a single failed node is fully automatic:

1. The Operator detects the failure and recreates the failed Pod.
2. The recreated Pod rejoins the cluster and catches up on the data it missed while it was down.
3. The proxy reroutes writes to the surviving nodes.

Even though recovery is automatic, there are some behaviors that affect your application. See [What to expect](#what-to-expect) for more details, and [Verify a failover completed](#verify-a-failover-completed) to confirm recovery actually completed.

### Pod recreation

Kubernetes probes drive recovery independently of the proxy. The `readiness-check.sh` script removes a Pod from the Service as soon as it stops being the Primary or a synced or donor node. The `liveness-check.sh` script restarts a Pod that stays stuck in that state.

### Rejoining the cluster

The recreated Pod rejoins the cluster and catches up on the data it missed while it was down. Galera does this via SST (State Snapshot Transfer), making a full data copy from a healthy node acting as donor. When the gap is small enough, Galera uses IST (Incremental State Transfer) as a faster way to catch up. The time it takes to catch up depends on the size of the gap and the network conditions.

The node providing SST is called the *donor*. While it is donating, its `wsrep_local_state_comment` shows `Donor/Desynced`. This also matters during a typical single-node restart. If the gap is large enough to require a full SST, the healthy node that the Operator selects as donor will temporarily fail HAProxy's health check. As a result, this donor node can drop out of HAProxy rotation for the entire duration of the SST. This issue affects not only the node that is rejoining, but also the donor node itself.

### Traffic rerouting

Traffic rerouting depends on which proxy is in use.

=== "HAProxy"

    HAProxy always treats `<cluster>-pxc-0` as the only non-backup server. Every other node is a `backup` server that receives traffic only if `pxc-0` fails its health check.

    Two different things happen on two different timelines:

    - HAProxy reroutes the *next new connection attempt* as soon as `pxc-0` stops accepting connections — this is what your application actually feels, and it happens immediately, before any formal check completes.
    - The health check itself (`check inter 10000 rise 1 fall 2`) requires the node to be the Galera primary component and synced, or an eligible donor. It runs roughly every ten seconds, so formally marking a failed node down takes up to about 12 seconds in the worst case.

=== "ProxySQL, native scheduler mode"

    ProxySQL uses its own built-in Galera support for load balancing: a monitor thread checks each node's state roughly once a second and moves nodes between hostgroups accordingly. ProxySQL always configures a backup-writer hostgroup containing every non-writer node, so a promotion candidate is always available.

    Unlike HAProxy, this mode does not pin a preferred Pod. All nodes get equal connection weight, and the Operator elects the initial writer automatically — do not assume it will be `pxc-0`.

=== "ProxySQL, external scheduler mode"

    When an [external scheduler](proxysql-conf.md#proxysql-scheduler-tech-preview) is enabled, ProxySQL elects a single writer dynamically instead of relying on native Galera hostgroups. It uses settings such as `activeFailover=1`, `singlePrimary=true`, and `maxNumWriters=1`.

    This mode's single-writer guarantee is not absolute at every instant. During a failover cycle, there can be a brief window where two nodes are both marked online as writer at once. This is a normal, transient part of how the scheduler re-elects a writer, not a malfunction. However, an application that assumes exactly one writer is reachable at all times should not treat this mode's guarantee as instantaneous.

## What to expect

Automatic recovery handles the failure itself. Two behaviors are not obvious from the mechanics above, and both can affect your application directly.

**Failback forcibly closes the active session.** When `pxc-0` recovers, HAProxy does not leave traffic on the backup node it failed over to. It forcibly closes the session using the backup node and forces reconnection to `pxc-0`, typically within about two seconds of `pxc-0` being marked healthy again. You may see the following error for a client that wasconnected to the backup node and then failed:

```{.text .no-copy}
ERROR 2013 (HY000): Lost connection to MySQL server during query
```

This can happen *after* `kubectl get pxc` already reports the cluster as `ready`. Cluster-ready status confirms the Operator reconciled, not that every existing connection is still valid. Design your application to reconnect on error rather than treat a long-lived connection as safe.

**Losing two of three nodes is a Galera-level failure, not just a proxy one.** If a cluster loses two of three nodes at once, the survivor no longer has a majority of the cluster's last known membership, so by default Galera takes it out of the Primary Component. Once that happens, the node stops accepting *any* query, including both reads and writes, and returns an error like this:

```{.text .no-copy}
ERROR 1047 (08S01): WSREP has not yet prepared node for application use
```

Once the survivor node rejoins a Primary Component and starts acting as SST donor for the returning nodes, it enters the `Donor` state. HAProxy's default health check won't route to a Donor node. You can set the `OK_IF_DONOR` environment variable to allow HAProxy to route to a Donor node. However, this does nothing while the survivor is still non-Primary. This is a Galera quorum issue, and no proxy setting can route around a node refusing queries at the database layer.

Recovery from the non-Primary state is usually automatic. Once the other two nodes are recreated and can reach the survivor again, the cluster reassesses quorum and re-forms a Primary Component on its own. If the other nodes are confirmed down rather than just slow to return, you can force the survivor to form a new primary by itself:

```{sql data-prompt="mysql> "}
mysql> SET GLOBAL wsrep_provider_options='pc.bootstrap=YES';
```

Only do this once you've confirmed the other nodes are actually down. If one of them is still up and serving as Primary elsewhere — for example, after a network split — bootstrapping a second primary creates two independent clusters with diverging data.

## Take a node out of rotation for maintenance

The behavior above applies to an unplanned failure. To perform maintenance without triggering one, take a node out of rotation deliberately instead of stopping MySQL and forcing a failover.

**With HAProxy, there is no equivalent drain command.** HAProxy routes based only on its health check, and the Operator does not expose a supported way to mark a node down manually ahead of maintenance. The safe path is to let the health check do its job: perform your maintenance, and if it requires stopping MySQL, expect HAProxy to treat it as an unplanned failure. This includes the failback session drop when the node comes back (see [What to expect](#what-to-expect) above).

**With ProxySQL** in either mode, use `pxc_maint_mode`:

```{sql data-prompt="mysql> "}
mysql> SET GLOBAL pxc_maint_mode='MAINTENANCE';
```

ProxySQL stops routing new connections to the node once it is in maintenance mode. The node itself stays online. If it is the current writer, ProxySQL routes writes to a backup-writer node instead. Once maintenance is complete, restore the node to normal operation:

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

`wsrep_desync` is not a drain command. It doesn't remove the node from the Kubernetes Service or from either proxy's rotation. Clients can still be routed to it while it's set. It only lets the node fall behind on replication without blocking the rest of the cluster's flow control, which is what makes it safe to run a long operation on that node without stalling everyone else's writes.

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
* Do not run `pc.bootstrap=YES` unless you've confirmed the other nodes are actually down. Running it while another node is still Primary elsewhere causes a split-brain.

## See also

* [Set up disaster recovery](dr.md) — for losing an entire site, not just a node
* [Configure load balancing](load-balancing.md) — background on how HAProxy and ProxySQL differ
