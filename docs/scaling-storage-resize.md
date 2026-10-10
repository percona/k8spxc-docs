# Resize storage

Each Percona XtraDB Cluster node stores data in a PVC defined in `pxc.volumeSpec`. For
background on how Kubernetes storage works and what you can and cannot resize, see
[About scaling and storage — Storage](scaling-about.md#storage).

You can resize storage in these ways: 

* [Automatic resizing](#automatic-storage-resizing) (Operator 1.20.0+) — the 
Operator monitors storage usage and resizes storage automatically
* [Storage resizing with Volume Expansion capability](#storage-resizing-with-volume-expansion-capability) (Operator 1.14.0+) - you set the new size in the Custom Resource and the Operator resizes the storage to match the desired size
* [Manual resizing](#manual-resizing-without-volume-expansion-capability) — you resize storage when Volume Expansion is unavailable

You can also use an external autoscaler with the Operator. To enable it, set the `spec.storageScaling.enableExternalAutoscaling` to `true`.

Enabling an external autoscaler
disables the Operator's own automatic storage resizing. Choose one method based on your
environment and requirements. Using both together isn't supported.

Automatic resizing and resizing through Volume Expansion require a volume type that supports PVC expansion. Manual resizing is available when Volume Expansion is unavailable. To check whether your storage 
supports volume expansion, run:

```bash
kubectl describe sc <storage class name> | grep AllowVolumeExpansion
```

??? example "Expected output"

    ``` {.text .no-copy}
    AllowVolumeExpansion: true
    ```

Find exact details about PVCs and the supported volume types in
[Kubernetes documentation :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims).

## Automatic storage resizing

!!! note "Version added: [1.20.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.20.0.md)"

The Operator can automatically resize Persistent Volume
Claims (PVCs) for Percona XtraDB Cluster Pods based on your configured thresholds. The
Operator monitors storage usage across all PVCs. When usage exceeds the configured
threshold, the Operator resizes storage until it reaches the maximum limit.

This feature gives you:

* fewer outages from full disks because storage grows with demand
* less guesswork on capacity planning and fewer last-minute fixes
* lower operational effort for developers and platform engineers
* lower costs, since storage only expands when needed
* more predictable operations so teams can focus on delivery

To enable automatic storage resizing, edit the `deploy/cr.yaml` Custom Resource manifest
as follows:
{.power-number}

1. Make sure each Percona XtraDB Cluster container has a storage size set.

    Example:

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
    * `autoscaling.triggerThresholdPercent` - the usage percentage that triggers autoscaling when exceeded
    * `autoscaling.growthStep` - how much to increase the storage on each resize
    * `autoscaling.maxSize` - the upper limit for storage growth; the Operator stops scaling once this limit is reached

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

When the Operator changes the storage size, it updates the Custom Resource status as
follows:

* adds the `pvc-resize-in-progress` annotation. The annotation contains the timestamp of the resize start and indicates that the resize operation is running. After the resize finishes, the Operator deletes this annotation.
* records the new size in the `currentSize` field
* updates the `resizeCount` field

Run `kubectl get pxc -o yaml -n <namespace>` to check the current cluster state.

??? example "Sample output"

    ```{.text .no-copy}
    storageAutoscaling:
      datadir-pxc-pxc-0:
        currentSize: 5123744Ki
        lastResizeTime: "2026-01-23T15:08:59Z"
        resizeCount: 2
    ```

The `storageAutoscaling` section appears under `.status` in the Custom Resource.

When storage reaches the limit, the Operator stops resizing and logs the event. Clean up
the data or set a new limit based on your organization's policies and requirements. For
help with common issues, see [Troubleshoot storage resizing](debug-storage.md).

## Storage resizing with Volume Expansion capability

Certain volume types support PVC expansion. Run the following command to check if your
storage supports the expansion capability:

```bash
kubectl describe sc <storage class name> | grep AllowVolumeExpansion
```

??? example "Expected output"

    ``` {.text .no-copy}
    AllowVolumeExpansion: true
    ```

To enable storage resizing through volume expansion, set
[storageScaling.enableVolumeScaling](operator.md#storagescalingenablevolumescaling) to
`true` and set the new storage size in
`pxc.volumeSpec.persistentVolumeClaim.resources.requests.storage`. The Operator expands
storage for all database Pods to the new value.

For example, edit the `deploy/cr.yaml` file:

```yaml
spec:
  storageScaling:
    enableVolumeScaling: true
  pxc:
    volumeSpec:
      persistentVolumeClaim:
        resources:
          requests:
            storage: <NEW STORAGE SIZE>
```

Apply changes as usual:

```bash
kubectl apply -f cr.yaml
```

The storage size change takes some time. When it starts, the Operator automatically adds
the `pvc-resize-in-progress` annotation to the `PerconaXtraDBCluster` Custom Resource. The
annotation contains the timestamp of the resize start and indicates that the resize
operation is running. After the resize finishes, the Operator deletes this annotation.

#### If storage scaling cannot complete

Sometimes resizing storage doesn't finish as expected. Here's what the Operator does in
each case:

* If a resource quota prevents your PersistentVolumeClaim (PVC) from growing to the new size, the Operator detects this immediately, skips the resize, and reverts the storage size in the Custom Resource to its previous value automatically.
* If no quota is set but you request a storage size that's too large for your environment, the resize can still fail. The Operator detects the failure and reverts the storage size in the Custom Resource to its original value. Kubernetes, however, can keep trying to finish the resize until [an administrator fixes the issue manually](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#recovering-from-failure-when-expanding-volumes).
* If storage resizing only partially succeeds (for example, two out of three Pods have their PVCs expanded) and you turn off `enableVolumeScaling` while this is happening, the Operator rolls back the storage size in the Custom Resource to the previous value. Since Kubernetes doesn't allow shrinking storage, though, PVCs keep the size they had when scaling was interrupted.

If you later re-enable `enableVolumeScaling`, check the actual storage size of your PVCs
first. Set the storage size in the Custom Resource to be equal to or greater than the
largest current PVC size.

## Manual resizing without Volume Expansion capability

Use manual resizing when:

* your version of the Operator is older than 1.14.0,
* your volumes have a type that doesn't support Volume Expansion, or
* you don't rely on automated scaling.

Delete Pods and their persistent volumes one by one to resync data onto the new volumes.
**This method also lets you shrink storage.**

Here's how to resize the storage:
{.power-number}

1. Update the Custom Resource with the new storage size by editing and applying the `deploy/cr.yaml` file:

    ``` {.text .no-copy}
    spec:
      pxc:
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <NEW STORAGE SIZE>
    ```

2. Apply the updated Custom Resource:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

3. Delete the StatefulSet with the `orphan` option:

    ```bash
    kubectl delete sts <statefulset-name> --cascade=orphan
    ```

    The Pods stay running, and the Operator recreates the StatefulSet:

    ```bash
    kubectl get sts <statefulset-name>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        cluster1-pxc       3/3     39s
        ```

4. Scale up the cluster (optional).

    Changing the storage size terminates Pods one at a time, which temporarily reduces the
    cluster's compute capacity and can affect performance. To reduce that impact during the
    resize, increase the cluster size from 3 to 5 nodes:

    ```yaml
    spec:
      pxc:
        size: 5
    ```

    Apply the change:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

    New Pods already have the new storage:

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

5. Delete PVCs and Pods with the old storage size one by one. Wait for data to sync before you proceed to the next node.

    ```bash
    kubectl delete pvc <PVC NAME>
    kubectl delete pod <POD NAME>
    ```

    A new PVC is created along with the Pod.

The storage size change takes some time. When it starts, the Operator automatically adds
the `pvc-resize-in-progress` annotation to the `PerconaXtraDBCluster` Custom Resource. The
annotation contains the timestamp of the resize start and indicates that the resize
operation is running. After the resize finishes, the Operator deletes this annotation.

## See also

* [About scaling and storage](scaling-about.md)
* [Horizontal and vertical scaling](scaling.md)
* [Troubleshoot storage resizing](debug-storage.md)
