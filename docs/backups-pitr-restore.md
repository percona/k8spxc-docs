# Restore with point-in-time recovery

Point-in-time recovery (PITR) replays binary logs (binlogs) on top of a full backup so you can bring your database to an exact moment or an exact transaction, instead of only the moment the backup finished.

You can make a point-in-time restore:

* [in-place, on the same cluster](backups-restore-in-place.md)
* to a [side cluster](backups-restore-side-cluster.md)
* to a [new cluster](backups-restore-to-new-cluster.md)
* after a [disaster](backups-disaster-restore.md)

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

1. Check how far forward you can restore. The Operator tracks the latest point it can guarantee a consistent recovery as `status.latestRestorableTime` on the Backup object:

    ```bash
    kubectl get pxc-backup <backup_name> -n <namespace> -o jsonpath='{.status.latestRestorableTime}'
    ```

    For a `date`-type restore, your `date` value can't be later than this. The value only appears once the backup has succeeded and the Operator has confirmed there's no binlog gap blocking recovery up to that point — see [Binlog gaps](#binlog-gaps) if it's missing or you suspect it's stale. If you're restoring by `transaction` or `skip` instead, see [Find a GTID for point-in-time recovery](backups-pitr-find-gtid.md) to look up the GTID you need.

2. Disable point-in-time recovery on the target cluster before restoring, regardless of whether the backup itself was made with PITR enabled or not:

    ```bash
    kubectl patch pxc cluster1 \
      -n <namespace> \
      --type merge \
      -p '{"spec":{"backup":{"pitr":{"enabled":false}}}}'
    ```

3. The Operator still requires a Secret with the same user passwords used at backup time for a PITR restore — this is a known limitation, unlike a full-backup restore, which tolerates changed passwords since Operator 1.18.0. If passwords have since changed, follow [Restore the cluster when backup has different passwords](backups-restore.md#restore-the-cluster-when-backup-has-different-passwords) before you restore.

## Run the restore

Point-in-time recovery requires the full backup itself to be in cloud storage. A Persistent Volume backup can't be the base for a PITR restore. See [Considerations](backups-pitr.md#considerations) to learn more. 

Pick the section that matches how you're addressing the full backup. See [Choose backupName or backupSource](backups-restore.md#choose-backupname-or-backupsource) for what these mean and when each applies.

### Use `backupName`

Use these steps to restore in-place or to a side cluster in the same namespace as the source. A Backup object for the full backup already exists there.

1. Set the following keys for the `PerconaXtraDBClusterRestore` custom resource:

    * `spec.pxcCluster`: the name of the target cluster
    * `spec.backupName`: the name of your backup
    * Configure the `pitr` section:

      * `type`: [choose your recovery target](#choose-a-recovery-target)

      * For the `type=date` option, set the `date` key in the datetime format following the pattern `"YYYY-MM-DD HH:MM:SS"`.
      * For the `type=transaction` option, set the `gtid` key to be the exact GTID of a transaction **which follows** the last transaction included into the recovery.
      * For the `type=skip` option, set the `gtid` key to be the exact GTID or GTID set of transactions that will be **excluded** from the restore.

      * In the `backupSource` subsection, specify the storage where binlogs are stored for point-in-time recovery. You can do this either by referencing the storage using `storageName`, or by providing the storage settings directly in the restore manifest:

          * If you have [already defined the storage](backups-pitr.md#enable-point-in-time-recovery) for binlogs in the `pitr.storages` section of your `deploy/cr.yaml` file, specify the storage name in the `storageName` option.
          * If you have not configured the binlog storage in your cluster CR, specify the storage settings directly for the `s3` subsection in your restore configuration.

3. Pass this configuration to the Operator:

    === "via the YAML manifest"

        1. Edit the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file.

            The sample configuration may look as follows:

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

        2. Start the restore:

            ```bash
            kubectl apply -f deploy/backup/restore.yaml
            ```

    === "via the command line"

        You can skip editing the YAML file and pass its contents to the Operator via the command line. For example:

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

### Use the `backupSource`, storage already defined on the target

Use this to restore to a side cluster in a different namespace or to a new cluster. You have already configured the backup storage and the binlog storage in the target cluster's `cr.yaml`.

1. Edit the [deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file. Set the following keys:
   
    * Set `spec.pxcCluster` key to the name of the target cluster to restore the backup on.

    * Specify the storage name in the `storageName` key. The name must match the name in the `backup.storages` subsection of the `deploy/cr.yaml` file.
    * Configure the `spec.backupSource` subsection with the backup destination. Take it from the output of the `kubectl get pxc-backup` command on the source cluster
    * Configure the `pitr` section:

        * `type` - [choose your recovery target](#choose-a-recovery-target)

        * For the `type=date` option, set the `date` key in the datetime format following the pattern `"YYYY-MM-DD HH:MM:SS"`.
        * For the `type=transaction` or `type=skip` option, set the `gtid` key to be the exact GTID of a transaction **which follows** the last transaction included into the recovery.
        * `backupSource.storageName` - specify the name of the binlog storage 

    Here are example configurations:

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

2. Start the restore process:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE

### By `backupSource`, full inline storage details

Use this when the target cluster has no storage configuration to reference. For example, to restore after a disaster or to a new cluster where you haven't predefined the storage.

1. Edit the `deploy/backup/restore.yaml`. Set the following keys:

    * Set `spec.pxcCluster` key to the name of the target cluster to restore the backup on.
    * Configure the `spec.backupSource` subsection to point to the cloud storage where the backup is stored. This subsection should include:

        * A `destination` key. Take it from the output of the `kubectl get pxc-backup -n <namespace>` command.
        * The [necessary storage configuration keys](backups-storage.md), just like in the `deploy/cr.yaml` file of the source cluster.
  
    * Configure the `pitr` section:

        * `type` - [choose a recovery target](#choose-a-recovery-target):
        * For the `type=date` option, set the `date` key in the datetime format following the pattern `"YYYY-MM-DD HH:MM:SS"`.
        * For the `type=transaction` option, set the `gtid` key to be the exact GTID of a transaction **which follows** the last transaction included into the recovery.
        * For the `type=skip` option, set the `gtid` key to be the exact GTID or GTID set of transactions that will be **excluded** from the restore.
        * Configure the `pitr.backupSource` subsection. Specify the storage location settings for the binlogs on the source cluster. The Operator requires access to these binlogs storage in order to perform point-in-time recovery, so the settings (including credentials, endpoint, bucket name, etc.) must exactly match those used on the source cluster.
        
        === "S3-compatible storage"

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
              s3:
               bucket: S3-BINLOG-BACKUP-BUCKET-NAME-HERE
               credentialsSecret: my-cluster-name-backup-s3
               endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
               region: us-west-2
          backupSource:
            verifyTLS: true
            destination: s3://S3-BUCKET-NAME/BACKUP-NAME
            s3:
              bucket: S3-BUCKET-NAME
              credentialsSecret: my-cluster-name-backup-s3
              region: us-west-2
              endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
              caBundle: #If you use custom TLS certificates for S3 storage
                name: minio-ca-bundle
                key: ca.crt
        ```

        === "Azure Blob storage"

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
                  s3:
                  bucket: S3-BINLOG-BACKUP-BUCKET-NAME-HERE
                  credentialsSecret: my-cluster-name-backup-s3
                  endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
              backupSource:
                destination: azure://AZURE-CONTAINER-NAME/BACKUP-NAME
                azure:
                  container: AZURE-CONTAINER-NAME
                  credentialsSecret: my-cluster-azure-secret
                  ...
            ```

    

2. Start the restore:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n <namespace>
    ```

## Verify the restore

1. Confirm the restore succeeded:

    ```bash
    kubectl get pxc-restore -n <namespace>
    ```

2. Confirm the cluster reports the `ready` status:

    ```bash
    kubectl get pxc -n <namespace>
    ```

3. Confirm the data landed where you expected. Check the last applied transaction against the GTID or date you targeted:

    ```{sql data-prompt="mysql> "}
    mysql> SHOW GLOBAL VARIABLES LIKE 'gtid_executed';
    ```

    For a `date`-type restore, also spot-check a row you know should (or shouldn't) be present based on your target time.

4. Make a new full backup once you've confirmed the restore is correct. The restored database is now the new baseline for future recoveries — don't rely on replaying binlogs past this point from the old backup chain.

## Post-restore steps

1. Configure the main storage within the target cluster's `cr.yaml` to be able to make subsequent backups.
2. [Enable point-in-time recovery](backups-pitr.md#enable-point-in-time-recovery) to start binlog collection.
3. Make a new full backup after the restore, because your restored database is now the new baseline for future recoveries.


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
