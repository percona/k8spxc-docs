# Configure storage for backups

You can configure storage for backups in the `backup.storages` subsection of the
Custom Resource, using the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml)
configuration file.

Before configuring the storage, you need to create a [Kubernetes Secret :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) object that contains the credentials needed to access your storage.

=== "Amazon S3 or S3-compatible storage"

    To use Amazon S3 or S3-compatible storage for backups, create a Secret object with your access credentials. Use the [deploy/backup/backup-secret-s3.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/backup-secret-s3.yaml) file as an example. You must specify the following information:

    * the `metadata.name` key is the name  the Kubernetes secret which you will reference in the Custom Resource
    * `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are base64-encoded keys to access S3 storage

    Use the following command to encode the keys:

    === ":simple-linux: in Linux"

        ```bash
        echo -n 'plain-text-string' | base64 --wrap=0
        ```

    === ":simple-apple: in macOS"

        ```bash
        echo -n 'plain-text-string' | base64
        ```

    Here's the example configuration of the Secret file:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-name-backup-s3
    type: Opaque
      data:
        AWS_ACCESS_KEY_ID: <YOUR-BASE64-ENCODED-KEY-HERE>
        AWS_SECRET_ACCESS_KEY: <YOUR-BASE64-ENCODED-SECRET-HERE>
    ```

    1. Create the Kubernetes Secret object with this file:

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/backup/backup-secret-s3.yaml -n <namespace>
        ```

        !!! note

            If the previous backup attempt fails (because of a temporary
            networking problem, etc.) the backup job tries to delete the unsuccessful
            backup leftovers first, and then makes a retry. Therefore there will be no
            backup retry without [DELETE permissions to the objects in the bucket :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-actions.html).
            Also, setting [Google Cloud Storage Retention Period :octicons-link-external-16:](https://cloud.google.com/storage/docs/bucket-lock)
            can cause a similar problem.


    2. Configure the storage in the Custom Resource. Modify the [`deploy/cr.yaml`](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml) file and define the following information:

        * `storages.<NAME>.type` - set to `s3`. Substitute the <NAME>
           part with some name you will later use to refer this
           storage when making backups and restores.

        * `storages.<NAME>.s3.credentialsSecret` set to the name of the Secret you created previously

        * `storages.<NAME>.s3.bucket` - where the data will be stored
        * `storages.<NAME>.s3.region` - location of the bucket

        Here is an example of the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml)
        configuration file which configures Amazon S3 storage for backups:

        ```yaml
        ...
        backup:
          ...
          storages:
            s3-us-west:
              type: s3
              s3:
                bucket: S3-BACKUP-BUCKET-NAME-HERE
                region: us-west-2
                credentialsSecret: my-cluster-name-backup-s3
                caBundle:
                  name: minio-ca-bundle
                  key: tls.cert
          ...
        ```
        
        !!! note "S3-compatible storage"

            If you use S3-compatible storage instead of Amazon S3, add the `endpointUrl` option in the `s3` subsection. This points to your storage service and is specific to your cloud provider. For example, for MinIO:

            ```yaml
            endpointUrl: https://minio-service:9000
            ```
        
        For more configuration options, see the [Operator Custom Resource options](operator.md#operator-backup-section).

=== "Microsoft Azure Blob storage"

    1. To store backups on the Azure Blob storage, you need to create a
        Secret with the following values:

        * the `metadata.name` key is the name which you will further use to refer
            your Kubernetes Secret,
        * the `data.AZURE_STORAGE_ACCOUNT_NAME` and `data.AZURE_STORAGE_ACCOUNT_KEY`
            keys are base64-encoded credentials used to access the storage
            (obviously these keys should contain proper values to make the access
            possible).

        Create the Secrets file with these base64-encoded keys following the
        [deploy/backup/backup-secret-azure.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/backup-secret-azure.yaml) example:

        ```yaml
        apiVersion: v1
        kind: Secret
        metadata:
          name: azure-secret
        type: Opaque
        data:
          AZURE_STORAGE_ACCOUNT_NAME: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
          AZURE_STORAGE_ACCOUNT_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
        ```

        !!! note

            You can use the following command to get a base64-encoded string from a plain text one:

            === "in Linux"

                ``` {.bash data-prompt="$" }
                $ echo -n 'plain-text-string' | base64 --wrap=0
                ```

            === "in macOS"

                ``` {.bash data-prompt="$" }
                $ echo -n 'plain-text-string' | base64
                ```

        Once the editing is over, create the Kubernetes Secret object as follows:

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/backup/backup-secret-azure.yaml
        ```

    2. Put the data needed to access the Azure Blob storage into the
        `backup.storages` subsection of the Custom Resource.

        * `storages.<NAME>.type` should be set to `azure` (substitute the `<NAME>` part
           with some arbitrary name you will later use to refer this storage when
           making backups and restores).

        * `storages.<NAME>.azure.credentialsSecret` key should be set to the name used
            to refer your Kubernetes Secret (`azure-secret` in the last
            example).

        * `storages.<NAME>.azure.container` option should contain the name of the
           Azure [container :octicons-link-external-16:](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers).

        The options within the `storages.<NAME>.azure` subsection are further explained
        in the [Operator Custom Resource options](operator.md#operator-backup-section).

        Here is an example
        of the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
        configuration file which configures Azure Blob storage for backups:

        ```yaml
        ...
        backup:
          ...
          storages:
            azure-blob:
              type: azure
              azure:
                container: <your-container-name>
                credentialsSecret: azure-secret
              ...
        ```

=== "Persistent Volume"

    Here is an example of the `deploy/cr.yaml` backup section fragment,
    which configures a private volume for filesystem-type storage:

    ```yaml
    ...
    backup:
      ...
      storages:
        fs-pvc:
          type: filesystem
          volume:
            persistentVolumeClaim:
              accessModes: [ "ReadWriteOnce" ]
              resources:
                requests:
                  storage: 6G
      ...
    ```

    !!! note

        Please take into account that 6Gi storage size specified in this
        example may be insufficient for the real-life setups; consider using
        tens or hundreds of gigabytes. Also, you can edit this option later,
        and changes will take effect after applying the updated
            `deploy/cr.yaml` file with `kubectl`.

!!! note

    Typically, Percona XtraBackup tools used by the Operator to perform the
    backup/restore process does not require any additional configuration beyond
    the standard parameters mentioned above. However, if access
    to a non-standard cloud requires some fine-tuning, you can pass
    additional options to the binary XtraBackup utilities using the following
    Custom Resource options:
    [backup.storages.STORAGE_NAME.containerOptions.args.xtrabackup](operator.md#backupstoragesstorage-namecontaineroptionsargsxtrabackup),
    [backup.storages.STORAGE_NAME.containerOptions.args.xbcloud](operator.md#backupstoragesstorage-namecontaineroptionsargsxbcloud), and
    [backup.storages.STORAGE_NAME.containerOptions.args.xbstream](operator.md#backupstoragesstorage-namecontaineroptionsargsxbstream).
    Also, you can set environment variables for the XtraBackup container with
    [backup.storages.STORAGE_NAME.containerOptions.env](operator.md#backupstoragesstorage-namecontaineroptionsenv).

## Configure TLS verification with custom certificates for S3 storage

!!! note "Version added: 1.19.0"

You can use your organization's custom TLS / SSL certificates and instruct the Operator to securely verify TLS communication with S3 storage. 

To configure TLS verification with custom certificates, do the following:

1. Create the Secret object that contains the TLS certificate to access the S3 storage, the certificate's private key and the CA certificate.
2. Modify the S3 storage configuration in the Custom Resource and specify the following information:

    * `storages.<NAME>.s3.caBundle.name` is the name of the Secret object you created previously
    * `storages.<NAME>.s3.caBundle.key` is the CA certificate. 
   
    Here's the example configuration:

    ```yaml
    ...
    backup:
      ...
      storages:
        s3-us-west:
          type: s3
          s3:
            bucket: S3-BACKUP-BUCKET-NAME-HERE
            region: us-west-2
            credentialsSecret: my-cluster-name-backup-s3
            caBundle:
              name: minio-ca-bundle
              key: ca.crt
      ...
    ```
    
    The Operator will use this configuration to securely verify TLS communication with S3 storage during backups and restores.
