# Restore from a backup to a new Kubernetes-based environment

You can restore from a backup as follows:

* [On the same cluster where you made a backup](backups-restore.md)
* On a new cluster deployed in a different Kubernetes-based environment.

This document focuses on the restore on a new cluster deployed in a different Kubernetes environment.

!!! admonition "For Operator version 1.17.0 and earlier"

    When restoring to a new Kubernetes-based environment, make sure it has a Secrets
    object with the same **user passwords** as in the source cluster. Find more details
    about secrets in [System Users](users.md#system-users).
    Find the name of the required Secrets object in the
    `spec.secretsName` key in the `deploy/cr.yaml`. The default Secret name is `cluster1-secrets`.

## Restore scenarios

This document covers the following restore scenarios:

* [Restore from a full backup](#restore-from-a-full-backup) - the restore from a backup without point-in-time
* [Point-in-time recovery](#restore-the-cluster-with-point-in-time-recovery) - restore to a specific time, a specific or  latest transaction or skip a specific transaction during a restore. This ability requires that you [configure storing binlogs for point-in-time recovery](backups-pitr.md)

To restore from a backup, you create a special Restore object using a special restore configuration file. The
example of such file is [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml).

You can check available options in the [restore options reference](restore-cr.md).

## Preconditions for a restore from a PVC backup

If you are restoring from a backup stored in a Persistent Volume Claim (PVC), note that PVCs are namespace-specific Kubernetes resources. This means:

* **PVCs cannot be directly accessed across different Kubernetes clusters or namespaces** - The PVC that contains your backup exists only in the source cluster's namespace and cannot be accessed from the target cluster.

* **You must recreate the PVC on the target cluster** - Your Kubernetes cluster administrator needs to create a new PVC on the target cluster that contains the backup data. This typically involves:

    1. Copying the backup data from the source PVC to the target PVC (using tools like `kubectl cp`, `rsync`, or storage-level replication depending on your infrastructure)
    2. Ensuring the new PVC has sufficient storage capacity to hold the backup
    3. Ensuring the new PVC is accessible from the namespace where you plan to restore

--8<-- "backups-restore.md:backup-prepare"

## Restore from a full backup

To restore from a backup Percona XtraDB Cluster must know where to take the backup from and have access to that storage.

You can define the backup storage in two ways: within the restore object configuration or pre-configure it within the target cluster's Custom Resource manifest.

### Approach 1: Define storage configuration in the Restore object

If you haven't defined storage in the target cluster's `cr.yaml` file, you can configure it directly in the restore object.

!!! important 

    This approach is supported only for backups stored in a cloud storage. To restore from Persistent Volume backups, use [Approach 2](#approach-2-storage-is-configured-on-the-target-cluster)

1. Configure the `PerconaXtraDBClusterRestore` Custom Resource. Specify the following keys in the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/restore.yaml) file:

    * set `spec.pxcCluster` key to the name of the target cluster to restore the backup on,

    * configure the `spec.backupSource` subsection to point to the cloud storage where the backup is stored. 

        === "S3-compatible storage"

            The `spec.backupSource` subsection should include:
                
              * a destination key. Take it from the output of the `kubectl get pxc-backup` command. The destination consists of the `s3://` prefix, the S3 bucket name
                and the backup name.
              * the necessary [storage configuration keys](backups-storage.md#configure-storage-for-backups), just like in the `deploy/cr.yaml` file of the source cluster.
              * `verifyTLS` to verify the storage server TLS certificate
              * the custom TLS configuration if you use it for backups. Refer to the [Configure TLS verification with custom certificates for S3 storage](backups-storage.md#configure-tls-verification-with-custom-certificates-for-s3-storage) section for more information.

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
            * The necessary [Azure storage configuration keys](backups-storage.md), just like in the `deploy/cr.yaml` file of the source cluster.:

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
    kubectl apply -f deploy/backup/restore.yaml -n <namespace>
    ```

### Approach 2: Storage is configured on the target cluster

You can [already define](backups-storage.md) the storage where the backup is stored in the `backup.storages` subsection of your target cluster's `deploy/cr.yaml` file. In this case, reference it by name within the restore configuration.

1. Configure the `PerconaXtraDBClusterRestore` Custom Resource. Specify the following keys in the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/restore.yaml) file:

    * set `spec.pxcCluster` key to the name of the target cluster to restore the backup on,

    * specify the storage name in the `storageName` key. The name must match the name in the `backup.storages` subsection of the `deploy/cr.yaml` file.

    * configure the `spec.backupSource` subsection with the backup destination
 
        Here are example configurations:
       
        === "Persistent volume"

            ```yaml
            spec:
              pxcCluster: cluster1
              storageName: pvc
              backupSource:
                destination: pvc/PVC_VOLUME_NAME
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
    kubectl apply -f deploy/backup/restore.yaml -n <namespace>
    ```
          
## Restore the cluster with point-in-time recovery

As with the restore from a backup, the Operator must know where to take the backup from and have access to the storage. You can define the backup storage in two ways: within the restore object configuration or pre-configure it on the target cluster's `cr.yaml` file.

!!! important

    1. The Operator still requires the Secret containing the same user passwords as those used at the time of the backup. This is a known limitation and it will be addressed in future releases. If your user passwords have changed and no longer match the backup, please follow the manual steps described in the [Restore the cluster when backup has different passwords](backups-restore.md#restore-the-cluster-when-backup-has-different-passwords) section to update them before the restore.

    2. Disable the point-in-time functionality on the existing cluster before restoring a backup on it, regardless of whether the backup was made with point-in-time recovery or without it.


### Approach 1: Define storage configuration in the restore object

!!! important

    This approach is supported only for backups stored in a cloud storage. To restore from Persistent Volume backups, use [Approach 2](#approach-2-the-storage-is-defined-on-target)

You can configure the storage within the restore object configuration:

1. Set appropriate keys in the [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file:

    * Set `spec.pxcCluster` key to the name of the target cluster to restore the backup on.

    * Put additional restoration parameters to the `pitr` section:

        * `type` - set one of the following options:

            * `date` - roll back to specific date
            * `transaction` - roll back to a specific transaction (available since Operator 1.8.0)
            * `latest` - recover to the latest possible transaction
            * `skip` - skip a specific transaction (available since Operator 1.7.0)

        * For the `type=date` option, set the `date` key in the datetime format.
        * For the `type=transaction` option, set the `gtid` key (available since the Operator 1.8.0) to be the exact GTID of a transaction **which follows** the last transaction included into the recovery.

    * Configure the `spec.backupSource` subsection to point to the cloud storage where the backup is stored. This subsection should include:

        * A `destination` key. Take it from the output of the `kubectl get pxc-backup -n <namespace>` command.
        * The [necessary storage configuration keys](backups-storage.md), just like in the `deploy/cr.yaml` file of the source cluster.

    The resulting `restore.yaml` file may look as follows:

    === "S3-compatible storage"

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
            destination: azure://AZURE-CONTAINER-NAME/BACKUP-NAME
            azure:
              container: AZURE-CONTAINER-NAME
              credentialsSecret: my-cluster-azure-secret
              ...
        ```

2. Run the actual restoration process:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n <namespace>
    ```

3. As a post-restore step, configure the main storage within the target cluster's `cr.yaml` to be able to make subsequent backups.

4. Make a new full backup after the restore, because your restored database is now the new baseline for future recoveries.

### Approach 2: The storage is defined on target

You can define the storage where the backup is stored in the `backup.storages` subsection of your target cluster's `deploy/cr.yaml` file. In this case, reference it by name within the restore configuration.

1. Set appropriate keys in the [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file:

    * Set `spec.pxcCluster` key to the name of the target cluster to restore the backup on.

    * Put additional restoration parameters to the `pitr` section:

        * `type` - set one of the following options:

            * `date` - roll back to specific date
            * `transaction` - roll back to a specific transaction (available since Operator 1.8.0)
            * `latest` - recover to the latest possible transaction
            * `skip` - skip a specific transaction (available since Operator 1.7.0)

        * For the `type=date` option, set the `date` key in the datetime format.
        * For the `type=transaction` option, set the `gtid` key (available since the Operator 1.8.0) to be the exact GTID of a transaction **which follows** the last transaction included into the recovery.

    * Specify the storage name in the `storageName` key. The name must match the name in the `backup.storages` subsection of the `deploy/cr.yaml` file.

    * Configure the `spec.backupSource` subsection with the backup destination. Take it from the output of the `kubectl get pxc-backup` command on the source cluster

    Here are example configurations:

    === "Persistent volume"

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          storageName: pvc
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
          backupSource:
            destination: pvc/PVC_VOLUME_NAME
        ```
    
    === "S3-compatible storage"

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          storageName: s3-us-west
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
          backupSource:
            destination: s3://S3-BUCKET-NAME/BACKUP-NAME
        ```

    === "Azure Blob storage"

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          storageName: azure
          backupSource:
            destination: azure://AZURE-CONTAINER-NAME/BACKUP-NAME
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
        ```

2. Start the restore process:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n <namespace>
    ```

3. As a post-restore step, configure the main storage within the target cluster's `cr.yaml` to be able to make subsequent backups.

4. Make a new full backup after the restore, because your restored database is now the new baseline for future recoveries.
