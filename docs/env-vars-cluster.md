# Define environment variables for cluster components

Cluster component environment variables let you customize the behavior of Percona XtraDB Cluster, HAProxy, and ProxySQL. These variables are stored in Kubernetes Secrets and referenced in your Custom Resource configuration. Below you'll find practical examples and steps for configuration.

## Configure HAProxy environment variables

The following environment variables are available for HAProxy:

* `HA_CONNECTION_TIMEOUT`: Sets the timeout (in milliseconds) for HAProxy health checks on XtraDB Cluster nodes. The default is 10000 milliseconds (10 seconds), but you can increase this value for unstable Kubernetes networking or if you experience soft lockups on nodes.

* `OK_IF_DONOR`: Allows applications to connect to XtraDB Cluster donor nodes (nodes running backups). Enable if only one node is available and a second node is joining the cluster via SST.

* `HA_SERVER_OPTIONS`: Provides [custom options :octicons-link-external-16:](https://docs.haproxy.org/2.6/configuration.html#5) for servers in the HAProxy configuration file. The default is `check inter 30000 rise 1 fall 5 weight 1`. You can add or adjust options as described in the [HAProxy documentation :octicons-link-external-16:](https://docs.haproxy.org/2.6/configuration.html#5.2).

* `PEER_LIST_SRV_PROTOCOL`: The protocol (TCP or UDP) for the Operator to use for peer-list SRV lookups. TCP is useful in large clusters with many nodes where peer-list SRV lookup returns large DNS responses or when DNS over UDP is blocked by network policies. You can configure the protocol for both HAProxy and ProxySQL.

### Encode environment variable values

All environment variable values must be base64-encoded in the Secret's `data` section.

To encode a value, run this command:

=== "On Linux"

    ```bash
    echo -n "1000" | base64 --wrap=0
    ```

=== "On macOS"

    ```bash
    echo -n "1000" | base64
    ```

To verify or decode an encoded value:

```bash
echo "MTAwMA==" | base64 --decode
1000
```

### Create a Secret

Create a Kubernetes Secret with your encoded environment variables. Here's an example Secret manifest:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-env-var-secrets
type: Opaque
data:
  HA_CONNECTION_TIMEOUT: MTAwMA==
  OK_IF_DONOR: MQ==
  HA_SERVER_OPTIONS: Y2hlY2sgaW50ZXIgMzAwMDAgcmlzZSAxIGZhbGwgNSB3ZWlnaHQgMQ==
  PEER_LIST_SRV_PROTOCOL: dGNw
```

Save this manifest to a file (for example, `deploy/my-env-secret.yaml`) and create the Secret:

```bash
kubectl create -f deploy/my-env-secret.yaml
```

### Apply the configuration

1. Add the Secret name to your cluster configuration. Edit the `deploy/cr.yaml` file and add the `envVarsSecret` key to the `haproxy` section:

    ```yaml
    haproxy:
      envVarsSecret: my-env-var-secrets
    ```

2. Apply the updated configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

## Configure alternative memory allocator

You can use an alternative memory allocator library for `mysqld` to optimize memory usage. This is often recommended when memory usage is higher than expected.

The Percona XtraDB Cluster Pods include the jemalloc allocator. You can enable it with the `LD_PRELOAD` environment variable.

### Encode the LD_PRELOAD value

The value for `LD_PRELOAD` is `/usr/lib64/libjemalloc.so.1`. Encode it using base64:

=== "On Linux"

    ```bash
    echo -n "/usr/lib64/libjemalloc.so.1" | base64 --wrap=0
    ```

=== "On macOS"

    ```bash
    echo -n "/usr/lib64/libjemalloc.so.1" | base64
    ```

### Create the memory allocator Secret

Create a Kubernetes Secret with the encoded value:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-new-env-var-secrets
type: Opaque
data:
  LD_PRELOAD: L3Vzci9saWI2NC9saWJqZW1hbGxvYy5zby4x
```

Save this manifest to a file (for example, `deploy/my-new-env-var-secret.yaml`) and create the Secret:

```bash
kubectl create -f deploy/my-new-env-var-secret.yaml
```

### Apply the memory allocator configuration

1. Add the Secret to the PXC section in your `deploy/cr.yaml` file:

    ```yaml
    pxc:
      envVarsSecret: my-new-env-var-secrets
    ```

2. Apply the updated configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

