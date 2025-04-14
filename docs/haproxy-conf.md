# Configuring Load Balancing with HAProxy

You can use either [HAProxy :octicons-link-external-16:](https://haproxy.org) or [ProxySQL :octicons-link-external-16:](https://proxysql.com/) for load balancing and proxy services.

You can control which one to use, if any, by enabling or disabling via the
`haproxy.enabled` and `proxysql.enabled` options in the `deploy/cr.yaml`
configuration file.

Use the following command to enable HAProxy:

``` {.bash data-prompt="$" }
$ kubectl patch pxc cluster1 --type=merge --patch '{
  "spec": {
     "haproxy": {
        "enabled": true,
        "size": 3,
        "image": "percona/percona-xtradb-cluster-operator:{{ release }}-haproxy" },
     "proxysql": { "enabled": false }
  }}'
```

!!! warning

    Switching from ProxySQL to HAProxy will cause Percona XtraDB Cluster Pods
    restart. Switching from HAProxy to ProxySQL is not possible, and if you need
    ProxySQL, this should be configured at cluster creation time.

## HAProxy services

The Operator creates two services for HAProxy:

### `cluster1-haproxy` service 

The `cluster1-haproxy` service listens on the following ports:

* `3306` is the default MySQL port. It is used by the mysql client, MySQL Connectors, and utilities such as mysqldump and mysqlpump

* `3309` is the [proxy protocol :octicons-link-external-16:](https://www.haproxy.com/blog/haproxy/proxy-protocol/) port. Proxy protocol is used to store the client's IP address

* `33062` is the port to connect to the MySQL Administrative Interface

* `33060` is the port for the [MySQLX protocol :octicons-link-external-16:](https://dev.mysql.com/doc/dev/mysql-server/8.4.3/PAGE_PROTOCOL.html). It is supported by clients such as MySQL Shell, MySQL Connectors and MySQL Router

* `8404` is the port to connect to the [HAProxy statistics page :octicons-link-external-16:](https://www.haproxy.com/blog/exploring-the-haproxy-stats-page)

   The [haproxy.enabled](operator.md#haproxyexposeprimaryenabled)
    Custom Resource option enables or disables `cluster1-haproxy` service.

By default, the `cluster1-haproxy` service points to the number zero Percona XtraDB Cluster member (`cluster1-pxc-0`), when this member is available. If a zero member is not available, members are selected in descending order of their
numbers: `cluster1-pxc-2`, then `cluster1-pxc-1`. This service
can be used for both read and write load, or it can also be used just for
write load (single writer mode) in setups with split write and read loads.

The [haproxy.exposePrimary.enabled](operator.md#haproxyexposeprimaryenabled)
Custom Resource option enables or disables the `cluster1-haproxy` service.

### `cluster1-haproxy-replicas` service

The `cluster1-haproxy-replicas` service listens on port 3306 (MySQL).
    
This service selects Percona XtraDB Cluster members to serve queries following
the Round Robin load balancing algorithm.

**Don't use it for write requests**.

The [haproxy.exposeReplicas.enabled](operator.md#haproxyexposereplicasenabled)
Custom Resource option enables or disables `cluster1-haproxy-replicas`   service (on by default).

!!! note

    <a name="headless-service"> If you need to configure `cluster1-haproxy` and
    `cluster1-haproxy-replicas` as a [headless Service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services)
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

When the cluster with HAProxy is upgraded, the following steps
take place. First, reader members are upgraded one by one: the Operator waits
until the upgraded Percona XtraDB Cluster member becomes synced, and then
proceeds to upgrade the next member. When the upgrade is finished for all
the readers, then the writer Percona XtraDB Cluster member is finally upgraded.

## Exposing HAProxy

You can expose HAProxy, so that clients can connect to your database cluster from the outside. To do so, you need to set the service type `LoadBalancer` for the `haproxy-primary` service. 

By default, the HAProxy is available for all clients. If you need to restrict the client IP addresses from which the load balancer should be reachable, list these IP addresses in the `loadBalancerSourceRanges` option. 

Edit the `deploy/cr.yaml` Custom Resource manifest and specify the following configuration:

```yaml
spec:
  haproxy:
    exposePrimary:
      type: LoadBalancer
      loadBalancerSourceRanges:
        - 10.0.0.0/8
```

Note that the `haproxy-replica` service inherits this setup. You can override it for the `haproxy-replica` service by setting the IP ranges to access the cluster for read requests. The configuration for the `haproxy-replica` service will be as follows:

```yaml
spec:
  haproxy:
    enabled: true
    exposeReplicas:
      enabled: true
      type: LoadBalancer
```

## Passing custom configuration options to HAProxy

You can pass custom configuration to HAProxy in one of the following ways:

* edit the `deploy/cr.yaml` file,
* use a ConfigMap,
* use a Secret object.

!!! note

    If you specify a custom HAProxy configuration in this way, the
    Operator doesn’t provide its own HAProxy configuration file except [several hardcoded options :octicons-link-external-16:](https://github.com/percona/percona-docker/blob/pxc-operator-{{ release }}/haproxy/dockerdir/etc/haproxy/haproxy.cfg) (which therefore can't be overwritten). That’s why you
    should specify either a full set of configuration options or nothing.
    Additionally, when [upgrading Percona XtraDB Cluster](update.md#upgrading-percona-xtradb-cluster)
    it would be wise to check the
    [HAProxy configuration file :octicons-link-external-16:](https://github.com/percona/percona-docker/blob/pxc-operator-{{ release }}/haproxy/dockerdir/etc/haproxy/haproxy-global.cfg)
    provided by the Operator and make sure that your custom config is still
    compatible with the new variant.

### Edit the `deploy/cr.yaml` file

You can add options from the [haproxy.cfg :octicons-link-external-16:](https://www.haproxy.com/blog/the-four-essential-sections-of-an-haproxy-configuration/)
configuration file by editing  `haproxy.configuration` key in the
`deploy/cr.yaml` file. Here is an example:

```yaml
...
haproxy:
    enabled: true
    size: 3
    image: percona/percona-xtradb-cluster-operator:{{ release }}-haproxy
    configuration: |
      global
        maxconn 2048
        external-check
        stats socket /var/run/haproxy.sock mode 600 expose-fd listeners level user
      defaults
        log global
        mode tcp
        retries 10
        timeout client 10000
        timeout connect 100500
        timeout server 10000
      frontend galera-in
        bind *:3309 accept-proxy
        bind *:3306
        mode tcp
        option clitcpka
        default_backend galera-nodes

      frontend galera-admin-in
        bind *:33062
        mode tcp
        option clitcpka
        default_backend galera-admin-nodes

      frontend galera-replica-in
        bind *:3307
        mode tcp
        option clitcpka
        default_backend galera-replica-nodes

      frontend galera-mysqlx-in
        bind *:33060
        mode tcp
        option clitcpka
        default_backend galera-mysqlx-nodes

      frontend stats
        bind *:8404
        mode http
        http-request use-service prometheus-exporter if { path /metrics }
```

### Use a ConfigMap

You can use a configmap and the cluster restart to reset configuration
options. A configmap allows Kubernetes to pass or update configuration
data inside a containerized application.

Use the `kubectl` command to create the configmap from external
resources, for more information see [Configure a Pod to use a
ConfigMap :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#create-a-configmap).

For example, you define a `haproxy.cfg` configuration file with the following
setting:

--8<-- "haproxy-config.txt"

You can create a configmap from the `haproxy.cfg` file with the
`kubectl create configmap` command.

You should use the combination of the cluster name with the `-haproxy`
suffix as the naming convention for the configmap. To find the cluster
name, you can use the following command:

``` {.bash data-prompt="$" }
$ kubectl get pxc
```

The syntax for `kubectl create configmap` command is:

```default
kubectl create configmap <cluster-name>-haproxy <resource-type=resource-name>
```

The following example defines `cluster1-haproxy` as the configmap name and
the `haproxy.cfg` file as the data source:

``` {.bash data-prompt="$" }
$ kubectl create configmap cluster1-haproxy --from-file=haproxy.cfg
```

To view the created configmap, use the following command:

``` {.bash data-prompt="$" }
$ kubectl describe configmaps cluster1-haproxy
```

### Use a Secret Object

The Operator can also store configuration options in [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/).
This can be useful if you need additional protection for some sensitive data.

You should create a Secret object with a specific name, composed of your cluster
name and the `haproxy` suffix.

!!! note

    To find the cluster name, you can use the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl get pxc
    ```

Configuration options should be put inside a specific key inside of the `data`
section. The name of this key is `haproxy.cfg` for ProxySQL Pods.

Actual options should be encoded with [Base64 :octicons-link-external-16:](https://en.wikipedia.org/wiki/Base64).

For example, let’s define a `haproxy.cfg` configuration file and put there
options we used in the previous example:

--8<-- "haproxy-config.txt"

You can get a Base64 encoded string from your options via the command line as
follows:

=== "in Linux"

    ``` {.bash data-prompt="$" }
    $ cat haproxy.cfg | base64 --wrap=0
    ```

=== "in macOS"

    ``` {.bash data-prompt="$" }
    $ cat haproxy.cfg | base64
    ```

!!! note

    Similarly, you can read the list of options from a Base64 encoded string:

    ``` {.bash data-prompt="$" }
    $ echo "IGdsb2JhbAogICBtYXhjb25uIDIwNDgKICAgZXh0ZXJuYWwtY2hlY2sKICAgc3RhdHMgc29ja2V0\
      IC92YXIvcnVuL2hhcHJveHkuc29jayBtb2RlIDYwMCBleHBvc2UtZmQgbGlzdGVuZXJzIGxldmVs\
      IHVzZXIKIGRlZmF1bHRzCiAgIGxvZyBnbG9iYWwKICAgbW9kZSB0Y3AKICAgcmV0cmllcyAxMAog\
      ICB0aW1lb3V0IGNsaWVudCAxMDAwMAogICB0aW1lb3V0IGNvbm5lY3QgMTAwNTAwCiAgIHRpbWVv\
      dXQgc2VydmVyIDEwMDAwCiBmcm9udGVuZCBnYWxlcmEtaW4KICAgYmluZCAqOjMzMDkgYWNjZXB0\
      LXByb3h5CiAgIGJpbmQgKjozMzA2CiAgIG1vZGUgdGNwCiAgIG9wdGlvbiBjbGl0Y3BrYQogICBk\
      ZWZhdWx0X2JhY2tlbmQgZ2FsZXJhLW5vZGVzCiBmcm9udGVuZCBnYWxlcmEtcmVwbGljYS1pbgog\
      ICBiaW5kICo6MzMwOSBhY2NlcHQtcHJveHkKICAgYmluZCAqOjMzMDcKICAgbW9kZSB0Y3AKICAg\
      b3B0aW9uIGNsaXRjcGthCiAgIGRlZmF1bHRfYmFja2VuZCBnYWxlcmEtcmVwbGljYS1ub2Rlcwo=" | base64 --decode
    ```

Finally, use a yaml file to create the Secret object. For example, you can
create a `deploy/my-haproxy-secret.yaml` file with the following contents:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cluster1-haproxy
data:
  haproxy.cfg: "IGdsb2JhbAogICBtYXhjb25uIDIwNDgKICAgZXh0ZXJuYWwtY2hlY2sKICAgc3RhdHMgc29ja2V0\
     IC92YXIvcnVuL2hhcHJveHkuc29jayBtb2RlIDYwMCBleHBvc2UtZmQgbGlzdGVuZXJzIGxldmVs\
     IHVzZXIKIGRlZmF1bHRzCiAgIGxvZyBnbG9iYWwKICAgbW9kZSB0Y3AKICAgcmV0cmllcyAxMAog\
     ICB0aW1lb3V0IGNsaWVudCAxMDAwMAogICB0aW1lb3V0IGNvbm5lY3QgMTAwNTAwCiAgIHRpbWVv\
     dXQgc2VydmVyIDEwMDAwCiBmcm9udGVuZCBnYWxlcmEtaW4KICAgYmluZCAqOjMzMDkgYWNjZXB0\
     LXByb3h5CiAgIGJpbmQgKjozMzA2CiAgIG1vZGUgdGNwCiAgIG9wdGlvbiBjbGl0Y3BrYQogICBk\
     ZWZhdWx0X2JhY2tlbmQgZ2FsZXJhLW5vZGVzCiBmcm9udGVuZCBnYWxlcmEtcmVwbGljYS1pbgog\
     ICBiaW5kICo6MzMwOSBhY2NlcHQtcHJveHkKICAgYmluZCAqOjMzMDcKICAgbW9kZSB0Y3AKICAg\
     b3B0aW9uIGNsaXRjcGthCiAgIGRlZmF1bHRfYmFja2VuZCBnYWxlcmEtcmVwbGljYS1ub2Rlcwo="
```

When ready, apply it with the following command:

``` {.bash data-prompt="$" }
$ kubectl create -f deploy/my-haproxy-secret.yaml
```

!!! note

    Do not forget to restart Percona XtraDB Cluster to ensure the
    cluster has updated the configuration.

## Enabling the Proxy protocol

The Proxy protocol [allows :octicons-link-external-16:](https://docs.percona.com/percona-server/innovation-release/proxy-protocol-support.html)
HAProxy to provide a real client address to Percona XtraDB Cluster.

!!! note

    To use this feature, you should have a Percona XtraDB Cluster image
    version `8.0.21` or newer.

Normally Proxy protocol is disabled, and Percona XtraDB Cluster sees the IP
address of the proxying server (HAProxy) instead of the real client address.
But there are scenarios when making real client IP-address visible for Percona
XtraDB Cluster is important: e.g. it allows to have privilege grants based on
client/application address, and significantly enhance auditing.

You can enable Proxy protocol on Percona XtraDB Cluster by adding
[proxy_protocol_networks :octicons-link-external-16:](https://docs.percona.com/percona-server/innovation-release/proxy-protocol-support.html#proxy_protocol_networks)
option to [pxc.configuration](operator.md#pxcconfiguration) key in the `deploy/cr.yaml` configuration
file.

!!! note

    Depending on the load balancer of your cloud provider, you may also
    need setting [haproxy.externaltrafficpolicy](operator.md#haproxyexternaltrafficpolicy) option in `deploy/cr.yaml`.

More information about Proxy protocol can be found in the [official HAProxy documentation :octicons-link-external-16:](https://www.haproxy.com/blog/using-haproxy-with-the-proxy-protocol-to-better-secure-your-database/).
