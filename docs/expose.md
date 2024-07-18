# Exposing cluster

Percona Operator for MySQL based on Percona XtraDB Cluster provides entry points for accessing the database by client
applications in several scenarios. In either way the cluster is exposed with
regular Kubernetes [Service objects](https://kubernetes.io/docs/concepts/services-networking/service/),
configured by the Operator.

This document describes the usage of [Custom Resource manifest options](operator.md#operator-custom-resource-options)
to expose the clusters deployed with the Operator.

### Exposing cluster with HAProxy or ProxySQL

The Operator provides a choice of two cluster components to
provide load balancing and proxy service: you can use either [HAProxy](https://haproxy.org) or [ProxySQL](https://proxysql.com/).

![image](assets/images/replication.svg)


Load balancing and proxy service with [HAProxy](https://haproxy.org) is the
default choice.

* See [how you can enable and use HAProxy and what are the limitations](haproxy-conf.md).
* See [how you can enable and use ProxySQL and what are the limitations](proxysql-conf.md).

=== "HAProxy"

    The default HAProxy based setup will contain the `cluster1-haproxy` Service
    listening on ports 3306 (MySQL primary) and 3309 (the
    [proxy protocol](https://www.haproxy.com/blog/haproxy/proxy-protocol/) useful
    for operations such as asynchronous calls), and also `cluster1-haproxy-replicas`
    Service for MySQL replicas, listening on port 3306 (this Service
    **should not be used for write requests**).

    You can find the endpoint (the public IP address of the load balancer in our
    example) by getting the Service object with the `kubectl get service` command.
    The output will be as follows:

    ```{.bash data-prompt="$"}
    $ kubectl get service cluster1-haproxy
    NAME                        TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)                                                         AGE
    cluster1-haproxy            LoadBalancer   10.12.23.173   <pending>     3306:32548/TCP,3309:30787/TCP,33062:32347/TCP,33060:31867/TCP   14s
    cluster1-haproxy-replicas   LoadBalancer   10.12.25.208   <pending>     3306:32166/TCP                                                  14s
    ```

    You can control creation of these two Services with the following Custom
    Resource options:

    * [haproxy.exposePrimary.enabled](operator.md#haproxy-exposePrimary-enabled)
        enables or disables `cluster1-haproxy` Service,
    * [haproxy.exposeReplicas.enabled](operator.md#haproxy-exposeReplicas-enabled)
        enables or disables `haproxy-replicas` Service.

=== "ProxySQL"

    If you configured your cluster with ProxySQL based setup, you will have 
    `cluster1-proxysql` Service.
    You can find the endpoint (the public IP address of the load balancer in our
    example) by getting the Service object with the `kubectl get service` command.
    The output will be as follows:

    ```{.bash data-prompt="$"}
    $ kubectl get service cluster1-proxysql
    NAME                     TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)                        AGE
    cluster1-proxysql        LoadBalancer   10.0.238.36    35.192.172.85   3306:30408/TCP,33062:30217/TCP   115s
    ```

    As you could notice, this command also shows mapped ports the application 
    can use to communicate with MySQL primary instance (`3306` for the classic
    MySQL protocol).

    You can enable or disable this Service with the
    [proxysql.expose.enabled](operator.md#proxysql-expose-enabled) Custom
    Resource option.

## Service per Pod

Still, sometimes it is required to expose all Percona XtraDB Cluster instances,
where each of them gets its own IP address (e.g. in case of load balancing
implemented on the application level).

![image](assets/images/exposure-all.svg)

This is possible by setting the following options in [spec.mysql section](operator.md#operator-mysql-section).

* [pxc.expose.enabled](operator.md#pxc-expose-enabled) enables or disables exposure
    of Percona XtraDB Cluster instances,
* [pxc.expose.type](operator.md#pxc-expose-type) defines the Kubernetes Service
    object type.

The following example creates a dedicated LoadBalancer Service for each node of
the MySQL cluster:

```yaml
pxc:
  expose:
    enabled: true
    type: LoadBalancer
```

When the cluster instances are exposed in this way, you can find the
corresponding Services with the `kubectl get services` command:

```{.bash data-prompt="$"}
$ kubectl get services
NAME                              TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)                                 AGE
...
cluster1-pxc-0                    LoadBalancer   10.120.15.23    34.132.93.114   3306:30771/TCP                          111s
cluster1-pxc-1                    LoadBalancer   10.120.8.132    35.188.39.15    3306:30832/TCP                          111s
cluster1-pxc-2                    LoadBalancer   10.120.14.65    34.16.25.126    3306:32018/TCP                          111s
```

As you could notice, this command also shows mapped ports the application can
use to communicate with MySQL instances (e.g. `3306` for the classic MySQL
protocol, or `33060` for [MySQL X Protocol](https://dev.mysql.com/doc/dev/mysql-server/latest/page_mysqlx_protocol.html)
useful for operations such as asynchronous calls).

