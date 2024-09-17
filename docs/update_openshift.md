# Upgrade Database and Operator on OpenShift

{%set commandName = 'oc' %}

Upgrading database and Operator on [Red Hat Marketplace :octicons-link-external-16:](https://marketplace.redhat.com) or to upgrade Red Hat certified Operators on [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) generally follows the [standard upgrade scenario](update.md), but includes additional steps specific for these platforms.

## Upgrading the Operator and CRD

=== "Operator 1.13.0 and older"

    1. First of all you need to manually update `initImage` Custom Resource option with the value of an alternative initial Operator installation image. You need doing this for all database clusters managed by the Operator. Without this step the cluster will go into error state after the Operator upgrade.

        1. Find the `percona-xtradb-cluster-operator` Pod name with `kubectl get pods` command. Let's say the Pod name is  `percona-xtradb-cluster-operator-7cfd666b69-tk4rq`. Now see the actual image name with the `kubectl describe` command:

        ``` {.bash data-prompt="$" }
        $ kubectl describe pod percona-xtradb-cluster-operator-7cfd666b69-tk4rq | grep Image:
        ```
        
        ??? example "Expected output"

            ``` {.text .no-copy}
            Image:         registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:4edb5a53230e023bbe54c8e9e1154579668423fc3466415d5b04b8304a8e01d7
            ```

        2. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to update the `initImage` option of your cluster Custom Resource with this value. Supposing that your cluster name is `cluster1`, the command should look as follows:


            ``` {.bash data-prompt="$" }
            $ kubectl patch pxc cluster1 --type=merge --patch '{
                "spec": {
                   "initImage":"registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:4edb5a53230e023bbe54c8e9e1154579668423fc3466415d5b04b8304a8e01d7"
                }}'
            ```

    2. Now you can actually update the Operator.

        1. Update the [Custom Resource Definition :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) for the Operator, taking it from the official repository on Github, and do the same for the Role-based access control:

            ``` {.bash data-prompt="$" }
            $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/crd.yaml
            $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/rbac.yaml
            ```

        2. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your deployment, supplying necessary image name with a newer version tag. You can find the proper image name for the current Operator release [in the list of certified images](images.md) (for older releases, please refer to the [old releases documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/))). For example, updating to the `{{ release }}` version should look as follows.

            ``` {.bash data-prompt="$" }
            $ kubectl patch deployment percona-xtradb-cluster-operator \
              -p'{"spec":{"template":{"spec":{"containers":[{"name":"percona-xtradb-cluster-operator","image":"percona/percona-xtradb-cluster-operator:{{ release }}"}]}}}}'
            ```

        3. The deployment rollout will be automatically triggered by the applied patch. You can track the rollout process in real time with the `kubectl rollout status` command with the name of your cluster:

            ``` {.bash data-prompt="$" }
            $ kubectl rollout status deployments percona-xtradb-cluster-operator
            ```

=== "Operator 1.14.0"

    1. First of all you need to manually update `initContainer.image` Custom Resource option with the value of an alternative initial Operator installation image. You need doing this for all database clusters managed by the Operator. Without this step the cluster will go into error state after the Operator upgrade.

        1. Find the `percona-xtradb-cluster-operator` Pod name with `kubectl get pods` command. Let's say the Pod name is  `percona-xtradb-cluster-operator-7cfd666b69-tk4rq`. Now see the actual image name with the `kubectl describe` command:

        ``` {.bash data-prompt="$" }
        $ kubectl describe pod percona-xtradb-cluster-operator-7cfd666b69-tk4rq | grep Image:
        ```
        
        ??? example "Expected output"

            ``` {.text .no-copy}
            Image:         registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:4edb5a53230e023bbe54c8e9e1154579668423fc3466415d5b04b8304a8e01d7
            ```

        2. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to update the `initContainer.image` option of your cluster Custom Resource with this value. Supposing that your cluster name is `cluster1`, the command should look as follows:


            ``` {.bash data-prompt="$" }
            $ kubectl patch pxc cluster1 --type=merge --patch '{
                "spec": {
                   "initContainer": { "image": "registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:4edb5a53230e023bbe54c8e9e1154579668423fc3466415d5b04b8304a8e01d7" }
                }}'
            ```

    2. Now you can actually update the Operator.

        1. Update the [Custom Resource Definition :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) for the Operator, taking it from the official repository on Github, and do the same for the Role-based access control:

            ``` {.bash data-prompt="$" }
            $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/crd.yaml
            $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/rbac.yaml
            ```

        2. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your deployment, supplying necessary image name with a newer version tag. You can find the proper image name for the current Operator release [in the list of certified images](images.md) (for older releases, please refer to the [old releases documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/))). For example, updating to the `{{ release }}` version should look as follows.

            ``` {.bash data-prompt="$" }
            $ kubectl patch deployment percona-xtradb-cluster-operator \
              -p'{"spec":{"template":{"spec":{"containers":[{"name":"percona-xtradb-cluster-operator","image":"percona/percona-xtradb-cluster-operator:{{ release }}"}]}}}}'
            ```

        3. The deployment rollout will be automatically triggered by the applied patch. You can track the rollout process in real time with the `kubectl rollout status` command with the name of your cluster:

            ``` {.bash data-prompt="$" }
            $ kubectl rollout status deployments percona-xtradb-cluster-operator
            ```

=== "Operator 1.15.0 and newer"

    1. Update the [Custom Resource Definition :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) for the Operator, taking it from the official repository on Github, and do the same for the Role-based access control:

        ``` {.bash data-prompt="$" }
        $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/crd.yaml
        $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/rbac.yaml
        ```

    2. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your deployment, supplying necessary image name with a newer version tag. You can find the proper image name for the current Operator release [in the list of certified images](images.md) (for older releases, please refer to the [old releases documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/))). For example, updating to the `{{ release }}` version should look as follows.

        ``` {.bash data-prompt="$" }
        $ kubectl patch deployment percona-xtradb-cluster-operator \
          -p'{"spec":{"template":{"spec":{"containers":[{"name":"percona-xtradb-cluster-operator","image":"percona/percona-xtradb-cluster-operator:{{ release }}"}]}}}}'
        ```

    3. The deployment rollout will be automatically triggered by the applied patch. You can track the rollout process in real time with the `kubectl rollout status` command with the name of your cluster:

        ``` {.bash data-prompt="$" }
        $ kubectl rollout status deployments percona-xtradb-cluster-operator
        ```

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

2. Find the new `percona-xtradb-cluster-operator` Pod name with `kubectl get pods` command (it had changed during the Operator upgrade). Let's say the Pod name is  `percona-xtradb-cluster-operator-7547d9cd9d-6klkl`. Now see the **new** image name:

    ``` {.bash data-prompt="$" }
    $ kubectl describe pod percona-xtradb-cluster-operator-7547d9cd9d-6klkl | grep Image:
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        Image:         registry.connect.redhat.com/percona/percona-xtradb-cluster-operator@sha256:e8c0237ace948653d8f3e297ec67276f23f4f7fb4f8018f97f246b65604d49e6
        ```

3. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to update the init image name in your cluster Custom Resource with this value. Supposing that your cluster name is `cluster1`, the command should look as follows:

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

    Now use the same way to patch your Custom Resource, setting necessary Custom Resource version and other images names with a newer version tag. Needed image names can be found [in the list of certified images](images.md) (for older releases, please refer to the [old releases documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/)). For example, updating `cluster1` cluster to the `{{ release }}` version should look as follows:

    === "For Percona XtraDB Cluster 8.0"
   
        ```bash
        $ kubectl patch pxc cluster1 --type=merge --patch '{
           "spec": {
               "crVersion":"{{ release }}",
               "pxc":{ "image": "percona/percona-xtradb-cluster:{{ pxc80recommended }}" },
               "proxysql": { "image": "percona/proxysql2:{{ proxysqlrecommended }}" },
               "haproxy":  { "image": "percona/haproxy:{{ haproxyrecommended }}" },
               "backup":   { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-pxc8.0-backup-pxb{{ pxb80recommended }}" },
               "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector-fluentbit{{ fluentbitrecommended }}" },
               "pmm":      { "image": "percona/pmm-client:{{ pmm2recommended }}" }
           }}'
        ```
   
    === "For Percona XtraDB Cluster 5.7"
   
        ```bash
        $ kubectl patch pxc cluster1 --type=merge --patch '{
           "spec": {
               "crVersion":"{{ release }}",
               "pxc":{ "image": "percona/percona-xtradb-cluster:{{ pxc57recommended }}" },
               "proxysql": { "image": "percona/proxysql2:{{ proxysqlrecommended }}" },
               "haproxy":  { "image": "percona/haproxy:{{ haproxyrecommended }}" },
               "backup":   { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-pxc5.7-backup-pxb{{ pxb57recommended }}" },
               "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector-fluentbit{{ fluentbitrecommended }}" },
               "pmm":      { "image": "percona/pmm-client:{{ pmm2recommended }}" }
           }}'
        ```

    !!! warning

        The above command upgrades various components of the cluster including PMM Client. If you didn't follow the [official recommendation :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/how-to/upgrade.html) to upgrade PMM Server before upgrading PMM Client, you can avoid PMM Client upgrade by removing it from the list of images as follows:

        === "For Percona XtraDB Cluster 8.0"
   
            ```bash
            $ kubectl patch pxc cluster1 --type=merge --patch '{
               "spec": {
                   "crVersion":"{{ release }}",
                   "pxc":{ "image": "percona/percona-xtradb-cluster:{{ pxc80recommended }}" },
                   "proxysql": { "image": "percona/proxysql2:{{ proxysqlrecommended }}" },
                   "haproxy":  { "image": "percona/haproxy:{{ haproxyrecommended }}" },
                   "backup":   { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-pxc8.0-backup-pxb{{ pxb80recommended }}" },
                   "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector-fluentbit{{ fluentbitrecommended }}" }
               }}'
            ```

        === "For Percona XtraDB Cluster 5.7"
   
            ```bash
            $ kubectl patch pxc cluster1 --type=merge --patch '{
               "spec": {
                   "crVersion":"{{ release }}",
                   "pxc":{ "image": "percona/percona-xtradb-cluster:{{ pxc57recommended }}" },
                   "proxysql": { "image": "percona/proxysql2:{{ proxysqlrecommended }}" },
                   "haproxy":  { "image": "percona/haproxy:{{ haproxyrecommended }}" },
                   "backup":   { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-pxc5.7-backup-pxb{{ pxb57recommended }}" },
                   "logcollector": { "image": "percona/percona-xtradb-cluster-operator:{{ release }}-logcollector-fluentbit{{ fluentbitrecommended }}" }
               }}'
            ```

5. The deployment rollout will be automatically triggered by the applied patch. You can track the rollout process in real time with the `kubectl rollout status` command with the name of your cluster:

    ```default
    $ kubectl rollout status sts cluster1-pxc
    ```
