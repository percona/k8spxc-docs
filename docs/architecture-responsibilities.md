# Who owns what

When something goes wrong, the first question is which layer is responsible: the Operator, Percona XtraDB Cluster (Galera), Kubernetes, or you. This page lists what each layer does and, just as important, what it does *not* do. It ends with a table that maps common symptoms to the layer that owns them.

For an overview of the layers, see [Design and architecture](architecture.md#the-four-layers).

## The Operator

**The Operator does:**

* Create and update the StatefulSets, Services, ConfigMaps, Secrets and PodDisruptionBudgets for the cluster. See [What gets created](architecture.md#what-gets-created).
* Revert manual changes to the objects it manages. It re-checks the cluster every few seconds and restores the state described in the Custom Resource.
* Restart database Pods in a safe order when their configuration changes ([Smart Update](architecture-reconciliation.md#update-strategies)).
* Change system user passwords in the database when you edit the users Secret, and restart only the components that use the changed user. See [System users](users.md#system-users).
* Create the custom users you list in `spec.users`.
* Generate TLS certificates if you don't provide them, or have cert-manager issue and renew them.
* Resize PVCs when you increase the storage size and volume scaling is turned on, and grow them automatically if you turn on [storage autoscaling](scaling.md#automatic-storage-resizing).
* Detect a full cluster crash and bootstrap the cluster from the most advanced node. See [Full cluster crash recovery](architecture-workflows.md#full-cluster-crash-recovery).
* Configure asynchronous replication channels for [cross-site replication](replication.md).
* Run backups on demand and on a schedule, apply retention, and run the binlog collector for point-in-time recovery.
* Run restores.
* Upgrade database images automatically, if you turn this on with `upgradeOptions.apply`.
* Delete Pods in order, PVCs, and TLS objects on cluster deletion, if the matching finalizers are set.

**The Operator does not:**

* Control Galera at runtime. It writes the Galera configuration, but quorum, SST and IST, and donor selection are handled by Galera itself.
* Handle Kubernetes node failures. It does not force-delete Pods stuck on a failed node or react to node taints. Kubernetes recreates a Pod from an unreachable node elsewhere only after the Node object is removed or the stuck Pod is force-deleted.
* Validate MySQL options. The contents of `spec.pxc.configuration` go into a ConfigMap as is.
* Install or upgrade CRDs and RBAC.
* Drop database users that you remove from `spec.users`.
* Repair broken cross-site replication. It only logs that the replication channel is not running.
* Renew self-signed certificates it generated without cert-manager.
* Report most problems as Kubernetes events. It emits events only for full cluster crash recovery, CA certificate rotation, and volume resize. Everything else is in the Operator logs and the Custom Resource status.

## Percona XtraDB Cluster and Galera

**Galera does:**

* Replicate every transaction to all nodes and certify it, resolving write conflicts.
* Maintain quorum and decide which nodes form the primary component that serves queries.
* Slow down writes with flow control when a node falls behind.
* Bring a joining node up to date: with IST from another node's write-set cache (gcache) if possible, or with a full SST through Percona XtraBackup otherwise. Galera also chooses the donor node.

**What the Operator sets up for Galera:**

* The list of peers to connect to, from the cluster DNS.
* A preferred list of SST donors that excludes `cluster1-pxc-0` (the HAProxy writer) and the node with the highest number.
* `pc.weight=10`, unless you set it yourself.
* Encryption of replication traffic when internal TLS certificates exist.
* `innodb_buffer_pool_size` and `max_connections` calculated from the Pod resources, unless you set them yourself. This requires a memory request. See [Auto-tuning MySQL options](options.md#auto-tuning-mysql-options).

**Health as the Pod probes see it:**

* A database Pod is *ready* only when its node belongs to the primary component and is `Synced`. A node that is a donor counts as ready only when this is allowed.
* The liveness probe tolerates long startups, SST and recovery, so a node that is busy catching up is not killed.

**What this means in practice:**

* A Pod that is `Running` but not `Ready` usually means Galera hasn't finished bringing the node in: the node is still receiving an SST or IST, or it cannot reach the other nodes.
* An SST that keeps failing stops after `pxc.sstRetryCount` attempts, and the Pod stays not ready until you intervene. See [Limit SST retries](sst-retry-limit.md).
* A bad option in `spec.pxc.configuration` shows up as `mysqld` failing to start, in the `pxc` container logs.

## Kubernetes

**Kubernetes does:**

* **Schedule Pods.** The Operator only writes the affinity rules, node selectors, tolerations, priority class and topology spread constraints you specify. The default anti-affinity is *required* on `kubernetes.io/hostname`: three database Pods need three schedulable nodes. Otherwise a Pod stays `Pending`, and after about a minute the Custom Resource status shows the scheduler's message.
* **Provide storage.** The CSI driver and StorageClass provision volumes, bind them to zones, and expand file systems. A ReadWriteOnce volume ties the Pod to the node or zone where the volume can attach.
* **Run the network and DNS.** The database nodes find each other, and the proxies find the database nodes, by looking up the headless Services in cluster DNS. If DNS is broken, nodes cannot form or join the cluster, proxies lose their backends, and crash detection stops working.
* **Provision load balancers.** For `LoadBalancer` Services, the cloud provider creates the load balancer. Firewalls and source ranges are yours and the provider's to manage.
* **Manage the Pod lifecycle.** Run probes, restart failed containers, enforce PodDisruptionBudgets during node drains, and retry failed Jobs.
* **Collect garbage.** Delete objects owned by the Custom Resource when you delete it.

**Kubernetes does not:**

* Know anything about Galera beyond the readiness probe. A native StatefulSet rolling update waits for each Pod to become ready, but it doesn't pause for a running backup, doesn't wait for ProxySQL to bring the node back online, and doesn't stop early when a Pod can't start.
* Expand a volume whose StorageClass doesn't allow it, or beyond your storage quota.

## You, the user

You are responsible for:

* **CRDs and RBAC.** Install and upgrade them. The Operator never applies CRDs.
* **Upgrade order.** Upgrade the Operator first, then raise `spec.crVersion` in the Custom Resource. Upgrading the Operator alone does not change database images or how the Operator handles an existing cluster, because the behavior depends on `crVersion`. See [Upgrade CRD and the Operator](update-operator.md).
* **Automatic upgrade policy.** `upgradeOptions.apply` is `Disabled` by default. Set it to `Recommended`, `Latest` or an exact version to let the Operator upgrade the database. See [Automatic minor upgrades](update-automatic.md).
* **Capacity.** Enough nodes to satisfy anti-affinity, a StorageClass that supports expansion and your zone layout, and resource requests and limits.
* **Credentials.** Backup storage credentials (S3 or Azure Secrets, or an IAM role), the PMM token, and a CA bundle for custom S3 endpoints.
* **MySQL options.** Check options before you put them in `spec.pxc.configuration`. See [Changing MySQL options](options.md).
* **Storage size changes.** A larger `storage` value in the Custom Resource does nothing unless `storageScaling.enableVolumeScaling` is turned on. Shrinking a volume is refused and reverted. See [Scale storage](scaling.md#scale-storage).
* **Certificate renewal without cert-manager.** See the warning below.
* **Custom users.** The Operator creates users from `spec.users` only when the cluster is `ready`. Removing an entry does not drop the user from the database; drop it yourself. See [Users](users.md).
* **Cross-site replication.** Routable endpoints between sites, matching replication passwords, and monitoring the replication health. If replication breaks, you fix it. See [Set up cross-site replication](replication.md).
* **Point-in-time recovery.** Keep binary logs on the servers long enough for the collector to upload them. When the Operator reports a gap in the binlogs, take a new full backup. See [Store binary logs for point-in-time recovery](backups-pitr.md).
* **Data cleanup.** Decide whether to set the `percona.com/delete-pxc-pvc` and `percona.com/delete-ssl` finalizers. Without them, PVCs, Secrets and certificates remain after you delete the cluster, and you delete them yourself. See [Clean up resources](delete.md#clean-up-resources).
* **Disk usage and MySQL tuning.** Storage autoscaling can grow volumes for you. Beyond that, monitoring disk usage and tuning MySQL is the DBA's job.

!!! warning "Certificates expire without cert-manager"

    If cert-manager is not installed, the Operator generates self-signed certificates once, when the cluster is created. They are valid for 90 days, and the Operator does not renew them. Plan their renewal, or [use cert-manager](tls-cert-manager.md). See [Update certificates](tls-update.md).

### Unsafe configurations

The Operator refuses configurations that put availability or data at risk. To use one anyway, you opt in explicitly with a flag in the `spec.unsafeFlags` subsection:

| Flag | What it allows |
| --- | --- |
| `unsafeFlags.tls` | Running the cluster with TLS turned off |
| `unsafeFlags.pxcSize` | A database cluster with fewer than 3 nodes, more than 5 nodes, or an even number of nodes |
| `unsafeFlags.proxySize` | Fewer than 2 proxy Pods |
| `unsafeFlags.backupIfUnhealthy` | Starting backups when the cluster is not `ready` |

The older `allowUnsafeConfigurations` option turns on all four at once.

!!! warning

    Each flag removes a safeguard. A single-node or even-sized cluster can lose quorum, a single proxy Pod is a single point of failure, and a backup of an unhealthy cluster puts extra load on the remaining nodes. Use these flags for testing, or when you understand the consequences. See [Unsafe flags section](operator.md#operator-unsafeflags-section).

## Who owns this failure?

Find the symptom, check the place named in the second column, and follow the link for the fix.

| Symptom | Look here first | Usually owned by | What to do |
| --- | --- | --- | --- |
| Cluster status is `error` with a message like `wrong PXC options: ...` | `kubectl get pxc cluster1 -o yaml`, the `status` section | User: invalid spec, such as an even size without `unsafeFlags.pxcSize`, both proxies enabled, or Smart Update without a proxy | Fix the Custom Resource. See [Custom Resource options](operator.md) |
| Pod is `Pending`; the cluster status shows a scheduling message | `kubectl describe pod <pod>`, events | Kubernetes and your capacity: required anti-affinity, resource requests, or a volume in another zone | Add nodes or relax the rules. See [Control Pod scheduling](constraints.md) |
| Pod is `Running` but not `Ready` | `kubectl logs <pod> -c pxc` | Galera: the node is not `Synced` or not in the primary component, an SST is in progress, or the SST retry limit is reached | See [Limit SST retries](sst-retry-limit.md) and [Check the logs](debug-logs.md) |
| `FULL_PXC_CLUSTER_CRASH` in the logs; events `FullClusterCrashDetected` or `AutomaticRecoveryRefused` | Events, the `pxc` container logs | Galera; recovered by the Operator, or by you if automatic recovery is off or refused | See [Crash recovery](recovery.md) |
| `mysqld` fails to start after a configuration change | `kubectl logs <pod> -c pxc` | User: `spec.pxc.configuration` is not validated | Fix the option. See [Changing MySQL options](options.md) |
| A storage size change does nothing | The `storage` value in the Custom Resource compared with the PVC size; events | User, if `storageScaling.enableVolumeScaling` is off. Kubernetes or CSI, for `StorageClassNotSupportResize`, `ExceededQuota` or `VolumeResizeFailed` events | See [Scale storage](scaling.md#scale-storage) and [Troubleshoot storage resizing](debug-storage.md#troubleshoot-storage-resizing) |
| Nodes can't join the cluster; the proxy has no backends | `kubectl logs <proxy-pod> -c pxc-monit`, cluster DNS | Kubernetes networking and DNS | Check that DNS resolves the `cluster1-pxc` Service. See [Exec into the containers](debug-shell.md) |
| A rolling restart is stuck | Operator logs | Operator, waiting for a node to become `Synced`, for a backup to finish, or for a Pod to be scheduled | See [Update strategies](architecture-reconciliation.md#update-strategies) |
| A backup is stuck in `Starting` or `Suspended` | `kubectl get pxc-backup <name> -o yaml`, the `pxc-cluster1-backup-lock` Lease, Operator logs (`Cluster is not ready for backup`) | Cluster health, or another backup holding the lock | Restore cluster health. See [Backup suspension](backups.md#backup-suspension-for-an-unhealthy-database-cluster) |
| A backup is `Failed` | `kubectl logs job/xb-<backup>` | User: storage credentials or endpoint. Galera: the donor node left the cluster | See [Configure storage for backups](backups-storage.md) |
| Backup condition `PITRReady=False` with reason `BinlogGapDetected` | Backup conditions, `kubectl logs deployment/cluster1-pitr` | User: binlog retention on the servers is too short | Take a new full backup. See [Binlog gaps](backups-restore.md#binlog-gaps) |
| A restore is `Failed` | `kubectl get pxc-restore <name> -o yaml` (`status.comments`), logs of the `restore-job-*`, `prepare-job-*` and `pitr-job-*` Jobs | Varies: often the backup source or storage access | See [Restore](architecture-workflows.md#restore) |
| A scheduled backup didn't run | Operator logs | The cluster wasn't `ready` when the run was due, so the run was skipped; or the Operator wasn't running at that time | See [Scheduled backups](architecture-workflows.md#scheduled-backups) |
| A cross-site replica is lagging or broken | Operator logs (`Replication for channel is not running`), `SHOW REPLICA STATUS` on the replica | MySQL replication; you fix it | See [Set up cross-site replication](replication.md) |
| TLS errors after about 90 days, without cert-manager | Certificate expiry date in the `cluster1-ssl` Secret | User: certificates need manual renewal | See [Update certificates](tls-update.md) |
| A backup object is stuck in `Terminating` | Operator logs | The backup files could not be deleted from storage, so the `percona.com/delete-backup` finalizer is not removed | Check storage access. See [Delete the unneeded backup](backups-delete.md) |

## How to tell which layer it is

Check these sources in order. Each one narrows down the layer.

1. **Custom Resource status and conditions.** `kubectl get pxc cluster1 -o yaml` shows the cluster state, the reconcile error message if any, and scheduling problems. An `error` state with a spec message points to the user. See [Status](architecture-reconciliation.md#status).
2. **Events.** `kubectl get events --sort-by=.lastTimestamp` shows Kubernetes problems: scheduling, volume attachment and resize, image pulls, probe failures. The Operator itself adds events only for full cluster crash recovery, CA rotation and volume resize. See [Check the events](debug-events.md).
3. **Operator logs.** `kubectl logs deployment/percona-xtradb-cluster-operator` shows what the Operator is doing or waiting for: a stuck rolling restart, a skipped backup, broken replication. Most Operator problems appear only here.
4. **Pod and container logs.** `kubectl logs cluster1-pxc-0 -c pxc` shows Galera and MySQL problems: SST failures, quorum loss, `mysqld` start failures. For backup and restore problems, read the logs of the Job. See [Check the logs](debug-logs.md).
