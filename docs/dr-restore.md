# Restore the previous primary site

Let's say the root of the outage is no longer present. You can now install a new database cluster on this site. Let's use the previous name `cluster1` for it.

## Install a new database cluster on the previous primary site

The new `cluster1` must be the exact copy of the current primary `cluster2`. We will use the same approach as we did when creating `cluster2`: make a backup from `cluster2` and restore it on `cluster1`.

The steps are the following:

1. Create the namespace 
2. If you deleted the Operator, install it. Use the [Quickstart](kubectl.md) for the steps.
3. Prepare the Secrets file with the user credentials for `cluster1`. The users on both sites must have the same credentials. 

    You can reuse the `pxcsecret.yaml` secrets file or create a new one. Make sure that the passwords in this file match the passwords from the `cluster2-secrets` Secrets object. Check the [Export the database secrets](dr-primary.md#export-the-database-secrets) section to refresh your memory how to find the required Secrets object.

    Edit the `pxcsecret.yaml` file and change the name of the cluster to `cluster1`. 

	```yaml
	apiVersion: v1
	kind: Secret
	metadata:
	  name: cluster1-secrets  # The name of the cluster to-be-installed
	type: Opaque
	stringData:
	  monitor: <monitor-password>  # Decoded passwords here
	  operator: <operator-password>
	  proxyadmin: <proxyadmin-password>
	  replication: <replication-password>
	  root: <root-password>
	  xtrabackup: <xtrabackup-password>
	```

4. Create the Secrets object:

	```{.bash data-prompt="$" }
	$ kubectl apply -f path/to/pxcsecret.yaml -n <namespace>
	```

5. Install Percona XtraDB Cluster with the `cluster1` name and the default parameters:

    ```{.bash data-prompt="$"}
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{release}}/deploy/cr.yaml -n <namespace>
    ```

6. Check the status of the cluster:

	```{.bash data-prompt="$" }
	$ kubectl get pxc -n <namespace>
	```

	??? example "Expected output"

		```{.text .no-copy}
		NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
		cluster1   cluster1-haproxy.<namespace>   ready    3                3         3m
		```

## Make a backup on the current primary site

1. Make a backup on the current primary `cluster2`. See the [Create a backup from the primary site](dr-primary.md#create-a-backup-from-the-primary-site) section for the steps.

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME      CLUSTER    STORAGE      DESTINATION                                               STATUS      COMPLETED   AGE
        backup1   cluster2   s3-us-west   s3://mybucket/cluster2-2025-03-21-12:05:37-full   Succeeded   2m55s       6m6s
		```

## Restore the backup on a new database cluster

1. Restore the backup from `cluster2` on `cluster1`. Change the `deploy/backup/restore.yaml` file as follows:

    * Change the `pxcCluster` name to `cluster1`. This is where you make the restore.
	* Change the `backupSource.destination` to the location of the backup on the backup storage. Run the `kubectl get pxc-backup -n <namespace>` on `cluster2` (the current primary) to check the destination.

	```yaml
	apiVersion: pxc.percona.com/v1
	kind: PerconaXtraDBClusterRestore
	metadata:
	  name: restore1
	spec:
	  pxcCluster: cluster1
	  backupSource:
		destination: s3://mybucket/cluster2-2025-03-21-12:05:37-full
		s3:
		  bucket: mybucket
		  credentialsSecret: my-cluster-name-backup-s3
		  region: us-west-2
	```

2. Start the restore with the following command:

    ```{.bash data-prompt="$" }
	$ kubectl apply -f deploy/backup/restore.yaml -n <namespace>
	```

3. Check the status of the cluster:

	```{.bash data-prompt="$" }
	$ kubectl get pxc -n <namespace>
	```

    The cluster should report the Ready status.

## Promote the new database cluster as the primary 

The newly deployed site with `cluster1` is now the working copy of the current primary `cluster2`. It's time to configure it back as the primary site.

To do this, configure the replication channels on both sites. Refer to the [Configure replication between the sites](dr-replication.md) section for the steps.

