> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Configure environment variables

You can configure environment variables in Percona Operator for XtraDB Cluster for the following purposes:

1. [Operator environment variables](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/env-vars-operator.html) - To control the Operator’s behavior, such as logging, telemetry, and backup operations. These are set directly in the Operator Deployment.
1. [Cluster component environment variables](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/env-vars-cluster.html) - To customize the behavior of cluster components (Percona XtraDB Cluster, HAProxy, ProxySQL). These are stored in [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/) and referenced in your cluster configuration.

## When to use environment variables

| Type                                    | Use cases                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operator environment variables          | - Control logging for better debugging and log aggregation - Manage telemetry - Optimize backup performance by setting the number of concurrent S3 workers - Configure the number of namespaces for the Operator to watch - Adjust concurrent reconciliation operations for better performance in multi-cluster environments |
| Cluster component environment variables | - Customize HAProxy - Optimize MySQL performance via alternative memory allocators like jemalloc - Configure ProxySQL - Configure monitoring and observability settings in PMM Client - Handle network policies                                                                                                              |
