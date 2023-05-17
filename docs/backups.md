# Providing Backups

The Operator usually stores Percona XtraDB Cluster backups outside the
Kubernetes cluster, on [Amazon S3 or S3-compatible storage](https://en.wikipedia.org/wiki/Amazon_S3#S3_API_and_competing_services),
or on [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/):

![image](assets/images/backup-s3.png)

But storing backups on [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) inside the Kubernetes cluster is also possible:

![image](assets/images/backup-pv.png)

The Operator allows doing backups in two ways:

*Scheduled backups* are configured in the
[deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
file to be executed automatically in proper time.
*On-demand backups* can be done manually at any moment and are configured in the [deploy/backup/backup.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/main/deploy/backup/backup.yaml).

## Making scheduled backups

Backups schedule is defined in the `backup` section of the
[deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
file. This section contains following subsections:

* `storages` subsection contains data and configuration needed to store backups,
* `schedule` subsection allows to actually schedule backups (the schedule is
    specified in crontab format).

### <a name="backups-scheduled-s3"></a> Backups on Amazon S3 or S3-compatible storage

Since backups are stored separately on the Amazon S3, a secret with
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` should be present on
the Kubernetes cluster. The secrets file with these base64-encoded keys should
be created: for example [deploy/backup/backup-secret-s3.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/backup-secret-s3.yaml) file with the following
contents:

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

    The following command can be used to get a base64-encoded string from
    a plain text one:
    
    === "in Linux"

        ``` {.bash data-prompt="$" }
        $ echo -n 'plain-text-string' | base64 --wrap=0
        ```

    === "in macOS"

        ``` {.bash data-prompt="$" }
        $ echo -n 'plain-text-string' | base64
        ```

The `name` value is the [Kubernetes
secret](https://kubernetes.io/docs/concepts/configuration/secret/)
name which will be used further, and `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY` are the keys to access S3 storage (and
obviously they should contain proper values to make this access
possible). To have effect secrets file should be applied with the
appropriate command to create the secret object, e.g.
`kubectl apply -f deploy/backup/backup-secret-s3.yaml` (for Kubernetes).

!!! note

    In case if the previous backup attempt fails (because of a temporary
    networking problem, etc.) the backup job tries to delete the unsuccessful
    backup leftovers first, and then makes a retry. Therefore there will be no
    backup retry without [DELETE permissions to the objects in the bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-actions.html).
    Also, setting [Google Cloud Storage Retention Period](https://cloud.google.com/storage/docs/bucket-lock)
    can cause a similar problem.

All the data needed to access the S3-compatible cloud to store backups (credentials, name of the [bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingBucket.html) to keep backups in, etc.)should be
put into the `backup.storages` subsection,  

if you use some S3-compatible storage instead of the original
Amazon S3, the [endpointUrl](https://docs.min.io/docs/aws-cli-with-minio.html) is needed in the s3 subsection which points to the actual cloud used for backups and
is specific to the cloud provider. For example, using [Google Cloud](https://cloud.google.com) involves the [following](https://storage.googleapis.com) endpointUrl:

```yaml
endpointUrl: https://storage.googleapis.com
```

The options within these three subsections are further explained in the
[Custom Resource options](operator.md#operator-custom-resource-options).

One option which should be mentioned separately is
`credentialsSecret` which is a [Kubernetes
secret](https://kubernetes.io/docs/concepts/configuration/secret/)
for backups. Value of this key should be the same as the name used to
create the secret object (`my-cluster-name-backup-s3` in the last
example).

### <a name="backups-scheduled-azure"></a> Backups on Microsoft Azure Blob storage

Since backups are stored separately on [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/),
a secret with `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` should be present on
the Kubernetes cluster. The secrets file with these base64-encoded keys should
be created: for example [deploy/backup/backup-secret-azure.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/backup-secret-azure.yaml) file with the following
contents.


```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-cluster-azure-secret
type: Opaque
data:
  AZURE_STORAGE_ACCOUNT_NAME: UkVQTEFDRS1XSVRILUFaVVJFLVNUT1JBR0UtQUNDT1VOVC1OQU1F
  AZURE_STORAGE_ACCOUNT_KEY: UkVQTEFDRS1XSVRILUFaVVJFLVNUT1JBR0UtQUNDT1VOVC1LRVk=
```
!!! note

    The following command can be used to get a base64-encoded string from
    a plain text one:
    
    === "in Linux"

        ```bash
        $ echo -n 'plain-text-string' | base64 --wrap=0
        ```

    === "in macOS"

        ```bash
        $ echo -n 'plain-text-string' | base64
        ```

The `name` value is the [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/)
name which will be used further. The `AZURE_STORAGE_ACCOUNT_NAME` and
`AZURE_STORAGE_ACCOUNT_KEY` credentials will be used to access the storage
(and obviously they should contain proper values to make this access
possible). To have effect, secrets file should be applied with the appropriate
command to create the Secrets object, e.g.
`kubectl apply -f deploy/backup/backup-secret-azure.yaml` (for Kubernetes).

All the data needed to access the Azure Blob storage to store backups
(credentials, name of the [container](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers) to keep backups in, etc.) should be
put into the `backup.storages` subsection, and `backup.schedule` subsection
should actually schedule backups in crontab-compatible way. Here is an example
of [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
which uses Azure Blob storage for backups:

```yaml
...
backup:
  enabled: true
  ...
  storages:
    azure-blob:
      type: azure
      azure:
        credentialsSecret: my-cluster-azure-secret
        container: <your-container-name>
  ...
  schedule:
    - name: "sat-night-backup"
        schedule: "0 0 * * 6"
        keep: 3
        storageName: azure-blob
  ...
```
The options within these three subsections are further explained in the
[Operator Custom Resource options](operator.md).

One option which should be mentioned separately is `credentialsSecret` which is
a [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/)
for backups. Value of this key should be the same as the name used to
create the secret object (`my-cluster-azure-secret` in the last example).

## Storing binary logs for point-in-time recovery

Point-in-time recovery functionality allows users to roll back the cluster to a
specific transaction, time (or even skip a transaction in some cases).
Technically, this feature involves continuously saving binary log updates to the
backup storage. Point-in-time recovery is off by default and is supported by the
Operator only with Percona XtraDB Cluster versions starting from 8.0.21-12.1.

To be used, it requires setting a number of keys in the `pitr` subsection
under the `backup` section of the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file:


## Storing backup on Persistent Volume

Here is an example of the `deploy/cr.yaml` backup section fragment, which
configures a private volume for filesystem-type storage:

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
              storage: 6Gi
  ...
```

!!! note

    Please take into account that 6Gi storage size specified in this
    example may be insufficient for the real-life setups; consider using tens or
    hundreds of gigabytes. Also, you can edit this option later, and changes will
    take effect after applying the updated `deploy/cr.yaml` file with
    `kubectl`.

## Enabling compression for backups

There is a possibility to enable
[LZ4 compression](https://en.wikipedia.org/wiki/LZ4_(compression_algorithm))
for backups.

!!! note

    This feature is available only with Percona XtraDB Cluster 8.0 and not
    Percona XtraDB Cluster 5.7.

To enable compression, use [pxc.configuration](operator.md#pxc-configuration) key in the
`deploy/cr.yaml` configuration file to supply Percona XtraDB Cluster nodes
with two additional `my.cnf` options under its `[sst]` and `[xtrabackup]`
sections as follows:

```yaml
pxc:
  image: percona/percona-xtradb-cluster:8.0.19-10.1
  configuration: |
    ...
    [sst]
    xbstream-opts=--decompress
    [xtrabackup]
    compress=lz4
    ...
```

When enabled, compression will be used for both backups and [SST](https://www.percona.com/doc/percona-xtradb-cluster/8.0/manual/state_snapshot_transfer.html).


## Copy backup to a local machine

Make a local copy of a previously saved backup requires not more than
the backup name. This name can be taken from the list of available
backups returned by the following command:

``` {.bash data-prompt="$" }
$ kubectl get pxc-backup
```

When the name is known, backup can be downloaded to the local machine as
follows:

``` {.bash data-prompt="$" }
$ ./deploy/backup/copy-backup.sh <backup-name> path/to/dir
```

For example, this downloaded backup can be restored to the local
installation of Percona Server:

``` {.bash data-prompt="$" }
$ service mysqld stop
$ rm -rf /var/lib/mysql/*
$ cat xtrabackup.stream | xbstream -x -C /var/lib/mysql
$ xtrabackup --prepare --target-dir=/var/lib/mysql
$ chown -R mysql:mysql /var/lib/mysql
$ service mysqld start
```
