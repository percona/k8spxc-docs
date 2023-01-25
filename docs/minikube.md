# Install Percona XtraDB Cluster on Minikube

Installing the Percona Operator for MySQL based on Percona XtraDB Cluster on [minikube](https://github.com/kubernetes/minikube)
is the easiest way to try it locally without a cloud provider. Minikube runs
Kubernetes on GNU/Linux, Windows, or macOS system using a system-wide
hypervisor, such as VirtualBox, KVM/QEMU, VMware Fusion or Hyper-V. Using it is
a popular way to test the Kubernetes application locally prior to deploying it
on a cloud.

The following steps are needed to run the Operator and Percona XtraDB Cluster on
Minikube:

1. [Install Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/),
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
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/bundle.yaml
    ```

3. Deploy Percona XtraDB Cluster:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr-minimal.yaml
    ```

    !!! note

        This deploys one Percona XtraDB Cluster node and one HAProxy node. The
        [deploy/cr-minimal.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr-minimal.yaml) is for minimal non-production deployment.
        For more configuration options please see
        [deploy/cr.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr.yaml) and [Custom Resource Options](operator.md). You can clone the
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
        NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
        cluster1   cluster1-haproxy.default   ready    3                3         5m51s
        ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get pxc`
command finally shows you the cluster status as `ready`, you can try to connect
to the cluster.

1. You will need the login and password for the admin user to access the
    cluster. Use `kubectl get secrets` command to see the list of Secrets
    objects (by default the Secrets object you are interested in has
    `minimal-cluster-secrets` name). 
    You can use the following command to get the password of the `root`
    user:
    
    ``` {.bash data-prompt="$" }
    $ kubectl get secrets minimal-cluster-secrets -o yaml -o jsonpath='{.data.root}' | base64 --decode | tr '\n' ' ' && echo " "
    ```

2. Run a container with `mysql` tool and connect its console output to your
    terminal. The following command will do this, naming the new Pod
    `percona-client`:

    ```bash
    $ kubectl run -i --rm --tty percona-client --image=percona:8.0 --restart=Never -- bash -il
    ```

    Executing it may require some time to deploy the correspondent Pod.

3. Now run `mysql` tool in the percona-client command shell using the password
    obtained from the secret. The command will look different depending on
    whether your cluster provides load balancing with [HAProxy](haproxy-conf.md)
    (the default choice) or [ProxySQL](proxysql-conf.md):

    === "with HAProxy (default)"
        ```bash
        $ mysql -h minimal-cluster-haproxy -uroot -proot_password
        ```

    === "with ProxySQL"
        ```bash
        $ mysql -h minimal-cluster-proxysql -uroot -proot_password
        ```

    This command will connect you to the MySQL server.
