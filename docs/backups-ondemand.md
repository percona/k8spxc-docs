# Make on-demand backup

## Before you begin

1. Export the namespace as an environment variable. Replace the `<namespace>` placeholder with your value:

    ```bash
    export NAMESPACE=<namespace>
    ```

2. Check the configuration of the `PerconaXtraDBCluster` Custom Resource. Verify that you have [configured backup storage](backups-storage.md) and specified its configuration in the `backup.storages` subsection of the Custom Resource.

## Backup steps

To make an on-demand backup, use
*a special backup configuration YAML file*. The example of such file is
[deploy/backup/backup.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/backup.yaml)

1. Specify the following keys

    * Set the `metadata.name` key to assign a name to the backup. You will use it to make a [restore](backups-restore.md)
    * Set the `spec.pxcCluster` key to the name of your cluster
    * Set the `spec.storageName` key to a storage configuration defined in your `deploy/cr.yaml` file.
    * Optionally, add the `percona.com/delete-backup` entry under `metadata.finalizers` to enable deletion of backup files from a backup storage when the backup object is removed (manually or by schedule).

    Here's the example configuration:

    ```yaml
    apiVersion: pxc.percona.com/v1
    kind: PerconaXtraDBClusterBackup
    metadata:
      finalizers:
        - percona.com/delete-backup
      name: backup1
    spec:
      pxcCluster: cluster1
      storageName: fs-pvc
    ```

2. Start the backup process:

    ```bash
    kubectl apply -f deploy/backup/backup.yaml -n $NAMESPACE
    ```

3. Track the backup process by checking the status of the Backup object:

    ```bash
    kubectl get pxc-backup -n $NAMESPACE -w
    ```

    The `-w` flag instructs the Operator to provide real-time updates about the backup progress. The `Succeeded` status indicates that a backup is completed. 

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME      CLUSTER    STORAGE   DESTINATION                              STATUS     COMPLETED   AGE
        backup1   cluster1   fs-pvc    pvc/xb-backup1-20251201102237-8f7b3390   Succeeded   3s          76s
        ```

4. View detailed information about the backup using the `kubectl describe` command:
    
    ```bash
    kubectl describe pxc-backup -n $NAMESPACE 
    ```

    The `Status` section of the output provides useful details about the backup state, the error message in case of issues with the backup, and the storage details.

    ??? example "Sample output"

        ```{.text .no-copy}
        Name:         backup1
        Namespace:    <my-namespace>
        Labels:       <none>
        Annotations:  <none>
        API Version:  pxc.percona.com/v1
        Kind:         PerconaXtraDBClusterBackup
        Metadata:
          Creation Timestamp:  2025-12-01T10:22:37Z
          Generation:          1
          Resource Version:    1764584633525183013
          UID:                 8f7b3390-fa7a-4c37-85f2-9037c093589f
        Spec:
          Pxc Cluster:   cluster1
          Storage Name:  fs-pvc
        Status:
          Completed:    2025-12-01T10:23:50Z
          Destination:  pvc/xb-backup1-20251201102237-8f7b3390
          Image:        perconalab/percona-xtradb-cluster-operator:main-pxc8.0-backup
          Pvc:
            Access Modes:
              ReadWriteOnce
            Resources:
              Requests:
                Storage:             6G
            Storage Class Name:      standard-rwo
            Volume Mode:             Filesystem
            Volume Name:             pvc-5238d6db-f40a-4608-8f8e-d0d74f328de9
        ```
