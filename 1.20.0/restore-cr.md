> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# PerconaXtraDBClusterRestore Custom Resource options

A Restore resource is a Kubernetes object that tells the Operator how to restore your database from a specific backup. The [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file is a template for creating restore resources.

It defines the `PerconaXtraDBClusterRestore` resource.

The metadata part contains the following keys:

- `name` sets the name of your restore resource;
- `annotations` subsection:
  - `percona.com/headless-service` if present, activates the headless service for the restore.

## `spec` section

The toplevel spec elements of the [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) are the following ones:

### `pxcCluster`

The name of the Percona XtraDB Cluster to restore the backup to.

| Value type | Example    |
| ---------- | ---------- |
| string     | `cluster1` |

### `backupName`

The name of the backup which should be restored.

| Value type | Example   |
| ---------- | --------- |
| string     | `backup1` |

### `containerOptions.env`

The [environment variables set as key-value pairs](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) for the restore container.

| Value type | Example                               |
| ---------- | ------------------------------------- |
| subdoc     | `- name: VERIFY_TLS   value: “false”` |

### `containerOptions.args.xtrabackup`

Custom [command line options](https://docs.percona.com/percona-xtrabackup/8.0/xtrabackup-option-reference.html) for the `xtrabackup` Percona XtraBackup tool.

| Value type | Example             |
| ---------- | ------------------- |
| subdoc     | `- “–someflag=abc”` |

### `containerOptions.args.xbcloud`

Custom [command line options](https://docs.percona.com/percona-xtrabackup/8.0/xbcloud-options.html) for the `xbcloud` Percona XtraBackup tool.

| Value type | Example             |
| ---------- | ------------------- |
| subdoc     | `- “–someflag=abc”` |

### `containerOptions.args.xbstream`

Custom [command line options](https://docs.percona.com/percona-xtrabackup/8.0/xbstream-options.html) for the `xbstream` Percona XtraBackup tool.

| Value type | Example             |
| ---------- | ------------------- |
| subdoc     | `- “–someflag=abc”` |

### `resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job.

| Value type | Example |
| ---------- | ------- |
| string     | `100M`  |

### `resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job.

| Value type | Example |
| ---------- | ------- |
| string     | `100m`  |

### `resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job.

| Value type | Example |
| ---------- | ------- |
| string     | `200M`  |

### `resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job.

| Value type | Example |
| ---------- | ------- |
| string     | `200m`  |

## backupSource section

The `backupSource` section in the [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file contains configuration options for restoring from external backup sources.

### `backupSource.verifyTLS`

Enable or disable verification of the storage server TLS certificate. Disabling it may be useful e.g. to skip TLS verification for private S3-compatible storage with a self-issued certificate.

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `backupSource.destination`

Path to the backup in the storage. The format depends on the storage type: `s3://S3-BUCKET-NAME/BACKUP-NAME` for S3-compatible storage or `azure://CONTAINER-NAME/BACKUP-NAME` for Azure Blob storage.

| Value type | Example                    |
| ---------- | -------------------------- |
| string     | `s3://my-bucket/my-backup` |

### `backupSource.s3.bucket`

The [Amazon S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) name for backups.

| Value type | Example                             |
| ---------- | ----------------------------------- |
| string     | `S3-BINLOG-BACKUP-BUCKET-NAME-HERE` |

### `backupSource.s3.credentialsSecret`

The [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys.

| Value type | Example                     |
| ---------- | --------------------------- |
| string     | `my-cluster-name-backup-s3` |

### `backupSource.s3.endpointUrl`

The endpoint URL of the S3-compatible storage to be used (not needed for the original Amazon S3 cloud).

| Value type | Example                               |
| ---------- | ------------------------------------- |
| string     | `https://s3.us-west-2.amazonaws.com/` |

### `backupSource.s3.region`

The [AWS region](https://docs.aws.amazon.com/general/latest/gr/rande.html) to use. Please note **this option is mandatory** for Amazon and all S3-compatible storages.

| Value type | Example     |
| ---------- | ----------- |
| string     | `us-west-2` |

### `backupSource.s3.caBundle.name`

The name of the Secret that stores custom TLS certificates for TLS communication with S3 storage.

| Value type | Example           |
| ---------- | ----------------- |
| string     | `minio-ca-bundle` |

### `backupSource.s3.caBundle.key`

The key in the Secret that corresponds to the custom CA certificate file used to sign TLS certificates.

| Value type | Example   |
| ---------- | --------- |
| string     | `tls.crt` |

### `backupSource.azure.container`

The container name of the Azure Blob storage.

| Value type | Example                 |
| ---------- | ----------------------- |
| string     | `<your-container-name>` |

### `backupSource.azure.credentialsSecret`

The [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/) for Azure Blob storage backups.

| Value type | Example                        |
| ---------- | ------------------------------ |
| string     | `my-cluster-name-backup-azure` |

## pitr section

The `pitr` section in the [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file contains configuration options for [point-in-time-recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr.html).

### `pitr.type`

The type of point-in-time recovery. Supported values are:

- `latest` - to restore to the latest available point in time
- `date` - to restore to a specific date
- `transaction` - to restore to a specific transaction identified by a GTID
- `skip` - to skip a specific transaction identified by a GTID

| Value type | Example  |
| ---------- | -------- |
| string     | `latest` |

### `pitr.date`

Specify the exact date and time for point-in-time recovery in the format `"YYYY-MM-DD HH:MM:SS"`

where:

- `YYYY`: four-digit year (e.g. 2026)
- `MM`: two-digit month (`01`–`12`)
- `DD`: two-digit day (`01`–`31`)
- `HH`: hours in 24-hour format (`00`–`23`)
- `MM`: minutes (`00`–`59`)
- `SS`: seconds (`00`–`59`)

This option is required and valid only if `pitr.type` is set to `date`.

| Value type | Example                 |
| ---------- | ----------------------- |
| string     | `"2026-01-15 14:30:00"` |

### `pitr.gtid`

The exact GTID for point-in-time recovery, specified in the format `"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee:nnn"`.

This option is required and valid if `pitr.type` is set to `transaction` or `skip`.

| Value type | Example                                      |
| ---------- | -------------------------------------------- |
| string     | `"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee:123"` |

### `pitr.backupSource.verifyTLS`

Enable or disable verification of the storage server TLS certificate for binlog backups. Disabling it may be useful e.g. to skip TLS verification for private S3-compatible storage with a self-issued certificate.

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `pitr.backupSource.storageName`

The name of the storage for binlog backups configured in the `spec.backup.storages` subsection.

| Value type | Example             |
| ---------- | ------------------- |
| string     | `STORAGE-NAME-HERE` |

### `pitr.backupSource.s3.bucket`

The [Amazon S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) name for binlog backups.

| Value type | Example                             |
| ---------- | ----------------------------------- |
| string     | `S3-BINLOG-BACKUP-BUCKET-NAME-HERE` |

### `pitr.backupSource.s3.credentialsSecret`

The [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/) for binlog backups. It should contain `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys.

| Value type | Example                     |
| ---------- | --------------------------- |
| string     | `my-cluster-name-backup-s3` |

### `pitr.backupSource.s3.endpointUrl`

The endpoint URL of the S3-compatible storage to be used for binlog backups (not needed for the original Amazon S3 cloud).

| Value type | Example                               |
| ---------- | ------------------------------------- |
| string     | `https://s3.us-west-2.amazonaws.com/` |

### `pitr.backupSource.s3.region`

The [AWS region](https://docs.aws.amazon.com/general/latest/gr/rande.html) to use for binlog backups. Please note **this option is mandatory** for Amazon and all S3-compatible storages.

| Value type | Example     |
| ---------- | ----------- |
| string     | `us-west-2` |

### `pitr.backupSource.s3.caBundle.name`

The name of the Secret that stores custom TLS certificates for TLS communication with S3 storage for binlog backups.

| Value type | Example           |
| ---------- | ----------------- |
| string     | `minio-ca-bundle` |

### `pitr.backupSource.s3.caBundle.key`

The key in the Secret that corresponds to the custom CA certificate file used to sign TLS certificates for binlog backups.

| Value type | Example   |
| ---------- | --------- |
| string     | `tls.crt` |
