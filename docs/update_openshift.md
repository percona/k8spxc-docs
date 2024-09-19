# Upgrade Database and Operator on OpenShift

{%set commandName = 'oc' %}

Upgrading database and Operator on [Red Hat Marketplace :octicons-link-external-16:](https://marketplace.redhat.com) or to upgrade Red Hat certified Operators on [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) generally follows the [standard upgrade scenario](update.md), but includes a number of special steps specific for these platforms.

## Upgrading the Operator and CRD

=== "Operator 1.13.0 and older"

    1. First of all you need to manually update `initImage` Custom Resource option with the value of an alternative initial Operator installation image. You need doing this for all database clusters managed by the Operator. Without this step the cluster will go into error state after the Operator upgrade.

        1. Find the initial Operator installation image with `kubectl get deploy` command:

            ``` {.bash data-prompt="$" }
            $ kubectl get deploy percona-xtradb-cluster-operator -o yaml
            ```
        
            ??? example "Expected output"

                ``` {.text .no-copy}
                ...
                "initContainer" : {
                  "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:4edb5a53230e023bbe54c8e9e1154579668423fc3466415d5b04b8304a8e01d7"
                },
                ...
                ```

        2. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to update the `initImage` option of your cluster Custom Resource with this value. Supposing that your cluster name is `cluster1`, the command should look as follows:

            ``` {.bash data-prompt="$" }
            $ kubectl patch pxc cluster1 --type=merge --patch '{
                "spec": {
                   "initImage":"registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:4edb5a53230e023bbe54c8e9e1154579668423fc3466415d5b04b8304a8e01d7"
                }}'
            ```

    2. Now you can actually update the Operator via the [Operator Lifecycle Manager (OLM) :octicons-link-external-16:](https://docs.redhat.com/en/documentation/openshift_container_platform/4.2/html/operators/understanding-the-operator-lifecycle-manager-olm#olm-overview_olm-understanding-olm) web interface.

        Login to your OLM installation and list installed Operators for your Namespace to see if there are upgradable items:

        ![image](assets/images/olm4.svg)

        Click the "Upgrade available" link to see upgrade details, then click "Preview InstallPlan" button, and finally "Approve" to upgrade the Operator.

=== "Operator 1.14.0"

    1. First of all you need to manually update `initContainer.image` Custom Resource option with the value of an alternative initial Operator installation image. You need doing this for all database clusters managed by the Operator. Without this step the cluster will go into error state after the Operator upgrade.

        1. Find the initial Operator installation image with `kubectl get deploy` command:

            ``` {.bash data-prompt="$" }
            $ kubectl get deploy percona-xtradb-cluster-operator -o yaml
            ```
        
            ??? example "Expected output"

                ``` {.text .no-copy}
                ...
                "initContainer" : {
                  "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:4edb5a53230e023bbe54c8e9e1154579668423fc3466415d5b04b8304a8e01d7"
                },
                ...
                ```

        2. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to update the `initContainer.image` option of your cluster Custom Resource with this value. Supposing that your cluster name is `cluster1`, the command should look as follows:

            ``` {.bash data-prompt="$" }
            $ kubectl patch pxc cluster1 --type=merge --patch '{
                "spec": {
                   "initContainer": { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:4edb5a53230e023bbe54c8e9e1154579668423fc3466415d5b04b8304a8e01d7" }
                }}'
            ```

    2. Now you can actually update the Operator via the [Operator Lifecycle Manager (OLM) :octicons-link-external-16:](https://docs.redhat.com/en/documentation/openshift_container_platform/4.2/html/operators/understanding-the-operator-lifecycle-manager-olm#olm-overview_olm-understanding-olm) web interface.

        Login to your OLM installation and list installed Operators for your Namespace to see if there are upgradable items:

        ![image](assets/images/olm4.svg)

        Click the "Upgrade available" link to see upgrade details, then click "Preview InstallPlan" button, and finally "Approve" to upgrade the Operator.

=== "Operator 1.15.0 and newer"

    You can actually update the Operator via the [Operator Lifecycle Manager (OLM) :octicons-link-external-16:](https://docs.redhat.com/en/documentation/openshift_container_platform/4.2/html/operators/understanding-the-operator-lifecycle-manager-olm#olm-overview_olm-understanding-olm) web interface.

    Login to your OLM installation and list installed Operators for your Namespace to see if there are upgradable items:

    ![image](assets/images/olm4.svg)

    Click the "Upgrade available" link to see upgrade details, then click "Preview InstallPlan" button, and finally "Approve" to upgrade the Operator.

## Upgrading Percona XtraDB Cluster

1. Make sure that `spec.updateStrategy` option in the [Custom Resource](operator.md)
    is set to `SmartUpdate`, `spec.upgradeOptions.apply` option is set to `Never`
    or `Disabled` (this means that the Operator will not carry on upgrades
    automatically).
    
    ```yaml
    ...
    spec:
      updateStrategy: SmartUpdate
      upgradeOptions:
        apply: Disabled
        ...
    ```

2. Find the **new** initial Operator installation image name with `kubectl get deploy` command (it had changed during the Operator upgrade):

    ``` {.bash data-prompt="$" }
    $ kubectl get deploy percona-xtradb-cluster-operator -o yaml
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        ...
        "initContainer" : {
          "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:e8c0237ace948653d8f3e297ec67276f23f4f7fb4f8018f97f246b65604d49e6"
        },
        ...
        ```

3. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to update the init image in your cluster Custom Resource with this value. Supposing that your cluster name is `cluster1`, the command should look as follows:

    === "Operator 1.13.0 and older"

        ``` {.bash data-prompt="$" }
        $ kubectl patch pxc cluster1 --type=merge --patch '{
            "spec": {               
               "initImage": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:e8c0237ace948653d8f3e297ec67276f23f4f7fb4f8018f97f246b65604d49e6"
            }}'
        ```

    === "Operator 1.14.0 and newer"

        ``` {.bash data-prompt="$" }
        $ kubectl patch pxc cluster1 --type=merge --patch '{
            "spec": {               
               "initContainer": { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:e8c0237ace948653d8f3e297ec67276f23f4f7fb4f8018f97f246b65604d49e6" }
            }}'
        ```

    Now use the same way to patch your Custom Resource, setting necessary Custom Resource version and other images with a newer version tag. Needed images can be found in the output of the same `kubectl get deploy` command:

    ``` {.bash data-prompt="$" }
    $ kubectl get deploy percona-xtradb-cluster-operator -o yaml
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        ...
        "pxc": {
          "size": 3,
          "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:b526b83865ca26808aa1ef96f64319f65deba94b76c5b5b6aa181981ebd4282f",
        ...
        "haproxy": {
          "enabled": true,
          "size": 3,
          "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:cbd4f1791941765eb6732f2dc88bad29bf23469898bd30f02d22a95c0f2aab9b",
        ...
        "proxysql": {
          "enabled": false,
          "size": 3,
          "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:24f6d959efcf2083addf42f3b816220654133dc8a5a8a989ffd4caffe122e19c",
        ...
        "logcollector": {
          "enabled": true,
          "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:cb6ccda7839b3205ffaf5cb8016d1f91ed3be4438334d2122beb38791a32c015",
        ...
        "pmm": {
          "enabled": false,
          "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:165f97cdae2b6def546b0df7f50d88d83c150578bdb9c992953ed866615016f1",
        ...
        "backup": {
          "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:483acaa57378ee5529479dbcabb3b8002751c1c43edd5553b52f001f323d4723",
        ...
        ```

    When you have found all needed images, [apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your Custom Resource, setting necessary Custom Resource version and images.

    ```bash
    $ kubectl patch pxc cluster1 --type=merge --patch '{
       "spec": {
           "crVersion":"{{ release }}",
           "pxc":{ "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:b526b83865ca26808aa1ef96f64319f65deba94b76c5b5b6aa181981ebd4282f" },
           "proxysql": { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:24f6d959efcf2083addf42f3b816220654133dc8a5a8a989ffd4caffe122e19c" },
           "haproxy":  { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:cbd4f1791941765eb6732f2dc88bad29bf23469898bd30f02d22a95c0f2aab9b" },
           "backup":   { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:483acaa57378ee5529479dbcabb3b8002751c1c43edd5553b52f001f323d4723" },
           "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector-fluentbit{{ fluentbitrecommended }}" },
           "pmm":      { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:165f97cdae2b6def546b0df7f50d88d83c150578bdb9c992953ed866615016f1" }
       }}'
    ```

    !!! warning

        The above command upgrades various components of the cluster including PMM Client. If you didn't follow the [official recommendation :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/how-to/upgrade.html) to upgrade PMM Server before upgrading PMM Client, you can avoid PMM Client upgrade by removing it from the list of images as follows:

        ```bash
        $ kubectl patch pxc cluster1 --type=merge --patch '{
           "spec": {
               "crVersion":"{{ release }}",
               "pxc":{ "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:b526b83865ca26808aa1ef96f64319f65deba94b76c5b5b6aa181981ebd4282f" },
               "proxysql": { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:24f6d959efcf2083addf42f3b816220654133dc8a5a8a989ffd4caffe122e19c" },
               "haproxy":  { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:cbd4f1791941765eb6732f2dc88bad29bf23469898bd30f02d22a95c0f2aab9b" },
               "backup":   { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator-containers@sha256:483acaa57378ee5529479dbcabb3b8002751c1c43edd5553b52f001f323d4723" },
               "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector-fluentbit{{ fluentbitrecommended }}" }
               }}'
            ```

4. The deployment rollout will be automatically triggered by the applied patch. You can track the rollout process in real time with the `kubectl rollout status` command with the name of your cluster:

    ```default
    $ kubectl rollout status sts cluster1-pxc
    ```
