# PerconaXtraDBClusterBackup Custom Resource options

A Backup resource is a Kubernetes object that tells the Operator how
to backup your database. The [deploy/backup/backup.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/backup.yaml) file is a template for creating backup resources.

It defines the `PerconaXtraDBClusterBackup` resource. 

This document describes all available options that you can use to customize a backup. 

## `apiVersion`

Specifies the API version of the Custom Resource.
`pxc.percona.com` indicates the group, and `v1` is the version of the API.

## `kind`

Defines the type of resource being created: `PerconaXtraDBClusterBackup`.

## `metadata`

The metadata part contains the following keys:

* <a name="backup-metadata-name"></a> `name` sets the name of your backup resource;
* `finalizers` subsection:

    * `percona.com/delete-backup` if present, enables deletion of backup files from a backup storage when the backup object is removed (manually or by schedule). When used with the Persistent Volume as the backup storage, the finalizer deletes the PVC. 

## `spec` section

The toplevel spec elements of the [deploy/backup/backup.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/backup.yaml) are the following ones:

### `pxcCluster`

The name of the Percona XtraDB Cluster to back up.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `cluster1`         |

### `storageName`

The name of the storage configuration defined in your `deploy/cr.yaml` file in the `spec.backup.storages` subsection.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `fs-pvc`         |

### `activeDeadlineSeconds`

The timeout value in seconds, after which backup job will automatically fail.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3600` |

### `startingDeadlineSeconds`

The maximum time in seconds for a backup to start. The Operator compares the timestamp of the backup object against the current time. If the backup is not started within the set time, the Operator automatically marks it as "failed".

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `300` |

### `suspendedDeadlineSeconds`

The maximum time in seconds for a backup to remain in a suspended state. The Operator compares the timestamp when the backup job was suspended against the current time. After the defined suspension time expires, the backup is automatically marked as "failed".

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1200` |

### `runningDeadlineSeconds`

The maximum time in seconds for a backup job to run. The Operator compares the timestamp when the backup job started running against the current time. After the defined running time expires, the backup is automatically marked as "failed".

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `300` |

### `containerOptions.env`

The [environment variables set as key-value pairs :octicons-link-external-16:](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) for the backup container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>- name: VERIFY_TLS<br>  value: "false"</pre> |

### `containerOptions.args.xbcloud`

Custom [command line options :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/8.0/xbcloud-options.html) for the `xbcloud` Percona XtraBackup tool.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>- "--someflag=abc"</pre> |

### `containerOptions.args.xbstream`

Custom [command line options :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/8.0/xbstream-options.html) for the `xbstream` Percona XtraBackup tool.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>- "--someflag=abc"</pre> |

