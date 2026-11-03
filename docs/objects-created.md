# Objects the Operator creates

This page lists what the Operator creates in your Kubernetes cluster for a Percona XtraDB Cluster, and which containers run in each Pod. Use it to size quotas, plan RBAC and storage, and to find an object when you troubleshoot.

## Kubernetes objects

For a cluster named `cluster1`, the Operator creates and manages the following Kubernetes objects. Some exist only when the related feature is turned on.

| Kind | Name | Purpose |
| --- | --- | --- |
| StatefulSet | `cluster1-pxc` | Database nodes |
| StatefulSet | `cluster1-haproxy` or `cluster1-proxysql` | Proxy, depending on which one is enabled |
| Service | `cluster1-haproxy`, `cluster1-proxysql`, `cluster1-pxc`, and more | Client entry points, headless Services for node discovery, and optional per-Pod Services. See [Services and ports](services.md) |
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

    PVCs and Secrets are not owned by the Custom Resource, so deleting the CR does not delete them. This lets you recreate the cluster with its data and credentials. To delete them together with the cluster, set the `percona.com/delete-pxc-pvc` and `percona.com/delete-ssl` finalizers. ProxySQL volumes have their own finalizer, `percona.com/delete-proxysql-pvc`. See [Delete the database cluster](delete.md#delete-the-database-cluster).

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

## See also

* [Services and ports](services.md) for every Service, its ports and when it exists
* [Design and architecture](architecture.md) for how these objects work together
* [Responsibilities by area](operator-boundaries.md) for what the Operator does and doesn't do with them
