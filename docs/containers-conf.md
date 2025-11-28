# Configure environment variables

You can configure environment variables in Percona Operator for XtraDB Cluster for the following purposes:

1. [Operator environment variables](env-vars-operator.md) - To control the Operator's behavior, such as logging, telemetry, and backup operations. These are set directly in the Operator Deployment.

2. [Cluster component environment variables](env-vars-cluster.md) - To customize the behavior of cluster components (Percona XtraDB Cluster, HAProxy, ProxySQL). These are stored in [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) and referenced in your cluster configuration.

## When to use environment variables

| Type                           | Use cases                   | 
| ------------------------------ | --------------------------- |
| Operator environment variables |  - Control logging for better debugging and log aggregation <br> - Manage telemetry <br> - Optimize backup performance by setting the number of concurrent S3 workers <br> - Configure the number of namespaces for the Operator to watch <br> - Adjust concurrent reconciliation operations for better performance in multi-cluster environments | 
| Cluster component environment variables | - Customize HAProxy <br> - Optimize MySQL performance via alternative memory allocators like jemalloc <br> - Configure ProxySQL <br> - Configure monitoring and observability settings in PMM Client <br> - Handle network policies | 




