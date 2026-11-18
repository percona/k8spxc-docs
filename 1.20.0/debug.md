> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Initial troubleshooting

Percona Operator for MySQL uses [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) to manage options for the various components of the cluster.

- `PerconaXtraDBCluster` Custom Resource with Percona XtraDB Cluster options (it has handy `pxc` shortname also),
- `PerconaXtraDBClusterBackup` and `PerconaXtraDBClusterRestore` Custom Resources contain options for Percona XtraBackup used to backup Percona XtraDB Cluster and to restore it from backups (`pxc-backup` and `pxc-restore` shortnames are available for them).

## Which layer is it?

Problems can come from four layers: your configuration, the Operator, Kubernetes, or Percona XtraDB Cluster itself. See [Who owns what](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-responsibilities.html) for what each layer does.

Check these sources in order. Each one narrows down the layer.

1. **Custom Resource status and conditions.** `kubectl get pxc cluster1 -o yaml` shows the cluster state, the reconcile error message if any, and scheduling problems. An `error` state with a spec message points to the user. See [Status](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-reconciliation.html#status).
1. **Events.** `kubectl get events --sort-by=.lastTimestamp` shows Kubernetes problems: scheduling, volume attachment and resize, image pulls, probe failures. The Operator itself adds events only for full cluster crash recovery, CA rotation and volume resize. See [Check the events](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/debug-events.html).
1. **Operator logs.** `kubectl logs deployment/percona-xtradb-cluster-operator` shows what the Operator is doing or waiting for: a stuck rolling restart, a skipped backup, broken replication. Most Operator problems appear only here.
1. **Pod and container logs.** `kubectl logs cluster1-pxc-0 -c pxc` shows Galera and MySQL problems: SST failures, quorum loss, `mysqld` start failures. For backup and restore problems, read the logs of the Job. See [Check the logs](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/debug-logs.html).

## Where to look first

Find the symptom, check the place named in the second column, and follow the link for the fix. The same table is in [Who owns what](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-responsibilities.html#who-owns-this-failure).

### Cluster and Pods

| Symptom                                                                                               | Look here first                                          | Usually owned by                                                                                                              | What to do                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cluster status is `error` with a message like `wrong PXC options: ...`                                | `kubectl get pxc cluster1 -o yaml`, the `status` section | User: invalid spec, such as an even size without `unsafeFlags.pxcSize`, both proxies enabled, or Smart Update without a proxy | Fix the Custom Resource. See [Custom Resource options](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html)                                                                                   |
| Pod is `Pending`; the cluster status shows a scheduling message                                       | `kubectl describe pod <pod>`, events                     | Kubernetes and your capacity: required anti-affinity, resource requests, or a volume in another zone                          | Add nodes or relax the rules. See [Control Pod scheduling](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/constraints.html)                                                                            |
| Pod is `Running` but not `Ready`                                                                      | `kubectl logs <pod> -c pxc`                              | Galera: the node is not `Synced` or not in the primary component, an SST is in progress, or the SST retry limit is reached    | See [Limit SST retries](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sst-retry-limit.html) and [Check the logs](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/debug-logs.html) |
| `FULL_PXC_CLUSTER_CRASH` in the logs; events `FullClusterCrashDetected` or `AutomaticRecoveryRefused` | Events, the `pxc` container logs                         | Galera; recovered by the Operator, or by you if automatic recovery is off or refused                                          | See [Crash recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/recovery.html)                                                                                                                     |
| `mysqld` fails to start after a configuration change                                                  | `kubectl logs <pod> -c pxc`                              | User: `spec.pxc.configuration` is not validated                                                                               | Fix the option. See [Changing MySQL options](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/options.html)                                                                                              |
| Nodes can’t join the cluster; the proxy has no backends                                               | `kubectl logs <proxy-pod> -c pxc-monit`, cluster DNS     | Kubernetes networking and DNS                                                                                                 | Check that DNS resolves the `cluster1-pxc` Service. See [Exec into the containers](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/debug-shell.html)                                                    |
| A rolling restart is stuck                                                                            | Operator logs                                            | Operator, waiting for a node to become `Synced`, for a backup to finish, or for a Pod to be scheduled                         | See [Update strategies](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-reconciliation.html#update-strategies)                                                                             |

### Backups and restores

| Symptom                                                               | Look here first                                                                                                                                                                                                | Usually owned by                                                                                                                 | What to do                                                                                                                                                                            |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A backup has an empty state, or is stuck in `Starting` or `Suspended` | `kubectl get pxc-backup <name> -o yaml`, Operator logs (`Cluster is not ready for backup`, `Another backup is holding the lock`), and with `backup.allowParallel: false`, the `pxc-cluster1-backup-lock` Lease | Cluster health, or, with `allowParallel: false`, another backup holding the lock. An empty state means the Job isn’t created yet | Restore cluster health. See [Backup suspension](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups.html#backup-suspension-for-an-unhealthy-database-cluster) |
| A backup is `Failed`                                                  | `kubectl logs job/xb-<backup>`                                                                                                                                                                                 | User: storage credentials or endpoint. Galera: the donor node left the cluster                                                   | See [Configure storage for backups](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage.html)                                                         |
| Backup condition `PITRReady=False` with reason `BinlogGapDetected`    | Backup conditions, `kubectl logs deployment/cluster1-pitr`                                                                                                                                                     | User: binlog retention on the servers is too short                                                                               | Take a new full backup. See [Binlog gaps](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr-restore.html#binlog-gaps)                                  |
| A restore is `Failed`                                                 | `kubectl get pxc-restore <name> -o yaml` (`status.comments`), logs of the `restore-job-*`, `prepare-job-*` and `pitr-job-*` Jobs                                                                               | Varies: often the backup source or storage access                                                                                | See [Restore](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-workflows.html#restore)                                                                |
| A scheduled backup didn’t run                                         | Operator logs                                                                                                                                                                                                  | The cluster wasn’t `ready` when the run was due, so the run was skipped; or the Operator wasn’t running at that time             | See [Scheduled backups](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-workflows.html#scheduled-backups)                                            |
| A backup object is stuck in `Terminating`                             | Operator logs                                                                                                                                                                                                  | The backup files could not be deleted from storage, so the `percona.com/delete-backup` finalizer is not removed                  | Check storage access. See [Delete the unneeded backup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-delete.html)                                       |

### Storage, replication and TLS

| Symptom                                              | Look here first                                                                                | Usually owned by                                                                                                                                            | What to do                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A storage size change does nothing                   | The `storage` value in the Custom Resource compared with the PVC size; events                  | User, if `storageScaling.enableVolumeScaling` is off. Kubernetes or CSI, for `StorageClassNotSupportResize`, `ExceededQuota` or `VolumeResizeFailed` events | See [Resize storage](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/scaling-storage-resize.html) and [Troubleshoot storage resizing](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/debug-storage.html#troubleshoot-storage-resizing) |
| A cross-site replica is lagging or broken            | Operator logs (`Replication for channel is not running`), `SHOW REPLICA STATUS` on the replica | MySQL replication; you fix it                                                                                                                               | See [Set up cross-site replication](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/replication.html)                                                                                                                                                       |
| TLS errors after about 90 days, without cert-manager | Certificate expiry date in the `cluster1-ssl` Secret                                           | User: certificates need manual renewal                                                                                                                      | See [Update certificates](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/tls-update.html)                                                                                                                                                                  |

## Check the Custom Resource

The first thing you can check for the Custom Resource is to query it with `kubectl get` command:

```
kubectl get pxc
```

Expected output

```
NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
cluster1   cluster1-haproxy.default   ready    3                3         33d
```

The Custom Resource should have `Ready` status.

Note

You can check which Percona’s Custom Resources are present and get some information about them as follows:

```
kubectl api-resources | grep -i percona
```

Expected output

```
perconaxtradbclusterbackups       pxc-backup,pxc-backups     pxc.percona.com/v1                     true         PerconaXtraDBClusterBackup
perconaxtradbclusterrestores      pxc-restore,pxc-restores   pxc.percona.com/v1                     true         PerconaXtraDBClusterRestore
perconaxtradbclusters             pxc,pxcs                   pxc.percona.com/v1                     true         PerconaXtraDBCluster
```

## Check the Pods

If Custom Resource is not getting `Ready` status, it makes sense to check individual Pods. You can do it as follows:

```
kubectl get pods
```

Expected output

```
NAME                                               READY   STATUS    RESTARTS   AGE
cluster1-haproxy-0                                 2/2     Running   0          6m17s
cluster1-haproxy-1                                 2/2     Running   0          4m59s
cluster1-haproxy-2                                 2/2     Running   0          4m36s
cluster1-pxc-0                                     3/3     Running   0          6m17s
cluster1-pxc-1                                     3/3     Running   0          5m3s
cluster1-pxc-2                                     3/3     Running   0          3m56s
percona-xtradb-cluster-operator-79966668bd-rswbk   1/1     Running   0          9m54s
```

The above command provides the following insights:

- `READY` indicates how many containers in the Pod are ready to serve the traffic. In the above example, `cluster1-haproxy-0` Pod has all two containers ready (2/2). For an application to work properly, all containers of the Pod should be ready.
- `STATUS` indicates the current status of the Pod. The Pod should be in a `Running` state to confirm that the application is working as expected. You can find out other possible states in the [official Kubernetes documentation](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase) .
- `RESTARTS` indicates how many times containers of Pod were restarted. This is impacted by the [Container Restart Policy](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#restart-policy) . In an ideal world, the restart count would be zero, meaning no issues from the beginning. If the restart count exceeds zero, it may be reasonable to check why it happens.
- `AGE`: Indicates how long the Pod is running. Any abnormality in this value needs to be checked.

You can find more details about a specific Pod using the `kubectl describe pods <pod-name>` command.

```
kubectl describe pods cluster1-pxc-0
```

Expected output

```
...
Name:         cluster1-pxc-0
Namespace:    default
...
Controlled By:  StatefulSet/cluster1-pxc
Init Containers:
 pxc-init:
...
Containers:
 pmm-client:
...
 pxc:
...
   Restart Count:  0
   Limits:
     cpu:     1
     memory:  2G
   Requests:
     cpu:      1
     memory:   2G
   Liveness:   exec [/var/lib/mysql/liveness-check.sh] delay=300s timeout=5s period=10s #success=1 #failure=3
   Readiness:  exec [/var/lib/mysql/readiness-check.sh] delay=15s timeout=15s period=30s #success=1 #failure=5
   Environment Variables from:
     pxc-env-vars-pxc  Secret  Optional: true
   Environment:
...
   Mounts:
...
Volumes:
...
Events:                      <none>
```

This gives a lot of information about containers, resources, container status and also events. So, describe output should be checked to see any abnormalities.
