# How to use backups to move the external database to Kubernetes

The Operator enables you to restore a database from a backup made outside of Kubernetes environment to the target Kubernetes cluster using [Percona XtraBackup](https://docs.percona.com/percona-xtrabackup/8.0/index.html). In such a way you can migrate your external database to Kubernetes. Using [asyncronous replication](https://docs.percona.com/percona-operator-for-mysql/pxc/replication.html) between source and target environments enables you to reduce downtime and prevent data loss for your application.

This document provides the steps how to migrate Percona Server for MySQL 8.0.23 deployed on premises to the Kubernetes cluster managed by the Operator using [asyncronous replication](https://docs.percona.com/percona-operator-for-mysql/pxc/replication.html). We recommend testing this migration in a non-production environment first, before applying it in production.

## Requirements

1. The MySQL version for source and target environments must be 8.0.22 and higher since asyncronous replication is available starting with MySQL version 8.0.22. 
2. You must be running [Percona XtraBackup](https://docs.percona.com/percona-xtrabackup/8.0/index.html) as the backup tool on source environment. For how to install Percona XtraBackup, see the [installation instructions](https://docs.percona.com/percona-xtrabackup/8.0/installation.html)
3. The storage used to save the backup is one of the supported storages: AWS S3 storage or Azure Blob Storage


## Configure target environment

1. [Deploy Percona Operator for MySQL based on Percona XtraDB Cluster](index.md#quickstart-guides). The following example illustrates [the deployment on Google Kubernetes Engine 1.20](gke.md):

   * Clone the repository

      ```{.bash data-prompt="$"}
      $ git clone -b v1.9.0 https://github.com/percona/percona-xtradb-cluster-operator
      $ cd percona-xtradb-cluster-operator
      ```

   * Deploy the Operator

      ```{.bash data-prompt="$"}
      $ kubectl apply -f deploy/bundle.yaml
      ```

2. Create Percona XtraDB Cluster using the default custom resource manifest (CR).

   * Create the cluster's secret

      ```{.bash data-prompt="$"}
      $ kubectl apply -f deploy/secrets.yaml
      ```

   * Create the cluster. By default, the Operator deploys the latest version cluster.

      ```{.bash data-prompt="$"}
      $ kubectl apply -f deploy/cr.yaml
      ```

      **TIP**: you can find the version in the `pxc.image` parameter of the `cr.yaml` file and change it to the desired one, if needed. 

3. Create the secrets file with the credentials for accessing the storage. The following is the example of the `S3-secret.yaml` file for AWS S3 bucket which will be used for access to the S3 bucket during the restoration procedure. 

    Replace `XXXX` placeholders with your actual values.

    ```yaml title="S3-secret.yaml"
    apiVersion: v1
    kind: Secret
    metadata:
      name: aws-s3-secret
    type: Opaque
    data:
      AWS_ACCESS_KEY_ID: XXXXXX
      AWS_SECRET_ACCESS_KEY: XXXXXX
    ```

4. Apply the changes

    ```{.bash data-prompt="$"}
    $ kubectl apply -f S3-secret.yaml
    ```

## Prepare the source environment

If you are already running Percona Sever for MySQL and Percona XtraBackuo in a testing environment, skip the installation and proceed to the configuration steps. 

If you are setting up the testing environment, do the following:

1. [Install Percona Server for MySQL](https://docs.percona.com/percona-server/8.0/quickstart-overview.html#install-percona-server-for-mysql)
2. [Install Percona XtraBackup](https://docs.percona.com/percona-xtrabackup/8.0/installation.html)
3. Configure the replication with Global Transaction Identifiers (GTID). This step is required if you are running Percona Sever for MySQL. If you run Percona XtraDB cluster, replication is already configured.

    Edit the `my.cnf` configuration file as follows: 

    ```ini
    [mysqld]
    enforce_gtid_consistency=ON
    gtid_mode=ON
    ```

4. Create all the required users for the Operator to use during the restore. Note that the user passwords must match the ones you specified in the `deploy/secrets.yaml` file. The following commands create users with the default passwords from the `deploy/secrets.yaml` file. Replace them with your values

    ```sql
    CREATE USER 'monitor'@'%' IDENTIFIED BY 'monitory' WITH MAX_USER_CONNECTIONS 100;
    GRANT SELECT, PROCESS, SUPER, REPLICATION CLIENT, RELOAD ON *.* TO 'monitor'@'%';
    GRANT SERVICE_CONNECTION_ADMIN ON *.* TO 'monitor'@'%';
     
    CREATE USER 'operator'@'%' IDENTIFIED BY 'operatoradmin';
    GRANT ALL ON *.* TO 'operator'@'%' WITH GRANT OPTION;
     
    CREATE USER 'xtrabackup'@'%' IDENTIFIED BY 'backup_password';
    GRANT ALL ON *.* TO 'xtrabackup'@'%';
     
    CREATE USER 'replication'@'%' IDENTIFIED BY 'repl_password';
    GRANT REPLICATION SLAVE ON *.* to 'replication'@'%';
    FLUSH PRIVILEGES;
    ```

## Make a backup

1. Export the storage credentials. Since we are using AWS S3 bucket, the command shows how to export AWS S3 credentials. Replace the ```XXXX``` placeholders with your values:

    ```{.bash data-prompt="$"}
    $ export AWS_ACCESS_KEY_ID=XXXXXX
    $ export AWS_SECRET_ACCESS_KEY=XXXXXX
    ```

2. Make the backup of your database and upload it to the storage using [xbcloud](https://docs.percona.com/percona-xtrabackup/8.0/xbcloud-binary-overview.html?h=xbcloud). Replace the values for the `--target-dir`, `--password`, `--s3-bucket` with your values in the following command:

    ```{.bash data-prompt="$"}
    $ xtrabackup --backup --stream=xbstream --target-dir=/tmp/backups/ --extra-lsndirk=/tmp/backups/  --password=root_password | xbcloud put --storage=s3 --parallel=10 --md5 --s3-bucket="mysql-testing-bucket" "db-test-1"
    ```

## Restore from a backup

If your source database didn't have any data, skip this step and proceed with the [asyncronous replication configuration](#configure-asyncronous-replication-in-the-kubernetes-cluster). Otherwise, restore the database in the target environment.

1. Create the `restore.yaml` file with the following contents:

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
          credentialsSecret: aws-s3-secret
          region: us-east-1
    ```

    Replace the path to the backup and the credentials with your values

2. Restore from the backup
    
    ```{.bash data-prompt="$"}
    $ kubectl apply -f restore.yml
    ```

## Configure asyncronous replication in the Kubernetes cluster

To avoid data loss for your application, configure the asyncronous replication between the source database and target cluster.

1. Edit custom resource manifest `deploy/cr.yaml` to configure the `spec.pxc.replicationChannels` section.

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

2. Apply the changes

    ```{.bash data-prompt="$"}
    $ kubectl apply -f deploy/cr.yaml
    ```

3. Verify the replication by connecting to a PXC node in the cluetr and running the following command:

    ```{.bash data-prompt="$"}
    $ kubectl exec -it cluster1-pxc-0 -c pxc -- mysql -uroot -proot_password -e "show replica status \G"
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

After you reconfigured your application to work with the new PXC cluster in Kubernetes, you can promote this cluster as primary.

1. Stop the replication. Edit the `deploy/cr.yaml` resource manifest and comment the `replicationChannels` section

    ``` yaml title='cr.yaml'
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

2. Stop the mysql service on the source environment to make sure no new data is written

    ```{.bash data-prompt="$"}
    $ sudo systemctl stop mysqld
    ```

3. Apply the changes to the Kubernetes cluster

    ```{.bash data-prompt="$"}
    $ kubectl apply -f deploy/cr.yaml
    ```

As a result, replication is stopped and the read-only mode is disabled for the PXC cluster.

!!! admonition ""

    This document is based on the blog post [Migration of a MySQL Database to a Kubernetes Cluster Using Asynchronous Replication](https://www.percona.com/blog/migration-of-a-mysql-database-to-a-kubernetes-cluster-using-asynchronous-replication/) by *Slava Sarzhan*.  