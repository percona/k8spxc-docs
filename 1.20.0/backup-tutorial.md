> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# 4. Make a backup

In this tutorial, you will learn how to make a backup of your data manually. To learn more about backups, see the [Backup and restore](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups.html) section.

## Considerations and prerequisites

In this tutorial, we use the [AWS S3](https://aws.amazon.com/s3/) as the backup storage. You need the following S3-related information:

- the name of the S3 storage
- the name of the S3 bucket
- the region - the location of the bucket
- the S3 credentials to be used to access the storage.

If you don’t have access to AWS, you can use any S3-compatible storage like [MinIO](https://min.io/docs/minio/linux/index.html) . Also [check the list of supported storages](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage.html).

Also, we will use some files from the Operator repository for setting up backups. So, clone the percona-xtradb-cluster-operator repository:

```
git clone -b v1.20.0 https://github.com/percona/percona-xtradb-cluster-operator.git
cd percona-xtradb-cluster-operator
```

Note

It is important to specify the right branch with `-b` option while cloning the code on this step. Please be careful.

## Configure backup storage

1. Encode S3 credentials, substituting `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with your real values:

   **on Linux**

   ```
   echo -n 'AWS_ACCESS_KEY_ID' | base64 --wrap=0
   echo -n 'AWS_SECRET_ACCESS_KEY' | base64 --wrap=0
   ```

   **on MacOS**

   ```
   echo -n 'AWS_ACCESS_KEY_ID' | base64 
   echo -n 'AWS_SECRET_ACCESS_KEY' | base64
   ```

1. Edit the [`deploy/backup-secret-s3.yaml`](https://github.com/percona/percona-xtradb-cluster-operator/blob/v1.20.0/deploy/backup/backup-secret-s3.yaml) example Secrets configuration file and specify the following:

   - the `metadata.name` key is the name which you use to refer your Kubernetes Secret
   - the base64-encoded S3 credentials

   deploy/backup/backup-secret-s3.yaml

   ```
   apiVersion: v1
   kind: Secret
   metadata:
     name: my-cluster-name-backup-s3
   type: Opaque
   data:
     AWS_ACCESS_KEY_ID: <YOUR_AWS_ACCESS_KEY_ID>
     AWS_SECRET_ACCESS_KEY: <YOUR_AWS_SECRET_ACCESS_KEY>
   ```

1. Create the Secrets object from this yaml file. Specify your namespace instead of the `<namespace>` placeholder:

   ```
   kubectl apply -f deploy/backup/backup-secret-s3.yaml -n <namespace>
   ```

1. Update your `deploy/cr.yaml` configuration. Specify the following parameters in the `backup` section:

   - set the `storages.<NAME>.type` to `s3`. Substitute the `<NAME>` part with some arbitrary name that you will later use to refer this storage when making backups and restores.
   - set the `storages.<NAME>.s3.credentialsSecret` to the name you used to refer your Kubernetes Secret (`my-cluster-name-backup-s3` in the previous step).
   - specify the S3 bucket name for the `storages.<NAME>.s3.bucket` option
   - specify the region in the `storages.<NAME>.s3.region` option.

   ```
   ...
   backup:
     ...
     storages:
       s3-us-west:
         type: s3
         s3:
           bucket: "S3-BACKUP-BUCKET-NAME-HERE"
           region: "<AWS_S3_REGION>"
           credentialsSecret: my-cluster-name-backup-s3
     ...
   ```

   If you use a different S3-compatible storage instead of AWS S3, add the `endpointURL` key in the `s3` subsection, which should point to the actual cloud used for backups. This value is specific to the cloud provider. For example, using Google Cloud involves the following `endpointUrl`:

   ```
   endpointUrl: https://storage.googleapis.com
   ```

1. Apply the configuration. Specify your namespace instead of the `<namespace>` placeholder:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

## Make a physical backup

Now when your have the [configured storage](#configure-backup-storage) in your Custom Resource, you can make your first backup.

1. To make a backup, you need the configuration file. Edit the sample [`deploy/backup/backup.yaml`](https://github.com/percona/percona-xtradb-cluster-operator/blob/v1.20.0/deploy/backup/backup.yaml) configuration file and specify the following:

   - `metadata.name` - specify the backup name. You will use this name to restore from this backup
   - `spec.pxcCluster` - specify the name of your cluster. This is the name you specified when deploying Percona XtraDB Cluster.
   - `spec.storageName` - specify the name of your already configured storage.

   deploy/backup/backup.yaml

   ```
   apiVersion: pxc.percona.com/v1
   kind: PerconaXtraDBClusterBackup
   metadata:
     finalizers:
       - delete-s3-backup
     name: backup1
   spec:
     pxcCluster: cluster1
     clusterName: my-cluster-name
     storageName: s3-us-west
   ```

1. Apply the configuration. This instructs the Operator to start a backup. Specify your namespace instead of the `<namespace>` placeholder:

   ```
   kubectl apply -f deploy/backup/backup.yaml -n <namespace>
   ```

1. Track the backup progress.

   ```
   kubectl get pxc-backup -n <namespace>
   ```

   Output

   ```
   NAME      CLUSTER       STORAGE      DESTINATION                                      STATUS    COMPLETED   AGE
   backup1   cluster1      s3-us-west   s3://pxc-my-bucket/2023-10-10T16:36:46Z   Running               43s
   ```

   When the status changes to `Succeeded`, backup is made.

## Troubleshooting

You may face issues with the backup. To identify the issue, you can do the following:

- View the information about the backup with the following command:

```
kubectl get pxc-backup <backup-name> -n <namespace> -o yaml
```

- [View the backup-agent logs](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/debug-logs.html). Use the previous command to find the name of the pod where the backup was made:

```
kubectl logs pod/<pod-name> -c xtrabackup -n <namespace>
```

Congratulations! You have made the first backup manually. Want to learn more about backups? See the [Backup and restore](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups.html) section for how to [configure point-in-time recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr.html), and how to [automatically make backups according to the schedule](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-scheduled.html).

## Next steps

[Monitor the database](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/monitoring-tutorial.html)
