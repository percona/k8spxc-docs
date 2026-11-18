> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Making scheduled backups

Backups schedule is defined in the `backup` section of the Custom Resource and can be configured via the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/v1.20.0/deploy/cr.yaml) file.

1. The `backup.storages` subsection should contain at least one [configured storage](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage.html).

1. The `backup.schedule` subsection allows to actually schedule backups:

   - set the `backup.schedule.name` key to some arbitrary backup name (this name will be needed later to [restore the backup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore.html)).
   - specify the `backup.schedule.schedule` option with the desired backup schedule in [crontab format](https://en.wikipedia.org/wiki/Cron) .
   - set the `backup.schedule.storageName` key to the name of your [already configured storage](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage.html).
   - you can optionally define the retention policy for backups: how many backups which should be kept in the storage.

Here is an example of the `deploy/cr.yaml` with a scheduled Saturday night backup kept on the Amazon S3 storage:

```
...
backup:
  storages:
    s3-us-west:
      type: s3
      s3:
        bucket: S3-BACKUP-BUCKET-NAME-HERE
        region: us-west-2
        credentialsSecret: my-cluster-name-backup-s3
  schedule:
   - name: "sat-night-backup"
     schedule: "0 0 * * 6"
     retention:
        count: 3
        type: count
        deleteFromStorage: true
     storageName: s3-us-west
  ...
```

## Verify a scheduled backup ran

1. List backups for the cluster and confirm the latest scheduled run shows `Succeeded`:

   ```
   kubectl get pxc-backup -n <namespace>
   ```

1. For more detail on a specific backup, including the error message if it failed:

   ```
   kubectl describe pxc-backup <backup-name> -n <namespace>
   ```

1. If the cluster has [point-in-time recovery enabled](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr.html), also confirm the backup doesn’t have binlog gaps before relying on it for a PITR restore — see [Binlog gaps](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr-restore.html#binlog-gaps).
