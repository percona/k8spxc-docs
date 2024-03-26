# Install Percona XtraDB Cluster on Google Kubernetes Engine (GKE)

This quickstart shows you how to configure the Percona Operator for MySQL based on Percona XtraDB Cluster with the Google Kubernetes Engine. The document assumes some experience with Google Kubernetes Engine (GKE). For more information on the GKE, see the [Kubernetes Engine Quickstart](https://cloud.google.com/kubernetes-engine/docs/quickstart).

## Prerequisites

All commands from this quickstart can be run either in the **Google Cloud shell** or in **your local shell**.

To use *Google Cloud shell*, you need nothing but a modern web browser.

If you would like to use *your local shell*, install the following:

1. [gcloud](https://cloud.google.com/sdk/docs/quickstarts). This tool is part of the Google Cloud SDK. To install it, select your operating system on the [official Google Cloud SDK documentation page](https://cloud.google.com/sdk/docs) and then follow the instructions.

2. [kubectl](https://cloud.google.com/kubernetes-engine/docs/quickstart#choosing_a_shell). It is the Kubernetes command-line tool you will use to manage and deploy applications. To install the tool, run the following command:

    ``` {.bash data-prompt="$" }
    $ gcloud auth login
    $ gcloud components install kubectl
    ```

## Configuring default settings for the cluster

You can configure the settings using the `gcloud` tool. You can run it either in the [Cloud Shell](https://cloud.google.com/shell/docs/quickstart) or in your local shell (if you have installed Google Cloud SDK locally on the previous step). The following command will create a cluster named `my-cluster-1`:

``` {.bash data-prompt="$" }
$ gcloud container clusters create my-cluster-1 --project <project name> --zone us-central1-a --cluster-version {{ gkerecommended }} --machine-type n1-standard-4 --num-nodes=3
```

!!! note

    You must edit the following command and other command-line statements to replace the `<project name>` placeholder with your project name. You may also be required to edit the *zone location*, which is set to `us-central1` in the above example. Other parameters specify that we are creating a cluster with 3 nodes and with machine type of 4 vCPUs and 45 GB memory.

You may wait a few minutes for the cluster to be generated, and then you will see it listed in the Google Cloud console (select *Kubernetes Engine* → *Clusters* in the left menu panel):

![image](assets/images/gke-quickstart-cluster-connect.png)

Now you should configure the command-line access to your newly created cluster to make `kubectl` be able to use it.

In the Google Cloud Console, select your cluster and then click the *Connect* shown on the above image. You will see the connect statement configures command-line access. After you have edited the statement, you may run the command in your local shell:

``` {.bash data-prompt="$" }
$ gcloud container clusters get-credentials my-cluster-1 --zone us-central1-a --project <project name>
```

## Installing the Operator

1. First of all, use your [Cloud Identity and Access Management (Cloud IAM)](https://cloud.google.com/iam) to control access to the cluster. The following command will give you the ability to create Roles and RoleBindings:

    ``` {.bash data-prompt="$" }
    $ kubectl create clusterrolebinding cluster-admin-binding --clusterrole cluster-admin --user $(gcloud config get-value core/account)
    ```

    The return statement confirms the creation:

    ``` {.text .no-copy}
    clusterrolebinding.rbac.authorization.k8s.io/cluster-admin-binding created
    ```

2. Create a namespace and set the context for the namespace. The resource names must be unique within the namespace and provide a way to divide cluster resources between users spread across multiple projects.

    So, create the namespace and save it in the namespace context for subsequent commands as follows (replace the `<namespace name>` placeholder with some descriptive name):

    ``` {.bash data-prompt="$" }
    $ kubectl create namespace <namespace name>
    $ kubectl config set-context $(kubectl config current-context) --namespace=<namespace name>
    ```

    At success, you will see the message that namespace/<namespace name> was created, and the context (gke_<project name>_<zone location>_<cluster name>) was modified.

    Deploy the Operator using the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/bundle.yaml
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
        [deploy/cr.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr.yaml)
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

Also, you can see the same information when browsing Pods of your cluster in Google Cloud console via the *Object Browser*:

![image](assets/images/gke-quickstart-object-browser.png)

If the command output had shown some errors, you can examine the problematic
Pod with the `kubectl describe <pod name>` command as follows:

``` {.bash data-prompt="$" }
$ kubectl describe pod  cluster1-pxc-2
```

Review the detailed information for `Warning` statements and then correct the
configuration. An example of a warning is as follows:

`Warning  FailedScheduling  68s (x4 over 2m22s)  default-scheduler  0/1 nodes are available: 1 node(s) didn’t match pod affinity/anti-affinity, 1 node(s) didn’t satisfy existing pods anti-affinity rules.`

Alternatively, you can examine your Pods via the *object browser*. Errors will look as follows:

![image](assets/images/gke-quickstart-object-browser-error.png)

Clicking the problematic Pod will bring you to the details page with the same warning:

![image](assets/images/gke-quickstart-object-browser-details.png)

## Removing the GKE cluster

There are several ways that you can delete the cluster.

You can clean up the cluster with the `gcloud` command as follows:

``` {.bash data-prompt="$" }
$ gcloud container clusters delete <cluster name>
```

The return statement requests your confirmation of the deletion. Type `y` to confirm.

Also, you can delete your cluster via the GKE console. Just click the appropriate trashcan icon in the clusters list:

![image](assets/images/gke-quickstart-cluster-connect.png)

The cluster deletion may take time.
