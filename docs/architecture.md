# Design and architecture

This section explains how Percona Operator for MySQL based on Percona XtraDB Cluster is built: what runs in your Kubernetes cluster, which component is responsible for what, and how the pieces interact. Read it to build a mental model of the system, and come back to it when something fails and you need to know where to look first.

## Percona XtraDB Cluster in brief

*Percona XtraDB Cluster* combines *Percona Server for MySQL* with the XtraDB storage engine, *Percona XtraBackup*, and the *Galera library*. Galera provides virtually synchronous multi-primary replication: every node holds the full data set. A transaction commits after its write set is delivered to all nodes and passes certification. The other nodes apply it a moment later, so a read on another node can briefly return older data, unless you set the `wsrep_sync_wait` variable.

Use 3 to 5 nodes in production:

* **Not more than 5.** Every write must be confirmed by all nodes. More nodes mean more network round trips and acknowledgments for each transaction, which increases latency and resource usage.
* **An odd number.** Galera decides which nodes may keep serving queries by quorum voting. With an even number of nodes, a network partition can split the cluster into two equal halves. Neither half has a majority, so both stop serving queries to avoid data inconsistency.

With 3 nodes, the cluster keeps working when any one node goes down.

A proxy sits in front of the nodes and routes client connections. You choose one of two:

* **HAProxy** (default) is a TCP load balancer. It sends writes to one node and can spread reads across all nodes.
* **ProxySQL** is SQL-aware. It understands MySQL traffic and can route queries by rules. See [What load balancer to use?](load-balancing.md#what-load-balancer-to-use).

## The four layers

A running cluster is the combined result of four layers. Most confusion during troubleshooting comes from expecting one layer to do something that belongs to another. The [Who owns what](architecture-responsibilities.md) page covers each layer in detail.

```mermaid
flowchart TB
  U["<b>User</b><br/>Custom Resource, Secrets,<br/>CRDs and RBAC, node and storage capacity"]
  O["<b>Operator</b><br/>reconcile loop: compares the Custom Resource<br/>with the cluster and corrects differences"]
  K["<b>Kubernetes</b><br/>StatefulSets, scheduling, storage (CSI),<br/>networking and DNS, Pod lifecycle"]
  G["<b>Percona XtraDB Cluster / Galera</b><br/>replication, quorum, SST and IST"]
  U -- "writes the desired state" --> O
  O -- "creates and updates objects" --> K
  K -- "runs Pods and volumes for" --> G
  O -. "configures; recovers after a full crash" .-> G
```

* **User.** You describe the cluster you want in the `PerconaXtraDBCluster` Custom Resource (CR) and provide everything the Operator cannot create for you: the CustomResourceDefinitions (CRDs) and RBAC, credentials for backup storage, and enough nodes and storage to run the cluster.
* **Operator.** The Operator runs a reconcile loop. It reads the CR, compares it with what exists in Kubernetes, and creates, updates or deletes objects to close the gap. It also runs day-2 tasks such as ordered restarts, password changes, backups and recovery after a full cluster crash. See [How the Operator reacts to changes](architecture-reconciliation.md).
* **Kubernetes.** Kubernetes turns the objects the Operator creates into running Pods. It schedules Pods to nodes, provisions and attaches volumes through the CSI driver, provides Services and DNS, and restarts failed containers.
* **Percona XtraDB Cluster / Galera.** Inside the Pods, Galera replicates data between nodes, maintains quorum, and brings a joining node up to date with an Incremental State Transfer (IST) or a full State Snapshot Transfer (SST). The Operator writes the Galera configuration but does not control these mechanisms at runtime.

## Cluster topology

The following diagram shows a cluster named `cluster1` with three Percona XtraDB Cluster nodes, HAProxy, and point-in-time recovery turned on.

```mermaid
flowchart LR
  C[Clients] --> S1["Service<br/>cluster1-haproxy"]
  C --> S2["Service<br/>cluster1-haproxy-replicas"]
  S1 --> H["HAProxy Pods<br/>haproxy + pxc-monit"]
  S2 --> H
  H -- "writer, reads" --> P0["cluster1-pxc-0"]
  H -. "failover, reads" .-> P1["cluster1-pxc-1"]
  H -. "failover, reads" .-> P2["cluster1-pxc-2"]
  P0 <-- "Galera replication" --> P1
  P1 <-- "Galera replication" --> P2
  PITR["cluster1-pitr<br/>binlog collector"] -- "reads binlogs" --> P1
  PITR --> ST[("Backup storage<br/>S3 / Azure")]
  J["Backup Job xb-*"] -- "SST" --> P2
  J --> ST
```

Each node Pod has its own PersistentVolumeClaim (PVC) for the data directory. Galera replication runs between all node pairs; the diagram shows only two links for readability.

Here is how a client request reaches the data:

1. A client connects to the `cluster1-haproxy` Service on port 3306 for read-write traffic, or to `cluster1-haproxy-replicas` on port 3306 for reads. The replicas Service forwards port 3306 to port 3307 in the HAProxy Pods.
2. The Service forwards the connection to one of the HAProxy Pods.
3. HAProxy sends writes to `cluster1-pxc-0`. If that node fails its health check, HAProxy sends writes to another node. Read connections from the replicas Service are spread across nodes.
4. HAProxy learns which nodes exist through the headless `cluster1-pxc` Service. The `pxc-monit` container in each HAProxy Pod watches that Service in DNS and regenerates the HAProxy configuration when the set of nodes changes.
5. The node executes the transaction and Galera replicates it to the other nodes before the commit returns.

Node discovery doesn't use the Kubernetes API. A small `peer-list` tool resolves the DNS SRV records of a headless Service every second and runs a script when the list of Pods changes:

* In the proxy Pods, `pxc-monit` watches `cluster1-pxc`, which lists only ready database Pods, and updates the proxy configuration.
* In the database Pods, the `pxc` container watches `cluster1-pxc-unready`, which also lists Pods that are not ready yet, to find the other nodes when it starts and builds the Galera cluster address from them.

See [Node discovery](architecture-workflows.md#node-discovery) for the timings and where to look when it fails.

Two more components appear around the nodes:

* **The binlog collector** (`cluster1-pitr` Deployment) exists only when point-in-time recovery is turned on. It reads binary logs from one node and uploads them to backup storage. At the start of each upload cycle, it looks up the nodes through `cluster1-pxc`, keeps those that are `Synced` and in the primary component, and picks the one whose oldest binlog is the oldest. This node most likely still has every binlog the collector hasn't uploaded yet. If the current node becomes unhealthy, or another node has older binlogs, the collector switches to it and logs the reason. See [Point-in-time recovery](architecture-workflows.md#point-in-time-recovery).

* **Backup Jobs** (`xb-<backup-name>`) exist only while a backup runs. By default, the Job joins the cluster as a Galera arbitrator and receives a full copy of the data from a donor node through SST, then uploads it to storage. With the `XtrabackupSidecar` [feature gate](env-vars-operator.md#pxco_feature_gates) turned on, each database Pod runs an extra `xtrabackup` container instead. The backup Job asks this sidecar on a non-primary node to run XtraBackup on the local data, so no node enters the `Donor` state. See [Backup methods](backups.md#backup-methods).

If you use ProxySQL instead of HAProxy, the picture is the same with `cluster1-proxysql` in place of `cluster1-haproxy`. There is no separate replicas Service, because ProxySQL splits reads and writes by its own rules.

With `proxysql.scheduler.enabled`, ProxySQL uses the external [`pxc_scheduler_handler` :octicons-link-external-16:](https://docs.percona.com/proxysql/psh-overview.html) instead of its built-in Galera support. The scheduler checks the nodes, keeps exactly one writer, and spreads `SELECT` queries across all nodes, or across all nodes except the writer when `proxysql.scheduler.writerIsAlsoReader` is `false`. With the scheduler enabled, the ProxySQL instances no longer form a ProxySQL cluster, and the `proxysql-monit` container is not created. See [ProxySQL scheduler](proxysql-conf.md#proxysql-scheduler-tech-preview).

The [Key workflows](architecture-workflows.md) page describes proxy failover, backups, restores and crash recovery step by step.

### Scheduling and storage

To survive a node failure, the Operator places the database Pods on separate Kubernetes nodes with [Pod anti-affinity :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity). By default, this rule is *required*: with three database Pods you need at least three schedulable nodes, or a Pod stays `Pending`. See [Control Pod scheduling](constraints.md) to change it.

If a Kubernetes node fails, Kubernetes can recreate the Pod on another node, but for a StatefulSet Pod it does so only after the failed Node object is removed or the stuck Pod is force-deleted. The Operator does neither. The Pod's data lives in a PersistentVolume, so the storage must be able to follow the Pod: the Container Storage Interface (CSI) driver and StorageClass must support attaching the volume on a different node. A volume that can attach only in one zone keeps the Pod in that zone.

## What gets created

For a cluster named `cluster1`, the Operator creates and manages the following Kubernetes objects. Some exist only when the related feature is turned on.

| Kind | Name | Purpose |
| --- | --- | --- |
| StatefulSet | `cluster1-pxc` | Database nodes |
| StatefulSet | `cluster1-haproxy` or `cluster1-proxysql` | Proxy, depending on which one is enabled |
| Service | `cluster1-pxc` | Headless Service with the ready database Pods. Used for node discovery |
| Service | `cluster1-pxc-unready` | Headless Service that includes database Pods that are not ready yet |
| Service | `cluster1-haproxy`, `cluster1-haproxy-replicas` | Client entry points for HAProxy: read-write and read-only |
| Service | `cluster1-proxysql`, `cluster1-proxysql-unready` | Client entry point for ProxySQL, and a Service for ProxySQL instances to find each other |
| Service | `cluster1-pxc-0`, `cluster1-pxc-1`, ... | Per-Pod Services, only when `pxc.expose.enabled` is set for [cross-site replication](replication.md) |
| Deployment and Service | `cluster1-pitr` | Binlog collector, only when [point-in-time recovery](backups-pitr.md) is turned on |
| Secret | `cluster1-secrets` | Passwords of system users. You can edit it to change passwords |
| Secret | `internal-cluster1` | Passwords the Operator has actually applied to the database. Do not edit it |
| Secret | `cluster1-ssl`, `cluster1-ssl-internal` | TLS certificates for client and internal traffic |
| ConfigMap | `cluster1-pxc`, `cluster1-haproxy`, `cluster1-proxysql` | Your custom configuration from the CR |
| ConfigMap | `auto-cluster1-pxc` | MySQL options the Operator calculates from the memory limit |
| PodDisruptionBudget | one per component | Limits voluntary disruptions, such as node drains, to one Pod at a time by default |
| PersistentVolumeClaim | `datadir-cluster1-pxc-N`, `proxydata-cluster1-proxysql-N` | Data volumes, created by the StatefulSets |
| Lease | `pxc-cluster1-backup-lock` | Makes backups run one at a time. Created only when `backup.allowParallel` is `false` |
| Job | `xb-<backup>` | Makes a backup and uploads it to storage. Created for each backup |
| Job | `restore-job-<restore>-cluster1` | Writes the backup into the data volume of `cluster1-pxc-0`. Created for each restore |
| Job | `prepare-job-<restore>-cluster1` | Prepares the restored data so that the node can bootstrap a new cluster. Created for each restore |
| Job | `pitr-job-<restore>-cluster1` | Replays binlogs up to the target. Created only for a [point-in-time restore](backups-restore.md) |

If cert-manager is installed, the Operator also creates cert-manager Issuers and Certificates that produce the TLS Secrets.

!!! note

    Scheduled backups are not Kubernetes CronJobs. The Operator keeps the schedule itself and creates a backup object when a run is due. See [Scheduled backups](architecture-workflows.md#scheduled-backups).

!!! warning "Objects that survive cluster deletion"

    PVCs and Secrets are not owned by the Custom Resource, so deleting the CR does not delete them. This lets you recreate the cluster with its data and credentials. To delete them together with the cluster, set the `percona.com/delete-pxc-pvc` and `percona.com/delete-ssl` finalizers. See [Delete the database cluster](delete.md#delete-the-database-cluster).

## Containers in each Pod

**Percona XtraDB Cluster Pod** (`cluster1-pxc-N`):

* `pxc-init` (init container) copies the Operator's entrypoint, probe and helper scripts into the data volume.
* `pxc` runs `mysqld`. It listens on 3306 (MySQL), 33062 (admin), 33060 (MySQL X protocol), and on 4567, 4568 and 4444 for Galera replication, IST and SST.
* Optional sidecars: `logs` and `logrotate` for [log collection](persistent-logging.md), `pmm-client` for [monitoring](monitoring.md), `xtrabackup` when the `XtrabackupSidecar` feature gate is on, and your own [sidecar containers](sidecar.md).

**HAProxy Pod** (`cluster1-haproxy-N`):

* `haproxy` routes client traffic.
* `pxc-monit` watches the `cluster1-pxc` Service and regenerates the HAProxy configuration when nodes join or leave.
* Optional: `pmm-client`.

**ProxySQL Pod** (`cluster1-proxysql-N`):

* `proxysql` routes client traffic.
* `pxc-monit` watches the `cluster1-pxc` Service and adds or removes database nodes in ProxySQL.
* `proxysql-monit` watches the `cluster1-proxysql-unready` Service so that ProxySQL instances form a ProxySQL cluster. It is not created when the ProxySQL scheduler is enabled.
* Optional: `pmm-client`.

## Next steps

* [Who owns what](architecture-responsibilities.md){.md-button}
* [How the Operator reacts to changes](architecture-reconciliation.md){.md-button}
* [Key workflows](architecture-workflows.md){.md-button}
* [Health checks and probes](architecture-probes.md){.md-button}
