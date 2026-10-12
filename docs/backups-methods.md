# Backup methods

The Operator supports two backup methods. See [Backup and restore](backups.md) for how backups fit into the bigger picture — storage, scheduling, and restore paths.

## SST method (default)

The default backup method uses [State Snapshot Transfer (SST) :octicons-link-external-16:](https://docs.percona.com/percona-xtradb-cluster/8.4/state-snapshot-transfer.html). The backup Pod does not run Percona XtraBackup directly. It starts the [Galera Arbitrator (`garbd`) :octicons-link-external-16:](https://mariadb.com/docs/galera-cluster), which joins the cluster only to receive the snapshot. Percona XtraBackup runs in the SST script on the donor Pod.

When you create a Backup object:

1. The Operator creates a backup Job, which creates a backup Pod according to the table. The backup Pod starts `garbd` and prepares the path in the backup storage.
2. `garbd` requests the snapshot from a synced Pod. That Pod becomes the donor, enters the Donor state, and stops receiving requests.
3. The donor's SST script runs Percona XtraBackup and streams the data to `garbd`.
4. A receive script that `garbd` starts writes the stream to the backup storage.

The backup is resource-consuming and can affect performance. The Operator chooses a secondary Pod as the donor when the cluster has more than one Pod. A one-Pod cluster uses that same Pod.

After the backup is stored in the [backup storage](backups-storage.md), the Operator marks the backup Pod Completed, deletes it, and updates the Backup object status.

## XtraBackup sidecar method (tech preview)

When you enable the `XtrabackupSidecar` feature gate, the Operator uses a different backup approach:

1. An XtraBackup sidecar container runs in each Percona XtraDB Cluster Pod, providing a gRPC server interface for making backups. 
2. When you create a Backup object, the Operator creates a Job that acts like a client and sends requests directly to the sidecar. 
3. The sidecar performs the backup and uploads it to the same storage types as the default method — S3-compatible storage (including Google Cloud Storage, which works through its S3-compatible endpoint) or Azure Blob Storage. The database Pod doesn't change its state to Donor and continues processing all requests.

As with the SST method, the Operator uses one of the secondary Percona XtraDB Cluster Pods for backups to not overload the primary Pod. 

**Benefits of the XtraBackup sidecar method:**

* **Better performance**: Direct access to data files without network overhead
* **Easier troubleshooting**: The sidecar container runs continuously in the Percona XtraDB Cluster Pod, so you can check backup logs and status at any time. SST backups may fail with cryptic errors when a network issue occurs. This makes it difficult to diagnose the root cause or intervene to resolve problems.
* **Native encryption**: Built-in support for encrypted backups with proper key management. This functionality is not yet available in version 1.19.0 but will be added in future releases.
* **Incremental backups**: Make your backups more efficient by saving only the data that has changed since the last backup, rather than copying the entire database each time. This reduces the amount of backup storage required and allows you to take backups more frequently with less impact on performance. This functionality is not yet available in version 1.19.0 but will be added in future releases.

**Limitations:**

* PVC (Persistent Volume Claim) backups are not supported when this feature is enabled. This support is planned to be implemented in future releases.
* Only cloud storage backups are available (S3-compatible storage, including Google Cloud Storage, or Azure Blob Storage)
* IAM profiles are not yet supported. The support for IAM profiles is planned to be added in future releases.

To enable this method, set `PXCO_FEATURE_GATES=XtrabackupSidecar=true` in the Operator Deployment. See [Configure Operator environment variables](env-vars-operator.md#pxco_feature_gates) for detailed instructions.

!!! important
    
    Enabling the `PXCO_FEATURE_GATES=XtrabackupSidecar=true` affects all clusters managed by this Operator.

## Next step

[Configure a backup storage](backups-storage.md){.md-button}