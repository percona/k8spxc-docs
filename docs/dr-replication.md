# Configure replication between the sites

The sites must have the same copy of data. To do so, configure the replication between them so that sites are always in sync. The replication is defined via a replication channel where you specify which site is the source of data and which site receives it.

## Prepare the primary site

Your replica site needs to connect to your primary site to replicate data from it. For this, each database Pod on the primary site must have an external IP addresses to be reached directly. This is done by exposing the database cluster Pods using the LoadBalancer service type. Read more about [exposing a cluster](expose.md#service-per-pod).

1. Since the primary site is already running, we will patch its configuration with the following command. Replace the `<namespace>` placeholder with your namespace:

     ```bash
     kubectl patch pxc cluster1 -n <namespace> --type=merge --patch '{
       "spec": {
       "pxc": {
         "expose": {
           "enabled": true,
           "type": "LoadBalancer"
         }
       }}}'
     ```

2. Configure the replication channel on the primary site. Specify the following Custom Resource options in the `spec.pxc.replicationChannels` subsection in the `deploy/cr.yaml` file:

     * `pxc.replicationChannels.[].name` is the name of the channel,
     * `pxc.replicationChannels.[].isSource` defines what cluster the data is replicated from. Set the value to `true`.

     Run the following command to add this configuration:

     ```{.json data-prompt="$" }
     $ kubectl patch pxc cluster1 --type=merge --patch '{
       "spec": {
         "pxc": {
           "replicationChannels": [
             {
               "name": "pxc1_to_pxc2",
               "isSource": true
             }
           ]
         }
       }}'
     ```

3. Check that the Pods are exposed by listing the services:

    ```bash
	  kubectl get services -n <namespace>
  	```  

  	??? example "Expected output"  

  		```{.text .no-copy}
  		NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP      PORT(S)
  		cluster1-pxc-0                    LoadBalancer   34.118.227.242   104.197.82.173   3306:32522/TCP                          7m5s
  		cluster1-pxc-1                    LoadBalancer   34.118.236.108   34.44.97.95      3306:32361/TCP                          7m5s
  		cluster1-pxc-2                    LoadBalancer   34.118.236.170   35.222.208.249   3306:31607/TCP
  		```

	Store the public IP addresses of your Pods. You will need them during the replica site setup.

## Prepare the replica site

Configure the replication channel on the replica site. Specify the following Custom Resource options in the `spec.pxc.replicationChannels` subsection in the `deploy/cr.yaml` file:

* `spec.pxc.replicationChannels` - The replication channel configuration. The name of the channel must match the name on the primary site. 
* `spec.pxc.replicationChannels[].isSource` - Set the value to `false` to indicate that the replica site is not the source of the data.
* `spec.pxc.replicationChannels[].sourcesList` - The list of sources. Specify the external IP addresses of the database Pods from the primary site. 

Run the following command to apply a patch to the replica site's configuration with the required information. Don't forget to replace the `<placeholders>` with your values:

```bash
kubectl patch pxc cluster1 -n <namespace> --type=merge --patch '{
"spec": {
  "pxc": {
    "replicationChannels": [
      {
        "name": "pxc1_to_pxc2",
        "isSource": false,
        "sourcesList": [
          { "host": "34.118.227.242", "port": 3306, "weight": 100 },
          { "host": "34.118.227.242", "port": 3306, "weight": 100 },
          { "host": "34.118.227.242", "port": 3306, "weight": 100 }
        ]
      }
    ]
  }
}}'
```

## Verify the replication

To verify that the replication is working, do the following:

1. [Connect to Percona XtraDB Cluster](connect.md) on the primary site.

2. Create a database and a table.

    ```{sql data-prompt="mysql> "}
    mysql> CREATE DATABASE demo;
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        Query OK, 1 row affected (0.02 sec)
        ```

    ```{sql data-prompt="mysql> "}
    mysql> CREATE TABLE demo.users(user_id INT PRIMARY KEY, user_name VARCHAR(30));
    ```
    
    ??? example "Expected output"

        ```{.text .no-copy}
        Query OK, 0 rows affected (0.03 sec)
        ```

3. Insert some data into the database:

    ```{sql data-prompt="mysql> "}
    mysql> INSERT INTO demo.users VALUES (1, 'percona');
    ```

4. [Connect to Percona XtraDB Cluster](connect.md) on the replica site.

5. Retrieve the data from the database:

    ```{sql data-prompt="mysql> "}
    mysql> SELECT * FROM demo.users;
    ```
    
    ??? example "Expected output"

        ```{.text .no-copy}
        +---------+-----------+
        | user_id | user_name |
        +---------+-----------+
        |       1 | percona   |
        +---------+-----------+
        1 row in set (0.00 sec)
        ```


