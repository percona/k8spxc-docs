# Restore to the same cluster (in-place)

This page covers in-place restore - restoring a backup into the same cluster it was made from. For the other restore paths, see [Restore scenarios](backups-restore.md#restore-scenarios).

--8<-- "backups-restore.md:backup-prepare"

## Restore from a full backup

To restore your Percona XtraDB Cluster from a backup, define a `PerconaXtraDBClusterRestore` Custom Resource. Set the following keys:

* `spec.pxcCluster`: the name of the target cluster
* `spec.backupName`: the name of your backup

If the target cluster's passwords differ from the backup's, see [Restore the cluster when backup has different passwords](backups-restore.md#restore-the-cluster-when-backup-has-different-passwords) before you continue.

Pass this configuration to the Operator:

=== "via the YAML manifest"

    1. Edit the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file and specify the cluster and backup names:

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          backupName: backup1
        ```

    2. Start the restore with this command:

        ```bash
        kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
        ```

=== "via the command line"

    You can skip creating a separate file by passing YAML content directly:

    ```bash
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

You can use `backupSource` instead of `backupName`. See [Choose backupName or backupSource](backups-restore.md#choose-backupname-or-backupsource) for when this applies to an in-place restore. 

When using the `backupSource`, you also need to specify the destination — where the backup is stored. Take this value from the output of the `kubectl get pxc-backup -n $NAMESPACE` command.

When restoring to the same cluster, the backup storage is already defined in the cluster's configuration and you can reference it by name.

Here's the example configuration for the restore from a Persistent Volume backup:

```yaml
spec:
  pxcCluster: cluster1
  storageName: pvc-fs
  backupSource:
    destination: pvc/PVC_VOLUME_NAME
  ...
```

!!! note

    <a name="backups-headless-service"> If you need a [headless Service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services) for the restore Pod (i.e. restoring from a Persistent Volume in a tenant network), mention this in the `metadata.annotations` as follows:

    ```yaml
    annotations:
      percona.com/headless-service: "true"
    ...
    ```

Apply the configuration to start the restore:

```bash
kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
```

## Verify the restore

--8<-- "verify-restore.md"

1. Spot-check the data you expected the backup to contain.

## Restore with point-in-time recovery

See [Restore with point-in-time recovery](backups-pitr-restore.md) for recovery-target options (date, GTID, or latest), how to find the GTID you need, and verification steps.
