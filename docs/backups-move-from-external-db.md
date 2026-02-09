# How to use backups and asynchronous replication to move an external database to Kubernetes

The Operator enables you to restore a database from a backup made outside of Kubernetes environment to the target Kubernetes cluster using [Percona XtraBackup :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/8.0/index.html). In such a way you can migrate your external database to Kubernetes. Using [asynchronous replication :octicons-link-external-16:](replication.md) between source and target environments enables you to reduce downtime and prevent data loss for your application.

This document provides the steps how to migrate Percona Server for MySQL 8.0 deployed on premises to the Kubernetes cluster managed by the Operator using [asynchronous replication :octicons-link-external-16:](replication.md). We recommend testing this migration in a non-production environment first, before applying it in production.

## Requirements

1. The MySQL version for source and target environments must be 8.0.22 and higher since asynchronous replication is available starting with MySQL version 8.0.22. 
2. You must be running [Percona XtraBackup :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/8.0/index.html) as the backup tool on source environment. For how to install Percona XtraBackup, see the [installation instructions :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/8.0/installation.html)
3. The storage used to save the backup should be one of the [supported cloud storages](backups-storage.md): AWS S3 or compatible storage, or Azure Blob Storage.

## Configure target environment

1. Deploy Percona Operator for MySQL and use it to create Percona XtraDB Cluster
    following any of the [official installation guides](System-Requirements.md#installation-guidelines).
2. Create the YAML file with the credentials for accessing the storage, needed
    to create the [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/)
    object. As and example here, we will use Amazon S3 storage. You will need to
    create a Secret with the following data to store backups on the Amazon S3:

    * the `metadata.name` key is the name which you will further use to refer
        your Kubernetes Secret,
    * the `data.AWS_ACCESS_KEY_ID` and `data.AWS_SECRET_ACCESS_KEY` keys are
        base64-encoded credentials used to access the storage (obviously these
        keys should contain proper values to make the access possible).

    Create the Secrets file with these base64-encoded keys following the
    [deploy/backup-s3.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/backup-secret-s3.yaml)
    example:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-name-backup-s3
    type: Opaque
    data:
      AWS_ACCESS_KEY_ID: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
      AWS_SECRET_ACCESS_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
    ```

    !!! note

        You can use the following command to get a base64-encoded string from a plain text one:

        === "in Linux"

            ```bash
            echo -n 'plain-text-string' | base64 --wrap=0
            ```

        === "in macOS"

            ```bash
            echo -n 'plain-text-string' | base64
            ```

3. Once the editing is over, create the Kubernetes Secret object as follows:

    ```bash
    kubectl apply -f deploy/backup-s3.yaml
    ```

4. You will need passwords for the `monitor`, `operator`, `xtrabackup` and
    `replication` system users created by the Operator.
    Use `kubectl get secrets` command to see the list of Secrets objects (by
    default the Secrets object you are interested in has `cluster1-secrets`
    name). When you know the Secrets name, you can get password for a specific
    user as follows:

    ```bash
    kubectl get secrets cluster1-secrets --template='{{"{{"}}.data.<user_name> | base64decode{{"}}"}}{{"{{"}}"\n"{{"}}"}}'
    ```
    
    Repeat this command 4 times, substituting <user_name> with `monitor`,
    `operator`, `xtrabackup` and `replication`. You will further use these
    passwords when preparing the source environment.

## Prepare the source environment

1. Use official installation instructions for either [Percona Server for MySQL :octicons-link-external-16:](https://docs.percona.com/percona-server/8.0/quickstart-overview.html#install-percona-server-for-mysql) or [Percona XtraDB Cluster :octicons-link-external-16:](https://docs.percona.com/percona-xtradb-cluster/8.0/install/index.html)
    to have the database up and running in your source environment (skip this
    step if one of them is already installed).

2. Use official installation instructions for [Percona XtraBackup :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/8.0/installation.html)
    to have it up and running in your source environment (skip this step if it
    is already installed).

2. Configure the replication with Global Transaction Identifiers (GTID).
    This step is required if you are running Percona Sever for MySQL. If you run
    Percona XtraDB cluster, replication is already configured.

    Edit the `my.cnf` configuration file as follows: 

    ```ini
    [mysqld]
    enforce_gtid_consistency=ON
    gtid_mode=ON
    ```

4. Create the `monitor`, `operator`, `xtrabackup`, and `replication` system
    users which will be needed by the Operator to restore a backup. User
    passwords must match the ones you have found out in your target environment.
    
    Use the following commands to create users with the actual passwords instead
    of the `monitor_password`, `operator_password`, `xtrabackup_password`, and
    `replication_password` placeholders:

    ```sql
    CREATE USER 'monitor'@'%' IDENTIFIED BY 'monitor_password' WITH MAX_USER_CONNECTIONS 100;
    GRANT SELECT, PROCESS, SUPER, REPLICATION CLIENT, RELOAD ON *.* TO 'monitor'@'%';
    GRANT SERVICE_CONNECTION_ADMIN ON *.* TO 'monitor'@'%';
     
    CREATE USER 'operator'@'%' IDENTIFIED BY 'operator_password';
    GRANT ALL ON *.* TO 'operator'@'%' WITH GRANT OPTION;
     
    CREATE USER 'xtrabackup'@'%' IDENTIFIED BY 'xtrabackup_password';
    GRANT ALL ON *.* TO 'xtrabackup'@'%';
     
    CREATE USER 'replication'@'%' IDENTIFIED BY 'replication_password';
    GRANT REPLICATION SLAVE ON *.* to 'replication'@'%';
    FLUSH PRIVILEGES;
    ```

## Make a backup in the source environment

1. Export the storage credentials as environment variables. Following the above
    example, here is a command which shows how to export the AWS S3 credentials:

    ```bash
    export AWS_ACCESS_KEY_ID=XXXXXX
    export AWS_SECRET_ACCESS_KEY=XXXXXX
    ```

    Don't forget to replace the ```XXXX``` placeholders with your actual Amazon
    access key ID and secret access key values.

2. Make the backup of your database and upload it to the storage using [xbcloud :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/8.0/xbcloud-binary-overview.html?h=xbcloud). Replace the values for the `--target-dir`, `--password`, `--s3-bucket` with your values in the following command:

    ```bash
    xtrabackup --backup --stream=xbstream --target-dir=/tmp/backups/ --extra-lsndir=/tmp/backups/  --password=root_password | xbcloud put --storage=s3 --parallel=10 --md5 --s3-bucket="mysql-testing-bucket" "db-test-1"
    ```

## Restore from a backup in the target environment

If your source database didn't have any data, skip this step and proceed with the [asynchronous replication configuration](#configure-asynchronous-replication-in-the-kubernetes-cluster). Otherwise, restore the database in the target environment.

1. To restore a backup, you will use the special restore configuration file.
   The example of such file is [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/{{release}}/deploy/backup/restore.yaml).
   For example. your `restore.yaml` file may have the following contents:

    ```yaml title='restore.yaml'
    apiVersion: pxc.percona.com/v1
    kind: PerconaXtraDBClusterRestore
    metadata:
      name: restore1
    spec:
      pxcCluster: cluster1
      backupSource:
        destination: s3://mysql-testing-bucket/db-test-1
        s3:
          credentialsSecret: my-cluster-name-backup-s3
          region: us-west-2
    ```

    Don't forget to replace the path to the backup and the credentials with your
    values.

2. Restore from the backup:
    
    ```bash
    kubectl apply -f restore.yml
    ```

You can find more information on restoring backup to a new Kubernetes-based
environment and see more examples [in a dedicated HowTo](backups-restore-to-new-cluster.md).

## Configure asynchronous replication in the Kubernetes cluster

This step will allow you to avoid data loss for your application, configuring
the asynchronous replication between the source database and the target cluster.

1. Edit the Custom Resource manifest `deploy/cr.yaml` in your target environment
    to configure the `spec.pxc.replicationChannels` section.

    ```yaml title='cr.yaml'
    spec:
      ...
      pxc:
        ...
        replicationChannels:
        - name: ps_to_pxc1
          isSource: false
          sourcesList:
            - host: <source_ip>
              port: 3306
              weight: 100
    ```

    Apply the changes for your Custom Resource as usual:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

2. Verify the replication by connecting to a Percona XtraDB Cluster node. You
    can do it with `mysql` tool, and you will need the `root` system user
    password created by the Operator for this. The password can be obtained in
    a same way we used for other system users:

    ```bash
    kubectl get secrets cluster1-secrets -o yaml -o jsonpath='{.data.root}' | base64 --decode | tr '\n' ' ' && echo " "
    ```

    When you know the `root` password, you can use `kubectl` command as follows
    (substitute `root_password` with the actual password you have just obtained):

    ```bash
    kubectl exec -it cluster1-pxc-0 -c pxc -- mysql -uroot -proot_password -e "show replica status \G"
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        *************************** 1. row ***************************
                       Slave_IO_State: Waiting for master to send event
                          Master_Host: <ip-of-source-db>
                          Master_User: replication
                          Master_Port: 3306
                        Connect_Retry: 60
                      Master_Log_File: binlog.000004
                  Read_Master_Log_Pos: 529
                       Relay_Log_File: cluster1-pxc-0-relay-bin-ps_to_pxc1.000002
                        Relay_Log_Pos: 738
                Relay_Master_Log_File: binlog.000004
                     Slave_IO_Running: Yes
                    Slave_SQL_Running: Yes
                      Replicate_Do_DB:
                  Replicate_Ignore_DB:
                   Replicate_Do_Table:
               Replicate_Ignore_Table:
              Replicate_Wild_Do_Table:
          Replicate_Wild_Ignore_Table:
                           Last_Errno: 0
                           Last_Error:
                         Skip_Counter: 0
                  Exec_Master_Log_Pos: 529
                      Relay_Log_Space: 969
                      Until_Condition: None
                       Until_Log_File:
                        Until_Log_Pos: 0
                   Master_SSL_Allowed: No
                   Master_SSL_CA_File:
                   Master_SSL_CA_Path:
                      Master_SSL_Cert:
                    Master_SSL_Cipher:
                       Master_SSL_Key:
                Seconds_Behind_Master: 0
        Master_SSL_Verify_Server_Cert: No
                        Last_IO_Errno: 0
                        Last_IO_Error:
                       Last_SQL_Errno: 0
                       Last_SQL_Error:
          Replicate_Ignore_Server_Ids:
                     Master_Server_Id: 1
                          Master_UUID: 9741945e-148d-11ec-89e9-5ee1a3cf433f
                     Master_Info_File: mysql.slave_master_info
                            SQL_Delay: 0
                  SQL_Remaining_Delay: NULL
              Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
                   Master_Retry_Count: 3
                          Master_Bind:
              Last_IO_Error_Timestamp:
             Last_SQL_Error_Timestamp:
                       Master_SSL_Crl:
                   Master_SSL_Crlpath:
                   Retrieved_Gtid_Set: 9741945e-148d-11ec-89e9-5ee1a3cf433f:1-2
                    Executed_Gtid_Set: 93f1e7bf-1495-11ec-80b2-06e6016a7c3d:1,
        9647dc03-1495-11ec-a385-7e3b2511dacb:1-7,
        9741945e-148d-11ec-89e9-5ee1a3cf433f:1-2
                        Auto_Position: 1
                 Replicate_Rewrite_DB:
                         Channel_Name: ps_to_pxc1
                   Master_TLS_Version:
               Master_public_key_path:
                Get_master_public_key: 0
                    Network_Namespace:
        ```

## Promote the Kubernetes cluster as primary

After you reconfigured your application to work with the new Percona XtraDB
Cluster in Kubernetes, you can promote this cluster as primary.

1. Stop the replication. Edit the `deploy/cr.yaml` manifest and comment the
`replicationChannels` subsection:

    ``` yaml title='cr.yaml'
    ...
    spec:
      ...
      pxc:
        ...
        #replicationChannels:
        #- name: ps_to_pxc1
        #  isSource: false
        #  sourcesList:
        #    - host: <source_ip>
        #      port: 3306
        #      weight: 100
    ```

2. Stop the `mysqld` service in your source environment to make sure no new data
    is written:

    ```bash
    sudo systemctl stop mysqld
    ```

3. Apply the changes to the Kubernetes cluster in your target environment:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

As a result, replication is stopped and the read-only mode is disabled for the
Percona XtraDB Cluster.

!!! admonition ""

    This document is based on the blog post [Migration of a MySQL Database to a Kubernetes Cluster Using Asynchronous Replication :octicons-link-external-16:](https://www.percona.com/blog/migration-of-a-mysql-database-to-a-kubernetes-cluster-using-asynchronous-replication/) by *Slava Sarzhan*.
