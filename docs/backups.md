# Providing Backups

The Operator usually stores Percona XtraDB Cluster backups outside the
Kubernetes cluster, on [Amazon S3 or S3-compatible storage](https://en.wikipedia.org/wiki/Amazon_S3#S3_API_and_competing_services),
or on [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/):

![image](assets/images/backup-cloud.svg)

But storing backups on [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) inside the Kubernetes cluster is also possible:

![image](assets/images/backup-pv.svg)

The Operator does logical backups, querying Percona XtraDB Cluster for the
database data and writing the retrieved data to the backup storage. The backups
are done using the [Percona XtraBackup](https://docs.percona.com/percona-xtrabackup/2.4/index.html) tool.

The Operator allows doing backups in two ways:

* *Scheduled backups* are configured in the
    [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
    file to be executed automatically in proper time.
* *On-demand backups* can be done manually at any moment and are configured in
    the [deploy/backup/backup.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/main/deploy/backup/backup.yaml).


