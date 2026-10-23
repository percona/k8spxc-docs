# Health checks and probes

Kubernetes decides whether a container is healthy by running *probes*: small checks it runs on a schedule. It acts on the results without asking the Operator or Galera:

* The **readiness probe** decides whether a Pod is *ready*. Only a ready Pod receives traffic through a Service: Kubernetes adds it to the endpoints of the Services that select it and removes it when the probe fails. Ready Pods also count as available and let the next Pod of a StatefulSet start.
* The **liveness probe** decides whether a container is *alive*. When it fails, the kubelet restarts the container.

!!! note "What is the kubelet"

    The kubelet is the Kubernetes agent that runs on every node. It starts and stops the containers of the Pods scheduled to its node, runs their probes, and reports their state to the Kubernetes API. The kubelet acts on probe results locally, without involving the Operator.

For a database, this means Kubernetes keeps its own opinion about which nodes are healthy, and it restarts `mysqld` when that opinion says so. Many behaviors that look surprising, such as a node that restarts after a network partition, a node drain that never finishes, or a cluster stuck in `initializing`, come from the probes. This page explains what the probes check and who acts on their result.

The examples use a cluster named `cluster1`.

## What the probes check

The Operator sets the probes for the `pxc` and `haproxy` containers. The probe scripts are shell scripts that log in as the `monitor` [system user](users.md#system-users) and run a query.

### Percona XtraDB Cluster Pods

**Readiness** (`readiness-check.sh`). The Pod is ready when the node:

* belongs to the primary component (`wsrep_cluster_status` is `Primary`), and
* is `Synced` (`wsrep_local_state` is `4`), or is a donor or desynced (`wsrep_local_state` is `2`) and the `AVAILABLE_WHEN_DONOR` environment variable is `1`, the default.

The probe doesn't check `pxc_maint_mode` or `wsrep_reject_queries`. By default, a donor and a node desynced with `wsrep_desync=ON` stay ready. If you set `AVAILABLE_WHEN_DONOR` to another value, they become not ready.

**Liveness** (`liveness-check.sh`). The container is alive when the node belongs to the primary component. It doesn't need to be `Synced`. The probe also passes while the node:

* is starting up: `mysqld` reports its start-up progress, including InnoDB crash recovery, and the probe doesn't kill a server that is still starting;
* receives an SST, or recovers its Galera position at start;
* has reached the [SST retry limit](sst-retry-limit.md).

**Special cases.** Two situations override both checks:

| Situation | Readiness | Liveness | Why |
| --- | --- | --- | --- |
| The node waits for [full cluster crash recovery](architecture-workflows.md#full-cluster-crash-recovery) | Passes | Passes | All Pods must be running for the Operator to compare their `seqno` values (see [Ordered start](#ordered-start)) |
| A `sleep-forever` file exists in the data directory | Passes | Passes | Lets you keep the container running without `mysqld` for [manual repair](debug-shell.md#avoid-the-restart-on-fail-loop-for-percona-xtradb-cluster-containers) |
| The SST retry limit is reached | Fails | Passes | The Pod stays up for investigation but receives no traffic |

The Operator doesn't count a Pod that waits for crash recovery as ready in the cluster status, even though its readiness probe passes.

### HAProxy Pods

Both probes run `SELECT 1` through HAProxy itself, on its admin port 33062. HAProxy forwards the query to a database node that passes its own [health check](architecture-workflows.md#haproxy). So an HAProxy Pod is ready, and alive, only while HAProxy has at least one healthy database node behind it.

### ProxySQL Pods

The ProxySQL containers have no readiness or liveness probes. A ProxySQL Pod is ready as soon as its containers are running.

## Default timings

| Container | Probe | First check after | Period | Timeout | Failures before acting | Time to act |
| --- | --- | --- | --- | --- | --- | --- |
| `pxc` | Readiness | 15 s | 30 s | 15 s | 5 | about 2.5 minutes |
| `pxc` | Liveness | 300 s | 10 s | 5 s | 3 | about 30 seconds |
| `haproxy` | Readiness | 15 s | 5 s | 1 s | 3 | about 15 seconds |
| `haproxy` | Liveness | 60 s | 30 s | 5 s | 4 | about 2 minutes |

The probe scripts use `timeoutSeconds` as the timeout for their own query, minus one second for the `pxc` container. A `pxc` liveness check fails if `mysqld` doesn't answer within 4 seconds.

## Who acts on readiness

A Pod's readiness is read by several parties, each for its own purpose:

```mermaid
flowchart LR
  %% Hexagon braces are escaped so the MkDocs macros plugin leaves them in place
  probe["readiness probe<br/>Primary and Synced?"] --> ready{{"{{"}}Pod ready{{"}}"}}
  ready --> svc["cluster1-pxc Service<br/>(DNS lists ready Pods only)"]
  svc --> monit["pxc-monit in proxy Pods"]
  monit --> proxy["HAProxy / ProxySQL backends"]
  ready --> sts["StatefulSet<br/>start the next Pod"]
  ready --> pdb["PodDisruptionBudget<br/>allow an eviction"]
  ready --> op["Operator<br/>cluster status, Smart Update"]
```

### Proxy backends

The `cluster1-pxc` headless Service lists only ready database Pods. The proxies [discover database nodes](architecture-workflows.md#node-discovery) from this Service. So a node that is not ready is removed from the proxy configuration, and a node that becomes ready is added, about half a minute after the change.

The database nodes find each other through a different Service, `cluster1-pxc-unready`, which lists all Pods whether they are ready or not. A node that is not ready yet can still find its peers and join the cluster.

The readiness probe is slow on purpose: it takes about 2.5 minutes to mark a node not ready. Short failures don't change the proxy configuration. Fast failover of client traffic is the job of the proxy's own health checks, which run every few seconds.

### Ordered start

Pods of the database StatefulSet start in order: `cluster1-pxc-1` is created only after `cluster1-pxc-0` is running and ready, and so on. As a result:

* On cluster creation and scale-up, a node that can't become ready blocks every node after it.
* If `cluster1-pxc-1` stays not ready, for example because it reached the SST retry limit, and `cluster1-pxc-2` is missing, Kubernetes doesn't recreate `cluster1-pxc-2` until `cluster1-pxc-1` is ready.
* With `updateStrategy: SmartUpdate`, the Operator restarts the next Pod only when the previous one is ready.

This is why a node waiting for full cluster crash recovery reports itself as ready: otherwise the nodes after it would never start, and the Operator could not compare the `seqno` of all nodes.

### Node drains

The default PodDisruptionBudget allows one database Pod to be unavailable (`pxc.podDisruptionBudget.maxUnavailable: 1`). A Pod that is not ready counts as unavailable. While one database Pod is not ready, for example during a long SST, Kubernetes refuses to evict another one: `kubectl drain` keeps retrying, and managed node pool upgrades wait. Some cloud providers evict the Pod anyway after their own timeout.

The same applies to HAProxy and ProxySQL Pods with their PodDisruptionBudgets.

### The Operator

The Operator reads Pod readiness, too:

* **Cluster status.** The cluster is `ready` only when every database and proxy Pod is ready. When one Pod becomes not ready, the cluster goes back to `initializing`, and everything that waits for a `ready` cluster waits as well: scheduled backups, creation of custom users, automatic upgrades. See [What `ready` means](architecture-reconciliation.md#what-ready-means).
* **Smart Update.** After it restarts a Pod, the Operator waits until the `pxc` container is ready, and then until the node is `Synced`, before it moves on. It waits for up to 2 hours, or for `pxc.livenessProbes.initialDelaySeconds` seconds if you changed that value from the default 300. See [How Smart Update works](architecture-reconciliation.md#how-smart-update-works).
* **Database connections.** When the Operator needs to query the database directly, for example to read the server version or to set up [cross-site replication](replication.md), it connects only to ready Pods.

## Who acts on liveness

Only the kubelet. When the liveness probe fails, the kubelet stops the `pxc` container, with the usual grace period, and starts it again. After repeated restarts, the Pod goes into `CrashLoopBackOff`, and the kubelet waits longer before each next start, up to 5 minutes.

A restarted node rejoins the cluster with IST, or with a full SST if the donor's gcache doesn't cover the gap. A liveness restart can turn a short problem into a long state transfer.

## What this means for users

The probes act on their own, and they don't know what you are doing on the node. Keep them in mind in these situations:

* **Network partition or quorum loss.** A node outside the primary component fails its liveness probe and is restarted after about 30 seconds. Galera alone would let the node wait and rejoin when the network comes back; on Kubernetes, the node restarts instead. If the cluster lost quorum, all remaining nodes restart, find no primary component to join, and wait for [full cluster crash recovery](architecture-workflows.md#full-cluster-crash-recovery).
* **A slow or stalled server.** If `mysqld` doesn't answer the liveness query within 4 seconds, the liveness probe fails and the container is restarted. Common causes are a stalled disk, CPU throttling by the container's CPU limit, and an overloaded server. Check the Pod events for `Liveness probe failed` before you look for a crash in the MySQL error log.
* **Manual maintenance on a running node.** Anything that takes the node out of the primary component for more than about 30 seconds gets the container restarted: disconnecting the node from the cluster, changing the Galera provider settings, or stopping `mysqld`. To work on a node without `mysqld` running, use the `sleep-forever` file. See [Avoid the restart-on-fail loop](debug-shell.md#avoid-the-restart-on-fail-loop-for-percona-xtradb-cluster-containers).
* **The `monitor` user.** Every probe logs in as `monitor` through the admin port 33062. If you change its password directly in MySQL instead of in the users Secret, drop it, or lock it, the probes fail on every node: all database Pods become not ready and are restarted one after another. Change system user passwords only through the Secret. See [System users](users.md#system-users).
* **A full outage behind HAProxy.** When no database node is healthy, every HAProxy Pod becomes not ready, so the `cluster1-haproxy` Service has no endpoints and clients get connection errors instead of MySQL errors. After about 2 minutes, the HAProxy containers start restarting as well. These restarts are a consequence of the database outage, not its cause.
* **A Pod that stays not ready.** It blocks node drains, ordered start of the Pods after it, the Smart Update, and everything that waits for a `ready` cluster.

## Tune the probes

Change the probe settings in the Custom Resource with the `pxc.readinessProbes`, `pxc.livenessProbes`, `haproxy.readinessProbes` and `haproxy.livenessProbes` subsections. See [Custom Resource options](operator.md#pxcreadinessprobesinitialdelayseconds).

* Probe settings are part of the Pod template. Changing them restarts the Pods with your [update strategy](architecture-reconciliation.md#update-strategies).
* If heavy load makes the liveness probe time out, raise `pxc.livenessProbes.timeoutSeconds` or `failureThreshold` rather than turning the probe off. The scripts use the new timeout for their query, too.
* If `mysqld` needs more than 5 minutes to start and the start-up isn't covered by the probe exceptions above, raise `pxc.livenessProbes.initialDelaySeconds`. Note that this value also limits how long the Smart Update waits for each Pod.

## Where to look

* `kubectl describe pod cluster1-pxc-0` shows the probe settings and, under `Events`, the `Readiness probe failed` and `Liveness probe failed` messages.
* `kubectl get pod cluster1-pxc-0` shows the restart count. If the events contain `Container pxc failed liveness probe, will be restarted`, the kubelet restarted the container; it was not a `mysqld` crash.
* `kubectl get events --sort-by=.lastTimestamp | grep -i probe` lists probe failures across the cluster.
* `kubectl get endpoints cluster1-pxc` shows which database Pods are ready and visible to the proxies.
* `kubectl get pdb` shows how many disruptions each PodDisruptionBudget allows right now.
