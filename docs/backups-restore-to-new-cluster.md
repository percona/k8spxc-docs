# Restore from a backup to a new Kubernetes-based environment

This page covers restoring a backup to a new cluster on a **different** Kubernetes cluster or environment. For example, if you migrate to another cloud provider or region. For the other restore paths, see [Restore scenarios](backups-restore.md#restore-scenarios).

Because PVCs are namespace-specific Kubernetes resources tied to a specific Kubernetes cluster, restoring to a different Kubernetes cluster only works from backups stored in cloud storage, such as S3 or Azure. See [Restore limitations](backups-restore.md#restore-limitations). 

!!! admonition "For Operator version 1.17.0 and earlier"

    When restoring to a new Kubernetes-based environment, make sure it has a Secrets
    object with the same **user passwords** as in the source cluster. Find more details
    about secrets in [System Users](users.md#system-users).
    Find the name of the required Secrets object in the
    `spec.secretsName` key in the `deploy/cr.yaml`. The default Secret name is `cluster1-secrets`.

    This differs for a point-in-time restore — see [Restore limitations](backups-restore.md#restore-limitations).

To restore from a backup, you create a `PerconaXtraDBClusterRestore` object using a restore configuration file. The example of such file is [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/restore.yaml). You can check available options in the [restore options reference](restore-cr.md).

--8<-- "backups-restore.md:backup-prepare"

## Restore from a full backup

To restore from a backup Percona XtraDB Cluster must know where to take the backup from and have access to that storage. See [Choose backupName or backupSource](backups-restore.md#choose-backupname-or-backupsource) for the general rule. A new cluster has no Backup object, so the procedures in this document use `backupSource`.

You can define the backup storage in two ways: within the restore object configuration or pre-configure it within the target cluster's Custom Resource manifest.

### Approach 1: Define storage configuration in the Restore object

If you haven't defined storage in the target cluster's `cr.yaml` file, you can configure it directly in the restore object.

1. Configure the `PerconaXtraDBClusterRestore` Custom Resource. Specify the following keys:

    * set `spec.pxcCluster` key to the name of the target cluster to restore the backup on,

    * configure the `spec.backupSource` subsection to point to the cloud storage where the backup is stored.

        === "S3-compatible storage"

            The `spec.backupSource` subsection should include:

              * a destination key. Take it from the output of the `kubectl get pxc-backup` command. The destination consists of the `s3://` prefix, the S3 bucket name
                and the backup name.
              * the necessary [storage configuration keys](backups-storage-s3.md), just like in the `deploy/cr.yaml` file of the source cluster.
              * `verifyTLS` to verify the storage server TLS certificate
              * the custom TLS configuration if you use it for backups. Refer to the [Configure TLS verification with custom certificates](backups-storage-s3.md#configure-tls-verification-with-custom-certificates) section for more information.

              ```yaml
              spec:
                pxcCluster: cluster1
                backupSource:
                  verifyTLS: true
                  destination: s3://S3-BUCKET-NAME/BACKUP-NAME
                  s3:
                    bucket: S3-BUCKET-NAME
                    credentialsSecret: my-cluster-name-backup-s3
                    region: us-west-2
                    endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
                    caBundle: #If you use custom TLS certificates for S3 storage
                      name: minio-ca-bundle
                      key: ca.crt
              ```

        === "Azure Blob storage"

            Specify the following keys in the `spec.backupSource` subsection:

            * The `destination` key. Take the value from the output of the `kubectl get pxc-backup` command.
            * The necessary [Azure storage configuration keys](backups-storage-azure.md), just like in the `deploy/cr.yaml` file of the source cluster.

            ```yaml
            spec:
              pxcCluster: cluster1
              backupSource:
                destination: azure://AZURE-CONTAINER-NAME/BACKUP-NAME
                azure:
                  container: AZURE-CONTAINER-NAME
                  credentialsSecret: my-cluster-azure-secret
                  ...
            ```

2. Start the restore process:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
    ```

### Approach 2: Storage is configured on the target cluster

You can [already define](backups-storage.md) the storage where the backup is stored in the `backup.storages` subsection of your target cluster's `deploy/cr.yaml` file. In this case, reference it by name within the restore configuration.

1. Configure the `PerconaXtraDBClusterRestore` Custom Resource. Specify the following keys:

    * set `spec.pxcCluster` key to the name of the target cluster to restore the backup on

    * specify the storage name in the `storageName` key. The name must match the name in the `backup.storages` subsection of the `deploy/cr.yaml` file

    * configure the `spec.backupSource` subsection with the backup destination

        Here are example configurations:

        === "S3-compatible storage"

            ```yaml
            spec:
              pxcCluster: cluster1
              storageName: s3-us-west
              backupSource:
                destination: s3://S3-BUCKET-NAME/BACKUP-NAME
            ```

        === "Azure Blob storage"

            ```yaml
            spec:
               pxcCluster: cluster1
               storageName: azure
               backupSource:
                 destination: azure://AZURE-CONTAINER-NAME/BACKUP-NAME
            ```

2. Run the restore process:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
    ```

### Verify the restore

--8<-- "verify-restore.md"

3. Spot-check the data you expected the backup to contain, then configure the main storage within the target cluster's `cr.yaml` so you can make subsequent backups from the new cluster.

## Restore the cluster with point-in-time recovery

See [Restore with point-in-time recovery](backups-pitr-restore.md). The storage requirements on this page still apply — PITR to a different Kubernetes cluster needs the binlogs in cloud storage, the same as the full backup.
