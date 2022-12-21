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

Only the incremental update to a nearest minor version of the
Operator is supported (for example, update from 1.4.0 to 1.5.0). To update
to a newer version, which differs from the current version by more
than one, make several incremental updates sequentially.

#### Manual upgrade

The upgrade includes the following steps.

1. Update the [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
    for the Operator, taking it from the official repository on Github, and do
    the same for the Role-based access control:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/crd.yaml
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/rbac.yaml
    ```

2. Now you should [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your
    deployment, supplying necessary image name with a newer version tag. You can find the proper
    image name for the current Operator release [in the list of certified images](images.md#custom-registry-images)
    (for older releases, please refer to the [old releases documentation archive](archive.md)).
    For example, updating to the `{{ release }}` version should look as
    follows.

    ``` {.bash data-prompt="$" }
    $ kubectl patch deployment percona-xtradb-cluster-operator \
      -p'{"spec":{"template":{"spec":{"containers":[{"name":"percona-xtradb-cluster-operator","image":"percona/percona-xtradb-cluster-operator:{{ release }}"}]}}}}'
    ```

3. The deployment rollout will be automatically triggered by the applied patch.
    You can track the rollout process in real time with the
    `kubectl rollout status` command with the name of your cluster:

    ``` {.bash data-prompt="$" }
    $ kubectl rollout status deployments percona-xtradb-cluster-operator
    ```

    !!! note

        Labels set on the Operator Pod will not be updated during upgrade.

#### Upgrade via helm

If you have [installed the Operator using Helm](helm.md), you can upgrade the
Operator with the `helm upgrade` command.

1. In case if you installed the Operator with no [customized parameters](https://github.com/percona/percona-helm-charts/tree/main/charts/pxc-operator#installing-the-chart), the upgrade can be done as follows: 

    ``` {.bash data-prompt="$" }
    $ helm upgrade my-op percona/pxc-operator --version {{ release }}
    ```

    The `my-op` parameter in the above example is the name of a [release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts)
    which which you have chosen for the Operator when installing its Helm chart.

    If the Operator was installed with some [customized parameters](https://github.com/percona/percona-helm-charts/tree/main/charts/pxc-operator#installing-the-chart), you should list these options in the upgrade command.
    
    
    !!! note
    
        You can get list of used options in YAML format with the `helm get values my-op -a > my-values.yaml` command, and this file can be directly passed to the upgrade command as follows:

        ``` {.bash data-prompt="$" }
        $ helm upgrade my-op percona/pxc-operator --version {{ release }} -f my-values.yaml
        ```

2. Update the [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
    for the Operator, taking it from the official repository on Github, and do
    the same for the Role-based access control:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/crd.yaml
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/rbac.yaml
    ```

!!! note

    You can use `helm upgrade` to upgrade the Operator only. The Database Management System (Percona XtraDB Cluster) should be upgraded in the same way whether you used helm to install it or not.

### Upgrading Percona XtraDB Cluster

The following section presumes that you are upgrading your cluster within the
*Smart Update strategy*, when the Operator controls how the objects
are updated. Smart Update strategy is on when the `updateStrategy` key in the
[Custom Resource](operator.md) configuration file is set to `SmartUpdate`
(this is the default value and the recommended way for upgrades).

!!! note

    Alternatively, you can set this key to `RollingUpdate` or `OnDelete`, which
    means that you will have to [carry on updates manually](update_manually.md)
    by interacting with Kubernetes at a lower level.

Under the Smart Updates strategy, the Operator will either detect the
availability of the Percona XtraDB Cluster version, or rely on the user's choice
of the version. To check the availability of the new version, the Operator will
query a special *Version Service* server at scheduled times to obtain fresh
information about version numbers and valid image paths.

If the current version should be upgraded, the Operator updates the
Custom Resource to reflect the new image paths and carries on sequential Pods
deletion, allowing StatefulSet to redeploy the cluster Pods with the new image.
Pods are restarted by the Operator in the order, which assures the primary
instance to be updated last, preventing possible connection issues until the
whole cluster is updated to the new settings.

You can configure Percona XtraDB Cluster upgrade as follows:

1. First of all you should patch the Custom Resource version in the
    `spec.crVersion` field for your cluster to match the the Custom Resource
    Definition upgrade [you have done](update.md#manual-upgrade) while upgrading
    the Operator. The appropriate patch command for the cluster named `cluster1`
    looks as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl patch pxc cluster1 --type=merge --patch '{"spec":{"crVersion":"{{ release }}"}}'
    ```

2. Change the `upgradeOptions.apply`  option from `Disabled` to one of the
    following values:

    * `Recommended` - [scheduled](operator.md#upgradeoptions-schedule) upgrades
        will choose the most recent version of software flagged as "Recommended"
        (for clusters created from scratch, the Percona XtraDB Cluster 8.0
        version will be selected instead of the Percona XtraDB Cluster 5.7 one
        regardless of the image path; for already existing clusters, the 8.0 vs.
        5.7 branch choice will be preserved),

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
        `{{ pxc57recommended }}`, etc.). Actual versions can be found
        [in the list of certified images](images.md#custom-registry-images)
        (for older releases, please refer to the
        [old releases documentation archive](archive.md)).

    * `Never` or `Disabled` - continue using Smart Update strategy with disabled
        upgrades (the default choice starting from the Operator 1.12.0).

3. Make sure the `upgradeOptions.versionServiceEndpoint` key is set to a valid
    Version Server URL (otherwise upgrades will not occur).

    1. You can use the URL of the official Percona’s Version Service (default).
        Set `upgradeOptions.versionServiceEndpoint` to `https://check.percona.com`.

    2. Alternatively, you can run Version Service inside your cluster. This
        can be done with the `kubectl` command as follows:

        ``` {.bash data-prompt="$" }
        $ kubectl run version-service --image=perconalab/version-service --env="SERVE_HTTP=true" --port 11000 --expose
        ```

    !!! note

        Version Service is never checked if automatic updates are disabled in 
        the `upgradeOptions.apply` option. If automatic updates are enabled, but
        the Version Service URL can not be reached, no updgrades will be
        performed.

4. Use the `upgradeOptions.schedule` option to specify the update check time in CRON format.

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

!!! note

    When automatic upgrades are disabled by the `apply` option, Smart Update
    functionality will continue restarting Pods in a proper order for changes
    triggered by other events, such as updating a ConfigMap, rotating a
    password, or changing resource values. That's why Smart Update strategy is
    useful, even when the automatic upgrade by querying the Version Service
    server is disabled.

## Minor Percona XtraDB Cluster version upgrade without the Operator upgrade

In this scenario, the database management system (Percona XtraDB Cluster) is the
only component of the cluster which is upgraded, and minor version upgrade is
the only one to occur. For example, the image `percona-xtradb-cluster:8.0.25-15.1`
can be upgraded to `percona-xtradb-cluster:8.0.27-18.1`.

You can find the proper image name for the current Operator release [in the list of certified images](images.md#custom-registry-images). For older releases, please refer to the [old releases documentation archive](archive.md).
