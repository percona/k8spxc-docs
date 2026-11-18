> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Install Percona XtraDB Cluster using Helm

[Helm](https://github.com/helm/helm) is the package manager for Kubernetes. Percona Helm charts can be found in [percona/percona-helm-charts](https://github.com/percona/percona-helm-charts) repository on Github.

## Pre-requisites

1. The **Helm** package manager. Install it [following the official installation instructions](https://docs.helm.sh/using_helm/#installing-helm) .

   Note

   Helm v3 is needed to run the following steps.

1. The **kubectl** tool to manage and deploy applications on Kubernetes. Install it [following the official installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/) .

## Installation

Here’s a sequence of steps to follow:

1. Add the Percona’s Helm charts repository and make your Helm client up to date with it:

   ```
   helm repo add percona https://percona.github.io/percona-helm-charts/
   helm repo update
   ```

1. It is a good practice to isolate workloads in Kubernetes via namespaces. Create a namespace:

   ```
   kubectl create namespace <namespace>
   ```

1. Install the Percona Operator for MySQL based on Percona XtraDB Cluster:

   ```
   helm install my-op percona/pxc-operator --version 1.20.1 --namespace <namespace>
   ```

   The `--version` flag pins the chart so that the installed Operator matches this documentation. The `namespace` is the name of your namespace. The `my-op` parameter in the above example is the name of [a new release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) which is created for the Operator when you install its Helm chart (use any name you like).

1. Install Percona XtraDB Cluster:

   ```
   helm install my-db percona/pxc-db --version 1.20.1 --namespace <namespace>
   ```

   The `my-db` parameter in the above example is the name of [a new release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) which is created for the Percona XtraDB Cluster when you install its Helm chart (use any name you like).

1. Check the Operator and the Percona XtraDB Cluster Pods status.

   ```
   kubectl get pxc -n <namespace>
   ```

   The creation process may take some time. When the process is over your cluster obtains the `ready` status.

   Expected output

   ```
   NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
   cluster1   cluster1-haproxy.default   ready    3                3         33d
   ```

You have successfully installed and deployed the Operator with default parameters.

This deploys default Percona XtraDB Cluster configuration with three HAProxy and three XtraDB Cluster instances.

You can find in the documentation for the charts, which [Operator](https://github.com/percona/percona-helm-charts/tree/main/charts/pxc-operator#installing-the-chart) and [database](https://github.com/percona/percona-helm-charts/tree/main/charts/pxc-db#installing-the-chart) parameters can be customized during installation. Also you can check the rest of the Operator’s parameters in the [Custom Resource options reference](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html).

## Next steps

[Connect to Percona XtraDB Cluster](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/connect.html)

## Useful links

[Install Percona XtraDB Cluster with customized parameters](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/custom-install.html)
