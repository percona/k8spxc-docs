# Check Storage-related objects

Storage-related objects worth to check in case of problems are the following ones:

* [Persistent Volume Claims (PVC) and Persistent Volumes (PV) :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/), which are playing a key role in stateful applications.
* [Storage Class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/), which automates the creation of Persistent Volumes and the underlying storage.

It is important to remember that PVC is namespace-scoped, but PV and Storage Class are cluster-scoped.

## Check the PVC

You can check all the PVC with the following command (use your namespace name instead of the `<namespace>` placeholder):

``` {.bash data-prompt="$" }
$ kubectl get pvc -n <namespace>
```

???+ example "Expected output"

    ``` {.text .no-copy}
    NAME                 STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
    datadir-pxc-pxc-0    Bound    pvc-f3e7097f-accd-4f5d-9c9d-6f29b54a368b   24Gi       RWO            standard       42d
    datadir-pxc-pxc-1    Bound    pvc-3ec336a8-69de-4cbc-aff8-700d41696447   24Gi       RWO            standard       42d
    datadir-pxc-pxc-2    Bound    pvc-207e8a3e-1c83-4eae-b3f2-cf126f89ba9e   24Gi       RWO            standard       42d
    ```

The fields in the output of this command provide the following insights:

* **STATUS**: shows the [state :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#phase) of the PVC:
    * For normal working of an application, the status should be `Bound`.
    * If the status is not `Bound`, further investigation is required.
* **VOLUME**: is the name of the Persistent Volume with which PVC is Bound to. Obviously, this field will be occupied only when a PVC is Bound.
* **CAPACITY**: it is the size of the volume claimed.
* **STORAGECLASS**: it indicates the [Kubernetes storage class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) used for dynamic provisioning of Volume.
* **ACCESS MODES**: [Access mode :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes) indicates how Volume is used with the Pods. Access modes should have write permission if the application needs to write data, which is obviously true in case of databases.

Now you can check a specific PVC for more details using its name as follows:

``` {.bash data-prompt="$" }
$ kubectl get pvc datadir-pxc-pxc-0 -n <namespace> -oyaml # output stripped for brevity, name of PVC may vary
```

??? example "Expected output"

    ``` {.yaml .no-copy}
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      ...
      name: datadir-pxc-pxc-0
      namespace: default
      ...
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 25G
      storageClassName: standard
      volumeMode: Filesystem
      volumeName: pvc-f3e7097f-accd-4f5d-9c9d-6f29b54a368b
    status:
      accessModes:
      - ReadWriteOnce
      capacity:
        storage: 24Gi
      phase: Bound
    ```

## Check the PV

It is important to remember that PV is a cluster-scoped Object. If you see any issues with attaching a Volume to a Pod, PV and PVC might be looked upon.

Check all the PV present in the Kubernetes cluster as follows:

``` {.bash data-prompt="$" }
$ kubectl get pv
```

???+ example "Expected output"

    ``` {.text .no-copy}
    NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                                                      STORAGECLASS   REASON   AGE
    pvc-207e8a3e-1c83-4eae-b3f2-cf126f89ba9e   24Gi       RWO            Delete           Bound       default/datadir-pxc-pxc-2                                  standard                43d
    pvc-3ec336a8-69de-4cbc-aff8-700d41696447   24Gi       RWO            Delete           Bound       default/datadir-pxc-pxc-1                                  standard                43d
    pvc-f3e7097f-accd-4f5d-9c9d-6f29b54a368b   24Gi       RWO            Delete           Bound       default/datadir-pxc-pxc-0                                  standard                43d
    ```

Now you can check a specific PV for more details using its name as follows:

``` {.bash data-prompt="$" }
$ kubectl get pv pvc-f3e7097f-accd-4f5d-9c9d-6f29b54a368b -oyaml
```

???+ example "Expected output"

    ``` {.yaml .no-copy}
    apiVersion: v1
    kind: PersistentVolume
    metadata:
      ...
      name: pvc-f3e7097f-accd-4f5d-9c9d-6f29b54a368b
     ...
    spec:
      accessModes:
      - ReadWriteOnce
      capacity:
        storage: 24Gi
      claimRef:
        apiVersion: v1
        kind: PersistentVolumeClaim
        name: datadir-pxc-pxc-0
        namespace: default
        resourceVersion: "912868"
        uid: f3e7097f-accd-4f5d-9c9d-6f29b54a368b
      gcePersistentDisk:
        fsType: ext4
        pdName: pvc-f3e7097f-accd-4f5d-9c9d-6f29b54a368b
      nodeAffinity:
        required:
          nodeSelectorTerms:
          - matchExpressions:
            - key: topology.kubernetes.io/zone
              operator: In
              values:
              - us-central1-a
            - key: topology.kubernetes.io/region
              operator: In
              values:
              - us-central1
      persistentVolumeReclaimPolicy: Delete
      storageClassName: standard
      volumeMode: Filesystem
    status:
      phase: Bound
    ```

Fields to check if there are any issues in binding with PVC, are the `claimRef` and `nodeAffinity`.

The `claimRef` one indicates to which PVC this volume is bound to. This means that if by any chance PVC is deleted (e.g. by the appropriate finalizer), this section needs to be modified so that it can bind to a new PVC.

The `spec.nodeAffinity` field may influence the PV availability as well: for example, it can make Volume accessed in one availability zone only.

## Check the StorageClass

StorageClass is also a cluster-scoped object, and it indicates what type of underlying storage is used for the Volumes.

Check all the storage class present in the Kubernetes cluster, and check which storage class is the default one:

``` {.bash data-prompt="$" }
$ kubectl get sc
```

???+ example "Expected output"

    ``` {.text .no-copy}
    NAME                 PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
    premium-rwo          pd.csi.storage.gke.io   Delete          WaitForFirstConsumer   true                   44d
    standard (default)   kubernetes.io/gce-pd    Delete          Immediate              true                   44d
    standard-rwo         pd.csi.storage.gke.io   Delete          WaitForFirstConsumer   true                   44d
    ```

If some PVC does not refer any storage class explicitly, it means that the default storage class is used. Ensure there is only one default Storage class.

You can check a specific storage class as follows:

``` {.bash data-prompt="$" }
$ kubectl get sc standard -oyaml
```

???+ example "Expected output"

    ``` {.yaml .no-copy}
    allowVolumeExpansion: true
    apiVersion: storage.k8s.io/v1
    kind: StorageClass
    metadata:
     annotations:
       storageclass.kubernetes.io/is-default-class: "true"
     creationTimestamp: "2022-10-09T06:28:03Z"
     labels:
       addonmanager.kubernetes.io/mode: EnsureExists
     name: standard
     resourceVersion: "906"
     uid: 933d37db-990b-4b2d-bf3a-dd091d0b00ae
    parameters:
     type: pd-standard
    provisioner: kubernetes.io/gce-pd
    reclaimPolicy: Delete
    volumeBindingMode: Immediate
    ```

Important things to observe here are the following ones:

* Check if the provisioner and parameters are indicating the type of storage you intend to provision.
* Check the [volumeBindingMode :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/#volume-binding-mode) especially if the storage cannot be accessed across availability zones. “WaitForFirstConsumer” volumeBindingMode ensures volume is provisioned only after a Pod requesting the Volume is created.
