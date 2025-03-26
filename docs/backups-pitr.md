# Store binary logs for point-in-time recovery

Point-in-time recovery allows users to roll back the cluster to a
specific transaction or time. You can even skip a transaction if you don't need it anymore. To do so, the Operator needs a backup and the binary logs (binlogs) of the server. They contain the operations that modified the database from a point in the past.

Point-in-time recovery is off by
default and is supported by the Operator only with Percona XtraDB Cluster
versions starting from 8.0.21-12.1.

After you [enable point-in-time recovery](#enable-point-in-time-recovery), the Operator saves binary log updates
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

For how to restore a database to a point in time, see [Restore the cluster with point-in-time recovery](backups-restore.md#restore-the-cluster-with-point-in-time-recovery).