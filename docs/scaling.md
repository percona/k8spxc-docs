# Scale Percona XtraDB Cluster on Kubernetes and OpenShift

One of the great advantages brought by Kubernetes and the OpenShift
platform is the ease of an application scaling. Scaling an application
results in adding or removing the Pods and scheduling them to available
Kubernetes nodes.

Size of the cluster is controlled by a [size key](operator.md#pxc-size) in the [Custom Resource options](operator.md#operator-custom-resource-options) configuration. That’s why scaling the cluster needs
nothing more but changing this option and applying the updated
configuration file. This may be done in a specifically saved config, or
on the fly, using the following command:

```bash
$ kubectl scale --replicas=5 pxc/cluster1
```

In this example we have changed the size of the Percona XtraDB Cluster
to `5` instances.

## Increase the Persistent Volume Claim size

Kubernetes manages storage with a PersistentVolume (PV), a segment of
storage supplied by the administrator, and a PersistentVolumeClaim
(PVC), a request for storage from a user. In Kubernetes v1.11 the
feature was added to allow a user to increase the size of an existing
PVC object. The user cannot shrink the size of an existing PVC object.
Certain volume types support, by default, expanding PVCs (details about
PVCs and the supported volume types can be found in [Kubernetes
documentation](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims))

The following are the steps to increase the size:

1. Extract and backup the yaml file for the cluster

```bash
$ kubectl get pxc cluster1 -o yaml --export > CR_backup.yaml
```


2. Now you should delete the cluster.

    !!! warning

        Make sure that [delete-pxc-pvc](operator.md#finalizers-pxc) finalizer
        is not set in your custom resource, **otherwise all cluster data will be lost!**

    You can use the following command to delete the cluster:

    ```bash
    $ kubectl delete -f CR_backup.yaml
    ```

3. For each node, edit the yaml to resize the PVC object.

    ```bash
    $ kubectl edit pvc datadir-cluster1-pxc-0
    ```

    In the yaml, edit the spec.resources.requests.storage value.

    ```yaml
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 6Gi
    ```

    Perform the same operation on the other nodes.

    ```bash
    $ kubectl edit pvc datadir-cluster1-pxc-1
    $ kubectl edit pvc datadir-cluster1-pxc-2
    ```

4. In the CR configuration file, use vim or another text editor to edit
    the PVC size.

    ```bash
    $ vim CR_backup.yaml
    ```

5. Apply the updated configuration to the cluster.

    ```bash
    $ kubectl apply -f CR_backup.yaml
    ```
