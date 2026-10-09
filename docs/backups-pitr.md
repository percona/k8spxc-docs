# Point-in-time recovery (PITR)

Point-in-time recovery allows you to roll back the cluster to a
specific transaction or time. You can also skip a specific transaction instead of replaying it. 

For point-in-time recovery, the Operator needs two things:

* at least one successful full backup 
* binary logs (binlogs) of the server. 
 
A binary log records all changes made to the database, such as updates, inserts, and deletes. The Operator already uses binlogs to synchronize data across cluster nodes. Point-in-time recovery reuses the same mechanism and extends it to a separate storage location so the log survives independently of the cluster.

Point-in-time recovery is off by
default and is supported starting with Percona XtraDB Cluster 8.0.21-12.1.

After you [enable point-in-time recovery](#enable-point-in-time-recovery), the Operator spins up a separate point-in-time recovery Pod, which starts saving binary log updates
[to the backup storage](backups-storage.md). 

## Considerations

1. Use either S3-compatible or Azure-compatible storage for both the binlog and the full backup. Point-in-time recovery doesn't work with other storage types.

2. The Operator saves binlogs without any
    cluster-based filtering. Use a separate folder per cluster on the same bucket, or use a different bucket per cluster.
    
    Also, we recommend to use an empty bucket or a folder on a bucket for binlogs when you enable point-in-time recovery. This bucket/folder should not contain binlogs or files from previous attempts or other clusters.

3. Don't [purge binlogs :octicons-link-external-16:](https://dev.mysql.com/doc/refman/8.0/en/purge-binary-logs.html) before they are transferred to the backup storage. Doing so breaks point-in-time recovery.

4. Disable the [retention policy](operator.md#backupschedulekeep) as it is incompatible with the point-in-time recovery. To clean up the storage, configure the [Bucket lifecycle :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/userguide/how-to-set-lifecycle-configuration-intro.html) on the storage.

5. Optionally set [`s3.checksumAlgorithm`](operator.md#backupstoragesstorage-names3checksumalgorithm) on the binlog storage to verify data integrity during uploads. This option also applies if you make backups with the [XtraBackup sidecar method](backups-methods.md); the default SST backup method doesn't use it.

## Enable point-in-time recovery

Before you start, make sure you [have configured the storage for binlogs](backups-storage.md).

To use point-in-time recovery, set the following keys in the `pitr` subsection
under the `backup` section of the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml) manifest:

* `backup.pitr.enabled` - set it to `true`

* `backup.pitr.storageName` - specify the same storage name that you have defined in the `storages` subsection

* `timeBetweenUploads`- specify the number of seconds between running the
    binlog uploader

The following example shows how the `pitr` subsection looks like if you use the S3 storage:

```yaml
backup:
  ...
  pitr:
    enabled: true
    storageName: s3-us-west
    timeBetweenUploads: 60
```

For how to restore a database to a specific point in time, see [Restore with point-in-time recovery](backups-pitr-restore.md).

## Binary logs statistics

The point-in-time recovery Pod has statistics metrics for binlogs. They provide insights into the success and failure rates of binlog operations, timeliness of processing and uploads and potential gaps or inconsistencies in binlog data.

The available metrics are:

* `pxc_binlog_collector_success_total` - The total number of successful binlog collection cycles. It helps monitor how often the binlog collector successfully processes and uploads binary logs.
* `pxc_binlog_collector_gap_detected_total` - Tracks the total number of gaps detected in the binlog sequence during collection. Highlights potential issues with missing or skipped binlogs, which could impact replication or recovery.
* `pxc_binlog_collector_last_processing_timestamp` - Records the timestamp of the last successful binlog collection operation.
* `pxc_binlog_collector_last_upload_timestamp` - Records the timestamp of the last successful binlog upload to the storage
* `pxc_binlog_collector_uploaded_total` - The total number of successfully uploaded binlogs

### Gather metrics data

You can connect to the point-in-time recovery Pod using the `<pitr-pod-service>:8080/metrics` endpoint to gather these metrics and further analyze them.

List services to get the point-in-time-recovery service name:

```bash
kubectl get services | grep 'pitr'
```

??? example "Expected output"

    ```{.text .no-copy}
    cluster1-pitr                         ClusterIP   34.118.225.138   <none>        8080/TCP
    ```

#### Access locally via port forwarding

Use this method to access the metrics from your local machine.

1. Forward the Kubernetes service's port:

    ```bash
    kubectl port-forward svc/cluster1-pitr 8080:8080
    ```

2. Open your browser and visit `<http://localhost:8080/metrics>`

    --8<-- "cli/pitr-metrics-sample.md"

#### Access directly from a Pod

You can gather the metrics from inside a database cluster. 

1. Connect to the cluster as follows, replacing the `<namespace>` placeholder with your value:

    ```bash
    kubectl run -n <namespace> -i --rm --tty percona-client --image=percona/percona-xtradb-cluster:8.4 --restart=Never -- bash -il
    ```

2. Connect to the point-in-time recovery port using `curl`:

    ```bash
    curl cluster1-pitr:8080/metrics
    ```

    --8<-- "cli/pitr-metrics-sample.md"




Note that the statistics data is not kept when the point-in-time recovery Pod restarts. This means that the counters like `pxc_binlog_collector_success_total` are reset.
