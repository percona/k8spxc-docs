# Install Percona XtraDB Cluster on Kubernetes

1. First of all, clone the percona-xtradb-cluster-operator repository:

    ```bash
    git clone -b v{{ release }} https://github.com/percona/percona-xtradb-cluster-operator
    cd percona-xtradb-cluster-operator
    ```

!!! note

    It is crucial to specify the right branch with `-b`
    option while cloning the code on this step. Please be careful.

2. Now Custom Resource Definition for Percona XtraDB Cluster should be created
    from the `deploy/crd.yaml` file. Custom Resource Definition extends the
    standard set of resources which Kubernetes “knows” about with the new
    items (in our case ones which are the core of the operator).

    This step should be done only once; it does not need to be repeated
    with the next Operator deployments, etc.

    ```bash
    kubectl apply --server-side -f deploy/crd.yaml
    ```

3. The next thing to do is to add the `pxc` namespace to Kubernetes,
    not forgetting to set the correspondent context for further steps:

    ```bash
    kubectl create namespace pxc
    kubectl config set-context $(kubectl config current-context) --namespace=pxc
    ```

4. Now RBAC (role-based access control) for Percona XtraDB Cluster should be set
    up from the `deploy/rbac.yaml` file. Briefly speaking, role-based access is
    based on specifically defined roles and actions corresponding to
    them, allowed to be done on specific Kubernetes resources (details
    about users and roles can be found in [Kubernetes documentation :octicons-link-external-16:](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#default-roles-and-role-bindings)).

    ```bash
    kubectl apply -f deploy/rbac.yaml
    ```

    !!! note

        Setting RBAC requires your user to have cluster-admin role
        privileges. For example, those using Google Kubernetes Engine can
        grant user needed privileges with the following command:

        `$ kubectl create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=$(gcloud config get-value core/account)`

    Finally it’s time to start the operator within Kubernetes:

    ```bash
    kubectl apply -f deploy/operator.yaml
    ```

    !!! note

        You can simplify the Operator installation by applying a single
        `deploy/bundle.yaml` file instead of running commands from the steps
        2 and 4:
        
        ```bash
        kubectl apply --server-side -f deploy/bundle.yaml
        ```
        
        This will automatically create Custom Resource Definition, set up
        role-based access control and install the Operator as one single action.

5. Now that’s time to add the Percona XtraDB Cluster users [Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/)
    with logins and passwords to Kubernetes. By default, the Operator generates
    users Secrets automatically, and *no actions are required at this step*.
    
    Still, you can generate and apply your Secrets on your own. In this case,
    place logins and plaintext passwords for the user accounts in the data
    section of the `deploy/secrets.yaml` file; after editing is finished, create
    users Secrets with the following command:

    ```bash
    kubectl create -f deploy/secrets.yaml
    ```

    More details about secrets can be found in [Users](users.md#users).

6. Now certificates should be generated. By default, the Operator generates
    certificates automatically, and *no actions are required at this step*.
    Still, you can generate and apply your own certificates as secrets according
    to the [TLS instructions](TLS.md).

7. After the operator is started and user secrets are added, Percona
    XtraDB Cluster can be created at any time with the following command:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

    Creation process will take some time. When the process is over your
    cluster will obtain the `ready` status. You can check it with the following
    command:

    ```bash
    kubectl get pxc
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
        cluster1   cluster1-haproxy.default   ready    3                3         5m51s
        ```

## Verify the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get pxc`
command finally shows you the cluster status as `ready`, you can try to connect
to the cluster.

{% include 'assets/fragments/connectivity.txt' %}
