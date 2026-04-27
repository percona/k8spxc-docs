# Persistent logging

In a distributed Kubernetes environment, it is often difficult to debug issues because logs are tied to the lifecycle of individual Pods and containers. If a Pod fails and restarts, its logs are lost, making it hard to identify the root cause.

Percona Operator for MySQL addresses this challenge with **persistent logging**, ensuring logs are stored independently of Pod lifecycle. This approach keeps logs available for review even after a Pod restarts.

The Operator collects logs using [Fluent Bit :octicons-link-external-16:](https://fluentbit.io/), a lightweight log processor with versatile output plugins and forwarding features. Fluent Bit runs as a `logs` sidecar container alongside each database Pod. It collects database logs and writes them to the `DATADIR` (`/var/lib/mysql/`) on the same Persistent Volume used by the corresponding Percona XtraDB Cluster Pod. As a result, logs persist across Pod restarts and remain available for later debugging.

Logs are stored for 7 days and then rotated.

To view collected logs, use the following command:

```bash
kubectl logs cluster1-pxc-0 -c logs -n <namespace>
```

## Configure  Log collector

Log collection is enabled by default and is controlled by the `logcollector.enabled` key in the `deploy/cr.yaml` configuration file.

If needed, you can configure Fluent Bit filtering and advanced features through the `logcollector.configuration` key in the `deploy/cr.yaml` file.

Note that when you add a new configuration to the `logcollector.configuration`, this triggers a rolling restart of the Pods.

Fluent Bit credentials and similar data for output plugins are stored in a separate Secret. The Secret name is set by the `logCollectorSecretName` option in the `deploy/cr.yaml` Custom Resource (`my-log-collector-secrets` by default).
