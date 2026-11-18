> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Configure Microsoft Azure Blob storage for backups

This document guides you how to configure backups to the Azure Blob storage.

## Create a Secret

Create a Secret with the following values:

- the `metadata.name` key is the name which you will further use to refer your Kubernetes Secret,
- the `data.AZURE_STORAGE_ACCOUNT_NAME` and `data.AZURE_STORAGE_ACCOUNT_KEY` keys are base64-encoded credentials used to access the storage.

The steps are:

1. Encode your Azure Storage account name and key using base64:

   **in Linux**

   ```
   echo -n 'plain-text-string' | base64 --wrap=0
   ```

   **in macOS**

   ```
   echo -n 'plain-text-string' | base64
   ```

1. Create the Secrets file with these base64-encoded keys following the [deploy/backup/backup-secret-azure.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/v1.20.0/deploy/backup/backup-secret-azure.yaml) example:

   ```
   apiVersion: v1
   kind: Secret
   metadata:
     name: azure-secret
   type: Opaque
   data:
     AZURE_STORAGE_ACCOUNT_NAME: <YOUR-BASE64-ENCODED-ACCOUNT-NAME>
     AZURE_STORAGE_ACCOUNT_KEY: <YOUR-BASE64-ENCODED-ACCOUNT-KEY>
   ```

1. Create the Kubernetes Secret object as follows:

   ```
   kubectl apply -f deploy/backup/backup-secret-azure.yaml -n <namespace>
   ```

## Configure the storage

Edit the [`deploy/cr.yaml`](https://github.com/percona/percona-xtradb-cluster-operator/blob/v1.20.0/deploy/cr.yaml) manifest and set:

- `storages.<NAME>.type` to `azure`. Substitute the `<NAME>` part with some arbitrary name you will later use to refer this storage when making backups and restores.
- `storages.<NAME>.azure.credentialsSecret` to the name used to refer your Kubernetes Secret (`azure-secret` in the last example).
- `storages.<NAME>.azure.container` to the name of the Azure [container](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers) .

Here is an example of the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/v1.20.0/deploy/cr.yaml) configuration file which configures Azure Blob storage named `azure-blob` for backups:

```
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

- **[`endpointUrl`](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-nameazureendpointurl)** — set this if you use an Azure-compatible storage service instead of Azure itself, or need a non-default Azure endpoint. When empty, the Operator defaults to `https://<storageAccount>.blob.core.windows.net/`.
- **[`storageClass`](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-nameazurestorageclass)** — the Azure storage tier to upload backups with, such as `Hot`, `Cool`, or `Archive`.
- **[`blockSize`](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-nameazureblocksize)** and **[`concurrency`](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-nameazureconcurrency)** — tune the block size and number of concurrent uploads for large backups.

For more configuration options, see the [Operator Custom Resource options](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#operator-backup-section).

## Next step

[On-demand backup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-ondemand.html) [Scheduled backup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-scheduled.html)
