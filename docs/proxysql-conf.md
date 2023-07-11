# Configuring Load Balancing with ProxySQL

Percona Operator for MySQL based on Percona XtraDB Cluster provides a choice of two cluster components to
provide load balancing and proxy service: you can use either [HAProxy](https://haproxy.org) or [ProxySQL](https://proxysql.com/).
You can choose which one to use, if any, by enabling or disabling via the
`haproxy.enabled` and `proxysql.enabled` options in the `deploy/cr.yaml`
configuration file.

!!! warning 

    You can enable ProxySQL only at cluster creation time. Otherwise you will be
    able to use HAProxy only, and the switch from HAProxy to ProxySQL is not
    possible.

The resulting setup will use the number zero Percona XtraDB Cluster member
(`cluster1-pxc-0` by default) as writer.

!!! note

    <a name="headless-service"> If you need to configure ProxySQL service as a
    [headless Service](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services)
    (e.g. to use on the tenant network), add the following [annotation](annotations.md)
    in the Custom Resource metadata section of the `deploy/cr.yaml`:

     ```yaml
    apiVersion: pxc.percona.com/v1
    kind: PerconaXtraDBCluster
    metadata:
      name: cluster1
      annotations:
        percona.com/headless-service: true
      ...
    ```

    This annotation works only at service creation time and can't be added later.

When a cluster with ProxySQL is upgraded, the following steps
take place. First, reader members are upgraded one by one: the Operator waits
until the upgraded member shows up in ProxySQL with online status, and then
proceeds to upgrade the next member. When the upgrade is finished for all
the readers, then the writer Percona XtraDB Cluster member is finally upgraded.

!!! note

    when both ProxySQL and Percona XtraDB Cluster are upgraded, they are
    upgraded in parallel.

## Passing custom configuration options to ProxySQL

You can pass custom configuration to ProxySQL

* edit the `deploy/cr.yaml` file,

* use a ConfigMap,

* use a Secret object.

!!! note

    If you specify a custom ProxySQL configuration in this way, ProxySQL
    will try to merge the passed parameters with the previously set
    configuration parameters, if any. If ProxySQL fails to merge some option,
    you will see a warning in its log.

### Edit the `deploy/cr.yaml` file

You can add options from the [proxysql.cnf](https://proxysql.com/documentation/configuring-proxysql/) configuration file by editing the `proxysql.configuration` key in the `deploy/cr.yaml` file.
Here is an example:

```yaml
...
proxysql:
  enabled: false
  size: 3
  image: percona/percona-xtradb-cluster-operator:{{ release }}-proxysql
  configuration: |
    datadir="/var/lib/proxysql"

    admin_variables =
    {
      admin_credentials="proxyadmin:admin_password"
      mysql_ifaces="0.0.0.0:6032"
      refresh_interval=2000

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

You can use a configmap and the cluster restart to reset configuration
options. A configmap allows Kubernetes to pass or update configuration
data inside a containerized application.

Use the `kubectl` command to create the configmap from external
resources, for more information see [Configure a Pod to use a
ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#create-a-configmap).

For example, you define a `proxysql.cnf` configuration file with the following
setting:

```default
datadir="/var/lib/proxysql"

admin_variables =
{
  admin_credentials="proxyadmin:admin_password"
  mysql_ifaces="0.0.0.0:6032"
  refresh_interval=2000

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

You can create a configmap from the `proxysql.cnf` file with the
`kubectl create configmap` command.

You should use the combination of the cluster name with the `-proxysql`
suffix as the naming convention for the configmap. To find the cluster
name, you can use the following command:

``` {.bash data-prompt="$" }
$ kubectl get pxc
```

The syntax for `kubectl create configmap` command is:

```default
$ kubectl create configmap <cluster-name>-proxysql <resource-type=resource-name>
```

The following example defines `cluster1-proxysql` as the configmap name and
the `proxysql.cnf` file as the data source:

``` {.bash data-prompt="$" }
$ kubectl create configmap cluster1-proxysql --from-file=proxysql.cnf
```

To view the created configmap, use the following command:

``` {.bash data-prompt="$" }
$ kubectl describe configmaps cluster1-proxysql
```

### Use a Secret Object

The Operator can also store configuration options in [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/).
This can be useful if you need additional protection for some sensitive data.

You should create a Secret object with a specific name, composed of your cluster
name and the `proxysql` suffix.

!!! note

    To find the cluster name, you can use the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl get pxc
    ```

Configuration options should be put inside a specific key inside of the `data`
section. The name of this key is `proxysql.cnf` for ProxySQL Pods.

Actual options should be encoded with [Base64](https://en.wikipedia.org/wiki/Base64).

For example, let’s define a `proxysql.cnf` configuration file and put there
options we used in the previous example:

```default
datadir="/var/lib/proxysql"

admin_variables =
{
  admin_credentials="proxyadmin:admin_password"
  mysql_ifaces="0.0.0.0:6032"
  refresh_interval=2000

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

You can get a Base64 encoded string from your options via the command line as
follows:

=== "in Linux"

    ``` {.bash data-prompt="$" }
    $ cat proxysql.cnf | base64 --wrap=0
    ```

=== "in macOS"

    ``` {.bash data-prompt="$" }
    $ cat proxysql.cnf | base64
    ```

!!! note

    Similarly, you can read the list of options from a Base64 encoded
    string:

    ``` {.bash data-prompt="$" }
    $ echo "ZGF0YWRpcj0iL3Zhci9saWIvcHJveHlzcWwiCgphZG1pbl92YXJpYWJsZXMgPQp7CiBhZG1pbl9j\
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
      bF9wMnNfY2lwaGVyPSJFQ0RIRS1SU0EtQUVTMTI4LUdDTS1TSEEyNTYiCn0K" | base64 --decode
    ```

Finally, use a yaml file to create the Secret object. For example, you can
create a `deploy/my-proxysql-secret.yaml` file with the following contents:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cluster1-proxysql
data:
  my.cnf: "ZGF0YWRpcj0iL3Zhci9saWIvcHJveHlzcWwiCgphZG1pbl92YXJpYWJsZXMgPQp7CiBhZG1pbl9j\
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

When ready, apply it with the following command:

``` {.bash data-prompt="$" }
$ kubectl create -f deploy/my-proxysql-secret.yaml
```

!!! note

    Do not forget to restart Percona XtraDB Cluster to ensure the
    cluster has updated the configuration.

## Accessing the ProxySQL Admin Interface

You can use [ProxySQL admin interface](https://www.percona.com/blog/2017/06/07/proxysql-admin-interface-not-typical-mysql-server/) to  configure its settings.

Configuring ProxySQL in this way means connecting to it using the MySQL
protocol, and two things are needed to do it:

* the ProxySQL Pod name

* the ProxySQL admin password

You can find out ProxySQL Pod name with the `kubectl get pods` command,
which will have the following output:

```default
$ kubectl get pods
NAME                                              READY   STATUS    RESTARTS   AGE
cluster1-pxc-node-0                               1/1     Running   0          5m
cluster1-pxc-node-1                               1/1     Running   0          4m
cluster1-pxc-node-2                               1/1     Running   0          2m
cluster1-proxysql-0                               1/1     Running   0          5m
percona-xtradb-cluster-operator-dc67778fd-qtspz   1/1     Running   0          6m
```

The next command will print you the needed admin password:

```default
$ kubectl get secrets $(kubectl get pxc -o jsonpath='{.items[].spec.seretsName}') -o template='{{'{{'}} .data.proxyadmin | base64decode {{'}}'}}'
```

When both Pod name and admin password are known, connect to the ProxySQL as
follows, substituting `cluster1-proxysql-0` with the actual Pod name and
`admin_password` with the actual password:

```default
$ kubectl exec -it cluster1-proxysql-0 -- mysql -h127.0.0.1 -P6032 -uproxyadmin -padmin_password
```
