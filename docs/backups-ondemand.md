# Make on-demand backup

1. To make an on-demand backup, you should first check your Custom Resource for
    the necessary options and make changes, if needed, using the
    `deploy/cr.yaml` configuration file. The `backup.storages` subsection should
    contain at least one [configured storage](backups-storage.md).

    You can apply changes in the `deploy/cr.yaml` file with the usual
    `kubectl apply -f deploy/cr.yaml` command.

2. Now use *a special backup configuration YAML file* with the following
    keys:

    * `metadata.name` key should be set to the **backup name**
        (this name will be needed later to [restore the bakup](backups-restore.md)),

    * `spec.pxcCluster` key should be set to the name of your cluster,

    * `spec.storageName` key should be set to the name of your [already configured storage](backups-storage.md).

    * optionally you can set the `metadata.finalizers.delete-s3-backup` key (it
        triggers the actual deletion of backup files from the S3 bucket or azure
        container when there is a manual or scheduled removal of the
        corresponding backup object).

    You can find the example of such file in
    [deploy/backup/backup.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/backup.yaml):

    ```yaml
    apiVersion: pxc.percona.com/v1
    kind: PerconaXtraDBClusterBackup
metadata:
      finalizers:
        - delete-s3-backup
      name: backup1
    spec:
      pxcCluster: cluster1
      storageName: fs-pvc
    ```

3. Run the actual backup command using this file:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/backup.yaml
    ```

