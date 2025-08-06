# Making scheduled backups

Backups schedule is defined in the `backup` section of the Custom
Resource and can be configured via the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml)
file.

1. The `backup.storages` subsection should contain at least one [configured storage](backups-storage.md).

2. The `backup.schedule` subsection allows to actually schedule backups:

    * set the `backup.schedule.name` key to some arbitray backup name (this name
        will be needed later to [restore the bakup](backups-restore.md)).

    * specify the `backup.schedule.schedule` option with the desired backup
        schedule in [crontab format :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron).

    * set the `backup.schedule.storageName` key to the name of your [already configured storage](backups-storage.md).

    * you can optionally set the `backup.schedule.keep` key to the number of
       backups which should be kept in the storage.

Here is an example of the `deploy/cr.yaml` with a scheduled Saturday night
backup kept on the Amazon S3 storage:

```yaml
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
     keep: 3
     storageName: s3-us-west
  ...
```

!!! note

    Before the Operator version 1.10 scheduled backups were based on [Kubernetes CronJobs :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/), while newer Operator versions take care about scheduled backups itself. Clusters upgraded from the Operator version 1.9 may need manual deletion of scheduled backups CronJobs, if any existed prior to the upgrade (otherwise backups will run twice).

    You can check if there are any CronJobs in the namespace of your cluster related to scheduled backups as follows:

    ```{.bash data-prompt="$" }
    $ kubectl get cronjobs -n <namespace>
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME SCHEDULE SUSPEND ACTIVE LAST SCHEDULE AGE
        sat-night-backup 0 0 * * 6 False 0 <none> 4m36s
        ```

    Deleting CronJob is straightforward:
    
    ```{.bash data-prompt="$" }
    $ kubectl delete cronjob sat-night-backup -n <namespace>
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        cronjob.batch "sat-night-backup" deleted
        ```
