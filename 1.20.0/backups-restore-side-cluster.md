> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Restore to a side cluster

A side cluster is a second, independent Percona XtraDB Cluster on the **same** Kubernetes cluster that you restore a backup into. It can run in the same namespace or a different one.

Unlike [restoring to a new cluster on a different Kubernetes environment](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore-to-new-cluster.html), a side cluster can use Persistent Volume backups as well as cloud storage, since the PVC stays on the same Kubernetes cluster. Compare this with the other restore paths in [Restore scenarios](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore.html#restore-scenarios).

Use a side cluster to:

- Test a schema change, an upgrade, or an application change against real data without touching production.
- Debug or analyze data without affecting the production cluster.
- Keep a throwaway copy around for a one-off investigation.

## Prerequisites

- A succeeded backup of the source cluster, either on a Persistent Volume or in cloud storage.
- The target cluster must already exist and be running before you create the Restore object. Restoring doesn’t create a cluster for you.
- If you’re restoring **into the same namespace** as the source cluster, the target `PerconaXtraDBCluster` cluster needs a different name. The Operator already manages multiple clusters within one namespace, so no extra configuration is needed.
- If you’re restoring **into a different namespace**, the names can match, but the Operator watching the source namespace won’t see a Custom Resource created in the new one. Either deploy a second, separate Operator into that namespace or switch the Operator to the cluster-wide mode so it watches both namespaces. See [Cluster-wide mode](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/cluster-wide.html) for the exact steps.

## Before you start

1. Make sure that the cluster is running.

1. Find the correct cluster name.

   ```
   kubectl get pxc -n <namespace>
   ```

1. Export the the cluster name and the namespace where it is running as environment variables. Replace the `cluster1` and `<namespace>` with your values:

   ```
   export CLUSTER=cluster1
   export NAMESPACE=<namespace>
   ```

1. List backups to retrieve the desired backup name. Replace the `<namespace>` with your value:

   ```
   kubectl get pxc-backup -n $NAMESPACE
   ```

1. For point-in-time recovery, disable storing binlogs point-in-time functionality on the existing cluster. You must do it regardless of whether you made the backup with point-in-time recovery or without it. Use the following command and replace the cluster name and the `<namespace>` with your values:

   ```
   kubectl patch pxc $CLUSTER \
     -n $NAMESPACE \
     --type merge \
     -p '{"spec":{"backup":{"pitr":{"enabled":false}}}}'
   ```

## Restore using `backupName`

Use `backupName` when the Backup object is in the same namespace as the target cluster. See [Choose `backupName` or `backupSource`](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore.html#choose-backupname-or-backupsource) for the general rule.

1. Edit `deploy/backup/restore.yaml` and set the following keys:

   - `backupName` - the backup name you restore from
   - `pxcCluster` - the name of the cluster you restore to. The name must differ from the name of the source cluster.

   ```
   apiVersion: pxc.percona.com/v1
   kind: PerconaXtraDBClusterRestore
   metadata:
     name: restore-to-side-cluster
   spec:
     pxcCluster: cluster2
     backupName: backup1
   ```

1. Start the restore:

   ```
   kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
   ```

The Operator doesn’t check that `backup1` was originally made from `cluster2`. It only checks that a succeeded Backup object by that name exists in the Restore object’s namespace. This is what lets you restore a backup from one cluster onto a differently named cluster in the same namespace.

## Restore using `backupSource`

Use this when restoring into a different namespace than the one containing the Backup object, or when you’d rather point directly at the storage destination instead of relying on a Backup object existing in the target namespace.

When using `backupSource`, you also need to specify the destination — where the backup is stored. Take this value from the output of `kubectl get pxc-backup -n <source-namespace>`.

**Persistent Volume backup**

A Persistent Volume backup can be restored to a side cluster only when the target is in the same namespace as the source. For a side cluster in a different namespace, use cloud storage.

```
spec:
  pxcCluster: cluster2
  backupSource:
    storageName: pvc-fs
    destination: pvc/PVC_VOLUME_NAME
```

**Cloud storage backup**

Cloud storage is external to the cluster. The Operator needs the storage settings and the credentials Secret to read the backup.

You can either pre-configure the storage in the target cluster or supply this information in the restore object.

A credentials Secret from the source namespace is not available in the target namespace. Create the Secret in the target namespace and set `credentialsSecret` on the restore object.

The following example configuration defines the storage settings within the restore object:

```
spec:
  pxcCluster: cluster2
  backupSource:
    destination: s3://S3-BUCKET-NAME/BACKUP-NAME
    s3:
      bucket: S3-BUCKET-NAME
      credentialsSecret: my-cluster-name-backup-s3 # Same as in the source namespace
      region: us-west-2
```

Start the restore:

```
kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
```

## Point-in-time recovery

PITR works the same way for a side cluster as it does for an in-place restore. See [Restore with point-in-time recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr-restore.html).

## Verify the restore

1. Confirm the Restore object reports `Succeeded`:

   ```
   kubectl get pxc-restore -n $NAMESPACE
   ```

1. Confirm the cluster reports the `ready` status:

   ```
   kubectl get pxc -n $NAMESPACE
   ```

1. Connect to the side cluster and spot-check the data you expected the backup to contain.

### User passwords after the restore

After the restore, the Operator resets the side cluster’s system users to its own Secret so the passwords do not need to match the source cluster. This applies to the `root`, `operator`, `monitor`, `xtrabackup`, and `replication` users.

Connect with the side cluster’s own credentials, not the source cluster’s.

Application users you created yourself likely keep the passwords they had on the source cluster at backup time, since the Operator’s post-restore password reset only covers the system users listed above. If an application user’s password doesn’t work after the restore, try the source cluster’s password for that user.

This only applies to a full-backup restore. If you’re making a [point-in-time recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr-restore.html), the Operator still requires a Secret with the same passwords used at backup time. See [Restore the cluster when backup has different passwords](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore.html#restore-the-cluster-when-a-backup-has-different-passwords).
