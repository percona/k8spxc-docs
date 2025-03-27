# Install Percona XtraDB Cluster on Minikube

{%set clusterName = 'minimal-cluster' %}

Installing the Percona Operator for MySQL based on Percona XtraDB Cluster on [minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube)
is the easiest way to try it locally without a cloud provider. Minikube runs
Kubernetes on GNU/Linux, Windows, or macOS system using a system-wide
hypervisor, such as VirtualBox, KVM/QEMU, VMware Fusion or Hyper-V. Using it is
a popular way to test the Kubernetes application locally prior to deploying it
on a cloud.

The following steps are needed to run the Operator and Percona XtraDB Cluster on
Minikube:

1. [Install Minikube :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/install-minikube/),
    using a way recommended for your system. This includes the installation of
    the following three components:

    1. kubectl tool,

    2. a hypervisor, if it is not already installed,

    3. actual Minikube package.

    After the installation, run `minikube start --memory=4096 --cpus=3`
    (parameters increase the virtual machine limits for the CPU cores and memory,
    to ensure stable work of the Operator). Being executed, this command will
    download needed virtualized images, then initialize and run the
    cluster.

2. Deploy the operator with the following command:

    ```{.bash data-prompt="$" }
    $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/bundle.yaml
    ```

3. Deploy Percona XtraDB Cluster:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr-minimal.yaml
    ```

    !!! note

        This deploys one Percona XtraDB Cluster node and one HAProxy node. The
        [deploy/cr-minimal.yaml :octicons-link-external-16:](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr-minimal.yaml) is for minimal non-production deployment.
        For more configuration options please see
        [deploy/cr.yaml :octicons-link-external-16:](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr.yaml) and [Custom Resource Options](operator.md). You can clone the
        repository with all manifests and source code by executing the following
        command:

        ``` {.bash data-prompt="$" }
        $ git clone -b v{{ release }} https://github.com/percona/percona-xtradb-cluster-operator
        ```

        After editing the needed options, apply your modified `deploy/cr.yaml` file as follows:

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/cr.yaml
        ```

    Creation process will take some time. When the process is over your
    cluster will obtain the `ready` status. You can check it with the following
    command:

    ```{.bash data-prompt="$" }
    $ kubectl get pxc
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME              ENDPOINT                          STATUS   PXC   PROXYSQL   HAPROXY   AGE
        minimal-cluster   minimal-cluster-haproxy.default   ready    3                3         5m51s
        ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When the `kubectl get pxc`
command output shows you the cluster status as `ready`, you can try to connect
to the cluster.

{% include 'assets/fragments/connectivity.txt' %}
