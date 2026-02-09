# How to carry on low-level manual upgrades of Percona XtraDB Cluster

The default and recommended way to upgrade the database cluster is using the Smart Update strategy. The Operator controls how objects are updated and restarts the Pods in a proper order during the database upgrade or for other events that require the cluster update. To these events belong ConfigMap updates, password rotation or changing resource values.

In some cases running an automatic upgrade of Percona XtraDB Cluster
is not an option. For example, if the database upgrade impacts your application, you may want to have a full control over the upgrade process.

Running a manual database upgrade allows you to do just that. You can use one of the following
*upgrade strategies*:

* *Rolling Update*, initiated manually and [controlled by Kubernetes  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies). Note that the order of Pods restart may not be optimal from the Percona Server for
    MongoDB point of view.

* *On Delete*, [done by Kubernetes on per-Pod basis  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies) when Pods are manually deleted.

## Before you start

1. We recommend to [update PMM Server :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/2/how-to/upgrade.html) **before** upgrading PMM Client.

2. If you are using [custom configuration for HAProxy](haproxy-conf.md#passing-custom-configuration-options-to-haproxy), check the HAProxy configuration file provided by the Operator **before the upgrade**. Find the `haproxy-global.cfg` for the Operator version   {{ release }} [here :octicons-link-external-16:](https://github.com/percona/percona-docker/blob/pxc-operator-{{ release }}/haproxy/dockerdir/etc/haproxy/haproxy-global.cfg)).

    Make sure that your custom config is still compatible with the new variant, and make necessary additions, if needed.

## Rolling Update strategy and semi-automatic updates

To run a semi-automatic update of Percona XtraDB Cluster, do the following:
{.power-number}

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update-operator.md).

2. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to 
    `RollingUpdate`.

   {% include 'assets/fragments/patch-update-db.txt' %}

3. After you applied the patch, the deployment rollout will be triggered automatically.
    You can track the rollout process in real time using the
    `kubectl rollout status` command with the name of your cluster:

    ```bash
    kubectl rollout status sts cluster1-pxc
    ```

## Manual upgrade (the On Delete strategy)

To update Percona XtraDB Cluster manually, do the following:
{.power-number}

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update-db.md).

2. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to `OnDelete`.

   {% include 'assets/fragments/patch-update-db.txt' %}

3. The Pod with the newer Percona XtraDB Cluster image will start after you
    delete it. Delete targeted Pods manually one by one to make them restart in
    desired order:

    1. Delete the Pod using its name with the command like the following one:

        ```bash
        kubectl delete pod cluster1-pxc-2
        ```

    2. Wait until Pod becomes ready:

        ```bash
        kubectl get pod cluster1-pxc-2
        ```

        The output should be like this:

        ```{.text .no-copy}
        NAME             READY   STATUS    RESTARTS   AGE
        cluster1-pxc-2   1/1     Running   0          3m33s
        ```

The update process is successfully finished when all Pods have been
    restarted.

