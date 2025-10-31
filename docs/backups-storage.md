# Configure storage for backups

You can configure storage for backups in the `backup.storages` subsection of the
Custom Resource, using the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml)
configuration file.

You should also create the [Kubernetes Secret :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/)
object with credentials needed to access the storage.

=== "Amazon S3 or S3-compatible storage"

    1. To store backups on the Amazon S3, you need to create a Secret with
        the following values:

        * the `metadata.name` key is the name which you will further use to refer
            your Kubernetes Secret,
        * the `data.AWS_ACCESS_KEY_ID` and `data.AWS_SECRET_ACCESS_KEY` keys are
            base64-encoded credentials used to access the storage (obviously these
            keys should contain proper values to make the access possible).

        Create the Secrets file with these base64-encoded keys following the
        [deploy/backup/backup-secret-s3.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/backup-secret-s3.yaml)
        example:

        ```yaml
        apiVersion: v1
        kind: Secret
        metadata:
          name: my-cluster-name-backup-s3
        type: Opaque
        data:
          AWS_ACCESS_KEY_ID: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
          AWS_SECRET_ACCESS_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
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
        $ kubectl apply -f deploy/backup/backup-secret-s3.yaml
        ```

        !!! note

            In case the previous backup attempt fails (because of a temporary
            networking problem, etc.) the backup job tries to delete the unsuccessful
            backup leftovers first, and then makes a retry. Therefore there will be no
            backup retry without [DELETE permissions to the objects in the bucket :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-actions.html).
            Also, setting [Google Cloud Storage Retention Period :octicons-link-external-16:](https://cloud.google.com/storage/docs/bucket-lock)
            can cause a similar problem.


    2. Put the data needed to access the S3-compatible cloud into the
        `backup.storages` subsection of the Custom Resource.

        * `storages.<NAME>.type` should be set to `s3` (substitute the <NAME>
           part with some arbitrary name you will later use to refer this
           storage when making backups and restores).

        * `storages.<NAME>.s3.credentialsSecret` key should be set to the name
            used to refer your Kubernetes Secret (`my-cluster-name-backup-s3` in
            the last example).

        * `storages.<NAME>.s3.bucket` and `storages.<NAME>.s3.region` should
           contain the S3 bucket and region. 

        * if you use some S3-compatible storage instead of the original Amazon
            S3, add the [endpointURL :octicons-link-external-16:](https://docs.min.io/docs/aws-cli-with-minio.html)
            key in the `s3` subsection, which should point to the actual cloud
            used for backups. This value is specific to the cloud provider. For
            example, using [Google Cloud :octicons-link-external-16:](https://cloud.google.com) involves the
            [following :octicons-link-external-16:](https://storage.googleapis.com) endpointUrl:

            ```yaml
            endpointUrl: https://storage.googleapis.com
            ```

        The options within the `storages.<NAME>.s3` subsection are further
        explained in the [Operator Custom Resource options](operator.md#operator-backup-section).

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
          ...
        ```

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
