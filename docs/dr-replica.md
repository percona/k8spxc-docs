# Set up the replica site

The replica site must be the exact copy of the primary site and must have the same system user credentials. The easiest way to achieve this is to [make a backup on the primary site](dr-primary.md#create-a-backup-from-the-primary-site) and restore it on the replica. 

## Before you start

Clone the repository with all manifests and source code. You'll need it to edit configuration files for the database clusters, Secrets, backups and restores. Run the following command:

```{.bash data-prompt="$" }
$ git clone -b v{{ release }} https://github.com/percona/percona-xtradb-cluster-operator
```

Make sure to clone the correct branch. The branch name is the same as the Operator release version. 

## Procedure

Let's create `cluster2` on the replica site.

1. Create a namespace.  

    ```{.bash data-prompt="$" }
	$ kubectl create namespace <namespace>
	```

2. Create the Secrets object with the user credentials for the replica site. The Operator uses this Secret object when installing Percona XtraDB Cluster. As a result, the users in both sites have the same credentials. This is required to restore the backup from the main site on the replica.

    Edit the `pxcsecret.yaml` file that you exported from the primary site, if you haven't done it before. Remove the `annotations`, `creationTimestamp`, `resourceVersion`, `selfLink`, and `uid` metadata fields. 

    You can create the replica site with the same name as the primary. In our setup we differentiate the clusters and must change the name in the Secret.

    The resulting Secret file must resemble the following:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: cluster2-secrets  # Change the name if needed
    type: Opaque
    stringData:
      monitor: <monitor-password>  # Decoded passwords here
      operator: <operator-password>
      proxyadmin: <proxyadmin-password>
      replication: <replication-password>
      root: <root-password>
      xtrabackup: <xtrabackup-password>
    ```

3. Create the Secret with the following command. Replace the `<namespace>` placeholder with your name:

	```{.bash data-prompt="$" }
	$ kubectl apply -f path/to/pxcsecret.yaml -n <namespace>
	```

4. Install Percona XtraDB Cluster. Edit the `deploy/cr.yaml` file and specify the following configuration:

    * `metadata.name` - The name of the cluster if you want to change it. It must match the name you defined for the user Secret on step 2.

       ```yaml
       metadata:
         name: cluster2  # The name of your cluster if you want to change it
       ```

5. Run the following command to install Percona XtraDB Cluster:

    ```{.bash data-prompt="$" }
	$ kubectl apply -f deploy/cr.yaml -n <namespace>
	```

	It may take some time to install and initialize the cluster.

6. Check the status of the cluster:

	```{.bash data-prompt="$" }
	$ kubectl get pxc -n <namespace>
	```

	??? example "Expected output"

		```{.text .no-copy}
		NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
		cluster2   cluster2-haproxy.<namespace>   ready    3                3         36m
		```

## Restore the backup on the replica site

1. Create the Secret object with the credentials from the cloud storage where you made the backup to. The Operator uses the same Secret for backups and  restores. For example, if you named the Secret `deploy/backup/backup-s3-secret.yaml`, run the following command to create the Secrets object on the replica site. Replace the `<namespace>` placeholder with your namespace.

    ```{.bash data-prompt="$" }
	$ kubectl apply -f deploy/backup/backup-s3-secret.yaml -n <namespace>
	```

2. To restore from a backup, create a special restore configuration file. Edit the sample [`deploy/backup/restore.yaml`](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml) file. 
    
    Specify the following information:

    * `spec.pxcCluster` -  the name of the cluster on the replica site. 
    * `spec.backupSource.destination` - the location of the backup on the backup storage. Run the `kubectl get pxc-backup -n <namespace>` on the main site to check the destination.

    Specify the storage information specific to the storage you used for the backup. For S3 storage, this will be the following:

    * `spec.backupSource.s3.bucket` - the name of the bucket where the backup is stored
    * `spec.backupSource.s3.credentialsSecret` - the name of the Secrets object with the credentials from the backup storage that you created in step 1.
    * `spec.backupSource.s3.region` - the region where the bucket is located. It must match the region that you defined in the `deploy/cr.yaml` file on when you [made a backup](dr-primary.md#create-a-backup-from-the-primary-site).

	```yaml
	apiVersion: pxc.percona.com/v1
	kind: PerconaXtraDBClusterRestore
	metadata:
	  name: restore1
	spec:
	  pxcCluster: cluster2
	  backupSource:
	    destination: s3://mybucket/cluster1-2025-03-18-10:55:43-full
	    s3:
	      bucket: mybucket
	      credentialsSecret: my-cluster-name-backup-s3
	      region: us-west-2
	```

3. Run the following command to start a restore:

    ```{.bash data-prompt="$" }
	$ kubectl apply -f deploy/backup/restore.yaml -n <namespace>
	```

4. Check the cluster status to see if the restore was successful:

	```{.bash data-prompt="$" }
	$ kubectl get pxc -n <namespace>
	```

	??? example "Expected output"

		```{.text .no-copy}
		NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
		cluster2   cluster2-haproxy.<namespace>   ready    3                3         36m
		```
