# Define environment variables

Sometimes you need to define new environment variables to provide additional
configuration for the components of your cluster. For example, you can use it to
customize the configuration of HAProxy, or to add additional options for PMM
Client.

The Operator can store environment variables in [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/). Here is an example with several options related to HAProxy:

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
```

!!! note

     <a name="haproxy-options"> Variables used in this example have the following effect:
     
     * `HA_CONNECTION_TIMEOUT` allows to set custom timeout for health checks done by HAProxy (it repeatedly executes a simple status query on XtraDB Cluster instances). The default 10 seconds timeout is good for most workloads, but increase should be helpful in case of unstable Kubernetes network or soft lockups happening on Kubernetes nodes.
     * `OK_IF_DONOR` allows application connections to XtraDB Cluster donors. The backup is running on the donor node, and SQL queries combined with it could run slower than usual. Enable the option to grant application access when there is only one XtraDB Cluster node alive, and a second XtraDB Cluster node is joining the cluster via SST.
     * `HA_SERVER_OPTIONS` allows to set the [custom options](https://docs.haproxy.org/2.6/configuration.html#5) for the server in the HAProxy configuration file. You can start with the default `check inter 30000 rise 1 fall 5 weight 1` set, and add required options [referenced in the upstream documentation](https://docs.haproxy.org/2.6/configuration.html#5.2).

As you can see, environment variables are stored as `data` - i.e.,
base64-encoded strings, so you’ll need to encode the value of each variable.
For example, To have `HA_CONNECTION_TIMEOUT` variable equal to `1000`, you
can run `echo -n "1000" | base64 --wrap=0` (or just `echo -n "1000" | base64`
in case of Apple macOS) in your local shell and get `MTAwMA==`.

!!! note

    Similarly, you can read the list of options from a Base64-encoded string:

    ``` {.bash data-prompt="$" }
    $ echo "MTAwMA==" | base64 --decode
    ```

When ready, apply the YAML file with the following command:

``` {.bash data-prompt="$" }
$ kubectl create -f deploy/my-env-secret.yaml
```

Put the name of this Secret to the `envVarsSecret` key either in `pxc`,
`haproxy` or `proxysql` section of the deploy/cr.yaml\` configuration file:

```yaml
haproxy:
  ....
  envVarsSecret: my-env-var-secrets
  ....
```

Now apply the `deploy/cr.yaml` file with the following command:

``` {.bash data-prompt="$" }
$ kubectl apply -f deploy/cr.yaml
```

Another example shows how to pass `LD_PRELOAD` environment variable with the
alternative memory allocator library name to mysqld. It’s often a recommended
practice to try using an alternative allocator library for mysqld in case the
memory usage is suspected to be higher than expected, and you can use jemalloc
allocator already present in Percona XtraDB Cluster Pods with the following
environment variable:

```bash
LD_PRELOAD=/usr/lib64/libjemalloc.so.1
```

Create a new YAML file with the contents similar to the previous example, but
with `LD_PRELOAD` variable, stored as base64-encoded strings:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-new-env-var-secrets
type: Opaque
data:
  LD_PRELOAD: L3Vzci9saWI2NC9saWJqZW1hbGxvYy5zby4x
```

If this YAML file was named `deploy/my-new-env-var-secret`, the command
to apply it will be the following one:

``` {.bash data-prompt="$" }
$ kubectl create -f deploy/my-new-env-secret.yaml
```

Now put the name of this new Secret to the `envVarsSecret` key in `pxc`
section of the deploy/cr.yaml\` configuration file:

```yaml
pxc:
  ....
  envVarsSecret: my-new-env-var-secrets
  ....
```

Don’t forget to apply the `deploy/cr.yaml` file, as usual:

``` {.bash data-prompt="$" }
$ kubectl apply -f deploy/cr.yaml
```
