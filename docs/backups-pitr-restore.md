# Restore with point-in-time recovery

Point-in-time recovery (PITR) replays binary logs (binlogs) on top of a full backup so you can bring your database to an exact moment or an exact transaction, instead of only the moment the backup finished.

You can make a point-in-time restore:

* [in-place, on the same cluster](backups-restore-in-place.md)
* to a [side cluster](backups-restore-side-cluster.md)
* to a [new cluster](backups-restore-to-new-cluster.md)
* after a [disaster](backups-restore-disaster.md)

Set `spec.pxcCluster` to whichever target you're restoring into, then follow the steps on this page for the `pitr` section — everything you need for a PITR restore, for any of these destinations, is on this one page.

Before you start, [enable point-in-time recovery](backups-pitr.md#enable-point-in-time-recovery) on the source cluster so binlogs are already uploaded to storage.

## Choose a recovery target

Set `pitr.type` to one of four values, depending on where you want recovery to stop and what you already know about the incident:

| `pitr.type` | Use it when... | What you need |
| --- | --- | --- |
| `date` | You know roughly when the incident happened (for example, from an application alert or a user report) and an exact transaction boundary doesn't matter. | `date` key, format `"YYYY-MM-DD HH:MM:SS"`, not later than the backup's `status.latestRestorableTime` — see [Before you restore](#before-you-restore) for how to check it |
| `transaction` | You know exactly which transaction caused the problem and want to stop right before it, or you need the restore to land on an exact, reproducible boundary rather than an approximate time. | `gtid` key: the exact GTID of the transaction **following** the last one to keep — see [Find a GTID for point-in-time recovery](backups-pitr-find-gtid.md) if you don't already know it |
| `skip` | You want to remove a single bad statement — a bad migration, an errant `UPDATE` — while keeping everything that came after it. | `gtid` key: the exact GTID or GTID set to exclude — see [Find a GTID for point-in-time recovery](backups-pitr-find-gtid.md) if you don't already know it |
| `latest` | You've had an infrastructure loss and want to recover as close to the present moment as possible, with no specific transaction known to be bad. | Nothing beyond the backup and binlog storage |

If you chose `transaction` or `skip`, see [Find a GTID for point-in-time recovery](backups-pitr-find-gtid.md) to look up the GTID before you continue. If you chose `date` or `latest`, skip ahead to [Before you restore](#before-you-restore).

## Before you restore

1. Export the namespace as an environment variable. Replace the `<namespace>` placeholder with your value:
     
    ```bash
    export NAMESPACE=<namespace>
    ```

2. Check how far forward you can restore. The Operator tracks the latest point it can guarantee a consistent recovery as `status.latestRestorableTime` on the Backup object:

    ```bash
    kubectl get pxc-backup <backup_name> -n <namespace> -o jsonpath='{.status.latestRestorableTime}'
    ```

    For a `date`-type restore, your `date` value can't be later than this. The value only appears once the backup has succeeded and the Operator has confirmed there's no binlog gap blocking recovery up to that point — see [Binlog gaps](#binlog-gaps) if it's missing or you suspect it's stale. If you're restoring by `transaction` or `skip` instead, see [Find a GTID for point-in-time recovery](backups-pitr-find-gtid.md) to look up the GTID you need.

3. Disable point-in-time recovery on the target cluster before restoring, regardless of whether the backup itself was made with PITR enabled or not:

    ```bash
    kubectl patch pxc cluster1 \
      -n <namespace> \
      --type merge \
      -p '{"spec":{"backup":{"pitr":{"enabled":false}}}}'
    ```

4. The Operator still requires a Secret with the same user passwords used at backup time for a PITR restore — this is a known limitation, unlike a full-backup restore, which tolerates changed passwords since Operator 1.18.0. If passwords have since changed, follow [Restore the cluster when a backup has different passwords](backups-restore.md#restore-the-cluster-when-a-backup-has-different-passwords) before you restore.

## Run the restore

Point-in-time recovery requires the full backup itself to be in cloud storage — see [Considerations](backups-pitr.md#considerations). A Persistent Volume backup can't be the base for a PITR restore.

Pick the section that matches how you're addressing the full backup. See [Choose backupName or backupSource](backups-restore.md#choose-backupname-or-backupsource) for what these mean and when each applies — the keys below only add the `pitr` section on top of that choice.

### Use `backupName`

Use this when restoring in-place or to a side cluster in the same namespace as the source — a Backup object for the full backup already exists there.

1. Set the following keys for the `PerconaXtraDBClusterRestore` Custom Resource:

    * `spec.pxcCluster`: the name of the target cluster
    * `spec.backupName`: the name of your backup
    * `spec.pitr`: the recovery target you [chose above](#choose-a-recovery-target), plus where to find the binlogs — either `pitr.backupSource.storageName`, referencing a storage you've already defined, or the storage settings written out directly under `pitr.backupSource`

2. Pass this configuration to the Operator:

    === "via the YAML manifest"

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          backupName: backup1
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
            backupSource:
              storageName: s3-us-west
        ```

        ```bash
        kubectl apply -f deploy/backup/restore.yaml -n <namespace>
        ```

    === "via the command line"

        ```bash
        cat <<EOF | kubectl apply -f-
        apiVersion: "pxc.percona.com/v1"
        kind: "PerconaXtraDBClusterRestore"
        metadata:
          name: "restore1"
        spec:
          pxcCluster: "cluster1"
          backupName: "backup1"
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
            backupSource:
              storageName: "s3-us-west"
        EOF
        ```

### Use `backupSource`, storage already defined on the target

Use this when restoring to a side cluster in a different namespace, or to a new cluster, and the backup storage is already configured in the target cluster's `cr.yaml`.

1. Set the following keys for the `PerconaXtraDBClusterRestore` Custom Resource:

    * `spec.pxcCluster`: the name of the target cluster
    * `spec.storageName`: the name matching the `backup.storages` subsection of the target cluster's `deploy/cr.yaml`
    * `spec.backupSource.destination`: the backup's location, from `kubectl get pxc-backup` on the source cluster
    * `spec.pitr`: the recovery target you [chose above](#choose-a-recovery-target), plus `pitr.backupSource.storageName` for the binlog storage

2. Pass this configuration to the Operator:

    === "S3-compatible storage"

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster2
          storageName: s3-us-west
          backupSource:
            destination: s3://S3-BUCKET-NAME/BACKUP-NAME
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
            backupSource:
              storageName: s3-us-west
        ```

    === "Azure Blob storage"

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          storageName: azure
          backupSource:
            destination: azure://AZURE-CONTAINER-NAME/BACKUP-NAME
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
            backupSource:
              storageName: azure
        ```

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n <namespace>
    ```

### Use `backupSource`, full inline storage details

Use this when the target cluster has no storage configuration to reference — restoring after a disaster, or to a new cluster where you haven't predefined the storage.

1. Set the following keys for the `PerconaXtraDBClusterRestore` Custom Resource:

    * `spec.pxcCluster`: the name of the target cluster
    * `spec.backupSource`: the full backup's location and storage settings — a `destination` key (from `kubectl get pxc-backup -n <namespace>` on the source cluster) plus the [necessary storage configuration keys](backups-storage.md), just like in the source cluster's `deploy/cr.yaml`
    * `spec.pitr`: the recovery target you [chose above](#choose-a-recovery-target), plus `pitr.backupSource` with the binlog storage settings — these must exactly match the storage used on the source cluster (credentials, endpoint, bucket name, and so on)

2. Pass this configuration to the Operator:

    === "S3-compatible storage"

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          backupSource:
            destination: s3://S3-BUCKET-NAME/BACKUP-NAME
            s3:
              bucket: S3-BUCKET-NAME
              credentialsSecret: my-cluster-name-backup-s3
              region: us-west-2
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
            backupSource:
              s3:
                bucket: S3-BINLOG-BACKUP-BUCKET-NAME-HERE
                credentialsSecret: my-cluster-name-backup-s3
                region: us-west-2
        ```

    === "Azure Blob storage"

        ```yaml
        apiVersion: pxc.percona.com/v1
        kind: PerconaXtraDBClusterRestore
        metadata:
          name: restore1
        spec:
          pxcCluster: cluster1
          backupSource:
            destination: azure://AZURE-CONTAINER-NAME/BACKUP-NAME
            azure:
              container: AZURE-CONTAINER-NAME
              credentialsSecret: my-cluster-azure-secret
          pitr:
            type: date
            date: "2020-12-31 09:37:13"
            backupSource:
              azure:
                container: AZURE-BINLOG-CONTAINER-NAME-HERE
                credentialsSecret: my-cluster-azure-secret
        ```

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n <namespace>
    ```

## Verify the restore

--8<-- "verify-restore.md"

3. Confirm the data landed where you expected. Check the last applied transaction against the GTID or date you targeted:

    ```{sql data-prompt="mysql> "}
    mysql> SHOW GLOBAL VARIABLES LIKE 'gtid_executed';
    ```

    For a `date`-type restore, also spot-check a row you know should (or shouldn't) be present based on your target time.

## Post-restore steps

1. Configure the main storage within the target cluster's `cr.yaml`, then [re-enable point-in-time recovery](backups-pitr.md#enable-point-in-time-recovery) to start binlog collection again.

2. Make a new full backup once you've confirmed the restore is correct. The restored database is now the new baseline for future recoveries — don't rely on replaying binlogs past this point from the old backup chain.

## Binlog gaps

The Operator monitors the binlog gaps detected by the binlog collector, if any. If a backup contains such gaps, the Operator marks the status of the latest successful backup with a condition that indicates the backup can't guarantee consistent point-in-time recovery:

To watch for gaps before they affect a restore, monitor the `pxc_binlog_collector_gap_detected_total` metric — see [Binary logs statistics](backups-pitr.md#binary-logs-statistics).

```yaml
apiVersion: pxc.percona.com/v1
kind: PerconaXtraDBClusterBackup
metadata:
  name: backup1
spec:
  pxcCluster: pitr
  storageName: minio
status:
  completed: "2022-11-25T15:57:29Z"
  conditions:
  - lastTransitionTime: "2022-11-25T15:57:48Z"
    message: Binlog with GTID set e41eb219-6cd8-11ed-94c8-9ebf697d3d20:21-22 not found
    reason: BinlogGapDetected
    status: "False"
    type: PITRReady
  state: Succeeded
```

Trying a point-in-time restore from such a backup results in the following error:

```text
Backup doesn't guarantee consistent recovery with PITR. Annotate PerconaXtraDBClusterRestore with percona.com/unsafe-pitr to force it.
```

You can bypass this check and force the restore by annotating the Restore object with `pxc.percona.com/unsafe-pitr`:

```yaml
apiVersion: pxc.percona.com/v1
kind: PerconaXtraDBClusterRestore
metadata:
  annotations:
    percona.com/unsafe-pitr: "true"
  name: restore2
spec:
  pxcCluster: pitr
  backupName: backup1
  pitr:
    type: latest
    backupSource:
      storageName: "minio-binlogs"
```
