# Delete Percona Operator for MySQL based on Percona XtraDB Cluster

You may have different reasons to clean up your Kubernetes environment: moving from trial deployment to a production one, testing experimental configurations and the like. In either case, you need to remove some (or all) of these objects:

* Percona XtraDB Cluster managed by the Operator
* Percona Operator for MySQL itself
* Custom Resource Definition deployed with the Operator
* Resources like PVCs and Secrets

## Delete the database cluster

To delete the database cluster means to delete the Custom Resource associated with it.

!!! note

    There are 3 [finalizers](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) defined in the Custom Resource, which define whether to delete or preserve  TLS-related objects and data volumes when the cluster is deleted.

    * `finalizers.percona.com/delete-ssl`: if present, objects, created for SSL (Secret, certificate, and issuer) are deleted along with the cluster deletion.
    * `finalizers.percona.com/delete-pxc-pvc`: if present, [Persistent Volume Claims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for the database cluster Pods are deleted along with the cluster deletion.
    * `finalizers.percona.com/delete-proxysql-pvc`: if present, [Persistent Volume Claims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for ProxySQL Pods are deleted along with the cluster deletion.

    All 3 finalizers are off by default in the `deploy/cr.yaml` configuration file, and this allows you to recreate the cluster without losing data, credentials for the system users, etc. You can always [delete TLS-related objects and PVCs manually](#clean-up-resources), if needed. 

The steps are the following:
{.power-number}

1. List the Custom Resources. Replace the `<namespace>` placeholder with your value

    ```{.bash data-prompt="$"}
    $ kubectl get pxc -n <namespace>
    ```

2. Delete the Custom Resource with the name of your cluster

    ```{.bash data-prompt="$"}
    $ kubectl delete pxc <cluster_name> -n <namespace>
    ```

    It may take a while to stop and delete the cluster. 

    ??? example "Sample output"

    ```{.text .no-copy}
    perconaxtradbcluster.pxc.percona.com "cluster1" deleted
    ```

3. Check that the cluster is deleted by listing the Custom Resources again:

    ```{.bash data-prompt="$"}
    $ kubectl get pxc -n <namespace>
    ```

    ??? example "Sample output"

    ```{.text .no-copy}
    No resources found in <namespace> namespace.
    ```

## Delete the Operator

Choose the instructions relevant to the way you installed the Operator. 

=== "kubectl"

    To uninstall the Operator, delete the [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) related to it.
    {.power-number}

    1. List the deployments. Replace the `<namespace>` placeholder with your namespace.

        ```{.bash data-prompt="$"}
        $ kubectl get deploy -n <namespace>
        ```

    2. Delete the `percona-*` deployment

        ```{.bash data-prompt="$"}
        $ kubectl delete deploy percona-xtradb-cluster-operator -n <namespace>
        ```

        ??? example "Sample output"

        ```{.text .no-copy}
        deployment.apps "percona-xtradb-cluster-operator" deleted
        ```

    3. Check that the Operator is deleted by listing the Pods. As a result you should have no Pods related to it.

        ```{.bash data-prompt="$"}
        $ kubectl get pods -n <namespace>
        ```
        
        ??? example "Sample output"

        ```{.text .no-copy}
        No resources found in <namespace> namespace.
        ```

    4. If you are not just deleting the Operator and XtraDB Cluster from a specific namespace, but want to clean up your entire Kubernetes environment, you can also delete the [CustomRecourceDefinitions (CRDs)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#customresourcedefinitions).

        <i warning>:material-alert: Warning:</i> CRDs in Kubernetes are non-namespaced but are available to the whole environment. This means that you shouldn’t delete CRDs if you still have the Operator and database cluster in some namespace.

        Get the list of CRDs. 

        ```{.bash data-prompt="$"}
        $ kubectl get crd
        ```

    5. Delete the `percona*.pxc.percona.com` CRDs

        ```{.bash data-prompt="$"}
        $ kubectl delete crd perconaxtradbclusterbackups.pxc.percona.com perconaxtradbclusterrestores.pxc.percona.com perconaxtradbclusters.pxc.percona.com
        ``` 

        ??? example "Sample output"

            ```{.text .no-copy}
            customresourcedefinition.apiextensions.k8s.io "perconaxtradbclusterbackups.pxc.percona.com" deleted
            customresourcedefinition.apiextensions.k8s.io "perconaxtradbclusterrestores.pxc.percona.com" deleted
            customresourcedefinition.apiextensions.k8s.io "perconaxtradbclusters.pxc.percona.com" deleted
            ```

=== "Helm"

    To delete the Operator, do the following:
    {.power-number}

    1. List the Helm charts:

        ```{.bash data-prompt="$"}
        $ helm list -n <namespace>
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            cluster1    <namespace>         1           2023-10-31 10:18:10.763049 +0100 CET    deployed    pxc-db-{{release}}        {{release}}
            my-op       <namespace>         1           2023-10-31 10:15:18.41444 +0100 CET     deployed    pxc-operator-{{release}}   {{release}}
            ```

    2. Delete the [release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) for Percona XtraDB Cluster 

        ```{.bash data-prompt="$"}
        $ helm uninstall cluster1 --namespace <namespace>
        ```

    3. Delete the [release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) for the Operator 

        ```{.bash data-prompt="$"}
        $ helm uninstall my-op --namespace <namespace>
        ```

## Clean up resources
 
By default, TLS-related objects and data volumes remain in Kubernetes environment after you delete the cluster to allow you to recreate it without losing the data. If you wish to delete them, do the following:
{.power-number}

1. Delete Persistent Volume Claims.

    1. List PVCs. Replace the `<namespace>` placeholder with your namespace:

        ```{.bash data-prompt="$"}
        $ kubectl get pvc -n <namespace>
        ```    

        ??? example "Sample output"    

            ```{.text .no-copy}
            NAME                     STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
            datadir-cluster1-pxc-0   Bound    pvc-be4e2398-6fc9-456a-836b-9f0bc36d2a16   6Gi        RWO            standard-rwo   3m57s
            datadir-cluster1-pxc-1   Bound    pvc-8a9ed524-2f79-4ed1-9265-a09947084e08   6Gi        RWO            standard-rwo   2m41s
            datadir-cluster1-pxc-2   Bound    pvc-830fccfb-ced6-4fab-b85a-866aa435a2c7   6Gi        RWO            standard-rwo   91s
            ```

    2. Delete PVCs related to your cluster. The following command deletes PVCs for the `cluster1` cluster:

        ```{.bash data-prompt="$"}
        $ kubectl delete pvc datadir-cluster1-pxc-0 datadir-cluster1-pxc-1 datadir-cluster1-pxc-2 -n <namespace>
        ```    

        ??? example "Sample output"       

            ```{.text .no-copy}
            persistentvolumeclaim "datadir-cluster1-pxc-0" deleted
            persistentvolumeclaim "datadir-cluster1-pxc-1" deleted
            persistentvolumeclaim "datadir-cluster1-pxc-2" deleted
            ```    

2. Delete the Secrets

    1. List Secrets:

        ```{.bash data-prompt="$"}
        $ kubectl get secrets -n <namespace>
        ```    

    2. Delete the Secret:
        
        ```{.bash data-prompt="$"}
        $ kubectl delete secret <secret_name> -n <namespace>
        ```

