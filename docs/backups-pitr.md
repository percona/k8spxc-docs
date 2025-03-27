# Store binary logs for point-in-time recovery

Point-in-time recovery allows users to roll back the cluster to a
specific transaction or time. You can even skip a transaction if you don't need it anymore. To do so, the Operator needs a backup and binary logs (binlogs) of the server. 

A binary log records all changes made to the database, such as updates, inserts, and deletes. It is used to synchronize data across servers for and point-in-time recovery. 

Point-in-time recovery is off by
default and is supported by the Operator with Percona XtraDB Cluster
versions starting from 8.0.21-12.1.

After you [enable point-in-time recovery](#enable-point-in-time-recovery), the Operator spins up a separate point-in-time recovery Pod, which starts saving binary log updates
[to the backup storage](backups-storage.md). 


## Considerations

1. Both binlog and full backup should use the same storage to make the point-in-time recovery work
2. Point-in-time recovery will be done for binlogs without any
    cluster-based filtering. Therefore it is recommended to use a separate
    storage, bucket, or directory to store binlogs for the cluster.
    Also, it is recommended to have empty bucket/directory which holds binlogs
    (with no binlogs or files from previous attempts or other clusters) when
    you enable point-in-time recovery.
3. Don't [purge binlogs :octicons-link-external-16:](https://dev.mysql.com/doc/refman/8.0/en/purge-binary-logs.html)
    before they are transferred to the backup storage. Doing so breaks point-in-time recovery
4. Disable the [retention policy](operator.md#backupschedulekeep) as it is incompatible with the point-in-time recovery. To clean up the storage, configure the [Bucket lifecycle :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/userguide/how-to-set-lifecycle-configuration-intro.html) on the storage

## Enable point-in-time recovery

To use point-in-time recovery, set the following keys in the `pitr` subsection
under the `backup` section of the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) manifest:

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

For how to restore a database to a specific point in time, see [Restore the cluster with point-in-time recovery](backups-restore.md#restore-the-cluster-with-point-in-time-recovery).

## Monitoring binary logs

The point-in-time recovery Pod collects statistics metrics for binlogs. They provide insights into the success and failure rates of binlog operations, timeliness of processing and uploads and potential gaps or inconsistencies in binlog data.

The available metrics are:

* `pxc_binlog_collector_success_total` - The total number of successful binlog collection cycles. It helps monitor how often the binlog collector successfully processes and uploads binary logs.
* `pxc_binlog_collector_failure_total` - The total number of failed binlog collection cycles. Indicates issues in the binlog collection process, such as connectivity problems or errors during processing
* `pxc_binlog_collector_gap_detected_total` - Tracks the total number of gaps detected in the binlog sequence during collection. Highlights potential issues with missing or skipped binlogs, which could impact replication or recovery.
* `pxc_binlog_collector_last_processing_timestamp` - Records the timestamp of the last successful binlog processing operation.
* `pxc_binlog_collector_last_upload_timestamp` - Records the timestamp of the last successful binlog upload to the storage
* `pxc_binlog_collector_uploaded_total` - The total number of successfully uploaded binlogs

You can connect to this Pod using the `<pitr-pod-service>:8080/metrics` endpoint to gather these metrics and further analyze them.