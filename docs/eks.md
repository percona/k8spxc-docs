# Install Percona XtraDB Cluster on Amazon Elastic Kubernetes Service (EKS)

This quickstart shows you how to deploy the Operator and Percona XtraDB Cluster on Amazon Elastic Kubernetes Service (EKS). The document assumes some experience with Amazon EKS. For more information on the EKS, see the [Amazon EKS official documentation :octicons-link-external-16:](https://aws.amazon.com/eks/).

## Prerequisites

The following tools are used in this guide and therefore should be preinstalled:

1. **AWS Command Line Interface (AWS CLI)** for interacting with the different
parts of AWS. You can install it following the [official installation instructions for your system :octicons-link-external-16:](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html).

2. **eksctl** to simplify cluster creation on EKS. It can be installed
along its [installation notes on GitHub :octicons-link-external-16:](https://github.com/weaveworks/eksctl#installation).

3. **kubectl**  to manage and deploy applications on Kubernetes. Install
it [following the official installation instructions :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

Also, you need to configure AWS CLI with your credentials according to the [official guide :octicons-link-external-16:](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).

## Create the EKS cluster

1. To create your cluster, you will need the following data:

    * name of your EKS cluster,
    * AWS region in which you wish to deploy your cluster,
    * the amount of nodes you would like tho have,
    * the desired ratio between [on-demand :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html)
        and [spot :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)
        instances in the total number of nodes.

    !!! note

        [spot :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)
        instances are not recommended for production environment, but may be useful
        e.g. for testing purposes.

    After you have settled all the needed details, create your EKS cluster [following the official cluster creation instructions :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html).

2. After you have created the EKS cluster, you also need to [install the Amazon EBS CSI driver :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html) on your cluster. See the [official documentation :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/managing-ebs-csi.html) on adding it as an Amazon EKS add-on.

## Install the Operator

1. Create a namespace and set the context for the namespace. The resource names must be unique within the namespace and provide a way to divide cluster resources between users spread across multiple projects.

    So, create the namespace and save it in the namespace context for subsequent commands as follows (replace the `<namespace name>` placeholder with some descriptive name):

    ``` {.bash data-prompt="$" }
    $ kubectl create namespace <namespace name>
    $ kubectl config set-context $(kubectl config current-context) --namespace=<namespace name>
    ```

    At success, you will see the message that namespace/<namespace name> was created, and the context was modified.

    Deploy the Operator using the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/bundle.yaml
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusters.pxc.percona.com created
        customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusterbackups.pxc.percona.com created
        customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusterrestores.pxc.percona.com created
        customresourcedefinition.apiextensions.k8s.io/perconaxtradbbackups.pxc.percona.com created
        role.rbac.authorization.k8s.io/percona-xtradb-cluster-operator created
        serviceaccount/percona-xtradb-cluster-operator created
        rolebinding.rbac.authorization.k8s.io/service-account-percona-xtradb-cluster-operator created
        deployment.apps/percona-xtradb-cluster-operator created
        ```

2. The operator has been started, and you can deploy Percona XtraDB Cluster:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr.yaml
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        perconaxtradbcluster.pxc.percona.com/ cluster1 created
        ```

    !!! note

        This deploys default Percona XtraDB Cluster configuration with three
        HAProxy and three XtraDB Cluster instances. Please see
        [deploy/cr.yaml :octicons-link-external-16:](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr.yaml)
        and [Custom Resource Options](operator.md) for the configuration
        options. You can clone the repository with all manifests and source code
        by executing the following command:

        ``` {.bash data-prompt="$" }
        $ git clone -b v{{ release }} https://github.com/percona/percona-xtradb-cluster-operator
        ```

        After editing the needed options, apply your modified `deploy/cr.yaml` file as follows:

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/cr.yaml
        ```

    The creation process may take some time. When the process is over your
    cluster will obtain the `ready` status. You can check it with the following
    command:

    ``` {.bash data-prompt="$" }
    $ kubectl get pxc
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
        cluster1   cluster1-haproxy.default   ready    3                3         5m51s
        ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get pxc`
command finally shows you the cluster status as `ready`, you can try to connect
to the cluster.

{% include 'assets/fragments/connectivity.txt' %}

## Troubleshooting

If `kubectl get pxc` command doesn't show `ready` status too long, you can 
check the creation process with the `kubectl get pods` command:

``` {.bash data-prompt="$" }
$ kubectl get pods
```

??? example "Expected output"

    --8<-- "cli/kubectl-get-pods-response.md"

If the command output had shown some errors, you can examine the problematic
Pod with the `kubectl describe <pod name>` command as follows:

``` {.bash data-prompt="$" }
$ kubectl describe pod  cluster1-pxc-2
```

Review the detailed information for `Warning` statements and then correct the
configuration. An example of a warning is as follows:

`Warning  FailedScheduling  68s (x4 over 2m22s)  default-scheduler  0/1 nodes are available: 1 node(s) didn’t match pod affinity/anti-affinity, 1 node(s) didn’t satisfy existing pods anti-affinity rules.`

