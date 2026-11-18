> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# How to carry on low-level manual upgrades of Percona XtraDB Cluster

The default and recommended way to upgrade the database cluster is using the Smart Update strategy. The Operator controls how objects are updated and restarts the Pods in a proper order during the database upgrade or for other events that require the cluster update. To these events belong ConfigMap updates, password rotation or changing resource values.

In some cases running an automatic upgrade of Percona XtraDB Cluster is not an option. For example, if the database upgrade impacts your application, you may want to have a full control over the upgrade process.

Running a manual database upgrade allows you to do just that. You can use one of the following *upgrade strategies*:

- *Rolling Update*, initiated manually and [controlled by Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies) . Note that the order of Pods restart may not be optimal from the Percona XtraDB Cluster point of view.
- *On Delete*, [done by Kubernetes on per-Pod basis](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies) when Pods are manually deleted.

## Before you start

1. We recommend to [update PMM Server](https://docs.percona.com/percona-monitoring-and-management/2/how-to/upgrade.html) **before** upgrading PMM Client.

1. If you are using [custom configuration for HAProxy](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/haproxy-conf.html#passing-custom-configuration-options-to-haproxy), check the HAProxy configuration file provided by the Operator **before the upgrade**. Find the `haproxy-global.cfg` for the Operator version 1.20.0 [here](https://github.com/percona/percona-docker/blob/pxc-operator-1.20.0/haproxy/dockerdir/etc/haproxy/haproxy-global.cfg) ).

   Make sure that your custom config is still compatible with the new variant, and make necessary additions, if needed.

## Rolling Update strategy and semi-automatic updates

To run a semi-automatic update of Percona XtraDB Cluster, do the following:

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/update-operator.html).

1. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to `RollingUpdate`.

1. Check the current version of the Custom Resource and what versions of the database and cluster components are compatible with it. Use the following command:

   ```
   curl https://check.percona.com/versions/v1/pxc-operator/1.20.0 |jq -r ‘.versions[].matrix’
   ```

   You can also find this information in the [Versions compatibility](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/versions.html) matrix.

1. Update the Custom Resource, the database, backup, proxy and PMM Client image names with a newer version tag. Find the image names [in the list of certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html).

   We recommend to update the PMM Server **before** the upgrade of PMM Client. In order to use PMM3, [upgrade your PMM Server to version 3](https://docs.percona.com/percona-monitoring-and-management/3/pmm-upgrade/migrating_from_pmm_2.html) .

   If you haven’t updated your PMM Server yet, exclude PMM Client from the list of images to update.

   To keep using PMM2, specify the PMM Client version compatible with PMM Server 2.

   Since this is a working cluster, the way to update the Custom Resource is to [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) with the `kubectl patch pxc` command.

   **With PMM Client**

   **For Percona XtraDB Cluster 8.4**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.4.8-8.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.4.0-5.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" },
          "pmm":      { "image": "percona/pmm-client:3.8.0" }
      }}'
   ```

   **For Percona XtraDB Cluster 8.0**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.0.45-36.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.0.35-35.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" },
          "pmm":      { "image": "percona/pmm-client:3.8.0" }
      }}'
   ```

   **For Percona XtraDB Cluster 5.7**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:5.7.44-31.65" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:2.4.29" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" },
          "pmm":      { "image": "percona/pmm-client:3.8.0" }
      }}'
   ```

   **Without PMM Client**

   **For Percona XtraDB Cluster 8.4**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.4.8-8.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.4.0-5.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" }

      }}'
   ```

   **For Percona XtraDB Cluster 8.0**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.0.45-36.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.0.35-35.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" }

      }}'
   ```

   **For Percona XtraDB Cluster 5.7**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:5.7.44-31.65" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:2.4.29" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" }

      }}'
   ```

1. After you applied the patch, the deployment rollout will be triggered automatically. You can track the rollout process in real time using the `kubectl rollout status` command with the name of your cluster:

   ```
   kubectl rollout status sts cluster1-pxc
   ```

## Manual upgrade (the On Delete strategy)

To update Percona XtraDB Cluster manually, do the following:

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/update-db.html).

1. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to `OnDelete`.

1. Check the current version of the Custom Resource and what versions of the database and cluster components are compatible with it. Use the following command:

   ```
   curl https://check.percona.com/versions/v1/pxc-operator/1.20.0 |jq -r ‘.versions[].matrix’
   ```

   You can also find this information in the [Versions compatibility](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/versions.html) matrix.

1. Update the Custom Resource, the database, backup, proxy and PMM Client image names with a newer version tag. Find the image names [in the list of certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html).

   We recommend to update the PMM Server **before** the upgrade of PMM Client. In order to use PMM3, [upgrade your PMM Server to version 3](https://docs.percona.com/percona-monitoring-and-management/3/pmm-upgrade/migrating_from_pmm_2.html) .

   If you haven’t updated your PMM Server yet, exclude PMM Client from the list of images to update.

   To keep using PMM2, specify the PMM Client version compatible with PMM Server 2.

   Since this is a working cluster, the way to update the Custom Resource is to [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) with the `kubectl patch pxc` command.

   **With PMM Client**

   **For Percona XtraDB Cluster 8.4**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.4.8-8.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.4.0-5.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" },
          "pmm":      { "image": "percona/pmm-client:3.8.0" }
      }}'
   ```

   **For Percona XtraDB Cluster 8.0**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.0.45-36.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.0.35-35.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" },
          "pmm":      { "image": "percona/pmm-client:3.8.0" }
      }}'
   ```

   **For Percona XtraDB Cluster 5.7**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:5.7.44-31.65" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:2.4.29" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" },
          "pmm":      { "image": "percona/pmm-client:3.8.0" }
      }}'
   ```

   **Without PMM Client**

   **For Percona XtraDB Cluster 8.4**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.4.8-8.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.4.0-5.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" }

      }}'
   ```

   **For Percona XtraDB Cluster 8.0**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.0.45-36.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.0.35-35.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" }

      }}'
   ```

   **For Percona XtraDB Cluster 5.7**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:5.7.44-31.65" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:2.4.29" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" }

      }}'
   ```

1. The Pod with the newer Percona XtraDB Cluster image will start after you delete it. Delete targeted Pods manually one by one to make them restart in desired order:

   1. Delete the Pod using its name with the command like the following one:

      ```
      kubectl delete pod cluster1-pxc-2
      ```

   1. Wait until Pod becomes ready:

      ```
      kubectl get pod cluster1-pxc-2
      ```

      The output should be like this:

      ```
      NAME             READY   STATUS    RESTARTS   AGE
      cluster1-pxc-2   1/1     Running   0          3m33s
      ```

The update process is successfully finished when all Pods have been restarted.
