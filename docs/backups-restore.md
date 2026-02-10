# Restore the cluster from a previously saved backup

You can restore from a backup as follows:

* On the same cluster where you made a backup
* On [a new cluster deployed in a different Kubernetes-based environment](backups-restore-to-new-cluster.md).

This document focuses on the restore to the same cluster.

## Restore scenarios

This document covers the following restore scenarios:

* [Restore from a full backup](#restore-from-a-full-backup) - restore from a backup without point-in-time recovery
* [Point-in-time recovery](#restore-with-point-in-time-recovery) - restore to a specific time, a specific or latest transaction, or skip a specific transaction during a restore. This ability requires that you [configure storing binlogs for point-in-time recovery](backups-pitr.md)
* [Restore when a backup has different passwords](#restore-the-cluster-when-backup-has-different-passwords)

To restore from a backup, you create a `PerconaXtraDBClusterRestore` object using a restore configuration file. The example of such file is [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/restore.yaml).

You can check available options in the [restore options reference](restore-cr.md).

### Specifying the backup source

You can specify the backup to restore from in two ways: using the `backupName` or the `backupSource` keys. You must use only one of these options in your restore configuration. Specifying them both together is not allowed.

* Use the **`backupName`** option when backup objects exist in the cluster, such as for restoring to the same cluster where the backup was created.

* Use the **`backupSource`** option for the following scenarios:

    * when there are no backup objects in the cluster, such as when restoring to a new cluster. 

    * for restores to the same cluster, instead of `backupName`. If the backup storage is configured in the target cluster's configuration, you can use `backupSource` with `storageName` (for example, for restores from Persistent volume backups). If the storage is not defined in the cluster, you must manually specify all required storage details within the restore configuration.

### Storage limitations

You **cannot restore** to [emptyDir and hostPath volumes](storage.md). However, you can make a backup from such storage (for example, from emptyDir/hostPath to S3) and later restore it to a [Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/).

--8<-- [start:backup-prepare]

## Before you start

1. Make sure that the cluster is running.
2. List the cluster to find the correct cluster name. Replace the `<namespace>` with your value:

    ```bash
    kubectl get pxc -n <namespace>
    ```

3. List backups to retrieve the desired backup name. Replace the `<namespace>` with your value:

    ```bash
    kubectl get pxc-backup -n <namespace>
    ```

4. For point-in-time recovery, disable storing binlogs point-in-time functionality on the existing cluster. You must do it regardless of whether you made the backup with point-in-time recovery or without it. Use the following command and replace the cluster name and the `<namespace>` with your values:

    ```bash
    kubectl patch pxc cluster1 \
      -n <namespace> \
      --type merge \
      -p '{"spec":{"backup":{"pitr":{"enabled":false}}}}'
    ```

--8<-- [end:backup-prepare]

## Restore from a full backup

To restore your Percona XtraDB cluster from a backup, define a `PerconaXtraDBClusterRestore` custom resource. Set the following keys:

* `spec.pxcCluster`: the name of the target cluster 
* `spec.backupName`: the name of your backup,

Pass this configuration to the Operator: 

=== "via the YAML manifest"

    1. Edit the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file and specify the following keys:

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          backupName: backup1
        ```

    2. Start the restore with this command:

        ```bash
        kubectl apply -f deploy/backup/restore.yaml -n <namespace>
        ```

=== "via the command line"

    You can skip creating a separate file by passing YAML content directly:

    ```bash
    cat <<EOF | kubectl apply -f-
    apiVersion: "pxc.percona.com/v1"
    kind: "PerconaXtraDBClusterRestore"
    metadata:
      name: "restore1"
    spec:
      pxcCluster: "cluster1"
      backupName: "backup1"
    EOF
    ```

### Restore from a backup using the `backupSource` option

You can use the `backupSource` option instead of the `backupName`. In this case you also need to specify the destination - where the backup is stored. Take this value from the output of the `kubectl get pxc-backup -n <namespace>` command.

When restoring to the same cluster, the backup storage is already defined in the cluster's configuration and you can reference it by name.

Here's the example configuration for the restore from a Persistent volume backup:

```yaml
spec:
  pxcCluster: cluster1
  storageName: pvc-fs
  backupSource:
    destination: pvc-fs/PVC_VOLUME_NAME
  ...
```

!!! note

    <a name="backups-headless-service"> If you need a [headless Service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services) for the restore Pod (i.e. restoring from a Persistent Volume in a tenant network), mention this in the `metadata.annotations` as follows:

    ```yaml
    annotations:
      percona.com/headless-service: "true"
    ...
    ```

Apply the configuration to start the restore:

```bash
kubectl apply -f deploy/backup/restore.yaml -n <namespace>
```

## Restore with point-in-time recovery

1. Check a time to restore for a backup. Use the command below to find the latest restorable timestamp:

    ```bash
    kubectl get pxc-backup <backup_name> -o jsonpath='{.status.latestRestorableTime}'
    ```

2. Set the following keys for the `PerconaXtraDBClusterRestore` custom resource:

    * `spec.pxcCluster`: the name of the target cluster

    * `spec.backupName`: the name of your backup

    * for the `pitr` section:

       * `type`: one of the following values:

          * `date` - roll back to specific date,
          * `transaction` - roll back to a specific transaction (available since Operator 1.8.0),
          * `latest` - recover most recent transaction,
          * `skip` - skip a specific transaction (available since Operator 1.7.0).

       * `date`: is used with `type=date` option and contains the value in the datetime format,
       * `gtid`: is used with `type=transaction` option and contains exact
                GTID of a transaction **which follows** the last transaction included into the recovery (available since the Operator 1.8.0)

      * (optional) `storageName`: the exact name of the storage. Note that you must have [already defined the storage](backups-storage.md) in the `backup.storages` subsection of the `deploy/cr.yaml` file.

3. Pass this configuration to the Operator:

    === "via the YAML manifest"

        1. Edit the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file.

            The sample configuration may look as follows:

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
                  storageName: s3-us-west
            ```
   
        2. Start the restore:

            ```bash
            kubectl apply -f deploy/backup/restore.yaml
            ```

    === "via the command line"

        You can skip editing the YAML file and pass its contents to the Operator via the command line. For example:
        
        ```bash
        cat <<EOF | kubectl apply -f-
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

4. Make a new full backup after the restore, because your restored database is now the new baseline for future recoveries

### Binlog gaps

The Operator monitors the binlog gaps detected by
binlog collector, if any. If a backup contains such gaps, the Operator will mark
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

Trying a point-in-time restore from such backup (with the condition value "False") results in the following error: 

```text
Backup doesn't guarantee consistent recovery with PITR. Annotate PerconaXtraDBClusterRestore with percona.com/unsafe-pitr to force it.
```

You can bypass this check and force the restore by annotating it with
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

## Restore the cluster when backup has different passwords

User passwords on the target cluster may have changed and now differ from the ones in a backup.

Starting with version 1.18.0, the Operator no longer requires matching secrets between the backup and the target cluster. After the restore, it changes user passwords using the local Secret as a source. It also creates missing system users and adds missing grants. So you can [restore from a full backup](#restore-from-a-full-backup) as usual.

!!! important 

    To run a [point-in-time restore](#restore-with-point-in-time-recovery) you still require a Secret object with the same user passwords. This is a known limitation and will be addressed in a future release. Please refer to the flow described below for now.

**For the Operator versions 1.17.0 and earlier**, read on.

If the cluster is restored to a backup which has different user passwords,
the Operator will be unable connect to database using the passwords in Secrets,
and so will fail to reconcile the cluster.

Let's consider an example with four backups, first two of which were done before
the password rotation and therefore have different passwords:

``` {.text .no-copy hl_lines="2 3"}
NAME      CLUSTER    STORAGE   DESTINATION      STATUS      COMPLETED   AGE
backup1   cluster1   fs-pvc    pvc/xb-backup1   Succeeded   23m         24m
backup2   cluster1   fs-pvc    pvc/xb-backup2   Succeeded   18m         19m
backup3   cluster1   fs-pvc    pvc/xb-backup3   Succeeded   13m         14m
backup3   cluster1   fs-pvc    pvc/xb-backup4   Succeeded   8m53s       9m29s
backup4   cluster1   fs-pvc    pvc/xb-backup5   Succeeded   3m11s       4m29s
```

In this case you will need some manual operations same as the Operator does
to propagate password changes in Secrets to the database
**before restoring a backup**.

When the user updates a password in the Secret, the Operator creates a temporary
Secret called `<clusterName>-mysql-init` and puts (or appends) the required
`ALTER USER` statement into it. Then MySQL Pods are mounting this init
Secret if exist and running corresponding statements on startup. When a new
backup is created and successfully finished, the Operator deletes the init
Secret.

In the above example passwords are changed after backup2 was finished, and then
three new backups were created, so the init Secret does not exist. If
you want to restore to backup2, you need to create the init secret by
your own with the latest passwords as follows.

1. Make a base64-encoded string with needed SQL statements (substitute each
    `<latestPass>` with the password of the appropriate user):

    === "in Linux"

        ```bash
        cat <<EOF | base64 --wrap=0
        ALTER USER 'root'@'%' IDENTIFIED BY '<latestPass>';
        ALTER USER 'root'@'localhost' IDENTIFIED BY '<latestPass>';
        ALTER USER 'operator'@'%' IDENTIFIED BY '<latestPass>';
        ALTER USER 'monitor'@'%' IDENTIFIED BY '<latestPass>';
        ALTER USER 'clustercheck'@'localhost' IDENTIFIED BY '<latestPass>';
        ALTER USER 'xtrabackup'@'%' IDENTIFIED BY '<latestPass>';
        ALTER USER 'xtrabackup'@'localhost' IDENTIFIED BY '<latestPass>';
        ALTER USER 'replication'@'%' IDENTIFIED BY '<latestPass>';
        EOF
        ```

    === "in macOS"

        ```bash
        cat <<EOF | base64
        ALTER USER 'root'@'%' IDENTIFIED BY '<latestPass>';
        ALTER USER 'root'@'localhost' IDENTIFIED BY '<latestPass>';
        ALTER USER 'operator'@'%' IDENTIFIED BY '<latestPass>';
        ALTER USER 'monitor'@'%' IDENTIFIED BY '<latestPass>';
        ALTER USER 'clustercheck'@'localhost' IDENTIFIED BY '<latestPass>';
        ALTER USER 'xtrabackup'@'%' IDENTIFIED BY '<latestPass>';
        ALTER USER 'xtrabackup'@'localhost' IDENTIFIED BY '<latestPass>';
        ALTER USER 'replication'@'%' IDENTIFIED BY '<latestPass>';
        EOF
        ```

2. After you obtained the needed base64-encoded string, create the appropriate
   Secret:

    ```bash
    kubectl apply -f - <<EOF
    apiVersion: v1
    kind: Secret
    type: Opaque
    metadata:
      name: cluster1-mysql-init
    data:
      init.sql: <base64encodedstring>
    EOF
    ```

3. Now you can restore the needed backup as usual.
