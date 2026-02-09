## Upgrading Percona XtraDB Cluster to a specific version

{% include 'assets/fragments/update-assumptions.txt' %}


## Procedure

To update Percona XtraDB Cluster to a specific version, do the following:
{.power-number}

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update-operator.md).

2. Check the [Custom Resource](operator.md) manifest configuration to be the following:

    * `spec.updateStrategy` option is set to `SmartUpdate`
    * `spec.upgradeOptions.apply` option is set to `Disabled` or `Never`.

    ```yaml
    ...
    spec:
      updateStrategy: SmartUpdate
      upgradeOptions:
        apply: Disabled
        ...
    ```

{% include 'assets/fragments/patch-update-db.txt' %}

5. The deployment rollout will be automatically triggered by the applied patch.
    You can track the rollout process in real time with the
    `kubectl rollout status` command with the name of your cluster:

    ```bash
    kubectl rollout status sts cluster1-pxc
    ```

