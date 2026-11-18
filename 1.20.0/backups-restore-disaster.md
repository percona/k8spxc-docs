> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Restore the cluster after a disaster

Use this page when the original cluster and its Kubernetes environment are both gone, and a backup in cloud storage is all that survived. For example, the Kubernetes cluster itself was lost or the namespace was deleted.

## Prerequisites

- A succeeded backup in the cloud storage (S3 or Azure). A Persistent Volume backup doesn’t survive the loss of its Kubernetes cluster, so it can’t be used here. See [Restore limitations](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore.html#restore-limitations).
- The Secret with the access credentials for that storage. Recreate it if it was lost along with the cluster.
- If you plan to apply [point-in-time recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr-restore.html) as part of this restore, you need the user passwords that were in effect on the source cluster. See [Restore limitations](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-restore.html#restore-limitations).

## Rebuild the cluster from a backup

1. Set up the namespace and install the Operator, if they don’t already exist. Use the [Quickstart](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/kubectl.html) for the installation steps.

1. Export the namespace where the cluster runs as an environment variable. Replace the `<namespace>` with your value:

   `bash export NAMESPACE=<namespace>`

1. Create the Secret with the new cluster’s system-user credentials as described in [System Users](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/users.html#system-users). Separately, recreate the cloud-storage credentials Secret by following [Create the S3 credentials Secret](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage-s3.html#create-the-s3-credentials-secret) or [Create a Secret for Azure](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage-azure.html#create-a-secret).

1. Deploy a fresh Percona XtraDB Cluster with the name you want to restore into:

   ```
   kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/cr.yaml -n $NAMESPACE
   ```

1. Confirm the new cluster reports the `ready` status before you restore into it:

   ```
   kubectl get pxc -n $NAMESPACE
   ```

1. Create a `PerconaXtraDBClusterRestore` object. Specify the name of the restore object and the cluster where you restore. Configure the `backupSource` section:

   - `destination` - the surviving backup’s location.
   - `<storage-type>.credentialsSecret` - reference the Secret you created earlier here
   - specify other storage related settings like bucket name, region, prefix, if you use them.
   - To restore to an exact time or transaction instead of the full backup as-is, add a `pitr` section — see [Restore with point-in-time recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr-restore.html).

   This example configures the restore with point-in-time recovery using AWS S3 storage.

   ```
   apiVersion: pxc.percona.com/v1
   kind: PerconaXtraDBClusterRestore
   metadata:
     name: restore1
   spec:
     pxcCluster: cluster1
     backupSource:
       destination: s3://mybucket/cluster1-2025-03-21-12:05:37-full
       s3:
         bucket: mybucket
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

1. Start the restore:

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

1. Connect to the cluster and spot-check the data you expected the backup to contain — row counts on a known table, or the latest timestamped record you expect to see.

1. Point your applications at the rebuilt cluster, then make a new full backup right away. The restored database is now your new baseline — don’t rely on anything from the old cluster’s backup chain going forward.

1. If you lost the storage credentials along with the cluster and had to recreate the Secret, confirm new backups succeed against it before you consider the cluster fully recovered.
