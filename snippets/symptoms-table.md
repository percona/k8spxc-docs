### Cluster and Pods

| Symptom | Look here first | Usually owned by | What to do |
| --- | --- | --- | --- |
| Cluster status is `error` with a message like `wrong PXC options: ...` | `kubectl get pxc cluster1 -o yaml`, the `status` section | User: invalid spec, such as an even size without `unsafeFlags.pxcSize`, both proxies enabled, or Smart Update without a proxy | Fix the Custom Resource. See [Custom Resource options](operator.md) |
| Pod is `Pending`; the cluster status shows a scheduling message | `kubectl describe pod <pod>`, events | Kubernetes and your capacity: required anti-affinity, resource requests, or a volume in another zone | Add nodes or relax the rules. See [Control Pod scheduling](constraints.md) |
| Pod is `Running` but not `Ready` | `kubectl logs <pod> -c pxc` | Galera: the node is not `Synced` or not in the primary component, an SST is in progress, or the SST retry limit is reached | See [Limit SST retries](sst-retry-limit.md) and [Check the logs](debug-logs.md) |
| `FULL_PXC_CLUSTER_CRASH` in the logs; events `FullClusterCrashDetected` or `AutomaticRecoveryRefused` | Events, the `pxc` container logs | Galera; recovered by the Operator, or by you if automatic recovery is off or refused | See [Crash recovery](recovery.md) |
| `mysqld` fails to start after a configuration change | `kubectl logs <pod> -c pxc` | User: `spec.pxc.configuration` is not validated | Fix the option. See [Changing MySQL options](options.md) |
| Nodes can't join the cluster; the proxy has no backends | `kubectl logs <proxy-pod> -c pxc-monit`, cluster DNS | Kubernetes networking and DNS | Check that DNS resolves the `cluster1-pxc` Service. See [Exec into the containers](debug-shell.md) |
| A rolling restart is stuck | Operator logs | Operator, waiting for a node to become `Synced`, for a backup to finish, or for a Pod to be scheduled | See [Update strategies](architecture-reconciliation.md#update-strategies) |

### Backups and restores

| Symptom | Look here first | Usually owned by | What to do |
| --- | --- | --- | --- |
| A backup has an empty state, or is stuck in `Starting` or `Suspended` | `kubectl get pxc-backup <name> -o yaml`, Operator logs (`Cluster is not ready for backup`, `Another backup is holding the lock`), and with `backup.allowParallel: false`, the `pxc-cluster1-backup-lock` Lease | Cluster health, or, with `allowParallel: false`, another backup holding the lock. An empty state means the Job isn't created yet | Restore cluster health. See [Backup suspension](backups.md#backup-suspension-for-an-unhealthy-database-cluster) |
| A backup is `Failed` | `kubectl logs job/xb-<backup>` | User: storage credentials or endpoint. Galera: the donor node left the cluster | See [Configure storage for backups](backups-storage.md) |
| Backup condition `PITRReady=False` with reason `BinlogGapDetected` | Backup conditions, `kubectl logs deployment/cluster1-pitr` | User: binlog retention on the servers is too short | Take a new full backup. See [Binlog gaps](backups-pitr-restore.md#binlog-gaps) |
| A restore is `Failed` | `kubectl get pxc-restore <name> -o yaml` (`status.comments`), logs of the `restore-job-*`, `prepare-job-*` and `pitr-job-*` Jobs | Varies: often the backup source or storage access | See [Restore](architecture-workflows.md#restore) |
| A scheduled backup didn't run | Operator logs | The cluster wasn't `ready` when the run was due, so the run was skipped; or the Operator wasn't running at that time | See [Scheduled backups](architecture-workflows.md#scheduled-backups) |
| A backup object is stuck in `Terminating` | Operator logs | The backup files could not be deleted from storage, so the `percona.com/delete-backup` finalizer is not removed | Check storage access. See [Delete the unneeded backup](backups-delete.md) |

### Storage, replication and TLS

| Symptom | Look here first | Usually owned by | What to do |
| --- | --- | --- | --- |
| A storage size change does nothing | The `storage` value in the Custom Resource compared with the PVC size; events | User, if `storageScaling.enableVolumeScaling` is off. Kubernetes or CSI, for `StorageClassNotSupportResize`, `ExceededQuota` or `VolumeResizeFailed` events | See [Resize storage](scaling-storage-resize.md) and [Troubleshoot storage resizing](debug-storage.md#troubleshoot-storage-resizing) |
| A cross-site replica is lagging or broken | Operator logs (`Replication for channel is not running`), `SHOW REPLICA STATUS` on the replica | MySQL replication; you fix it | See [Set up cross-site replication](replication.md) |
| TLS errors after about 90 days, without cert-manager | Certificate expiry date in the `cluster1-ssl` Secret | User: certificates need manual renewal | See [Update certificates](tls-update.md) |
