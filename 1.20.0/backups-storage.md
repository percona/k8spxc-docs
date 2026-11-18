> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Configure storage for backups

Configure storage for backups in the `backup.storages` subsection of the Custom Resource, using the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/v1.20.0/deploy/cr.yaml) configuration file.

For a cloud backup storage such as Amazon S3, S3-compatible or Azure Blob storage, create a [Kubernetes Secret](https://kubernetes.io/docs/concepts/configuration/secret/) with the access credentials before you configure `backup.storages`. Persistent Volume storage does not use a Secret.

The Operator supports the following storage types:

| Storage type                                                        | When to use                                                                                                  | Configuration                                                                                                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Amazon S3 or S3-compatible storage (including Google Cloud Storage) | Keep backups outside the Kubernetes cluster. For example, to restore them to another cluster or environment. | [Configure Amazon S3 or S3-compatible storage](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage-s3.html) |
| Microsoft Azure Blob storage                                        | Keep backups outside the Kubernetes cluster. For example, to restore them to another cluster or environment. | [Configure Microsoft Azure Blob storage](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage-azure.html)    |
| Persistent Volume                                                   | Keep backups in the same Kubernetes cluster and if you don’t need to move them elsewhere.                    | [Configure Persistent Volume storage](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage-pvc.html)         |

## Extra options for XtraBackup

The configuration guides in the table are enough for Percona XtraBackup to make backups and restores. When your storage needs additional settings, pass them to the XtraBackup tools via the following options in the Custom Resource:

- [backup.storages.STORAGE_NAME.containerOptions.args.xtrabackup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-namecontaineroptionsargsxtrabackup) for the `xtrabackup` command
- [backup.storages.STORAGE_NAME.containerOptions.args.xbcloud](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-namecontaineroptionsargsxbcloud) for the `xbcloud` command
- [backup.storages.STORAGE_NAME.containerOptions.args.xbstream](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-namecontaineroptionsargsxbstream) for the `xbstream` command

To set environment variables for the XtraBackup container, use [backup.storages.STORAGE_NAME.containerOptions.env](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-namecontaineroptionsenv).

## Next step

[On-demand backup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-ondemand.html) [Scheduled backup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-scheduled.html)
