> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Install Percona XtraDB Cluster on Minikube

Installing the Percona Operator for MySQL based on Percona XtraDB Cluster on [minikube](https://github.com/kubernetes/minikube) is the easiest way to try it locally without a cloud provider. Minikube runs Kubernetes on GNU/Linux, Windows, or macOS system using a system-wide hypervisor, such as VirtualBox, KVM/QEMU, VMware Fusion or Hyper-V. Using it is a popular way to test the Kubernetes application locally prior to deploying it on a cloud.

The following steps are needed to run the Operator and Percona XtraDB Cluster on Minikube:

1. [Install Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) , using a way recommended for your system. This includes the installation of the following three components:

   1. kubectl tool,
   1. a hypervisor, if it is not already installed,
   1. actual Minikube package.

   After the installation, run `minikube start --memory=4096 --cpus=3` (parameters increase the virtual machine limits for the CPU cores and memory, to ensure stable work of the Operator). Being executed, this command will download needed virtualized images, then initialize and run the cluster.

1. Deploy the operator with the following command:

   ```
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/bundle.yaml
   ```

1. Deploy Percona XtraDB Cluster:

   ```
   kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/cr-minimal.yaml
   ```

   Note

   This deploys one Percona XtraDB Cluster node and one HAProxy node. The [deploy/cr-minimal.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/cr-minimal.yaml) is for minimal non-production deployment. For more configuration options please see [deploy/cr.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/cr.yaml) and [Custom Resource Options](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html). You can clone the repository with all manifests and source code by executing the following command:

   ```
   git clone -b v1.20.0 https://github.com/percona/percona-xtradb-cluster-operator
   ```

   After editing the needed options, apply your modified `deploy/cr.yaml` file as follows:

   ```
   kubectl apply -f deploy/cr.yaml
   ```

   Creation process will take some time. When the process is over your cluster will obtain the `ready` status. You can check it with the following command:

   ```
   kubectl get pxc
   ```

   Expected output

   ```
   NAME              ENDPOINT                          STATUS   PXC   PROXYSQL   HAPROXY   AGE
   minimal-cluster   minimal-cluster-haproxy.default   ready    3                3         5m51s
   ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When the `kubectl get pxc` command output shows you the cluster status as `ready`, you can try to connect to the cluster.

To connect to Percona XtraDB Cluster you will need the password for the root user. Passwords are stored in the Secrets object.

Here’s how to get it:

1. List the Secrets objects.

   ```
   kubectl get secrets
   ```

   The Secrets object you are interested in has the `minimal-cluster-secrets` name by default.

1. Use the following command to get the password of the `root` user. Substitute the `<namespace>` placeholder with your value (and use the different Secrets object name instead of the `minimal-cluster-secrets`, if needed):

   ```
   kubectl get secret minimal-cluster-secrets -n <namespace> --template='{{.data.root | base64decode}}{{"\n"}}'
   ```

1. Run a container with `mysql` tool and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

   ```
   kubectl run -n <namespace> -i --rm --tty percona-client --image=percona/percona-xtradb-cluster:8.4.8-8.1 --restart=Never -- bash -il
   ```

   Executing it may require some time to deploy the corresponding Pod.

1. Now run the `mysql` tool in the `percona-client` command shell using the password obtained from the Secret instead of the `<root_password>` placeholder. The command will look different depending on whether your cluster provides load balancing with [HAProxy](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/haproxy-conf.html) (the default choice) or [ProxySQL](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/proxysql-conf.html):

   **with HAProxy (default)**

   ```
   mysql -h minimal-cluster-haproxy -uroot -p'<root_password>'
   ```

   **with ProxySQL**

   ```
   mysql -h minimal-cluster-proxysql -uroot -p'<root_password>'
   ```

   This command will connect you to the MySQL server.
