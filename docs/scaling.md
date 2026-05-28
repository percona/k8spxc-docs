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

Kubernetes manages storage with the following components:

* a PersistentVolume (PV) - a segment of
storage supplied by the Kubernetes administrator,
* a PersistentVolumeClaim
(PVC) - a request for storage from a user.

Starting from the version 1.14.0, you can increase the size of an existing PVC object (considered stable since Kubernetes v1.24).
Note that you **cannot** shrink the size of an existing PVC object.

Use storage scaling to keep up with growing data while keeping the cluster online. The Operator supports the following scaling options:

* automatic scaling - Starting with Operator version 1.20.0, the Operator monitors storage usage and scales the storage automatically
* storage resizing with Volume Expansion capability - Starting with the Operator version 1.14.0, you can instruct the Operator to scale the storage by updating the Custom Resource manifest
* manual scaling - scale the storage manually.

You can also use an external autoscaler with the Operator. Enabling an external autoscaler disables the Operator's internal logic for automatic storage resizing. Choose one method based on your environment and requirements; using both simultaneously is not supported.

For either option, the volume type must support PVC expansion.
To check if your storage supports the expansion capability, run the following command:

```bash
kubectl describe sc <storage class name> | grep AllowVolumeExpansion
```

??? example "Expected output"

    ``` {.text .no-copy}
    AllowVolumeExpansion: true
    ```

Find exact details about
PVCs and the supported volume types in [Kubernetes
documentation :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims).

#### Automatic storage resizing

Starting with version 1.20.0, the Operator can automatically resize Persistent Volume Claims (PVCs) for Percona XtraDB Cluster Pods based on your configured thresholds. The Operator monitors storage usage of all PVCs and when it exceeds the defined threshold, triggers resizing until the storage size reaches the maximum limit.

This feature gives you:

* fewer outages from full disks because storage grows with demand
* less guesswork on capacity planning and fewer last-minute fixes
* lower operational effort for developers and platform engineers
* cost control by expanding only when needed
* a more predictable environment so teams can focus on delivery

To enable automatic storage resizing, edit the `deploy/cr.yaml` Custom Resource manifest as follows:
{.power-number}

1. Make sure each Percona XtraDB Cluster container has a storage size set.

    Example for a replica set container:

    ```yaml
    pxc:
      volumeSpec:
        persistentVolumeClaim:
          resources:
            requests:
              storage: 6Gi
    ```

2. Configure autoscaling thresholds in the `storageScaling` subsection:

    * `enableVolumeScaling` - set to `true`
    * `autoscaling.enabled` - set to `true`
    * `autoscaling.triggerThresholdPercent` - specify the usage percentage. When the usage exceeds this threshold, this triggers autoscaling
    * `autoscaling.growthStep` - specify how much to increase the storage on
    * `autoscaling.maxSize` - specify the upper limit for storage growth. When this limit is reached, scaling is no longer possible.

    Example configuration:

    ```yaml
    spec:
      storageScaling:
        enableVolumeScaling: true
        autoscaling:
          enabled: true
          triggerThresholdPercent: 80
          growthStep: 2Gi
          maxSize: "10Gi"
    ```

3. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

When the Operator changes the storage size, it updates the Custom Resource status as follows:

* adds the `pvc-resize-in-progress` annotation. The annotation contains the timestamp of the resize start and indicates that the resize operation is running. After the resize finishes, the Operator deletes this annotation.
* records the new size in the `currentSize` field
* updates the `resizeCount` field.

Run the `kubectl get pxc -o yaml -n <namespace>` to check the current cluster state.

??? example "Sample output"

    ```{.text .no-copy}
    storageAutoscaling:
      datadir-pxc-pxc-0:
        currentSize: 5123744Ki
        lastResizeTime: "2026-01-23T15:08:59Z"
        resizeCount: 2
    ```

The `storageAutoscaling` section appears under `.status` in the Custom Resource.

When the storage size reaches the limit, no further resizing is done and this event is recorded in the logs. You can either clean up the data or set a new limit based on your organization's policies and requirements. For help with common issues, see [Troubleshooting storage](debug-storage.md).

#### Storage resizing with Volume Expansion capability

Certain volume types support PVCs expansion. You can run the following command to check if your storage supports the expansion capability:

```bash
kubectl describe sc <storage class name> | grep AllowVolumeExpansion
```

??? example "Expected output"

    ``` {.text .no-copy}
    AllowVolumeExpansion: true
    ```

To enable storage resizing via volume expansion, set the [storageScaling.enableVolumeScaling](operator.md#storagescalingenablevolumescaling) Custom Resource option to `true` and set the new storage size in the
`pxc.volumeSpec.persistentVolumeClaim.resources.requests.storage` option in the Custom Resource. The Operator will automatically expand the storage for all database Pods to the new value.

For example, edit the `deploy/cr.yaml` file:

```yaml
spec:
  storageScaling:
    enableVolumeScaling: true
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

The storage size change takes some time. When it starts, the Operator automatically adds the `pvc-resize-in-progress` annotation to the `PerconaXtraDBCluster` Custom Resource. The annotation contains the timestamp of the resize start and indicates that the resize operation is running. After the resize finishes, the Operator deletes this annotation.

##### If storage scaling cannot complete

Sometimes resizing storage does not finish as expected. Here are common situations and what the Operator does:

- **If there is a resource quota** that prevents your PersistentVolumeClaim (PVC) from growing to the new size, the Operator will detect this right away. In this case, no scaling will be attempted and the storage size in the Custom Resource  will be changed back to the previous value automatically.
  
* If no quota is set but **you request a storage size that is too large for your environment**, the resize may still fail. The Operator will again detect the failure and revert the storage size in the Custom Resource back to its original value. However, Kubernetes may keep trying to finish the resize until the issue is [fixed manually by an administrator](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#recovering-from-failure-when-expanding-volumes).

* If storage resizing is only partially successful (for example, two out of three pods have their PVCs expanded) and you turn off the `enableVolumeScaling` option while this is happening, the Operator will roll back the storage size in the Custom Resource to the previous value so that everything stays consistent.

  If you later re-enable the `enableVolumeScaling` option, always check the actual storage size of your PVCs. Be sure to set your desired storage size in the Custom Resource again to give all pods the correct storage capacity.


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
