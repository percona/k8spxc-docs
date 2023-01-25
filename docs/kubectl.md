# Install Percona XtraDB Cluster using kubectl

The [kubectl](https://kubernetes.io/docs/tasks/tools/) command line utility is a tool used before anything else to interact with Kubernetes and containerized applications running on it. Users can run kubectl to deploy applications, manage cluster resources, check logs, etc.

## Pre-requisites

The following tools are used in this guide and therefore should be preinstalled:

1. The **Git** distributed version control system. You can install it following the [official installation instructions](https://github.com/git-guides/install-git).

2. The **kubectl** tool to manage and deploy applications on Kubernetes, included in most Kubernetes distributions. Install it, if not present, [following the official installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

## Install the Operator and Percona XtraDB Cluster

The following steps are needed to deploy the Operator and Percona XtraDB Cluster in
your Kubernetes environment:

1. Deploy the Operator with the following command:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/bundle.yaml
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusters.pxc.percona.com created
        customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusterbackups.pxc.percona.com created
        customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusterrestores.pxc.percona.com created
        customresourcedefinition.apiextensions.k8s.io/perconaxtradbbackups.pxc.percona.com created
        role.rbac.authorization.k8s.io/percona-xtradb-cluster-operator created
        serviceaccount/percona-xtradb-cluster-operator created
        rolebinding.rbac.authorization.k8s.io/service-account-percona-xtradb-cluster-operator created
        deployment.apps/percona-xtradb-cluster-operator created
        ```

    As the result you will have the Operator Pod up and running. 

2. Deploy Percona XtraDB Cluster:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr.yaml
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        perconaxtradbcluster.pxc.percona.com/ cluster1 created
        ```

    !!! note

        This deploys default Percona XtraDB Cluster configuration with three
        HAProxy and three XtraDB Cluster instances. Please see
        [deploy/cr.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr.yaml)
        and [Custom Resource Options](operator.md) for the configuration
        options. You can clone the repository with all manifests and source code
        by executing the following command:

        ```{.bash data-prompt="$" }
        $ git clone -b v{{ release }} https://github.com/percona/percona-xtradb-cluster-operator
        ```

        After editing the needed options, apply your modified `deploy/cr.yaml` file as follows:

        ```{.bash data-prompt="$" }
        $ kubectl apply -f deploy/cr.yaml
        ```

    The creation process may take some time. When the process is over your
    cluster will obtain the `ready` status. You can check it with the following
    command:

    ```{.bash data-prompt="$" }
    $ kubectl get pxc
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
        cluster1   cluster1-haproxy.default   ready    3                3         5m51s
        ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get pxc`
command finally shows you the cluster status as `ready`, you can try to connect
to the cluster.

{% include 'assets/fragments/connectivity.txt' %}
