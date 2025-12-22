# Configure Operator environment variables

You can configure the Percona Operator for XtraDB Cluster behavior by setting environment variables in the Operator Deployment.
You can set environment variables in the following ways:

* For installations via `kubectl`, edit the Operator Deployment manifest (`deploy/operator.yaml`) before applying it, or modify the existing Deployment using `kubectl patch` or `kubectl edit`.
* For Helm installations you can set environment variables through Helm values.
* For installations on OpenShift, you can configure environment variables through the OLM subscription.

## Available environment variables

### `LOG_STRUCTURED`

Controls whether Operator logs are structured (JSON format) or plain text. Available since Operator version 1.12.0

| Value type | Default | Example |
| ---------- | ------- | ------- |
| string     | `"false"` | `"true"` |

When set to `"true"`, the Operator outputs logs in structured JSON format, which is useful for log aggregation systems. When set to `"false"` (default), logs are in plain text format.

**Example configuration:**

```yaml
env:
 - name: LOG_STRUCTURED
   value: "true"
```
  
### `LOG_LEVEL`

Sets the verbosity level of Operator logs. Available since Operator version 1.12.0

| Value type | Default | Example |
| ---------- | ------- | ------- |
| string     | `"INFO"` | `"DEBUG"` |

Valid values are:

* `"DEBUG"` - Most verbose, includes detailed debugging information
* `"INFO"` - Standard informational messages (default)
* `"WARN"` - Warning messages only
* `"ERROR"` - Error messages only

**Example configuration:**

```yaml
env:
 - name: LOG_LEVEL
   value: "DEBUG"
```

### `WATCH_NAMESPACE`

Specifies which namespaces the Operator should watch for Custom Resources.

| Value type | Default | Example |
| ---------- | ------- | ------- |
| string     | Operator's namespace | `"pxc,pxc-dev"` or `""` |

* If set to a comma-separated list of namespaces, the Operator watches only those namespaces (cluster-wide mode)
* If set to an empty string (`""`), the Operator watches all namespaces in the cluster
* If not set, the Operator watches only its own namespace

**Example configuration for cluster-wide mode:**

```yaml
env:
 - name: WATCH_NAMESPACE
   value: "pxc,pxc-dev,pxc-prod"
```

See [Cluster-wide installation](cluster-wide.md) for more details.

### `DISABLE_TELEMETRY`

Disables the Operator's telemetry data collection.

| Value type | Default | Example |
| ---------- | ------- | ------- |
| string     | `"false"` | `"true"` |

When set to `"true"`, the Operator does not send anonymous telemetry data to Percona.

**Example configuration:**

```yaml
env:
 - name: DISABLE_TELEMETRY
   value: "true"
```

See [Telemetry](telemetry.md) for more information about what data is collected.

### `S3_WORKERS_LIMIT`

This variable limits the number of parallel workers used for backup deletion from the S3-compatible storage (AWS S3, MinIO, etc.). Available since Operator version 1.8.0.

**When to use:**

* **High backup volume environments**: When you have many backups that need to be deleted, increasing this value can speed up cleanup operations
* **Backup deletion accumulation**: If you see repeated log messages like `"all workers are busy - skip backup deletion for now"`, consider increasing this value
* **Network saturation**: If you want to limit S3 operations to avoid saturating your network, decrease this value

**Considerations:**

* Lowering the value throttles all S3 operations (both uploads and deletions)
* Raising the value allows more concurrent operations but may increase network usage and Operator memory consumption
* Only positive integer values are accepted
* Setting this too high in environments with many backups may contribute to increased memory usage

| Value type | Default | Example |
| ---------- | ------- | ------- |
| string     | `"10"` | `"20"` |

**Example configuration:**

```yaml
env:
 - name: S3_WORKERS_LIMIT
   value: "20"
```

### `MAX_CONCURRENT_RECONCILES`

Controls the maximum number of concurrent reconciliation operations the Operator can perform.

| Value type | Default | Example |
| ---------- | ------- | ------- |
| string     | `"1"` | `"3"` |

This variable limits how many Custom Resources the Operator reconciles simultaneously. Increasing this value can improve performance in environments with many clusters, but may also increase resource usage.

Read more about concurrent reconciling in [Configure concurrency for a cluster reconciliation](reconciliation-concurrency.md) chapter.

**Example configuration:**

```yaml
env:
 - name: MAX_CONCURRENT_RECONCILES
   value: "3"
```

### `PXCO_FEATURE_GATES`

Enables you to turn on specific features for the Operator. 

| Value type | Default | Example |
| ---------- | ------- | ------- |
| string     | `""` (empty) | `"XtrabackupSidecar=false"` |

**Supported values:**

* `XtrabackupSidecar` - Enables the XtraBackup sidecar method for backups instead of the default SST (State Snapshot Transfer) method. Read more about [backup methods the Operator uses](backups.md#backup-methods). Disabled by default.

**When to use:**

Using the XtraBackup sidecar method is an alternative backup approach with different characteristics. You might want to use it if:

* You need better performance for large databases. The XtraBackup sidecar accesses data files directly without network overhead
* You require native encryption support for backups and/or incremental backups. These functionalities are not yet available in version 1.19.0 and will be added in future releases.

**Example configuration:**

Set the `PXCO_FEATURE_GATES` environment variable in the Operator Deployment:

```yaml
env:
 - name: PXCO_FEATURE_GATES
   value: "XtrabackupSidecar=true"
```

**Important considerations for enabling the `XtrabackupSidecar`:**

* PVC (Persistent Volume Claim) backups are not supported. Only cloud storage backups (S3, Azure, GCP) are available. PVC support will be added in future releases.
* This functionality affects all clusters managed by the Operator. You cannot enable it for specific clusters only.
* The Operator injects an XtraBackup sidecar container into each PXC Pod.
* The sidecar exposes a gRPC interface on port 6450 that handles backup requests.

### Automatic environment variables

The following environment variables are automatically set by Kubernetes and should not be manually configured:

* `POD_NAME` - The name of the Operator Pod (set from `metadata.name`)
* `OPERATOR_NAME` - The name of the Operator (set to `percona-xtradb-cluster-operator`)

### Update environment variables

#### Using kubectl patch

You can update environment variables in an existing Operator Deployment by applying a patch. To keep existing environment variables, you must specify the full list of them.

Here's how to do it:

1. Get the current environment variables:

    ```bash
    kubectl get deployment percona-xtradb-cluster-operator -o jsonpath='{.spec.template.spec.containers[?(@.name=="percona-xtradb-cluster-operator")].env}'
    ```

2. Edit the output to add or update your variable (e.g., `S3_WORKERS_LIMIT`), then use the full list in your patch:

    ```bash
    kubectl patch deployment percona-xtradb-cluster-operator \
      -p '{"spec":{"template":{"spec":{"containers":[{"name":"percona-xtradb-cluster-operator","env":[
        {"name":"POD_NAME","valueFrom":{"fieldRef":{"fieldPath":"metadata.name"}}},
        {"name":"OPERATOR_NAME","value":"percona-xtradb-cluster-operator"},
        {"name":"S3_WORKERS_LIMIT","value":"20"}
      ]}}]}}}'
    ```

#### Using kubectl edit

You can also edit the Deployment directly:

```{.bash data-prompt="$" }
$ kubectl edit deployment percona-xtradb-cluster-operator
```

Then modify the `env` section in the container specification.

#### Using Helm

For Helm installations, you can set environment variables through Helm values. Refer to the Helm chart documentation for the specific syntax.

### After the update

After modifying environment variables, the Operator Pod will be automatically restarted to apply the new configuration.
