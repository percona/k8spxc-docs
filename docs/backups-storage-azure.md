# Configure Microsoft Azure Blob storage for backups

This document guides you how to configure backups to the Azure Blob storage.

## Create a Secret

Create a Secret with the following values:

* the `metadata.name` key is the name which you will further use to refer your Kubernetes Secret,
* the `data.AZURE_STORAGE_ACCOUNT_NAME` and `data.AZURE_STORAGE_ACCOUNT_KEY` keys are base64-encoded credentials used to access the storage.

The steps are:

1. Encode your Azure Storage account name and key using base64:
   
    === ":simple-linux: in Linux"
    
        ```bash
        echo -n 'plain-text-string' | base64 --wrap=0
        ```

    === ":simple-apple: in macOS"
    
        ```bash
        echo -n 'plain-text-string' | base64
        ```

2. Create the Secrets file with these base64-encoded keys following the [deploy/backup/backup-secret-azure.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/backup-secret-azure.yaml) example:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: azure-secret
    type: Opaque
    data:
      AZURE_STORAGE_ACCOUNT_NAME: <YOUR-BASE64-ENCODED-ACCOUNT-NAME>
      AZURE_STORAGE_ACCOUNT_KEY: <YOUR-BASE64-ENCODED-ACCOUNT-KEY>
    ```


3. Create the Kubernetes Secret object as follows:

    ```bash
    kubectl apply -f deploy/backup/backup-secret-azure.yaml
    ```

## Configure the storage

Edit the [`deploy/cr.yaml`](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml) manifest and set:

* `storages.<NAME>.type` to `azure`. Substitute the `<NAME>` part with some arbitrary name you will later use to refer this storage when making backups and restores.
* `storages.<NAME>.azure.credentialsSecret` to the name used to refer your Kubernetes Secret (`azure-secret` in the last example).
* `storages.<NAME>.azure.container` to the name of the Azure [container :octicons-link-external-16:](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers).

Here is an example of the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml) configuration file which configures Azure Blob storage named `azure-blob` for backups:

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

Depending on your setup, you may also need these options in the `storages.<NAME>.azure` subsection:

* **[`endpointUrl`](operator.md#backupstoragesstorage-nameazureendpointurl)** — set this if you use an Azure-compatible storage service instead of Azure itself, or need a non-default Azure endpoint. When empty, the Operator defaults to `https://<storageAccount>.blob.core.windows.net/`.
* **[`storageClass`](operator.md#backupstoragesstorage-nameazurestorageclass)** — the Azure storage tier to upload backups with, such as `Hot`, `Cool`, or `Archive`.
* **[`blockSize`](operator.md#backupstoragesstorage-nameazureblocksize)** and **[`concurrency`](operator.md#backupstoragesstorage-nameazureconcurrency)** — tune the block size and number of concurrent uploads for large backups.

For more configuration options, see the [Operator Custom Resource options](operator.md#operator-backup-section).

## Next step

[On-demand backup](backups-ondemand.md){.md-button}
[Scheduled backup](backups-scheduled.md){.md-button}
