> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Exposing cluster

Percona Operator for MySQL based on Percona XtraDB Cluster provides entry points for accessing the database by client applications in several scenarios. In either way the cluster is exposed with regular Kubernetes [Service objects](https://kubernetes.io/docs/concepts/services-networking/service/) , configured by the Operator.

This document describes the usage of [Custom Resource manifest options](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html) to expose the clusters deployed with the Operator.

To see which Service your application should connect to, and every Service the Operator creates with its ports, see [Services and ports](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/services.html).

### Exposing cluster with HAProxy or ProxySQL

The Operator provides a choice of two cluster components to provide load balancing and proxy service: you can use either [HAProxy](https://haproxy.org) or [ProxySQL](https://proxysql.com/) .

Load balancing and proxy service with [HAProxy](https://haproxy.org) is the default choice.

- See [how you can enable and use HAProxy and what are the limitations](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/haproxy-conf.html).
- See [how you can enable and use ProxySQL and what are the limitations](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/proxysql-conf.html).

**HAProxy**

The default HAProxy based setup will contain the `cluster1-haproxy` Service listening on ports 3306 (MySQL primary) and 3309 (the [proxy protocol](https://www.haproxy.com/blog/haproxy/proxy-protocol/) useful for operations such as asynchronous calls), and also `cluster1-haproxy-replicas` Service for MySQL replicas, listening on port 3306 (this Service **should not be used for write requests**).

You can find the endpoint (the public IP address of the load balancer in our example) by getting the Service object with the `kubectl get service` command. The output will be as follows:

```
kubectl get service cluster1-haproxy
NAME                        TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)                                                         AGE
cluster1-haproxy            LoadBalancer   10.12.23.173   <pending>     3306:32548/TCP,3309:30787/TCP,33062:32347/TCP,33060:31867/TCP   14s
cluster1-haproxy-replicas   LoadBalancer   10.12.25.208   <pending>     3306:32166/TCP                                                  14s
```

You can control creation of these two Services with the following Custom Resource options:

- [haproxy.exposePrimary.enabled](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#haproxyexposeprimaryenabled) enables or disables `cluster1-haproxy` Service,
- [haproxy.exposeReplicas.enabled](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#haproxyexposereplicasenabled) enables or disables `haproxy-replicas` Service.

By default `haproxy-replica` Service directs connections to all Pods of the database cluster in a round-robin manner, but `haproxy.exposeReplicas.onlyReaders` Custom Resource option allows to modify this behavior: setting it to `true` excludes current MySQL primary instance (writer) from the list, leaving only the reader instances. By default the option is set to `false`, which means that `haproxy-replicas` sends traffic to all Pods, including the active writer. The feature can be useful to simplify the application logic by splitting read and write MySQL traffic on the Kubernetes level.

Also, it should be noted that changing `haproxy.exposeReplicas.onlyReaders` value will cause HAProxy Pods to restart.

**ProxySQL**

If you configured your cluster with ProxySQL based setup, you will have `cluster1-proxysql` Service. You can find the endpoint (the public IP address of the load balancer in our example) by getting the Service object with the `kubectl get service` command. The output will be as follows:

```
kubectl get service cluster1-proxysql
NAME                     TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)                        AGE
cluster1-proxysql        LoadBalancer   10.0.238.36    35.192.172.85   3306:30408/TCP,33062:30217/TCP   115s
```

As you could notice, this command also shows mapped ports the application can use to communicate with MySQL primary instance (`3306` for the classic MySQL protocol).

You can enable or disable this Service with the [proxysql.expose.enabled](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#proxysqlexposeenabled) Custom Resource option.

## Service per Pod

Still, sometimes it is required to expose all Percona XtraDB Cluster instances, where each of them gets its own IP address (e.g. in case of load balancing implemented on the application level).

This is possible by setting the following options in [spec.pxc section](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#operator-pxc-section).

- [pxc.expose.enabled](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#pxcexposeenabled) enables or disables exposure of Percona XtraDB Cluster instances,
- [pxc.expose.type](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#pxcexposetype) defines the Kubernetes Service object type.

The following example creates a dedicated LoadBalancer Service for each node of the MySQL cluster:

```
pxc:
  expose:
    enabled: true
    type: LoadBalancer
```

When the cluster instances are exposed in this way, you can find the corresponding Services with the `kubectl get services` command:

```
kubectl get services
NAME                              TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)                                 AGE
...
cluster1-pxc-0                    LoadBalancer   10.120.15.23    34.132.93.114   3306:30771/TCP                          111s
cluster1-pxc-1                    LoadBalancer   10.120.8.132    35.188.39.15    3306:30832/TCP                          111s
cluster1-pxc-2                    LoadBalancer   10.120.14.65    34.16.25.126    3306:32018/TCP                          111s
```

As you could notice, this command also shows mapped ports the application can use to communicate with MySQL instances (e.g. `3306` for the classic MySQL protocol, or `33060` for [MySQL X Protocol](https://dev.mysql.com/doc/dev/mysql-server/latest/page_mysqlx_protocol.html) useful for operations such as asynchronous calls).
