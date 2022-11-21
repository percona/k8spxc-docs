# Upgrade Database and Operator

Starting from the version 1.1.0, Percona Operator for MySQL based on Percona XtraDB Cluster
allows upgrades to newer versions. The upgradable components of the cluster are
the following ones:
* the Operator;
* [Custom Resource Definition (CRD)](operator.md),
* Database Management System (Percona XtraDB Cluster).

The list of recommended upgrade scenarios includes two variants:

* Upgrade to the new versions of the Operator *and* Percona XtraDB Cluster,
* Minor Percona XtraDB Cluster version upgrade *without* the Operator upgrade.

## Upgrade to the new versions of the Operator *and* Percona XtraDB Cluster

In this scenario, components of the cluster are upgraded in the following order:

1. The Operator and CRD,
2. Percona XtraDB Cluster.

### Upgrading the Operator and CRD

!!! note

    The Operator supports **last 3 versions of the CRD**, so it is technically
    possible to skip upgrading the CRD and just upgrade the Operator. If the CRD
    is older than the new Operator version *by no more than three releases*, you
    will be able to continue using the old CRD and even carry on Percona XtraDB
    Cluster minor version upgrades with it. But the recommended way is to update
    the Operator *and* CRD.

The upgrade includes the following steps.

1. Update the [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
    for the Operator, taking it from the official repository on Github, and do
    the same for the Role-based access control:

    ```bash
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/crd.yaml
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/rbac.yaml
    ```

2. Now you should [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your
    deployment, supplying necessary image name with a newer version tag. This
    is done with the `kubectl patch deployment` command. You can found proper
    image name [in the list of certified images](images.md#custom-registry-images).
    For example, updating to the `{{ release }}` version should look as
    follows.

    ```bash
    $ kubectl patch deployment percona-xtradb-cluster-operator \
      -p'{"spec":{"template":{"spec":{"containers":[{"name":"percona-xtradb-cluster-operator","image":"percona/percona-xtradb-cluster-operator:{{ release }}"}]}}}}'
    ```

3. The deployment rollout will be automatically triggered by the applied patch.
    You can track the rollout process in real time with the
    `kubectl rollout status` command with the name of your cluster:

    ```default
    $ kubectl rollout status deployments percona-xtradb-cluster-operator
    ```

    !!! note

        Labels set on the Operator Pod will not be updated during upgrade.

### Upgrading Percona XtraDB Cluster

The database management system (Percona XtraDB Cluster) can be upgraded along
with one of the following *update strategies*:

* *Smart Uptates*, controlled by the Operator (**the recommended way**),
* *Rolling Update*, initated manually and [controlled by Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies),
* *On Delete*, [done by Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies) when Pods are manually deleted one by one.

In case of Smart Updates, the Operator can either detect the availability of the
Percona XtraDB Cluster version or rely on the user's choice of the version. In
both cases Pods are restarted by the Operator automatically in the order, which
assures the primary instance to be updated last, preventing possible connection
issues until the whole cluster is updated to the new settings.

#### Smart Uptates strategy and the automatic upgrades

Smart Updates are available starting from the Operator version 1.5.0, allowing
the Operator to do fully automatic upgrades of Percona XtraDB Cluster.

To have this upgrade method enabled, make sure that the `updateStrategy` key
in the `deploy/cr.yaml` configuration file is set to `SmartUpdate`.

When automatic updates are enabled, the Operator will carry on upgrades
according to the following algorithm. It will query a special *Version Service*
server at scheduled times to obtain fresh information about version numbers and
valid image paths needed for the upgrade. If the current version should be
upgraded, the Operator updates the CR to reflect the new image paths and carries
on sequential Pods deletion in a safe order, allowing StatefulSet to redeploy
the cluster Pods with the new image.

The upgrade details are set in the `upgradeOptions` section of the
`deploy/cr.yaml` configuration file. Make the following edits to configure
updates:

1. Set the `apply` option to one of the following values:

    * `Recommended` - automatic upgrades will choose the most recent version
        of software flagged as Recommended (for clusters created from scratch,
        the Percona XtraDB Cluster 8.0 version will be selected instead of the
        Percona XtraDB Cluster 5.7 one regardless of the image path; for already
        existing clusters, the 8.0 vs. 5.7 branch choice will be preserved),

    * `8.0-recommended`, `5.7-recommended` - same as above, but preserves
        specific major Percona XtraDB Cluster version for newly provisioned
        clusters (ex. 8.0 will not be automatically used instead of 5.7),

    * `Latest` - automatic upgrades will choose the most recent version of
        the software available,

    * `8.0-latest`, `5.7-latest` - same as above, but preserves specific
        major Percona XtraDB Cluster version for newly provisioned
        clusters (ex. 8.0 will not be automatically used instead of 5.7),

    * *version number* - specify the desired version explicitly
        (version numbers are specified as `{{ pxc80recommended }}`,
        `{{ pxc57recommended }}`, etc.),

    * `Never` or `Disabled` - disable automatic upgrades

    !!! note

        When automatic upgrades are disabled by the `apply` option,
        Smart Update functionality will continue working for changes triggered
        by other events, such as updating a ConfigMap, rotating a password, or
        changing resource values.

2. Make sure the `versionServiceEndpoint` key is set to a valid Version
    Server URL (otherwise Smart Updates will not occur).

    1. You can use the URL of the official Percona’s Version Service (default).
        Set `versionServiceEndpoint` to `https://check.percona.com`.

    2. Alternatively, you can run Version Service inside your cluster. This
        can be done with the `kubectl` command as follows:

        ```bash
        $ kubectl run version-service --image=perconalab/version-service --env="SERVE_HTTP=true" --port 11000 --expose
        ```

        !!! note

            Version Service is never checked if automatic updates are disabled.
            If automatic updates are enabled, but Version Service URL can not be
            reached, upgrades will not occur.

3. Use the `schedule` option to specify the update checks time in CRON format.

    The following example sets the midnight update checks with the official
    Percona’s Version Service:

    ```yaml
    spec:
      updateStrategy: SmartUpdate
      upgradeOptions:
        apply: Recommended
        versionServiceEndpoint: https://check.percona.com
        schedule: "0 0 * * *"
    ...
    ```

#### Rolling Uptates strategy and semi-automatic upgrades

Semi-automatic update of Percona XtraDB Cluster should be used with the Operator
version 1.5.0 or earlier. For all newer versions, use [automatic update](update.md#smart-uptates-strategy-and-the-automatic-upgrades) instead.

1. Edit the `deploy/cr.yaml` file, setting `updateStrategy` key to 
    `RollingUpdate`.

2. Now you should [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your
    Custom Resource, setting necessary image names with a newer version tag.
    Also, you should specify the Operator version for your Percona XtraDB Cluster
    as a `crVersion` value. This version should be lower or equal to the
    version of the Operator you currently have in your Kubernetes environment.

    !!! note

        Only the incremental update to a nearest minor version of the
        Operator is supported (for example, update from 1.4.0 to 1.5.0). To update
        to a newer version, which differs from the current version by more
        than one, make several incremental updates sequentially.

    Patching Custom Resource is done with the `kubectl patch pxc` command.
    Actual image names can be found [in the list of certified images](images.md#custom-registry-images).
    For example, updating to the `{{ release }}` version should look as
    follows, depending on whether you are using Percona XtraDB Cluster 5.7 or 8.0.

    1. For Percona XtraDB Cluster 5.7 run the following:

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

    2. For Percona XtraDB Cluster 8.0 run the following:

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

3. The deployment rollout will be automatically triggered by the applied patch.
    You can track the rollout process in real time with the
    `kubectl rollout status` command with the name of your cluster:

    ```default
    $ kubectl rollout status sts cluster1-pxc
    ```

### Manual upgrade (the On Delete strategy)

Manual update of Percona XtraDB Cluster should be used with the Operator
version 1.5.0 or earlier. For all newer versions, use [automatic update](update.md#smart-uptates-strategy-and-the-automatic-upgrades) instead.

1. Edit the `deploy/cr.yaml` file, setting `updateStrategy` key to
    `OnDelete`.

2. Now you should [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your
    Custom Resource, setting necessary image names with a newer version tag.
    Also, you should specify the Operator version for your Percona XtraDB Cluster
    as a `crVersion` value. This version should be lower or equal to the
    version of the Operator you currently have in your Kubernetes environment.

    !!! note

        Only the incremental update to a nearest minor version of the
        Operator is supported (for example, update from 1.4.0 to 1.5.0). To update
        to a newer version, which differs from the current version by more
        than one, make several incremental updates sequentially.

    Patching Custom Resource is done with the `kubectl patch pxc` command.
    Actual image names can be found [in the list of certified images](images.md#custom-registry-images).
    For example, updating to the `{{ release }}` version should look as
    follows, depending on whether you are using Percona XtraDB Cluster 5.7 or 8.0.

    1. For Percona XtraDB Cluster 5.7 run the following:

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

    2. For Percona XtraDB Cluster 8.0 run the following:

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


## Minor Percona XtraDB Cluster version upgrade without the Operator upgrade

In this scenario, the database management system (Percona XtraDB Cluster) is the
only component of the cluster which is upgraded, and minor version upgrade is
the only one to occur. For example, the image `percona-xtradb-cluster:8.0.27-18.1`
can be upgraded to `percona-xtradb-cluster:8.0.25-15.1`.

