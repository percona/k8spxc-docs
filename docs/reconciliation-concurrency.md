# Configure concurrency for a cluster reconciliation

Reconciliation is the process by which the Operator continuously compares the desired state with the actual state of the cluster. The desired state is defined in a Kubernetes custom resource, like `PerconaXtraDBCluster`.

If the actual state does not match the desired state, the Operator takes actions to bring the system into alignment. This means creating, updating, or deleting Kubernetes resources (Pods, Services, ConfigMaps, etc.) or performing database-specific operations like scaling, backups, or failover.

Reconciliation is triggered by a variety of events, including:

- Changes to the cluster configuration
- Changes to the cluster state
- Changes to the cluster resources

By default, the Operator has one reconciliation worker. This means that if you deploy or update 2 clusters at the same time, the Operator will reconcile them sequentially.

The `MAX_CONCURRENT_RECONCILES` environment variable in the `percona-xtradb-cluster-operator` deployment controls the number of concurrent workers that can reconcile resources in Percona XtraDB Cluster clusters in parallel.

Thus, to extend the previous example, if you set the number of reconciliation workers to `2`, the Operator will reconcile both clusters in parallel. This also helps you with benchmarking the Operator performance.

The general recommendation is to set the number of concurrent workers equal to the number of Percona XtraDB Cluster clusters. When the number of workers is greater, the excessive workers will remain idle.

## Set the number of reconciliation workers

1. Check the index of the `MAX_CONCURRENT_RECONCILES` environment variable using the following command:

    ```{bash data-prompt="$"}
    kubectl get deployment percona-xtradb-cluster-operator -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="MAX_CONCURRENT_RECONCILES")].value}'
    ```

    ??? example "Sample output"

        ```{.json .no-copy}
        1
        ```

2. To set a new value and verify it's been updated, run the following command:

    ```{.bash data-prompt="$"}
    $ kubectl patch deployment percona-xtradb-cluster-operator \
    --type='strategic' \
    -o yaml \
    -p='{
        "spec": {
            "template": {
                "spec": {
                    "containers": [
                        {
                            "name": "percona-xtradb-cluster-operator",
                            "env": [
                                {
                                    "name": "MAX_CONCURRENT_RECONCILES",
                                    "value": "2"
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }'\
    -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="MAX_CONCURRENT_RECONCILES")].value}'
    ```

The command does the following:

- Patches the deployment to update the `MAX_CONCURRENT_RECONCILES` environment variable
- Sets the value to `2`.
- Outputs the result

You can set the value to any number greater than 0.

??? example "Sample output"

        ```{.text .no-copy}
        2
        ```
