> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Install Percona XtraDB Cluster using kubectl

A Kubernetes Operator is a special type of controller introduced to simplify complex deployments. The Operator extends the Kubernetes API with custom resources.

The [Percona Operator for MySQL based on XtraDB Cluster](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/compare.html) is based on best practices for configuration and setup of a [Percona XtraDB Cluster](https://www.percona.com/mysql/software/percona-xtradb-cluster) in a Kubernetes-based environment on-premises or in the cloud.

We recommend installing the Operator with the [kubectl](https://kubernetes.io/docs/tasks/tools/) command line utility. It is the universal way to interact with Kubernetes. Alternatively, you can install it using the [Helm](https://github.com/helm/helm) package manager.

[Install with kubectl](#prerequisites) [Install with Helm](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/helm.html)

## Prerequisites

To install Percona XtraDB Cluster, you need the following:

1. The **kubectl** tool to manage and deploy applications on Kubernetes, included in most Kubernetes distributions. If it is not installed, [follow its official installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/) .

1. A Kubernetes environment. You can deploy it on [Minikube](https://github.com/kubernetes/minikube) for testing purposes or using any cloud provider of your choice. Check the list of our [officially supported platforms](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/System-Requirements.html#supported-platforms).

   See also

   - [Set up Minikube](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/minikube.html)
   - [Create and configure the GKE cluster](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/gke.html)
   - [Set up Amazon Elastic Kubernetes Service](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/eks.html)
   - [Create and configure the AKS cluster](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/aks.html)

## Procedure

Here’s a sequence of steps to follow:

1. Create the Kubernetes namespace for your cluster. It is a good practice to isolate workloads in Kubernetes by installing the Operator in a custom namespace. Replace the `<namespace>` placeholder with your value.

   ```
   kubectl create namespace <namespace>
   ```

   Expected output

   ```
   namespace/<namespace> created
   ```

1. Deploy the Operator with the following command:

   ```
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/bundle.yaml  -n <namespace>
   ```

   Expected output

   ```
   customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusters.pxc.percona.com serverside-applied
   customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusterbackups.pxc.percona.com serverside-applied
   customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusterrestores.pxc.percona.com serverside-applied
   role.rbac.authorization.k8s.io/percona-xtradb-cluster-operator serverside-applied
   serviceaccount/percona-xtradb-cluster-operator serverside-applied
   rolebinding.rbac.authorization.k8s.io/service-account-percona-xtradb-cluster-operator serverside-applied
   deployment.apps/percona-xtradb-cluster-operator serverside-applied
   ```

   As the result you will have the Operator Pod up and running.

1. Deploy Percona XtraDB Cluster:

   ```
   kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/cr.yaml -n <namespace>
   ```

   Note

   The default `deploy/cr.yaml` deploys three Percona XtraDB Cluster Pods and three HAProxy Pods. The Operator spreads them across different nodes, so the cluster needs at least three schedulable Kubernetes nodes. For a single-node environment such as Minikube, deploy the `deploy/cr-minimal.yaml` file instead. See [Set up Minikube](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/minikube.html).

   The default `deploy/cr.yaml` also defines a daily backup schedule (`daily-backup`) that stores backups on a Persistent Volume Claim (PVC) and keeps the last five.

   Expected output

   ```
   perconaxtradbcluster.pxc.percona.com/cluster1 created
   ```

1. Check the Operator and the Percona XtraDB Cluster Pods status.

   ```
   kubectl get pxc -n <namespace>
   ```

   The creation process may take some time. When the process is over your cluster obtains the `ready` status.

   Expected output

   ```
   NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
   cluster1   cluster1-haproxy.default   ready    3                3         5m51s
   ```

You have successfully installed and deployed the Operator with default parameters.

The default Percona XtraDB Cluster configuration includes three HAProxy and three XtraDB Cluster instances.

You can check the rest of the Operator’s parameters in the [Custom Resource options reference](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html).

## Next steps

[Connect to Percona XtraDB Cluster](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/connect.html)

## Useful links

[Install Percona XtraDB Cluster with customized parameters](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/custom-install.html)
