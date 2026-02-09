# Scale MySQL on Kubernetes and OpenShift

One of the great advantages brought by Kubernetes and the OpenShift
platform is the ease of an application scaling. Scaling an application
results in adding resources or Pods and scheduling them to available
Kubernetes nodes.

Scaling can be [vertical](#vertical-scaling) and [horizontal](#horizontal-scaling). Vertical scaling adds more
compute or storage resources to MySQL nodes; horizontal scaling is
about adding more nodes to the cluster.

## Vertical scaling

### Scale compute resources

The Operator deploys and manages multiple components, such as Percona
XtraDB Cluster (PXC), HAProxy or ProxySQL, etc. You can manage CPU or memory for every component separately by editing corresponding sections in the Custom Resource. We follow  
the structure for `requests` and `limits` that Kubernetes [provides :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

To add more resources to your MySQL nodes in PXC edit the following section in
the Custom Resource:

```yaml
spec:
...
  pxc:
    ...
    resources:
      requests: 
        memory: 4G
        cpu: 2
      limits:
        memory: 4G
        cpu: 2
```

Use our reference documentation for the [Custom Resource options](operator.md) 
for more details about other components.

### Scale storage

Kubernetes manages storage with a PersistentVolume (PV), a segment of
storage supplied by the administrator, and a PersistentVolumeClaim
(PVC), a request for storage from a user. Starting with Kubernetes v1.11, a user can increase the size of an existing
PVC object (considered stable since Kubernetes v1.24).
The user cannot shrink the size of an existing PVC object.

Starting from the version 1.14.0, you can scale Percona XtraDB
Cluster storage automatically by configuring the Custom Resource manifest. Alternatively, you can scale the storage manually. For either way, the volume type must support PVCs expansion.

Find exact details about
PVCs and the supported volume types in [Kubernetes
documentation  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims).

#### Storage resizing with Volume Expansion capability

Certain volume types support PVCs expansion. You can run the following command to check if your storage supports the expansion capability:

```bash
kubectl describe sc <storage class name> | grep AllowVolumeExpansion
```

??? example "Expected output"

    ``` {.text .no-copy}
    AllowVolumeExpansion: true
    ```

To enable storage resizing via volume expansion, set the [enableVolumeExpansion](operator.md#enablevolumeexpansion) Custom Resource option to `true` ( it is turned off by default). When enabled, the Operator will automatically expand such storage for you when you change the
`pxc.volumeSpec.persistentVolumeClaim.resources.requests.storage` option in the Custom Resource.

For example, you can do it by editing and applying the `deploy/cr.yaml` file:

```yaml
spec:
  ...
  enableVolumeExpansion: true
    ...
  pxc:
    ...
    volumeSpec:
      ...
      persistentVolumeClaim:
        resources:
          requests:
            storage: <NEW STORAGE SIZE>
```

Apply changes as usual:

```bash
kubectl apply -f cr.yaml
```

The storage size change takes some time. When it starts, the Operator automatically adds the `pvc-resize-in-progress` annotation to the `PerconaXtraDBCluster` Custom Resource. The annotation contains the timestamp of the resize start and indicates that the resize operation is running.. After the resize finishes, the Operator deletes this annotation.

!!! warning

    If the new storage size can't be reached because there is a resource quota in place and the PVC storage limits are reached, this will be detected, there will be no scaling attempts, and the Operator will revert the value in the Custom Resource option back. If resize isn't successful (for example, no quota is set, but the new storage size turns out to be just too large), the Operator will detect Kubernetes failure on scaling, and revert the Custom Resource option. Still, Kubernetes will continue attempts to fulfill the scaling request until the problem is [fixed manually by the Kubernetes administrator](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#recovering-from-failure-when-expanding-volumes).


#### Manual resizing without Volume Expansion capability

Manual resizing is the way to go if:

* your version of the Operator is older than 1.14.0,
* your volumes have a type that does not support Volume Expansion, or
* you do not rely on automated scaling.

You will need to delete Pods and their persistent volumes one by one to resync
the data to the new volumes. **This way you can also shrink the storage.**

Here's how to resize the storage:
{.power-number}

1. Update the Custom Resource with the new storage size by editing and applying
    the `deploy/cr.yaml` file:

    ``` {.text .no-copy}
    spec:
    ...
      pxc:
        ...
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <NEW STORAGE SIZE>
    ```

3. Apply the Custom Resource update for the changes to come into effect:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

3. Delete the StatefulSet with the `orphan` option

    ```bash
    kubectl delete sts <statefulset-name> --cascade=orphan
    ```

    The Pods will not go down and the Operator is going to recreate
    the StatefulSet:

    ```bash
    kubectl get sts <statefulset-name>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        cluster1-pxc       3/3     39s
        ```

4. Scale up the cluster (Optional)

    Changing the storage size would require us to terminate the Pods, which 
    decreases the computational power of the cluster and might cause performance 
    issues. To improve performance during the operation we are going to 
    change the size of the cluster from 3 to 5 nodes:

    ```yaml
    ...
    spec:
    ...
      pxc:
        ...
        size: 5
    ```
    
    Apply the change:
    
    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

    New Pods will already have the new storage:
    
    ```bash
    kubectl get pvc
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME                     STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
        datadir-cluster1-pxc-0   Bound    pvc-90f0633b-0938-4b66-a695-556bb8a9e943   10Gi       RWO            standard       110m
        datadir-cluster1-pxc-1   Bound    pvc-7409ea83-15b6-448f-a6a0-12a139e2f5cc   10Gi       RWO            standard       109m
        datadir-cluster1-pxc-2   Bound    pvc-90f0b2f8-9bba-4262-904c-1740fdd5511b   10Gi       RWO            standard       108m
        datadir-cluster1-pxc-3   Bound    pvc-439bee13-3b57-4582-b342-98281aca50ba   19Gi       RWO            standard       49m
        datadir-cluster1-pxc-4   Bound    pvc-2d4f3a60-4ec4-48a0-96cd-5243e2f05234   19Gi       RWO            standard       47m
        ```

5. Delete PVCs and Pods with the old storage size one by one. Wait for data to sync
    before you proceed to the next node.

    ```bash
    kubectl delete pvc <PVC NAME>
    kubectl delete pod <POD NAME>
    ```
    The new PVC is going to be created along with the Pod. 

The storage size change takes some time. When it starts, the Operator automatically adds the `pvc-resize-in-progress` annotation to the `PerconaXtraDBCluster` Custom Resource. The annotation contains the timestamp of the resize start and indicates that the resize operation is running.. After the resize finishes, the Operator deletes this annotation.

## Horizontal scaling

Size of the cluster is controlled by a [size key](operator.md#pxcsize) in the [Custom Resource options](operator.md) configuration. That’s why scaling the cluster needs
nothing more but changing this option and applying the updated
configuration file. This may be done in a specifically saved config:

```yaml
spec:
...
  pxc:
    ...
    size: 5
```
    
Apply the change:
    
```bash
kubectl apply -f deploy/cr.yaml
```

Alternatively, you cana do it on the fly, using the following command:

```bash
kubectl scale --replicas=5 pxc/<CLUSTER NAME>
```

In this example we have changed the size of the Percona XtraDB Cluster
to `5` instances.

## Automated scaling

To automate horizontal scaling it is possible to use [Horizontal 
Pod Autoscaler (HPA) :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/). 
It will scale the Custom Resource itself, letting Operator to deal 
with everything else.

It is also possible to use [Kubernetes Event-driven Autoscaling (KEDA) :octicons-link-external-16:](https://keda.sh/), 
where you can apply more sophisticated logic for decision making on scaling.

For now it is not possible to use Vertical Pod Autoscaler (VPA) with 
the Operator due to the limitations it introduces for objects with 
owner references.
