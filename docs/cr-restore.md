# Restore options reference

[Percona XtraDB Cluster Restore](backups.md#restoring-backup) options are managed by the Operator via the 
`PerconaXtraDBClusterRestore` [Custom Resource](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) and can be configured via the
[deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml)
configuration file. This Custrom Resource contains the following options:

## <a name="operator-backupsource-section"></a>PerconaXtraDBClusterRestore

| Key             | Value type        | Description                                    | Required |
| --------------- | ----------------- | ---------------------------------------------- | -------- |
| metadata.name   | string            | The name of the restore                        | true     |
| spec.pxcCluster | string            | Percona XtraDB Cluster name (the name of your running cluster) | true |
| spec.backupName | string            | The name of your backup which should be restored | false  |
| [spec.backupSource](cr-restore.md#operator-restore-backupsource-options-section) | object | Define configuration for different restore sources | false    |
| [spec.pitr](cr-restore.md#operator-restore-pitr-options-section) | object | Define configuration for PITR restore | false |

## <a name="operator-restore-backupsource-options-section"></a>PerconaXtraDBClusterRestore.backupSource

| Key             | Value type        | Description                                    | Required |
| --------------- | ----------------- | ---------------------------------------------- | -------- |
| destination     | string            | Path to the backup                             | false    |
| storageName     | string            | The storage name from CR `spec.backup.storages` | false |
| [s3](cr-restore.md#operator-restore-s3-options-section) | object | Define configuration for s3 compatible storages | false |
| [azure](cr-restore.md#operator-restore-azure-options-section) | object | Define configuration for azure blob storage | false |

## <a name="operator-restore-s3-options-section"></a>PerconaXtraDBClusterRestore.backupSource.s3

| Key             | Value type        | Description                                    | Required |
| --------------- | ----------------- | ---------------------------------------------- | -------- |
| bucket          | string            | The bucket with a backup                       | true     |
| credentialsSecret | string          | The Secret name for the backup                 | true     |
| endpointUrl     | string            | A valid endpoint URL                           | false    |
| region          | string            | The region corresponding to the S3 bucket      | false    |

## <a name="operator-restore-azure-options-section"></a>PerconaXtraDBClusterRestore.backupSource.azure

| Key             | Value type        | Description                                    | Required |
| --------------- | ----------------- | ---------------------------------------------- | -------- |
| credentialsSecret | string          | The Secret name for the azure blob storage     | true     |
| container       | string            | The container name of the azure blob storage   | true     |
| endpointUrl     | string            | A valid endpoint URL                           | false    |
| storageClass    | string            | The storage class name of the azure storage    | false    |

## <a name="operator-restore-pitr-options-section"></a>PerconaXtraDBClusterRestore.pitr

| Key             | Value type        | Description                                    | Required |
| --------------- | ----------------- | ---------------------------------------------- | -------- |
| type            | string            | The type of PITR recover                       | true     |
| date            | string            | The exact date of recovery                     | true     |
| gtid            | string            | The exact GTID for PITR recover                | true     |
| [spec.backupSource](cr-restore.md#operator-restore-backupsource-options-section) | object | Percona XtraDB Cluster backups section | true |
| [s3](cr-restore.md#operator-restore-s3-options-section) | object | Define configuration for s3 compatible storages | false |
| [azure](cr-restore.md#operator-restore-azure-options-section) | object | Define configuration for azure blob storage | false |

