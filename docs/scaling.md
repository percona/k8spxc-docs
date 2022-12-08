# Scale MySQL on Kubernetes and OpenShift

One of the great advantages brought by Kubernetes and the OpenShift
platform is the ease of an application scaling. Scaling an application
results in adding resources or Pods and scheduling them to available
Kubernetes nodes.

Scaling can be vertical and horizontal. Vertical adds more compute or 
storage resources to MySQL nodes, horizontal is about adding more 
nodes to the cluster.

## Vertical scaling

### Scale compute

There are multiple components that Operator deploys and manages: Percona 
XtraDB Cluster (PXC), HAProxy or ProxySQL, etc. To add or reduce CPU or Memory 
you need to edit corresponding sections in the Custom Resource. We follow 
the structure for `requests` and `limits` that Kubernetes [provides](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

To add more resources to your MySQL nodes in PXC edit the following section in
the Custom Resource:
```
spec:
  pxc:
    resources:
      requests: 
        memory: 4G
        cpu: 2
      limits:
        memory: 4G
        cpu: 2
```

Use our reference documentation for [Custom Resource options](operator.md#operator-custom-resource-options) 
for more details about other components.

### Scale storage

Kubernetes manages storage with a PersistentVolume (PV), a segment of
storage supplied by the administrator, and a PersistentVolumeClaim
(PVC), a request for storage from a user. In Kubernetes v1.11 the
feature was added to allow a user to increase the size of an existing
PVC object. The user cannot shrink the size of an existing PVC object.

#### Volume Expansion capability

Certain volume types support PVCs expansion (details about
PVCs and the supported volume types can be found in [Kubernetes
documentation](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims))

You can run the following command to check if your storage supports the expansion capability:

``` {.bash data-prompt="$" }
$ kubectl describe sc <storage class name> | grep allowVolumeExpansion
```

??? example "Expected output"

```
allowVolumeExpansion: true
```

1. Get the list of volumes for you cluster:

``` {.bash data-prompt="$" }
kubectl get pvc -l app.kubernetes.io/instance=<CLUSTER_NAME>
```

??? example "Expected output"

``` {.text .no-copy}
NAME                     STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
datadir-cluster1-pxc-0   Bound    pvc-90f0633b-0938-4b66-a695-556bb8a9e943   6Gi        RWO            standard       5m13s
datadir-cluster1-pxc-1   Bound    pvc-7409ea83-15b6-448f-a6a0-12a139e2f5cc   6Gi        RWO            standard       3m52s
datadir-cluster1-pxc-2   Bound    pvc-90f0b2f8-9bba-4262-904c-1740fdd5511b   6Gi        RWO            standard       2m40s
```

2. Patch the volume to increase the size

You can either edit the pvc or run the patch command:

``` {.bash data-prompt="$" }
$ kubectl patch pvc <pvc-name> -p '{ "spec": { "resources": { "requests": { "storage": "NEW STORAGE SIZE" }}}}'
```

??? example "Expected output"

``` {.text .no-copy}
persistentvolumeclaim/datadir-cluster1-pxc-0 patched
```

3. Check if expansion is successful by running describe:

``` {.bash data-prompt="$" }
$ kubectl describe pvc <pvc-name>
```

??? example "Expected output"

``` {.text .no-copy}
...
  Normal  ExternalExpanding           3m52s              volume_expand                                                                                     CSI migration enabled for kubernetes.io/gce-pd; waiting for external resizer to expand the pvc
  Normal  Resizing                    3m52s              external-resizer pd.csi.storage.gke.io                                                            External resizer is resizing volume pvc-90f0633b-0938-4b66-a695-556bb8a9e943
  Normal  FileSystemResizeRequired    3m44s              external-resizer pd.csi.storage.gke.io                                                            Require file system resize of volume on node
  Normal  FileSystemResizeSuccessful  3m10s              kubelet                                                                                           MountVolume.NodeExpandVolume succeeded for volume "pvc-90f0633b-0938-4b66-a695-556bb8a9e943"
```

Repeat step 2 for all the volumes of your cluster.

4. Now we have increased storage, but our StatefulSet 
and Custom Resource are not in sync. Edit your Custom
Resource with new storage settings and apply:

``` {.text .no-copy}
spec:
  pxc:
    volumeSpec:
      persistentVolumeClaim:
        resources:
          requests:
            storage: <NEW STORAGE SIZE>
```

Apply the Custom Resource:

``` {.bash data-prompt="$" }
$ kubectl apply -f cr.yaml
```

5. Delete the StatefulSet to syncronize it with Custom
Resource:

``` {.bash data-prompt="$" }
$ kubectl delete sts <statefulset-name> --cascade=orphan
```

The Pods will not go down and Operator is going to recreate
the StatefulSet:

``` {.bash data-prompt="$" }
$ kubectl get sts <statefulset-name>
```

??? example "Expected output"

``` {.text .no-copy}
cluster1-pxc       3/3     39s
```

## Horizontal scaling

Size of the cluster is controlled by a [size key](operator.md#pxc-size) in the [Custom Resource options](operator.md#operator-custom-resource-options) configuration. That’s why scaling the cluster needs
nothing more but changing this option and applying the updated
configuration file. This may be done in a specifically saved config, or
on the fly, using the following command:

``` {.bash data-prompt="$" }
$ kubectl scale --replicas=5 pxc/cluster1
```

In this example we have changed the size of the Percona XtraDB Cluster
to `5` instances.
