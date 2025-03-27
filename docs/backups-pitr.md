# Store binary logs for point-in-time recovery

Point-in-time recovery functionality allows users to roll back the cluster to a
specific transaction, time (or even skip a transaction in some cases).
Technically, this feature involves continuously saving binary log updates
[to the backup storage](backups-storage.md). Point-in-time recovery is off by
default and is supported by the Operator only with Percona XtraDB Cluster
versions starting from 8.0.21-12.1.

To be used, it requires setting a number of keys in the `pitr` subsection
under the `backup` section of the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file:

* `backup.pitr.enabled` key should be set to `true`

* `backup.pitr.storageName` key should point to the name of the storage already
    configured in the `storages` subsection

    !!! note
        Both binlog and full backup should use s3-compatible storage to make
        point-in-time recovery work!

* `timeBetweenUploads` key specifies the number of seconds between running the
    binlog uploader.

The following example shows how the `pitr` subsection looks like:

```yaml
backup:
  ...
  pitr:
    enabled: true
    storageName: s3-us-west
    timeBetweenUploads: 60
```

!!! note

    Point-in-time recovery will be done for binlogs without any
    cluster-based filtering. Therefore it is recommended to use a separate
    storage, bucket, or directory to store binlogs for the cluster.
    Also, it is recommended to have empty bucket/directory which holds binlogs
    (with no binlogs or files from previous attempts or other clusters) when
    you enable point-in-time recovery.

!!! note

    [Purging binlogs :octicons-link-external-16:](https://dev.mysql.com/doc/refman/8.0/en/purge-binary-logs.html)
    before they are transferred to backup storage will break point-in-time recovery.


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