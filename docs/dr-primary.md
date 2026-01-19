# Set up the primary site

## Before you start

Clone the repository with all manifests and source code. You'll need it to edit configuration files for the database clusters, Secrets, backups and restores. Run the following command:

```{.bash data-prompt="$" }
$ git clone -b v{{ release }} https://github.com/percona/percona-xtradb-cluster-operator
```

Make sure to clone the correct branch. The branch name is the same as the Operator release version. 

## Install the Operator and PXC

1. Create a namespace.  

    ```{.bash data-prompt="$" }
	$ kubectl create namespace <namespace>
	```

2. Use the [Quickstart guide](kubectl.md) to install the Operator and Percona XtraDB Cluster. 

    You now have the `cluster1` database cluster up and running.


## Export the database secrets (for Operator 1.17.0 and earlier)

While on the primary site, export the Secrets object with the user credentials. Both the primary and the replica sites must have the same user credentials. This enables the Operator to restore the backup from the primary on the replica site.

1. List the Secrets objects. 

	```{.bash data-prompt="$" }
	$ kubectl get secrets -n <namespace>
	```

    ??? example "Expected output"

        ```{.text .no-copy}
        cluster1-secrets        Opaque              6      5m43s
        cluster1-ssl            kubernetes.io/tls   3      5m42s
        cluster1-ssl-internal   kubernetes.io/tls   3      5m40s
        internal-cluster1       Opaque              6      5m43s
        ```

    The file we are interested in is called `cluster1-secrets` where `cluster1` is the name of your cluster.

2. Export the database cluster's Secret file. You'll need it later to set up the replica site. The replica must have the same users as the primary site to replicate data from it. The following command exports the `cluster1-secrets` Secret to a `pxcsecret.yaml` file. Feel free to use your name and namespace:
    
    ```{.bash data-prompt="$" }
	$ kubectl get secret cluster1-secrets -n <namespace> -o yaml > pxcsecret.yaml
	```

3. Edit the exported `pxcsecret.yaml` file: remove the `annotations`, `creationTimestamp`, `resourceVersion`, `selfLink`, and `uid` metadata fields.  


## Create a backup from the primary site

We will use this backup to deploy the replica site.

1. Configure the backup storage. Use either the Amazon S3 / S3-compatible storage, or the Azure Blob Storage. Persistent Volumes are specific to a namespace, meaning only Pods in the same namespace can access them.  

    Use the [Configure storage for backups tutorial](backups-storage.md) for the steps.

2. [Make an on-demand backup](backup-tutorial.md#make-a-physical-backup) on the primary site.
3. View the information about a backup:

    ```{.bash data-prompt="$" }
    $ kubectl get pxc-backup -n <namespace>
    ```

    ??? example "Expected output"

		```{.text .no-copy}
		NAME      CLUSTER    STORAGE      DESTINATION                                               STATUS      COMPLETED   AGE
		backup1   cluster1   s3-us-west   s3://mybucket/cluster1-2025-03-18-10:55:43-full   Succeeded   3m25s       4m4s
		```
