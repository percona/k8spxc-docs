> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Install Percona XtraDB Cluster on Amazon Elastic Kubernetes Service (EKS)

This quickstart shows you how to deploy the Operator and Percona XtraDB Cluster on Amazon Elastic Kubernetes Service (EKS). The document assumes some experience with Amazon EKS. For more information on the EKS, see the [Amazon EKS official documentation](https://aws.amazon.com/eks/) .

## Prerequisites

The following tools are used in this guide and therefore should be preinstalled:

1. **AWS Command Line Interface (AWS CLI)** for interacting with the different parts of AWS. You can install it following the [official installation instructions for your system](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) .
1. **eksctl** to simplify cluster creation on EKS. It can be installed along its [installation notes on GitHub](https://github.com/weaveworks/eksctl#installation) .
1. **kubectl** to manage and deploy applications on Kubernetes. Install it [following the official installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/) .

Also, you need to configure AWS CLI with your credentials according to the [official guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) .

## Create the EKS cluster

1. To create your cluster, you will need the following data:

   - name of your EKS cluster,
   - AWS region in which you wish to deploy your cluster,
   - the amount of nodes you would like tho have,
   - the desired ratio between [on-demand](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html) and [spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html) instances in the total number of nodes.

   Note

   [spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html) instances are not recommended for production environment, but may be useful e.g. for testing purposes.

   After you have settled all the needed details, create your EKS cluster [following the official cluster creation instructions](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html) .

1. After you have created the EKS cluster, you also need to [install the Amazon EBS CSI driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html) on your cluster. See the [official documentation](https://docs.aws.amazon.com/eks/latest/userguide/managing-ebs-csi.html) on adding it as an Amazon EKS add-on.

## Install the Operator

1. Create a namespace and set the context for the namespace. The resource names must be unique within the namespace and provide a way to divide cluster resources between users spread across multiple projects.

   So, create the namespace and save it in the namespace context for subsequent commands as follows (replace the `<namespace name>` placeholder with some descriptive name):

   ```
   kubectl create namespace <namespace name>
   kubectl config set-context $(kubectl config current-context) --namespace=<namespace name>
   ```

   At success, you will see the message that namespace/ was created, and the context was modified.

   Deploy the Operator using the following command:

   ```
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/bundle.yaml
   ```

   Expected output

   ```
   customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusters.pxc.percona.com created
   customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusterbackups.pxc.percona.com created
   customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusterrestores.pxc.percona.com created
   customresourcedefinition.apiextensions.k8s.io/perconaxtradbbackups.pxc.percona.com created
   role.rbac.authorization.k8s.io/percona-xtradb-cluster-operator created
   serviceaccount/percona-xtradb-cluster-operator created
   rolebinding.rbac.authorization.k8s.io/service-account-percona-xtradb-cluster-operator created
   deployment.apps/percona-xtradb-cluster-operator created
   ```

1. The operator has been started, and you can deploy Percona XtraDB Cluster:

   ```
   kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/cr.yaml
   ```

   Expected output

   ```
   perconaxtradbcluster.pxc.percona.com/ cluster1 created
   ```

   Note

   This deploys default Percona XtraDB Cluster configuration with three HAProxy and three XtraDB Cluster instances. Please see [deploy/cr.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/cr.yaml) and [Custom Resource Options](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html) for the configuration options. You can clone the repository with all manifests and source code by executing the following command:

   ```
   git clone -b v1.20.0 https://github.com/percona/percona-xtradb-cluster-operator
   ```

   After editing the needed options, apply your modified `deploy/cr.yaml` file as follows:

   ```
   kubectl apply -f deploy/cr.yaml
   ```

   The creation process may take some time. When the process is over your cluster will obtain the `ready` status. You can check it with the following command:

   ```
   kubectl get pxc
   ```

   Expected output

   ```
   NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
   cluster1   cluster1-haproxy.default   ready    3                3         5m51s
   ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get pxc` command finally shows you the cluster status as `ready`, you can try to connect to the cluster.

To connect to Percona XtraDB Cluster you will need the password for the root user. Passwords are stored in the Secrets object.

Here’s how to get it:

1. List the Secrets objects.

   ```
   kubectl get secrets
   ```

   The Secrets object you are interested in has the `cluster1-secrets` name by default.

1. Use the following command to get the password of the `root` user. Substitute the `<namespace>` placeholder with your value (and use the different Secrets object name instead of the `cluster1-secrets`, if needed):

   ```
   kubectl get secret cluster1-secrets -n <namespace> --template='{{.data.root | base64decode}}{{"\n"}}'
   ```

1. Run a container with `mysql` tool and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

   ```
   kubectl run -n <namespace> -i --rm --tty percona-client --image=percona/percona-xtradb-cluster:8.4.8-8.1 --restart=Never -- bash -il
   ```

   Executing it may require some time to deploy the corresponding Pod.

1. Now run the `mysql` tool in the `percona-client` command shell using the password obtained from the Secret instead of the `<root_password>` placeholder. The command will look different depending on whether your cluster provides load balancing with [HAProxy](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/haproxy-conf.html) (the default choice) or [ProxySQL](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/proxysql-conf.html):

   **with HAProxy (default)**

   ```
   mysql -h cluster1-haproxy -uroot -p'<root_password>'
   ```

   **with ProxySQL**

   ```
   mysql -h cluster1-proxysql -uroot -p'<root_password>'
   ```

   This command will connect you to the MySQL server.

## Troubleshooting

If `kubectl get pxc` command doesn’t show `ready` status too long, you can check the creation process with the `kubectl get pods` command:

```
kubectl get pods
```

Expected output

```
NAME                                               READY   STATUS    RESTARTS   AGE
cluster1-haproxy-0                                 2/2     Running   0          6m17s
cluster1-haproxy-1                                 2/2     Running   0          4m59s
cluster1-haproxy-2                                 2/2     Running   0          4m36s
cluster1-pxc-0                                     3/3     Running   0          6m17s
cluster1-pxc-1                                     3/3     Running   0          5m3s
cluster1-pxc-2                                     3/3     Running   0          3m56s
percona-xtradb-cluster-operator-79966668bd-rswbk   1/1     Running   0          9m54s
```

If the command output had shown some errors, you can examine the problematic Pod with the `kubectl describe <pod name>` command as follows:

```
kubectl describe pod  cluster1-pxc-2
```

Review the detailed information for `Warning` statements and then correct the configuration. An example of a warning is as follows:

`Warning FailedScheduling 68s (x4 over 2m22s) default-scheduler 0/1 nodes are available: 1 node(s) didn’t match pod affinity/anti-affinity, 1 node(s) didn’t satisfy existing pods anti-affinity rules.`
