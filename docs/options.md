# Changing MySQL Options

You may need to change the MySQL configuration for your application. MySQL lets you customize its settings using a configuration file. You can include options from the [my.cnf :octicons-link-external-16:](https://dev.mysql.com/doc/refman/8.0/en/option-files.html) configuration file in one of these ways:

- Edit the `deploy/cr.yaml` file
- Use a ConfigMap
- Use a Secret object

In most cases, you don’t need to add custom options because the Operator already provides sensible defaults for MySQL.

If you supply custom configuration in more than one way, the Operator will only use one method. It follows this order of preference:

1. First, it checks for a Secret object.
2. If it doesn’t find a matching Secret, it looks for custom configuration in the Custom Resource (the `deploy/cr.yaml` file).
3. If neither of those exist, the Operator searches for a ConfigMap.

## Edit the `deploy/cr.yaml` file

You can add options from the
[my.cnf :octicons-link-external-16:](https://dev.mysql.com/doc/refman/8.0/en/option-files.html)
configuration file by editing the configuration section of the
`deploy/cr.yaml`. Here is an example:

```yaml
spec:
  secretsName: cluster1-secrets
  pxc:
    ...
      configuration: |
        [mysqld]
        wsrep_debug=CLIENT
        [sst]
        wsrep_debug=CLIENT
```

See the [Custom Resource options, PXC section](operator.md#operator-pxc-section)
for more details.

## Use a ConfigMap

You can use a configmap and the cluster restart to reset configuration
options. A configmap allows Kubernetes to pass or update configuration
data inside a containerized application.

Use the `kubectl` command to create the configmap from external
resources, for more information see [Configure a Pod to use a ConfigMap :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#create-a-configmap).

For example, let’s suppose that your application requires more
connections. To increase your `max_connections` setting in MySQL, you
define a `my.cnf` configuration file with the following setting:

```default
[mysqld]
...
max_connections=250
```

You can create a configmap from the `my.cnf` file with the
`kubectl create configmap` command.

You should use the combination of the cluster name with the `-pxc`
suffix as the naming convention for the configmap. To find the cluster
name, you can use the following command:

``` {.bash data-prompt="$" }
$ kubectl get pxc
```

The syntax for `kubectl create configmap` command is:

```default
$ kubectl create configmap <cluster-name>-pxc <resource-type=resource-name>
```

The following example defines `cluster1-pxc` as the configmap name and the
`my.cnf` file as the data source:

``` {.bash data-prompt="$" }
$ kubectl create configmap cluster1-pxc --from-file=my.cnf
```

To view the created configmap, use the following command:

``` {.bash data-prompt="$" }
$ kubectl describe configmaps cluster1-pxc
```

## Use a Secret Object

The Operator can also store configuration options in [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/).
This can be useful if you need additional protection for some sensitive data.

You should create a Secret object with a specific name, composed of your cluster
name and the `pxc` suffix.

!!! note

    To find the cluster name, you can use the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl get pxc
    ```

Configuration options should be put inside a specific key inside of the `data`
section. The name of this key is `my.cnf` for Percona XtraDB Cluster Pods.

Actual options should be encoded with [Base64 :octicons-link-external-16:](https://en.wikipedia.org/wiki/Base64).

For example, let’s define a `my.cnf` configuration file and put there a pair
of MySQL options we used in the previous example:

```default
[mysqld]
wsrep_debug=CLIENT
[sst]
wsrep_debug=CLIENT
```

You can get a Base64 encoded string from your options via the command line as
follows:

=== "in Linux"

    ``` {.bash data-prompt="$" }
    $ cat my.cnf | base64 --wrap=0
    ```

=== "in macOS"

    ``` {.bash data-prompt="$" }
    $ cat my.cnf | base64
    ```

!!! note

    Similarly, you can read the list of options from a Base64 encoded string:

    ``` {.bash data-prompt="$" }
    $ echo "W215c3FsZF0Kd3NyZXBfZGVidWc9T04KW3NzdF0Kd3NyZXBfZGVidWc9T04K" | base64 --decode
    ```

Finally, use a yaml file to create the Secret object. For example, you can
create a `deploy/my-pxc-secret.yaml` file with the following contents:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cluster1-pxc
data:
  my.cnf: "W215c3FsZF0Kd3NyZXBfZGVidWc9T04KW3NzdF0Kd3NyZXBfZGVidWc9T04K"
```

When ready, apply it with the following command:

``` {.bash data-prompt="$" }
$ kubectl create -f deploy/my-pxc-secret.yaml
```

!!! note

    Do not forget to restart Percona XtraDB Cluster to ensure the
    cluster has updated the configuration.

## Make changed options visible to Percona XtraDB Cluster

Do not forget to restart Percona XtraDB Cluster to ensure the cluster
has updated the configuration (see details on how to connect in the
[Install Percona XtraDB Cluster on Kubernetes](kubernetes.md) page).

## Auto-tuning MySQL options

Few configuration options for MySQL can be calculated and set by the Operator
automatically based on the available Pod resource limits (memory and CPU) **if
constant values for these options are not specified by user** (either in
CR.yaml or in ConfigMap).

Options which can be set automatically are the following ones:

* `innodb_buffer_pool_size`

* `max_connections`

If Percona XtraDB Cluster Pod limits are defined, then limits values are used to
calculate these options. If Percona XtraDB Cluster Pod limits are not defined,
auto-tuning is not done.

Also, starting from the Operator 1.12.0, there is another way of auto-tuning.
You can use `"{{containerMemoryLimit}}"` as a value in `spec.pxc.configuration`
as follows:

```yaml
pxc:
    configuration: |
    [mysqld]
    innodb_buffer_pool_size={{'{{'}}containerMemoryLimit * 3 / 4{{'}}'}}
    ...
```
