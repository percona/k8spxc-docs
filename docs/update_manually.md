# How to carry on low-level manual upgrades of Percona XtraDB Cluster

Percona Operator for MySQL based on Percona XtraDB Cluster supports upgrades 
of the database management system (Percona XtraDB Cluster) starting from the
Operator version 1.1.0. The Operator 1.5.0 had automated such upgrades with a
new upgrade strategy called [Smart Update](update.md#more-on-upgrade-strategies).
Smart Update automates the upgrade process while giving the user full control
over updates, so it is the most convenient upgrade strategy.

Still there may be use cases when automatic upgrade of Percona XtraDB Cluster
is not an option (for example, you may be using Percona XtraDB Cluster with the
Operator version 1.5.0 or earlier), and you have to carry on upgrades manually.

Percona XtraDB Cluster can be upgraded manually using one of the following
*upgrade strategies*:

* *Rolling Update*, initiated manually and [controlled by Kubernetes :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies),
* *On Delete*, [done by Kubernetes on per-Pod basis :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies) when Pods are deleted.

!!! warning

    In case of [Smart Updates](update.md#automated-upgrade), the Operator can
    either detect the availability of the Percona XtraDB Cluster version or rely
    on the user's choice of the version. In both cases Pods are restarted by the
    Operator automatically in the order, which assures the primary instance to
    be updated last, preventing possible connection issues until the whole
    cluster is updated to the new settings. Kubernetes-controlled Rolling Update
    can't guarantee that Pods update order is optimal from the Percona XtraDB
    Cluster point of view.

## Rolling Update strategy and semi-automatic updates

Semi-automatic update of Percona XtraDB Cluster can be done as follows:

1. Edit the `deploy/cr.yaml` file, setting `updateStrategy` key to 
    `RollingUpdate`.

2. Now you should [apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your
    Custom Resource, setting necessary image names with a newer version tag.

    !!! note

        Check the version of the Operator you have in your Kubernetes
        environment. Please refer to the [Operator upgrade guide](update.md#upgrading-the-operator-and-crd)
        to upgrade the Operator and CRD, if needed.

    Patching Custom Resource is done with the `kubectl patch pxc` command.
    Actual image names can be found [in the list of certified images](images.md)
    (for older releases, please refer to the [old releases documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/)).
    For example, updating to the `{{ release }}` version should look as follows:

    === "For Percona XtraDB Cluster 8.0"
        ```bash
        $ kubectl patch pxc cluster1 --type=merge --patch '{
           "spec": {
               "crVersion":"{{ release }}",
               "pxc":{ "image": "percona/percona-xtradb-cluster:{{ pxc80recommended }}" },
               "proxysql": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-proxysql" },
               "haproxy":  { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-haproxy" },
               "backup":   { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-pxc8.0-backup" },
               "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector" },
               "pmm":      { "image": "percona/pmm-client:{{ pmm2recommended }}" }
           }}'
        ```

    === "For Percona XtraDB Cluster 5.7"
        ```bash
        $ kubectl patch pxc cluster1 --type=merge --patch '{
           "spec": {
               "crVersion":"{{ release }}",
               "pxc":{ "image": "percona/percona-xtradb-cluster:{{ pxc57recommended }}" },
               "proxysql": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-proxysql" },
               "haproxy":  { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-haproxy" },
               "backup":   { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-pxc5.7-backup" },
               "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector" },
               "pmm":      { "image": "percona/pmm-client:{{ pmm2recommended }}" }
           }}'
        ```

3. The deployment rollout will be automatically triggered by the applied patch.
    You can track the rollout process in real time with the
    `kubectl rollout status` command with the name of your cluster:

    ```default
    $ kubectl rollout status sts cluster1-pxc
    ```

## Manual upgrade (the On Delete strategy)

Manual update of Percona XtraDB Cluster can be done as follows:

1. Edit the `deploy/cr.yaml` file, setting `updateStrategy` key to
    `OnDelete`.

2. Now you should [apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your
    Custom Resource, setting necessary image names with a newer version tag.

    !!! note

        Check the version of the Operator you have in your Kubernetes
        environment. Please refer to the [Operator upgrade guide](update.md#upgrading-the-operator-and-crd)
        to upgrade the Operator and CRD, if needed.

    Patching Custom Resource is done with the `kubectl patch pxc` command.
    Actual image names can be found [in the list of certified images](images.md)
    (for older releases, please refer to the [old releases documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/)).
    For example, updating to the `{{ release }}` version should look as
    follows, depending on whether you are using Percona XtraDB Cluster 5.7 or 8.0.

    === "For Percona XtraDB Cluster 8.0"
        ```bash
        $ kubectl patch pxc cluster1 --type=merge --patch '{
           "spec": {
               "crVersion":"{{ release }}",
               "pxc":{ "image": "percona/percona-xtradb-cluster:{{ pxc80recommended }}" },
               "proxysql": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-proxysql" },
               "haproxy":  { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-haproxy" },
               "backup":   { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-pxc8.0-backup" },
               "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector" },
               "pmm":      { "image": "percona/pmm-client:{{ pmm2recommended }}" }
           }}'
        ```

    === "For Percona XtraDB Cluster 5.7"
        ```bash
        $ kubectl patch pxc cluster1 --type=merge --patch '{
           "spec": {
               "crVersion":"{{ release }}",
               "pxc":{ "image": "percona/percona-xtradb-cluster:{{ pxc57recommended }}" },
               "proxysql": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-proxysql" },
               "haproxy":  { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-haproxy" },
               "backup":   { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-pxc5.7-backup" },
               "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector" },
               "pmm":      { "image": "percona/pmm-client:{{ pmm2recommended }}" }
           }}'
        ```

3. The Pod with the newer Percona XtraDB Cluster image will start after you
    delete it. Delete targeted Pods manually one by one to make them restart in
    desired order:

    1. Delete the Pod using its name with the command like the following one:

        ```default
        $ kubectl delete pod cluster1-pxc-2
        ```

    2. Wait until Pod becomes ready:

        ```default
        $ kubectl get pod cluster1-pxc-2
        ```

        The output should be like this:

        ```default
        NAME             READY   STATUS    RESTARTS   AGE
        cluster1-pxc-2   1/1     Running   0          3m33s
        ```

4. The update process is successfully finished when all Pods have been
    restarted.

