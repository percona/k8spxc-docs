> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Delete Percona Operator for MySQL based on Percona XtraDB Cluster

You may have different reasons to clean up your Kubernetes environment: moving from trial deployment to a production one, testing experimental configurations and the like. In either case, you need to remove some (or all) of these objects:

- Percona XtraDB Cluster managed by the Operator
- Percona Operator for MySQL itself
- Custom Resource Definition deployed with the Operator
- Resources like PVCs and Secrets

## Delete the database cluster

To delete the database cluster means to delete the Custom Resource associated with it.

Note

There are 4 [finalizers](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) defined in the Custom Resource, which define whether to delete or preserve TLS-related objects and data volumes when the cluster is deleted.

- `finalizers.percona.com/delete-pxc-pods-in-order`: if present, PXC pods are deleted in order on cluster deletion. PVC is not deleted.
- `finalizers.percona.com/delete-ssl`: if present, objects, created for SSL (Secret, certificate, and issuer) are deleted along with the cluster deletion (will not delete PVC).
- `finalizers.percona.com/delete-pxc-pvc`: if present, [Persistent Volume Claims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for the database cluster Pods are deleted along with the cluster deletion.
- `finalizers.percona.com/delete-proxysql-pvc`: if present, [Persistent Volume Claims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for ProxySQL Pods are deleted along with the cluster deletion.

The default finalizer in `deploy/cr.yaml` configuration file is `finalizers.percona.com/delete-pxc-pods-in-order`, this allows you to recreate the cluster without losing data, credentials for the system users, etc. You can always [delete TLS-related objects and PVCs manually](#clean-up-resources), if needed.

The steps are the following:

1. List the Custom Resources. Replace the `<namespace>` placeholder with your value

   ```
   kubectl get pxc -n <namespace>
   ```

1. Delete the Custom Resource with the name of your cluster

   ```
   kubectl delete pxc <cluster_name> -n <namespace>
   ```

   It may take a while to stop and delete the cluster.

   Sample output

   ```
   perconaxtradbcluster.pxc.percona.com "cluster1" deleted
   ```

1. Check that the cluster is deleted by listing the Custom Resources again:

   ```
   kubectl get pxc -n <namespace>
   ```

   Sample output

   ```
   No resources found in <namespace> namespace.
   ```

## Delete the Operator

Choose the instructions relevant to the way you installed the Operator.

**kubectl**

To uninstall the Operator, delete the [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) related to it.

1. List the deployments. Replace the `<namespace>` placeholder with your namespace.

   ```
   kubectl get deploy -n <namespace>
   ```

1. Delete the `percona-*` deployment

   ```
   kubectl delete deploy percona-xtradb-cluster-operator -n <namespace>
   ```

   Sample output

   ```
   deployment.apps "percona-xtradb-cluster-operator" deleted
   ```

1. Check that the Operator is deleted by listing the Pods. As a result you should have no Pods related to it.

   ```
   kubectl get pods -n <namespace>
   ```

   Sample output

   ```
   No resources found in <namespace> namespace.
   ```

1. If you are not just deleting the Operator and XtraDB Cluster from a specific namespace, but want to clean up your entire Kubernetes environment, you can also delete the [CustomResourceDefinitions (CRDs)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#customresourcedefinitions) .

   *Warning:* CRDs in Kubernetes are non-namespaced but are available to the whole environment. This means that you shouldn’t delete CRDs if you still have the Operator and database cluster in some namespace.

   Get the list of CRDs.

   ```
   kubectl get crd
   ```

1. Delete the `percona*.pxc.percona.com` CRDs

   ```
   kubectl delete crd perconaxtradbclusterbackups.pxc.percona.com perconaxtradbclusterrestores.pxc.percona.com perconaxtradbclusters.pxc.percona.com
   ```

   Sample output

   ```
   customresourcedefinition.apiextensions.k8s.io "perconaxtradbclusterbackups.pxc.percona.com" deleted
   customresourcedefinition.apiextensions.k8s.io "perconaxtradbclusterrestores.pxc.percona.com" deleted
   customresourcedefinition.apiextensions.k8s.io "perconaxtradbclusters.pxc.percona.com" deleted
   ```

**Helm**

To delete the Operator, do the following:

1. List the Helm charts:

   ```
   helm list -n <namespace>
   ```

   Sample output

   ```
   cluster1    <namespace>         1           2023-10-31 10:18:10.763049 +0100 CET    deployed    pxc-db-1.20.0        1.20.0
   my-op       <namespace>         1           2023-10-31 10:15:18.41444 +0100 CET     deployed    pxc-operator-1.20.0   1.20.0
   ```

1. Delete the [release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) for Percona XtraDB Cluster

   ```
   helm uninstall cluster1 --namespace <namespace>
   ```

1. Delete the [release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) for the Operator

   ```
   helm uninstall my-op --namespace <namespace>
   ```

## Clean up resources

By default, TLS-related objects and data volumes remain in Kubernetes environment after you delete the cluster to allow you to recreate it without losing the data.

You can automate resource cleanup by turning on `percona.com/delete-pxc-pvc` and/or `percona.com/delete-ssl` [finalizers](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#metadata-name)). You can also delete TLS-related objects and PVCs manually.

To manually clean up resources, do the following:

1. Delete Persistent Volume Claims.

   1. List PVCs. Replace the `<namespace>` placeholder with your namespace:

      ```
      kubectl get pvc -n <namespace>
      ```

      Sample output

      ```
      NAME                     STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
      datadir-cluster1-pxc-0   Bound    pvc-be4e2398-6fc9-456a-836b-9f0bc36d2a16   6Gi        RWO            standard-rwo   3m57s
      datadir-cluster1-pxc-1   Bound    pvc-8a9ed524-2f79-4ed1-9265-a09947084e08   6Gi        RWO            standard-rwo   2m41s
      datadir-cluster1-pxc-2   Bound    pvc-830fccfb-ced6-4fab-b85a-866aa435a2c7   6Gi        RWO            standard-rwo   91s
      ```

   1. Delete PVCs related to your cluster. The following command deletes PVCs for the `cluster1` cluster:

      ```
      kubectl delete pvc datadir-cluster1-pxc-0 datadir-cluster1-pxc-1 datadir-cluster1-pxc-2 -n <namespace>
      ```

      Sample output

      ```
      persistentvolumeclaim "datadir-cluster1-pxc-0" deleted
      persistentvolumeclaim "datadir-cluster1-pxc-1" deleted
      persistentvolumeclaim "datadir-cluster1-pxc-2" deleted
      ```

      Note that it also deletes user secrets if you have enabled the `percona.com/delete-pxc-pvc` finalizer. To prevent it from happening, disable the finalizer.

1. Delete the Secrets

   1. List Secrets:

      ```
      kubectl get secrets -n <namespace>
      ```

   1. Delete the Secret:

      ```
      kubectl delete secret <secret_name> -n <namespace>
      ```
