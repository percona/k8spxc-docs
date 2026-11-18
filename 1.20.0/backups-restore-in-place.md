> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Restore to the same cluster (in-place)

This page covers in-place restore - restoring a backup into the same cluster it was made from. For the other restore paths, see [Restore scenarios](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore.html#restore-scenarios).

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

## Restore from a full backup

To restore your Percona XtraDB Cluster from a backup, define a `PerconaXtraDBClusterRestore` Custom Resource. Set the following keys:

- `spec.pxcCluster`: the name of the target cluster
- `spec.backupName`: the name of your backup

If the target cluster’s passwords differ from the backup’s, see [Restore the cluster when backup has different passwords](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore.html#restore-the-cluster-when-a-backup-has-different-passwords) before you continue.

Pass this configuration to the Operator:

**via the YAML manifest**

1. Edit the [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file and specify the cluster and backup names:

   ```
   apiVersion: pxc.percona.com/v1
   kind: PerconaXtraDBClusterRestore
   metadata:
     name: restore1
   spec:
     pxcCluster: cluster1
     backupName: backup1
   ```

1. Start the restore with this command:

   ```
   kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
   ```

**via the command line**

You can skip creating a separate file by passing YAML content directly:

```
cat <<EOF | kubectl apply -f-
apiVersion: "pxc.percona.com/v1"
kind: "PerconaXtraDBClusterRestore"
metadata:
  name: "restore1"
spec:
  pxcCluster: "cluster1"
  backupName: "backup1"
EOF
```

### Restore from a backup using the `backupSource` option

You can use `backupSource` instead of `backupName`. See [Choose backupName or backupSource](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore.html#choose-backupname-or-backupsource) for when this applies to an in-place restore.

When using the `backupSource`, you also need to specify the destination — where the backup is stored. Take this value from the output of the `kubectl get pxc-backup -n $NAMESPACE` command.

When restoring to the same cluster, the backup storage is already defined in the cluster’s configuration and you can reference it by name.

Here’s the example configuration for the restore from a Persistent Volume backup:

```
spec:
  pxcCluster: cluster1
  backupSource:
    destination: pvc/PVC_VOLUME_NAME
    storageName: pvc-fs
  ...
```

Note

If you need a[headless Service](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services) for the restore Pod (i.e. restoring from a Persistent Volume in a tenant network), mention this in the `metadata.annotations` as follows:

```
annotations:
  percona.com/headless-service: "true"
...
```

Apply the configuration to start the restore:

```
kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
```

## Verify the restore

1. Confirm the Restore object reports `Succeeded`:

   ```
   kubectl get pxc-restore -n $NAMESPACE
   ```

1. Confirm the cluster reports the `ready` status:

   ```
   kubectl get pxc -n $NAMESPACE
   ```

1. Spot-check the data you expected the backup to contain.

## Remove the recovery record after the restore

Warning

A restore starts a new Galera cluster with a new cluster UUID, but the Operator keeps the `status.recovery` record of its last automatic recovery. On the next full cluster crash, the Operator compares the new UUID and `seqno` with the old record, refuses automatic recovery, and emits the `AutomaticRecoveryRefused` event. The Pods keep waiting until you intervene.

To avoid this, remove the record after the restore:

1. Wait until the restore is `Succeeded` and the cluster is `ready`.

1. Check whether the cluster has a record:

   ```
   kubectl get pxc $CLUSTER -n $NAMESPACE -o jsonpath='{.status.recovery}'
   ```

   If the output is empty, the Operator hasn’t recovered this cluster automatically yet and you have nothing to do.

1. Remove the record. The `status` is a subresource, so you need `kubectl` 1.24 or newer:

   ```
   kubectl patch pxc $CLUSTER -n $NAMESPACE --type=merge --subresource=status -p '{"status":{"recovery":null}}'
   ```

The Operator records the new UUID and `seqno` the next time it recovers the cluster. If a full cluster crash has already been refused, see [When the Operator refuses automatic recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/recovery.html#when-the-operator-refuses-automatic-recovery).

## Restore with point-in-time recovery

See [Restore with point-in-time recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr-restore.html) for recovery-target options (date, GTID, or latest), how to find the GTID you need, and verification steps.
