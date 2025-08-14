# Configure environment variables

You can define custom environment variables to configure components in your Percona XtraDB Cluster. This is useful for customizing HAProxy settings, adding PMM Client options, or configuring other cluster components.

The Operator stores environment variables in [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/). You can then reference these Secrets in your cluster configuration.

## Configure HAProxy environment variables

This example shows how to set up environment variables for HAProxy configuration:

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

!!! note

    The variables in this example have the following effects:
    
    * `HA_CONNECTION_TIMEOUT` sets a custom timeout for HAProxy health checks. HAProxy repeatedly executes status queries on XtraDB Cluster instances. The default 10-second timeout works for most workloads, but you may need to increase it for unstable Kubernetes networks or when soft lockups occur on Kubernetes nodes.
    
    * `OK_IF_DONOR` allows application connections to XtraDB Cluster donor nodes. Donor nodes run backups, which can slow down SQL queries. Enable this option when only one XtraDB Cluster node is available and a second node is joining the cluster via SST.
    
    * `HA_SERVER_OPTIONS` sets [custom options :octicons-link-external-16:](https://docs.haproxy.org/2.6/configuration.html#5) for servers in the HAProxy configuration file. The default is `check inter 30000 rise 1 fall 5 weight 1`. You can add additional options [referenced in the HAProxy documentation :octicons-link-external-16:](https://docs.haproxy.org/2.6/configuration.html#5.2).
    
    * `PEER_LIST_SRV_PROTOCOL` enables you define what protocol (UDP or TCP) the Operator uses when performing peer-list SRV lookups. The use of TCP may be required for large database clusters with many nodes where peer-list SRV lookup returns large DNS responses or when UDP DNS queries are blocked by network policies. You can configure the protocol for HAProxy or ProxySQL. 

### Create the Secret

Environment variables are stored as base64-encoded strings in the `data` section. You need to encode each variable value.

For example, to set `HA_CONNECTION_TIMEOUT` to `1000`, run this command:

```{.bash data-prompt="$" }
$ echo -n "1000" | base64 --wrap=0
```

!!! note

    On Apple macOS, use this command instead:

    ```{.bash data-prompt="$" }
    $ echo -n "1000" | base64
    ```

You can also decode base64-encoded values to verify them:

```{.bash data-prompt="$" }
$ echo "MTAwMA==" | base64 --decode
1000
```

### Apply the configuration

1. Create the Secret with the following command:

    ```{.bash data-prompt="$" }
    $ kubectl create -f deploy/my-env-secret.yaml
    ```

2. Add the Secret name to your cluster configuration. Edit the `deploy/cr.yaml` file and add the `envVarsSecret` key to the appropriate section: `pxc`, `haproxy` or `proxysql`. The sample configuration for HAproxy is:

    ```yaml
    haproxy:
      envVarsSecret: my-env-var-secrets
    ```

3. Apply the updated configuration:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml
    ```

## Configure alternative memory allocator

You can use an alternative memory allocator library for `mysqld` to optimize memory usage. This is often recommended when memory usage is higher than expected.

The Percona XtraDB Cluster Pods include the jemalloc allocator. You can enable it with the `LD_PRELOAD` environment variable:

```bash
LD_PRELOAD=/usr/lib64/libjemalloc.so.1
```

Here's how:

1. Create a Secret with the encoded value. This is the example of the Secret's YAML manifest:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-new-env-var-secrets
type: Opaque
data:
  LD_PRELOAD: L3Vzci9saWI2NC9saWJqZW1hbGxvYy5zby4x
```

2. Create the Secret object:

    ```{.bash data-prompt="$" }
    $ kubectl create -f deploy/my-new-env-var-secret.yaml
    ```

3. Add the Secret to the PXC section in your `deploy/cr.yaml` file:

    ```yaml
    pxc:
      envVarsSecret: my-new-env-var-secrets
    ```

4. Apply the configuration:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml
    ```
