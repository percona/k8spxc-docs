# Services and ports

The Operator creates Kubernetes Services so that applications reach the database through a proxy and the cluster components find each other. This page lists every Service, the ports it publishes, and when it exists.

The examples use a cluster named `cluster1`. Replace it with the name from `metadata.name` of your Custom Resource.

## Which Service to connect to

Applications connect to a proxy Service. Don't connect them to the database Pods or to the headless Services.

| You want to | HAProxy | ProxySQL |
| --- | --- | --- |
| Read and write | `cluster1-haproxy`, port 3306 | `cluster1-proxysql`, port 3306 |
| Read only | `cluster1-haproxy-replicas`, port 3306 | Use `cluster1-proxysql`. ProxySQL routes reads by its own rules, and there is no separate Service for reads |
| Reach one database node directly, for example for [cross-site replication](replication.md) | `cluster1-pxc-0`, `cluster1-pxc-1`, ... | The same |

For the full set of connection details, see [Connect to Percona XtraDB Cluster](connect.md).

## Client-facing Services

These Services are the entry points to the cluster. Their type is `ClusterIP` unless you change it in the Custom Resource.

| Service | Ports | Created when | Type and options set in |
| --- | --- | --- | --- |
| `cluster1-haproxy` | 3306 (MySQL), 3309 (MySQL with the proxy protocol), 33062 (admin), 33060 (MySQL X protocol), 8404 (HAProxy stats, starting with version 1.17.0) | HAProxy is enabled | [`haproxy.exposePrimary`](operator.md#haproxyexposeprimarytype) |
| `cluster1-haproxy-replicas` | 3306, forwarded to port 3307 in the HAProxy Pods | HAProxy is enabled and `haproxy.exposeReplicas.enabled` is `true`, the default | [`haproxy.exposeReplicas`](operator.md#haproxyexposereplicasenabled) |
| `cluster1-proxysql` | 3306 (MySQL), 33062 (admin), 6070 (ProxySQL stats, starting with version 1.17.0) | ProxySQL is enabled | [`proxysql.expose`](operator.md#proxysqlexposeenabled) |
| `cluster1-pxc-0`, `cluster1-pxc-1`, ... | 3306 | `pxc.expose.enabled` is `true`. The Operator doesn't create or update these Services while a backup or restore runs | [`pxc.expose`](operator.md#pxcexposeenabled) |

Each per-Pod Service selects one database Pod. The Operator removes them when you turn `pxc.expose.enabled` off or reduce the cluster size.

!!! warning "The admin port is published too"

    The HAProxy and ProxySQL Services publish the admin port 33062 next to 3306. If you change the Service type to `LoadBalancer`, the admin port becomes reachable from wherever the load balancer is. Limit access with `loadBalancerSourceRanges` for the Service you expose.

### Traffic and exposure options

The proxy Services accept the same set of standard Kubernetes options:

* `type`: `ClusterIP`, `NodePort` or `LoadBalancer`
* `annotations`, `labels`, and `loadBalancerSourceRanges`
* `externalTrafficPolicy` for `NodePort` and `LoadBalancer`, and `internalTrafficPolicy`
* `loadBalancerClass`, starting with version 1.18.0

The `percona.com/headless-service: "true"` annotation turns a `ClusterIP` Service into a headless one. For the per-Pod Services, the type, annotations and source ranges come from `pxc.expose`. Starting with version 1.14.0, the annotations and labels from `pxc.expose` also apply to the two headless database Services below.

See [Exposing the cluster](expose.md) for examples.

## Internal Services

These Services are for the Operator and the cluster's own components. Applications don't use them.

| Service | Type | Ports | Contains | Used by |
| --- | --- | --- | --- | --- |
| `cluster1-pxc` | Headless | 3306, 33062, 33060 | Ready database Pods only | The `pxc-monit` container in the proxy Pods to build the proxy configuration, the binlog collector to find nodes, and the Operator for its database connections |
| `cluster1-pxc-unready` | Headless, publishes addresses of Pods that are not ready | 3306, 33062, 33060 | All database Pods | The `pxc` container in the database Pods. It finds the other nodes through this Service when it starts and builds the Galera cluster address from them |
| `cluster1-proxysql-unready` | Headless, publishes addresses of Pods that are not ready | 3306, 6032 (ProxySQL admin), 33062 | All ProxySQL Pods | The `proxysql-monit` container, so that ProxySQL instances find each other and form a cluster. Not used when `proxysql.scheduler.enabled` is on, because the instances don't form a cluster then |
| `cluster1-pitr` | `ClusterIP` | 8080 (HTTP) | The binlog collector Pod | Created when point-in-time recovery is on. The collector serves Prometheus metrics at `/metrics`, a health check at `/health`, and a cache invalidation endpoint at `/invalidate-cache/` |

Two more Services exist outside the list above:

* The Operator's own webhook Service, `percona-xtradb-cluster-operator`, is shared by all clusters in the namespace and isn't created per cluster.
* A restore from a PVC creates a temporary Service for the duration of the restore.

## Ports in the Pods

The following ports are used inside the Pods in addition to those the Services publish:

| Port | Purpose | Container |
| --- | --- | --- |
| 3306 | MySQL | `pxc` |
| 33062 | MySQL admin interface. The Operator, the probes and the proxy health checks use it | `pxc` |
| 33060 | MySQL X protocol | `pxc` |
| 4567 | Galera replication | `pxc` |
| 4568 | Incremental State Transfer (IST) | `pxc` |
| 4444 | State Snapshot Transfer (SST) | `pxc` |
| 3307 | HAProxy listener for read traffic. The `cluster1-haproxy-replicas` Service forwards port 3306 to it | `haproxy` |

## See also

* [Design and architecture](architecture.md#how-clients-connect) for how a client request reaches the data
* [Exposing the cluster](expose.md) for how to publish the Services outside Kubernetes
* [Configure load balancing](load-balancing.md) for how HAProxy and ProxySQL differ
* [Objects the Operator creates](objects-created.md) for the rest of what the Operator creates
