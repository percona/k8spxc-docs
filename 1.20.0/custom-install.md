> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Install Percona XtraDB Cluster with customized parameters

You can adjust the configuration of the Operator Deployment and/or Percona XtraDB Cluster and install them with customized parameters.

To check available configuration options, see the following manifests:

- [`deploy/bundle.yaml`](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/bundle.yaml)
- [`deploy/cr.yaml`](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/cr.yaml) .

Also check the following documentation sections:

- [Configure Operator environment variables](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/env-vars-operator.html)
- [Custom Resource Options](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html) reference.

Tip

If you have installed the Operator and wish to update its configuration, you can do so by modifying and applying the [`deploy/operator.yaml`](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/operator.yaml) manifest.

Select how you wish to install the Operator and the database cluster:

**kubectl**

To customize the configuration, do the following:

1. Clone the repository with all manifests and source code by executing the following command:

   ```
   git clone -b v1.20.0 https://github.com/percona/percona-xtradb-cluster-operator
   ```

1. To customize the Operator Deployment, edit the required environment variables and apply the modified `deploy/bundle.yaml` file as follows:

   ```
   kubectl apply --server-side -f deploy/bundle.yaml -n <namespace>
   ```

1. To customize Percona XtraDB Cluster, edit the required options in the `deploy/cr.yaml` file and apply it as follows:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

**Helm**

You can install the Operator deployment and the Percona XtraDB Cluster with custom parameters using Helm. Find what options you can customize in the [Operator chart documentation](https://github.com/percona/percona-helm-charts/tree/main/charts/pxc-operator#installing-the-chart) and the [Percona XtraDB Cluster chart documentation](https://github.com/percona/percona-helm-charts/tree/main/charts/pxc-db#installing-the-chart) .

You can provide custom parameters to Helm using either the `--set` flag or a `values.yaml` file. The `--set` flag is convenient for overriding a small number of parameters directly in the command line, while a `values.yaml` file is preferable when you want to manage many custom settings in one place. Both methods are fully supported by Helm and can be used as needed for your deployment.

**Using `--set` flags**

To pass a custom parameter to Helm, use the `--set key=value` flag with the `helm install` command as follows:

```
helm install <release-name> <chart> --set key=value
```

For example, to install Percona XtraDB Cluster in the `pxc` namespace with 20 Gi storage, run:

```
helm install my-db percona/pxc-db --version 1.20.0 --namespace pxc \
--set pxc.volumeSpec.persistentVolumeClaim.resources.requests.storage=20Gi \
--set backup.enabled=false
```

**Using a `values.yaml` file**

Create a `values.yaml` file with your custom parameters and pass it to `helm install` with the `-f` or `--values` flag:

```
helm install my-db percona/pxc-db --version 1.20.0 --namespace <namespace> -f values.yaml
```

Example `values.yaml`:

values.yaml

```
pxc:
  size: 3
  volumeSpec:
    persistentVolumeClaim:
      resources:
        requests:
          storage: 2Gi
```

## Naming conventions for Helm resources

When you install a chart, Helm creates a release and uses the release name and chart name to generate resource names. By default, resources are named `release-name-chart-name`.

You can override the default naming with the `nameOverride` or `fullnameOverride` options. Pass them using the `--set` flag or in your `values.yaml` file.

| Option             | Effect                                                                   | Example                      |
| ------------------ | ------------------------------------------------------------------------ | ---------------------------- |
| `nameOverride`     | Replaces the chart name but keeps the release name in the generated name | `release-name-name-override` |
| `fullnameOverride` | Replaces the entire generated name with the specified value              | `fullname-override`          |

*Using `nameOverride`* — replaces the chart name but keeps the release name:

```
helm install my-op percona/pxc-operator --namespace my-namespace \
  --set nameOverride=pxc-operator
```

Deployment name: `my-op-pxc-operator`.

```
helm install cluster1 percona/pxc-db -n my-namespace \
  --set nameOverride=pxc
```

Cluster name: `cluster1-pxc`.

*Using `fullnameOverride`* — replaces the full resource name:

```
helm install my-op percona/pxc-operator --namespace my-namespace \
  --set fullnameOverride=percona-xtradb-cluster-operator
```

Deployment name: `percona-xtradb-cluster-operator`.

```
helm install cluster1 percona/pxc-db -n my-namespace \
  --set fullnameOverride=my-pxc-db
```

Cluster name: `my-pxc-db`.

Cluster naming

Use names that satisfy [Kubernetes naming rules](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names) for resources and DNS labels. If you use long release names together with `nameOverride` or `fullnameOverride`, ensure the resulting names stay within length limits your environment allows.

## Common Helm values reference

The following table lists commonly used values for the Operator and database charts. For the full list of options, see the chart values files.

| Value                | Charts                                                                                                                                                                                                 | Description                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `nameOverride`       | [pxc-operator](https://github.com/percona/percona-helm-charts/blob/main/charts/pxc-operator/values.yaml), [pxc-db](https://github.com/percona/percona-helm-charts/blob/main/charts/pxc-db/values.yaml) | Replaces the chart name in generated resource names                                                                                           |
| `fullnameOverride`   | [pxc-operator](https://github.com/percona/percona-helm-charts/blob/main/charts/pxc-operator/values.yaml), [pxc-db](https://github.com/percona/percona-helm-charts/blob/main/charts/pxc-db/values.yaml) | Replaces the entire generated resource name                                                                                                   |
| `watchAllNamespaces` | [pxc-operator](https://github.com/percona/percona-helm-charts/blob/main/charts/pxc-operator/values.yaml)                                                                                               | Deploy the Operator in cluster-wide mode to watch all namespaces                                                                              |
| `disableTelemetry`   | [pxc-operator](https://github.com/percona/percona-helm-charts/blob/main/charts/pxc-operator/values.yaml)                                                                                               | Disable telemetry collection. See [Telemetry](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/telemetry.html) for details |
