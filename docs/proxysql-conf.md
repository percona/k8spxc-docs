# Configuring load balancing with ProxySQL

You can use either [HAProxy :octicons-link-external-16:](https://haproxy.org) or [ProxySQL :octicons-link-external-16:](https://proxysql.com/) for load balancing and proxy services. Control which one to use via the `haproxy.enabled` and `proxysql.enabled` options in the `deploy/cr.yaml` configuration file.

!!! warning

    You can enable ProxySQL only during cluster creation. For existing clusters, you can enable only HAProxy. If HAProxy is already enabled, you cannot switch to ProxySQL later.

## `cluster1-proxysql` service

The `cluster1-proxysql` service listens on the following ports:

* `3306` is the default MySQL port. It is used by the mysql client, MySQL Connectors, and utilities such as mysqldump and mysqlpump
* `33062` is the port to connect to the MySQL Administrative Interface
* `6070` is the port to connect to the built-in Prometheus exporter to gather ProxySQL statistics and manage the ProxySQL observability stack

The `cluster1-proxysql` service uses the first Percona XtraDB Cluster member (`cluster1-pxc-0` by default) as the writer. Use the [proxysql.expose.enabled](operator.md#proxysqlexposeenabled) Custom Resource option to enable or disable this service.

### Headless ProxySQL service

You may want to configure the ProxySQL service as a [headless Service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services). For example, if you have applications that need direct DNS access to individual ProxySQL pods, such as when running in a multi-tenant setup or when handling advanced networking scenarios. 

To enable a headless ProxySQL service, add the `percona.com/headless-service: true` [annotation](annotations.md) in the Custom Resource metadata section of the `deploy/cr.yaml` file. Note that this annotation takes effect only at service creation time, so you need to set it when first creating the cluster.

```yaml
apiVersion: pxc.percona.com/v1
kind: PerconaXtraDBCluster
metadata:
  name: cluster1
  annotations:
    percona.com/headless-service: true
  ...
```

### Upgrade behavior

During cluster upgrades with ProxySQL, the Operator upgrades reader members one by one, waiting for each to show as online in ProxySQL before proceeding. After all readers are upgraded, the writer member is upgraded last. When both ProxySQL and Percona XtraDB Cluster are upgraded, they are upgraded in parallel.

## Passing custom configuration options to ProxySQL

You can pass custom configuration to ProxySQL in these ways:

* by editing the `deploy/cr.yaml` file, 
* by using a ConfigMap, 
* by using a Secret object. 

ProxySQL attempts to merge custom configuration with existing settings. If merging fails for any option, ProxySQL logs a warning.

### Edit the `deploy/cr.yaml` file

Add options from the [proxysql.cnf :octicons-link-external-16:](https://proxysql.com/documentation/configuring-proxysql/) configuration file by editing the `proxysql.configuration` key in `deploy/cr.yaml`. 

Here is an example:

```yaml
...
proxysql:
  enabled: true
  size: 3
  image: percona/percona-xtradb-cluster-operator:{{ release }}-proxysql
  configuration: |
    datadir="/var/lib/proxysql"

    admin_variables =
    {
      admin_credentials="proxyadmin:admin_password"
      mysql_ifaces="0.0.0.0:6032"
      refresh_interval=2000
      restapi_enabled=true
      restapi_port=6070

      cluster_username="proxyadmin"
      cluster_password="admin_password"
      cluster_check_interval_ms=200
      cluster_check_status_frequency=100
      cluster_mysql_query_rules_save_to_disk=true
      cluster_mysql_servers_save_to_disk=true
      cluster_mysql_users_save_to_disk=true
      cluster_proxysql_servers_save_to_disk=true
      cluster_mysql_query_rules_diffs_before_sync=1
      cluster_mysql_servers_diffs_before_sync=1
      cluster_mysql_users_diffs_before_sync=1
      cluster_proxysql_servers_diffs_before_sync=1
    }

    mysql_variables=
    {
      monitor_password="monitor"
      monitor_galera_healthcheck_interval=1000
      threads=2
      max_connections=2048
      default_query_delay=0
      default_query_timeout=10000
      poll_timeout=2000
      interfaces="0.0.0.0:3306"
      default_schema="information_schema"
      stacksize=1048576
      connect_timeout_server=10000
      monitor_history=60000
      monitor_connect_interval=20000
      monitor_ping_interval=10000
      ping_timeout_server=200
      commands_stats=true
      sessions_sort=true
      have_ssl=true
      ssl_p2s_ca="/etc/proxysql/ssl-internal/ca.crt"
      ssl_p2s_cert="/etc/proxysql/ssl-internal/tls.crt"
      ssl_p2s_key="/etc/proxysql/ssl-internal/tls.key"
      ssl_p2s_cipher="ECDHE-RSA-AES128-GCM-SHA256"
    }
```

### Use a ConfigMap

A configmap allows Kubernetes to pass or update configuration
data inside a containerized application. When you apply a ConfigMap, the cluster restarts.

See [Configure a Pod to use a
ConfigMap :octicons-link-external-16:](<https://kubernetes.io/docs/>
tasks/configure-pod-container/configure-pod-configmap/#create-a-configmap) for information how to create a ConfigMap.


Here's the example configuration.

1. Create a `proxysql.cnf` configuration file:

    --8<-- "proxysql-config.txt"

2. Find your cluster name:

    ``` {.bash data-prompt="$" }
    $ kubectl get pxc
    ```

3. Create the ConfigMap using the cluster name with the `-proxysql` suffix:

    ``` {.bash data-prompt="$" }
    $ kubectl create configmap cluster1-proxysql --from-file=proxysql.cnf
    ```

4. Verify the ConfigMap:

    ``` {.bash data-prompt="$" }
    $ kubectl describe configmaps cluster1-proxysql
    ```

### Use a Secret object

Store configuration options in [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) for additional protection of sensitive data.

The Secret name must be composed of your cluster
name and the `proxysql` suffix.

1. Find your cluster name:

    ``` {.bash data-prompt="$" }
    $ kubectl get pxc
    ```

2. Create a `proxysql.cnf` configuration file with your options:

    --8<-- "proxysql-config.txt"

3. Encode the configuration file with [Base64 :octicons-link-external-16:](https://en.wikipedia.org/wiki/Base64):

    === "in Linux"

        ``` {.bash data-prompt="$" }
        $ cat proxysql.cnf | base64 --wrap=0
        ```

    === "in macOS"

        ``` {.bash data-prompt="$" }
        $ cat proxysql.cnf | base64
        ```

4. Create a Secret object with a name composed of your cluster name and the `proxysql` suffix. Put the Base64-encoded configuration in the `data` section under the `proxysql.cnf` key. Example `deploy/my-proxysql-secret.yaml`:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
        name: cluster1-proxysql
    data:
        proxysql.cnf: "ZGF0YWRpcj0iL3Zhci9saWIvcHJveHlzcWwiCgphZG1pbl92YXJpYWJsZXMgPQp7CiBhZG1pbl9j\
         cmVkZW50aWFscz0icHJveHlhZG1pbjphZG1pbl9wYXNzd29yZCIKIG15c3FsX2lmYWNlcz0iMC4w\
         LjAuMDo2MDMyIgogcmVmcmVzaF9pbnRlcnZhbD0yMDAwCgogY2x1c3Rlcl91c2VybmFtZT0icHJv\
         eHlhZG1pbiIKIGNsdXN0ZXJfcGFzc3dvcmQ9ImFkbWluX3Bhc3N3b3JkIgogY2x1c3Rlcl9jaGVj\
         a19pbnRlcnZhbF9tcz0yMDAKIGNsdXN0ZXJfY2hlY2tfc3RhdHVzX2ZyZXF1ZW5jeT0xMDAKIGNs\
         dXN0ZXJfbXlzcWxfcXVlcnlfcnVsZXNfc2F2ZV90b19kaXNrPXRydWUKIGNsdXN0ZXJfbXlzcWxf\
         c2VydmVyc19zYXZlX3RvX2Rpc2s9dHJ1ZQogY2x1c3Rlcl9teXNxbF91c2Vyc19zYXZlX3RvX2Rp\
         c2s9dHJ1ZQogY2x1c3Rlcl9wcm94eXNxbF9zZXJ2ZXJzX3NhdmVfdG9fZGlzaz10cnVlCiBjbHVz\
         dGVyX215c3FsX3F1ZXJ5X3J1bGVzX2RpZmZzX2JlZm9yZV9zeW5jPTEKIGNsdXN0ZXJfbXlzcWxf\
         c2VydmVyc19kaWZmc19iZWZvcmVfc3luYz0xCiBjbHVzdGVyX215c3FsX3VzZXJzX2RpZmZzX2Jl\
         Zm9yZV9zeW5jPTEKIGNsdXN0ZXJfcHJveHlzcWxfc2VydmVyc19kaWZmc19iZWZvcmVfc3luYz0x\
         Cn0KCm15c3FsX3ZhcmlhYmxlcz0KewogbW9uaXRvcl9wYXNzd29yZD0ibW9uaXRvciIKIG1vbml0\
         b3JfZ2FsZXJhX2hlYWx0aGNoZWNrX2ludGVydmFsPTEwMDAKIHRocmVhZHM9MgogbWF4X2Nvbm5l\
         Y3Rpb25zPTIwNDgKIGRlZmF1bHRfcXVlcnlfZGVsYXk9MAogZGVmYXVsdF9xdWVyeV90aW1lb3V0\
         PTEwMDAwCiBwb2xsX3RpbWVvdXQ9MjAwMAogaW50ZXJmYWNlcz0iMC4wLjAuMDozMzA2IgogZGVm\
         YXVsdF9zY2hlbWE9ImluZm9ybWF0aW9uX3NjaGVtYSIKIHN0YWNrc2l6ZT0xMDQ4NTc2CiBjb25u\
         ZWN0X3RpbWVvdXRfc2VydmVyPTEwMDAwCiBtb25pdG9yX2hpc3Rvcnk9NjAwMDAKIG1vbml0b3Jf\
         Y29ubmVjdF9pbnRlcnZhbD0yMDAwMAogbW9uaXRvcl9waW5nX2ludGVydmFsPTEwMDAwCiBwaW5n\
         X3RpbWVvdXRfc2VydmVyPTIwMAogY29tbWFuZHNfc3RhdHM9dHJ1ZQogc2Vzc2lvbnNfc29ydD10\
         cnVlCiBoYXZlX3NzbD10cnVlCiBzc2xfcDJzX2NhPSIvZXRjL3Byb3h5c3FsL3NzbC1pbnRlcm5h\
         bC9jYS5jcnQiCiBzc2xfcDJzX2NlcnQ9Ii9ldGMvcHJveHlzcWwvc3NsLWludGVybmFsL3Rscy5j\
         cnQiCiBzc2xfcDJzX2tleT0iL2V0Yy9wcm94eXNxbC9zc2wtaW50ZXJuYWwvdGxzLmtleSIKIHNz\
         bF9wMnNfY2lwaGVyPSJFQ0RIRS1SU0EtQUVTMTI4LUdDTS1TSEEyNTYiCn0K"
    ```

5. Apply the Secret:

    ``` {.bash data-prompt="$" }
    $ kubectl create -f deploy/my-proxysql-secret.yaml
    ```

6. Restart Percona XtraDB Cluster to apply the configuration changes.

## Accessing the ProxySQL Admin Interface

Use the [ProxySQL admin interface :octicons-link-external-16:](https://www.percona.com/blog/2017/06/07/proxysql-admin-interface-not-typical-mysql-server/) to configure ProxySQL settings by connecting via the MySQL protocol.

1. Find the ProxySQL Pod name:

    ``` {.bash data-prompt="$" }
    $ kubectl get pods
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME                                              READY   STATUS    
        RESTARTS   AGE
        cluster1-pxc-node-0                               1/1     Running
        0          5m
        cluster1-pxc-node-1                               1/1     Running
        0          4m
        cluster1-pxc-node-2                               1/1     Running
        0          2m
        cluster1-proxysql-0                               1/1     Running
        0          5m
        percona-xtradb-cluster-operator-dc67778fd-qtspz   1/1     Running
        0          6m
        ```

2. Get the admin password:

    ``` {.bash data-prompt="$" }
    $ kubectl get secrets $(kubectl get pxc -o jsonpath='{.items[].spec.secretsName}') -o template='{{'{{'}} .data.proxyadmin | base64decode {{'}}'}}'
    ```

3. Connect to ProxySQL. Replace `cluster1-proxysql-0` with your Pod name and `admin_password` with the retrieved password:

    ``` {.bash data-prompt="$" }
    $ kubectl exec -it cluster1-proxysql-0 -- mysql -h127.0.0.1 -P6032 -uproxyadmin -padmin_password
    ```

## ProxySQL scheduler

By default, the Operator uses the internal ProxySQL scheduler for load balancing. In some cases, this scheduler may not fully recognize the cluster topology, directing both read and write traffic to the primary Pod. This can reduce scalability and efficiency and may increase the risk of overload and downtime.

To address this limitation, the Operator is integrated with the [`pxc_scheduler_handler` :octicons-link-external-16:](https://docs.percona.com/proxysql/psh-overview.html) tool starting with version 1.19.0. This external ProxySQL scheduler ensures the read/write splitting is distributed as follows:

* **SELECT queries** (without `FOR UPDATE`) are sent evenly to all PXC nodes or to all nodes except the primary, depending on your configuration
* **Non-SELECT queries** and **SELECT FOR UPDATE** queries are sent to the primary node
* The scheduler automatically manages the primary node, ensuring only one primary exists at a time

As a result, you achieve:

* Better performance through faster query processing and increased throughput
* Higher reliability by preventing single-node bottlenecks and points of failure
* Healthier cluster through early detection of replication lag and node issues
* Efficient resource utilization
* Improved user experience with consistent, predictable response times

### Enable the scheduler

The scheduler is disabled by default to maintain backward compatibility. You can enable it by setting `proxysql.scheduler.enabled=true` in your Custom Resource.

1. Edit the `deploy/cr.yaml` file and add the scheduler configuration:

    ```yaml
    proxysql:
      enabled: true
      size: 3
      image: percona/percona-xtradb-cluster-operator:{{ release }}-proxysql
      scheduler:
        enabled: true
    ```

2. Apply the configuration:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

When the scheduler is enabled, you should see:

* **Hostgroup 10** (readers): All PXC nodes with equal or weighted distribution
* **Hostgroup 11** (writer): Only the current writer node (typically `pod-0`) with a high weight (1000000)

You can also test read load balancing by running multiple `SELECT` queries and checking which node they hit:

```{.bash data-prompt="$" }
$ for i in $(seq 100); do 
    kubectl exec -i cluster1-pxc-0 -c pxc -- mysql -uroot -proot_password \
      --host cluster1-proxysql -Ne "SELECT VARIABLE_VALUE FROM \
      performance_schema.global_variables WHERE VARIABLE_NAME = 'wsrep_node_name' LIMIT 1" \
      2>/dev/null
  done | sort -n | uniq -c
```

You should see queries distributed across multiple nodes instead of all going to `cluster1-pxc-0`.

## Scheduler behavior

After you enabled the scheduler, it works as follows:

* **Writer node**: The scheduler sets `pod-0` (the first PXC Pod) as the writer node by default. The scheduler ensures only one writer exists at any time. As long as `pod-0` is available, it remains the writer.

* **Failover**: If `pod-0` becomes unavailable, the scheduler automatically promotes another Pod to be the writer. The scheduler uses weighted hostgroups to ensure all ProxySQL instances promote the same Pod during failover, preventing split-brain scenarios.

* **ProxySQL clustering**: When the scheduler is enabled, ProxySQL clustering is automatically disabled. This is because the scheduler and ProxySQL clustering do not work well together. The `proxysql-monit` sidecar container is removed from ProxySQL Pods, and each ProxySQL instance manages its own `mysql_servers` configuration independently.

!!! warning

    When the scheduler is enabled, ProxySQL clustering is disabled. Each ProxySQL instance manages its own server configuration independently. This ensures proper read/write splitting but means ProxySQL instances do not share configuration.

By default, ProxySQL scheduler will distribute read requests evenly across all your cluster nodes. You can exclude the primary from processing reads and reserve it only for accepting write requests by setting the `writerIsAlsoReader` option to `false`.

You can additionally fine-tune the scheduler's behavior for your workload and deployment scenario. See the [Custom resource](operator.md#proxysqlschedulerenabled) reference for a complete list of available options.

