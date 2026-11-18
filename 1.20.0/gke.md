> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Install Percona XtraDB Cluster on Google Kubernetes Engine (GKE)

This quickstart shows you how to configure the Percona Operator for MySQL based on Percona XtraDB Cluster with the Google Kubernetes Engine. The document assumes some experience with Google Kubernetes Engine (GKE). For more information on the GKE, see the [Kubernetes Engine Quickstart](https://cloud.google.com/kubernetes-engine/docs/quickstart) .

## Prerequisites

All commands from this quickstart can be run either in the **Google Cloud shell** or in **your local shell**.

To use *Google Cloud shell*, you need nothing but a modern web browser.

If you would like to use *your local shell*, install the following:

1. [gcloud](https://cloud.google.com/sdk/docs/quickstarts) . This tool is part of the Google Cloud SDK. To install it, select your operating system on the [official Google Cloud SDK documentation page](https://cloud.google.com/sdk/docs) and then follow the instructions.

1. [kubectl](https://cloud.google.com/kubernetes-engine/docs/quickstart#choosing_a_shell) . It is the Kubernetes command-line tool you will use to manage and deploy applications. To install the tool, run the following command:

   ```
   gcloud auth login
   gcloud components install kubectl
   ```

## Configuring default settings for the cluster

You can configure the settings using the `gcloud` tool. You can run it either in the [Cloud Shell](https://cloud.google.com/shell/docs/quickstart) or in your local shell (if you have installed Google Cloud SDK locally on the previous step). The following command will create a cluster named `my-cluster-1`:

```
gcloud container clusters create my-cluster-1 --project <project ID> --zone us-central1-a --cluster-version 1.35 --machine-type n1-standard-4 --num-nodes=3
```

Note

You must edit the above command and other command-line statements to replace the `<project ID>` placeholder with your project ID (see available projects with `gcloud projects list` command). You may also be required to edit the *zone location*, which is set to `us-central1-a` in the above example. Other parameters specify that we are creating a cluster with 3 nodes and with machine type of 4 vCPUs.

You may wait a few minutes for the cluster to be generated, and then you will see it listed in the Google Cloud console (select *Kubernetes Engine* → *Clusters* in the left menu panel):

Now you should configure the command-line access to your newly created cluster to make `kubectl` be able to use it.

In the Google Cloud Console, select your cluster and then click the *Connect* shown on the above image. You will see the connect statement configures command-line access. After you have edited the statement, you may run the command in your local shell:

```
gcloud container clusters get-credentials my-cluster-1 --zone us-central1-a --project <project name>
```

## Installing the Operator

1. First of all, use your [Cloud Identity and Access Management (Cloud IAM)](https://cloud.google.com/iam) to control access to the cluster. The following command will give you the ability to create Roles and RoleBindings:

   ```
   kubectl create clusterrolebinding cluster-admin-binding --clusterrole cluster-admin --user $(gcloud config get-value core/account)
   ```

   The return statement confirms the creation:

   ```
   clusterrolebinding.rbac.authorization.k8s.io/cluster-admin-binding created
   ```

1. Create a namespace and set the context for the namespace. The resource names must be unique within the namespace and provide a way to divide cluster resources between users spread across multiple projects.

   So, create the namespace and save it in the namespace context for subsequent commands as follows (replace the `<namespace name>` placeholder with some descriptive name):

   ```
   kubectl create namespace <namespace name>
   kubectl config set-context $(kubectl config current-context) --namespace=<namespace name>
   ```

   At success, you will see the message that namespace/ was created, and the context (gke\_) was modified.

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

Also, you can see the same information when browsing Pods of your cluster in Google Cloud console via the *Object Browser*:

If the command output had shown some errors, you can examine the problematic Pod with the `kubectl describe <pod name>` command as follows:

```
kubectl describe pod  cluster1-pxc-2
```

Review the detailed information for `Warning` statements and then correct the configuration. An example of a warning is as follows:

`Warning FailedScheduling 68s (x4 over 2m22s) default-scheduler 0/1 nodes are available: 1 node(s) didn’t match pod affinity/anti-affinity, 1 node(s) didn’t satisfy existing pods anti-affinity rules.`

Alternatively, you can examine your Pods via the *object browser*. Errors will look as follows:

Clicking the problematic Pod will bring you to the details page with the same warning:

## Removing the GKE cluster

There are several ways that you can delete the cluster.

You can clean up the cluster with the `gcloud container clusters delete <cluster name> --zone <zone location>` command. The return statement requests your confirmation of the deletion. Type `y` to confirm.

```
gcloud container clusters delete my-cluster-1 --zone us-central1-a --project <project ID>
```

Expected output

```
The following clusters will be deleted.
 - [my-cluster-1] in [us-central1-a]

Do you want to continue (Y/n)?  y

Deleting cluster my-cluster-1...⠧
```

Also, you can delete your cluster via the GKE console. Just click the appropriate trashcan icon in the clusters list:

The cluster deletion may take time.
