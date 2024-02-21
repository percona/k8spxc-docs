# Restore the cluster from a previously saved backup

The backup is normally restored on the Kubernetes cluster where it was made,
but [restoring it on a different Kubernetes-based environment with the installed Operator is also possible](backups-restore-to-new-cluster.md).

Backups **cannot be restored** to [emptyDir and hostPath volumes](storage.md#storage-local),
but it is possible to make a backup from such storage (i. e., from
emptyDir/hostPath to S3), and later restore it to a [Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/).

To restore a backup, you will use the special restore configuration file. The
example of such file is [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml). The list of options that can be used in it can
be found in the [restore options reference](operator.md#perconaxtradbclusterrestore-custom-resource-options).

Following things are needed to restore a previously saved backup:

* Make sure that the cluster is running.
* Find out correct names for the **backup** and the **cluster**. Available
    backups can be listed with the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl get pxc-backup
    ```

    And the following command will list available clusters:

    ``` {.bash data-prompt="$" }
    $ kubectl get pxc
    ```

!!! note

     If you have [configured storing binlogs for point-in-time recovery](backups-pitr.md),
     you will have possibility to roll back the cluster to a specific
     transaction, time (or even skip a transaction in some cases). Otherwise, 
     restoring backups without point-in-time recovery is the only option.

When the correct names for the backup and the cluster are known, backup
restoration can be done in the following way.

## Restore the cluster without point-in-time recovery

1. Set appropriate keys in the [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file.

    * set `spec.pxcCluster` key to the name of the target cluster to restore
        the backup on,

    * set `spec.backupName` key to the name of your backup,

    * you can also use a `storageName` key to specify the exact name of the
        storage (the actual storage should be [already defined](backups-storage.md)
        in the `backup.storages` subsection of the `deploy/cr.yaml` file):

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          backupName: backup1
          storageName: s3-us-west
        ```

2. After that, the actual restoration process can be started as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/restore.yaml
    ```

    !!! note

        Storing backup settings in a separate file can be replaced by
        passing its content to the `kubectl apply` command as follows:

        ``` {.bash data-prompt="$" }
        $ cat <<EOF | kubectl apply -f-
        apiVersion: "pxc.percona.com/v1"
        kind: "PerconaXtraDBClusterRestore"
        metadata:
          name: "restore1"
        spec:
          pxcCluster: "cluster1"
          backupName: "backup1"
        EOF
        ```

## Restore the cluster with point-in-time recovery

!!! note

    Disable the point-in-time functionality on the existing cluster before
    restoring a backup on it, regardless of whether the backup was made
    with point-in-time recovery or without it.

1. Set appropriate keys in the [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file.

    * set `spec.pxcCluster` key to the name of the target cluster to restore
        the backup on,

    * set `spec.backupName` key to the name of your backup,

    * put additional restoration parameters to the `pitr` section:

        * `type` key can be equal to one of the following options,

            * `date` - roll back to specific date,
            * `transaction` - roll back to a specific transaction (available since Operator 1.8.0),
            * `latest` - recover to the latest possible transaction,
            * `skip` - skip a specific transaction (available since Operator 1.7.0).

        * `date` key is used with `type=date` option and contains value in
            datetime format,
        * `gtid` key (available since the Operator 1.8.0) is used with `type=transaction` option and contains exact
            GTID of a transaction **which follows** the last transaction included into the recovery

    * use `backupSource.storageName` key to specify the exact name of the
        storage (the actual storage should be [already defined](backups-storage.md)
        in the `backup.storages` subsection of the `deploy/cr.yaml` file).

    The resulting `restore.yaml` file may look as follows:

    ```yaml
    apiVersion: pxc.percona.com/v1
    kind: PerconaXtraDBClusterRestore
    metadata:
      name: restore1
    spec:
      pxcCluster: cluster1
      backupName: backup1
      pitr:
        type: date
        date: "2020-12-31 09:37:13"
        backupSource:
          storageName: "s3-us-west"
    ```

   !!! note
   
       Full backup objects available with the `kubectl get pxc-backup` command
       have two information fields handy when selecting a backup to restore:
        "Earliest restorable time" and "Latest restorable time". You can easily
        query the backup for this information as follows:
       
       ``` {.bash data-prompt="$" }
       $ kubectl get pxc-backup <backup_name> -o jsonpath='{.status.earliestRestorableTime}'
       $ kubectl get pxc-backup <backup_name> -o jsonpath='{.status.latestRestorableTime}'
       ```

2. Run the actual restoration process:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/restore.yaml
    ```

    !!! note

        Storing backup settings in a separate file can be replaced by
        passing its content to the `kubectl apply` command as follows:

        ``` {.bash data-prompt="$" }
        $ cat <<EOF | kubectl apply -f-
        apiVersion: "pxc.percona.com/v1"
        kind: "PerconaXtraDBClusterRestore"
        metadata:
          name: "restore1"
        spec:
          pxcCluster: "cluster1"
          backupName: "backup1"
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
            backupSource:
              storageName: "s3-us-west"
        EOF
        ```
<a name="backup-pitr-binlog-gaps"></a>

Take into account, that Operator monitors the binlog gaps detected by
binlog collector, if any. If backup contains such gaps, the Operator will mark
the status of the latest successful backup with a new condition field that
indicates backup can't guarantee consistent point-in-time recovery. This
condition looks as follows:

```yaml
apiVersion: pxc.percona.com/v1
kind: PerconaXtraDBClusterBackup
metadata:
  name: backup1
spec:
  pxcCluster: pitr
  storageName: minio
status:
  completed: "2022-11-25T15:57:29Z"
  conditions:
  - lastTransitionTime: "2022-11-25T15:57:48Z"
    message: Binlog with GTID set e41eb219-6cd8-11ed-94c8-9ebf697d3d20:21-22 not found
    reason: BinlogGapDetected
    status: "False"
    type: PITRReady
  state: Succeeded
```

Trying to restore from such backup (with the condition value "False") with
point-in-time recovery will result in the following error: 

```text
Backup doesn't guarantee consistent recovery with PITR. Annotate PerconaXtraDBClusterRestore with percona.com/unsafe-pitr to force it.
```

You can disable this check and force the restore by annotating it with
`pxc.percona.com/unsafe-pitr` as follows:

```yaml
apiVersion: pxc.percona.com/v1
kind: PerconaXtraDBClusterRestore
metadata:
  annotations:
    percona.com/unsafe-pitr: "true"
  name: restore2
spec:
  pxcCluster: pitr
  backupName: backup1
  pitr:
    type: latest
    backupSource:
      storageName: "minio-binlogs"
```
