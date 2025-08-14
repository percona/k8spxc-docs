# How to restore backup to a new Kubernetes-based environment

You can restore from a backup as follows:

* [On the same cluster where you made a backup](backups-restore.md)
* On a new cluster deployed in a different Kubernetes-based environment.

To restore a backup, you will use the special restore configuration file. The
example of such file is [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/restore.yaml). The list of options that can be used in it can
be found in the [restore options reference](operator.md#perconaxtradbclusterrestore-custom-resource-options).

This document focuses on the restore on a new cluster deployed in a different Kubernetes environment.

??? admonition "For Operator version 1.17.0 and earlier"

    When restoring to a new Kubernetes-based environment, make sure it has a Secrets
    object with the same **user passwords** as in the original cluster. More details
    about secrets can be found in [System Users](users.md#system-users).
    The name of the required Secrets object can be found out from the
    `spec.secretsName` key in the `deploy/cr.yaml` (`cluster1-secrets` by default).

## Restore scenarios

This document covers the following restore scenarios:

* [Restore from a full backup](#restore-from-a-full-backup) - the restore from a backup without point-in-time
* [Point-in-time recovery](#restore-with-point-in-time-recovery) - restore to a specific time, a specific or  latest transaction or skip a specific transaction during a restore. This ability requires that you [configure storing binlogs for point-in-time recovery](backups-pitr.md)

To restore from a backup, you create a special Restore object using a special restore configuration file. The
example of such file is [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml).

You can check available options in the [restore options reference](operator.md#perconaxtradbclusterrestore-custom-resource-options).

--8<-- "backups-restore.md:backup-prepare"

## Restore the cluster without point-in-time recovery

1. Set appropriate keys in the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/restore.yaml) file.

    * set `spec.pxcCluster` key to the name of the target cluster to restore
        the backup on,

    * set `spec.backupSource` subsection to point on the appropriate PVC, or
        cloud storage:
        
        === "PVC volume"

            The `storageName` key should contain the storage name (which
            should be configured in the main CR), and the `destination` key
            should be equal to the PVC Name:

            ```yaml
            ...
            backupSource:
              destination: pvc/PVC_VOLUME_NAME
              storageName: pvc
              ...
            ```

            !!! note
            
                <a name="backups-headless-service"> If you need a [headless Service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services) for the restore Pod (i.e. restoring from a Persistent Volume in a tenant network), mention this in the `metadata.annotations` as follows:

                ```yaml
                annotations:
                  percona.com/headless-service: "true"
                ...
                ```

        === "S3-compatible storage"

            The `destination` key should have value composed of three parts:
            the `s3://` prefix, the S3 [bucket :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingBucket.html),
            and the backup name, which you have already found out using the
            `kubectl get pxc-backup` command. Also you should add necessary
            S3 configuration keys, [same](backups-storage.md) as those used
            to configure S3-compatible storage for backups in the
            `deploy/cr.yaml` file:

            ```yaml
            ...
            backupSource:
              destination: s3://S3-BUCKET-NAME/BACKUP-NAME
              s3:
                bucket: S3-BUCKET-NAME
                credentialsSecret: my-cluster-name-backup-s3
                region: us-west-2
                endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
                ...
            ```

        === "Azure Blob storage"

            The `destination` key should have value composed of three parts:
            the `azure://` prefix, the Azure Blob [container :octicons-link-external-16:](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers),
            and the backup name, which you have already found out using the
            `kubectl get pxc-backup` command. Also you should add necessary
            Azure configuration keys, [same](backups-storage.md) as those
            used to configure Azure Blob storage for backups in the
            `deploy/cr.yaml` file:

            ```yaml
            ...
            backupSource:
              destination: azure://AZURE-CONTAINER-NAME/BACKUP-NAME
              azure:
                container: AZURE-CONTAINER-NAME
                credentialsSecret: my-cluster-azure-secret
                ...
            ```

2. After that, the actual restoration process can be started as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/restore.yaml
    ```

## Restore the cluster with point-in-time recovery

!!! note

    Disable the point-in-time functionality on the existing cluster before
    restoring a backup on it, regardless of whether the backup was made
    with point-in-time recovery or without it.

1. Set appropriate keys in the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/restore.yaml) file.

    * set `spec.pxcCluster` key to the name of the target cluster to restore
        the backup on,

    * put additional restoration parameters to the `pitr` section:

        * `type` key can be equal to one of the following options,

            * `date` - roll back to specific date,
            * `transaction` - roll back to a specific transaction (available since Operator 1.8.0),
            * `latest` - recover to the latest possible transaction,
            * `skip` - skip a specific transaction (available since Operator 1.7.0).

        * `date` key is used with `type=date` option and contains value in
            datetime format,
        * `gtid` key (available since the Operator 1.8.0) is used with `type=transaction` option and contains exact
            GTID of a transaction **which follows** the last transaction included into the recovery,

    * set `spec.backupSource` subsection to point on the appropriate
        S3-compatible storage. This subsection should contain a
        `destination` key equal to the s3 bucket with a special
        `s3://` prefix, followed by necessary S3 configuration keys, [same](backups-storage.md)
        as in `deploy/cr.yaml` file.

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
              destination: s3://S3-BUCKET-NAME/BACKUP-NAME
              s3:
                bucket: S3-BUCKET-NAME
                credentialsSecret: my-cluster-name-backup-s3
                region: us-west-2
                endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
    ```

    * you can also use a `storageName` key to specify the exact name of the
        storage (the actual storage should be already defined in the
        `backup.storages` subsection of the `deploy/cr.yaml` file):

        ```yaml
        ...
        storageName: s3-us-west
        backupSource:
          destination: s3://S3-BUCKET-NAME/BACKUP-NAME
        ```

2. Run the actual restoration process:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/restore.yaml
    ```

