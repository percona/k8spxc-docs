# Restore from a backup

To restore your Percona XtraDB Cluster from a backup, you create a `PerconaXtraDBClusterRestore` object using a restore configuration file. The example of such file is [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/restore.yaml). You can check available options in the [restore options reference](restore-cr.md).

## Restore scenarios

| Destination | Use it when... | Tutorial |
| --- | --- | --- |
| The same cluster (in-place) | You want to roll the cluster back to an earlier state if a mistake happens. For example, after a bad `DELETE` or a failed upgrade. | [Restore to the same cluster](backups-restore-in-place.md) |
| A side cluster | You want to test a change or inspect data without touching production on the same Kubernetes cluster. | [Restore to a side cluster](backups-restore-side-cluster.md) |
| A new cluster | You're migrating or copying data to a different Kubernetes cluster or environment. | [Restore to a new cluster](backups-restore-to-new-cluster.md) |
| After a disaster | The original cluster and its Kubernetes environment are both gone. | [Restore the cluster after a disaster](backups-disaster-restore.md) |

Any of these can also land on an exact time or transaction instead of the last full backup. Refer to the [Restore with point-in-time recovery](backups-pitr-restore.md) for guidelines.

## Choose `backupName` or `backupSource`

Every restore names its source in one of two ways. Use exactly one - setting both is not allowed.

| | `backupName` | `backupSource` |
| --- | --- | --- |
| Use it when | A Backup object for that backup already exists in the namespace you're restoring into. | No Backup object exists in the target namespace. |
| Typical case | - An in-place restore to the same cluster, <br> - A restore to a side cluster in the same namespace as the source. | - A side cluster in a different namespace, <br> - A new cluster on a different Kubernetes environment, <br> - A disaster restore. |

`backupSource` still has to say where the backup files are. Point it at storage in one of two places:

| | `storageName` | Storage fields on the restore object |
| --- | --- | --- |
| Use it when | That storage is already defined in the target cluster's `cr.yaml`. | The target cluster has no matching storage yet. |
| What you set | `storageName` and `destination`. | The bucket, credentials, region, and other storage details. |

--8<-- [start:backup-prepare]

## Before you start

1. Make sure that the cluster is running.
2. Export the cluster name and the namespace where it is running as environment variables. Replace `cluster1` and `<namespace>` with your values:
   
    ```bash
    export CLUSTER=cluster1
    export NAMESPACE=<namespace>
    ```

3. List the cluster to find the correct cluster name. 

    ```bash
    kubectl get pxc -n $NAMESPACE
    ```

4. List backups to retrieve the desired backup name. Replace the `<namespace>` with your value:

    ```bash
    kubectl get pxc-backup -n $NAMESPACE
    ```

5. For point-in-time recovery, disable storing binlogs point-in-time functionality on the existing cluster. You must do it regardless of whether you made the backup with point-in-time recovery or without it. Use the following command and replace the cluster name and the `<namespace>` with your values:

    ```bash
    kubectl patch pxc $CLUSTER \
      -n $NAMESPACE \
      --type merge \
      -p '{"spec":{"backup":{"pitr":{"enabled":false}}}}'
    ```

--8<-- [end:backup-prepare]

## Restore limitations

* **Storage type.** Restoring from an `emptyDir` or `hostPath` volume isn't supported — back up from one if you need to, then restore the result onto a Persistent Volume instead. A Persistent Volume restore only works within the same Kubernetes cluster ([in-place](backups-restore-in-place.md) or a [side cluster](backups-restore-side-cluster.md)). A [new cluster on a different Kubernetes environment](backups-restore-to-new-cluster.md), a [disaster restore](backups-disaster-restore.md), and any [point-in-time recovery](backups-pitr-restore.md) restore all require the full backup to be in cloud storage (S3 or Azure).
* **User passwords.** A full-backup restore tolerates changed passwords since Operator 1.18.0 — see [Restore the cluster when backup has different passwords](#restore-the-cluster-when-backup-has-different-passwords). A point-in-time restore doesn't: it still requires a Secret with the passwords that were in effect at backup time. This is a known limitation.

## Restore the cluster when a backup has different passwords

User passwords on the target cluster may have changed and now differ from the ones in a backup.

Starting with version 1.18.0, the Operator no longer requires matching secrets between the backup and the target cluster. After the restore, it changes user passwords using the local Secret as a source. It also creates missing system users and adds missing grants. So you can restore from a full backup as usual.

!!! important

    To run a [point-in-time restore](backups-pitr-restore.md) you still require a Secret object with the same user passwords. This is a known limitation and will be addressed in a future release. Please refer to the flow described below for now.

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
      name: $CLUSTER-mysql-init
    data:
      init.sql: <base64encodedstring>
    EOF
    ```

3. Now you can restore the needed backup as usual.
