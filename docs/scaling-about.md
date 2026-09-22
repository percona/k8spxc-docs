# About scaling and storage

A cluster rarely stays the size you first deployed it at. You can grow your cluster in different ways:  

* add database nodes, 
* increase CPU and memory for a component, 
* scale HAProxy or ProxySQL Pods, 
* expand storage as your workload grows. 
 
This page describes each approach and which one to plan before you deploy.

## Ways to scale

| Approach | What changes | Choose it when |
|---|---|---|
| *Vertical scaling* | CPU and memory requests and limits for a component (`resources`). | A component is resource-bound rather than too small in number. |
| *Horizontal scaling* | The number of Percona XtraDB Cluster nodes (`pxc.size`). | You need more redundancy or more read capacity. |
| *Proxy sizing* | The number of HAProxy or ProxySQL Pods (`haproxy.size` / `proxysql.size`). | You're hitting connection bottlenecks or need proxy redundancy. |
| *Storage scaling* | The size of the persistent volumes behind the database nodes (`pxc.volumeSpec`). | The dataset outgrows the disks. |

These approaches can complement each other — a growing workload often needs more than one at once.
Vertical scaling, horizontal scaling, and proxy sizing are covered in
[Horizontal and vertical scaling](scaling.md). Storage is covered on this page and in
[Resize storage](scaling-storage-resize.md).

## Storage

Each Percona XtraDB Cluster node gets its own persistent volume, defined in
`pxc.volumeSpec`. Kubernetes manages this storage through two objects: 

* a PersistentVolume (PV) - a segment of storage the Kubernetes administrator supplies, 
* a PersistentVolumeClaim (PVC) - a request for storage from a user.

Starting from version 1.14.0, you can increase the size of an existing PVC (stable since
Kubernetes v1.24). You cannot shrink an existing PVC.

The Operator supports three ways to grow storage: automatic resizing based on usage
thresholds, resizing through Kubernetes' Volume Expansion capability, and manual resizing
for volume types or Operator versions that don't support Volume Expansion. For the full
step-by-step procedures, see [Resize storage](scaling-storage-resize.md).

## Limitations

* **Volumes cannot shrink.** Kubernetes can expand a PersistentVolumeClaim, but it cannot reduce
  it. When Volume Expansion is unavailable, use
  [Manual resizing](scaling-storage-resize.md#manual-resizing-without-volume-expansion-capability)
  to recreate PVCs one at a time. Otherwise create a new cluster and restore your data.
* Expansion depends on the storage class. A `StorageClass` without
  `allowVolumeExpansion: true` cannot grow its volumes at all. Check this before you need
  it, not during an incident.
* Changing `pxc.size` changes the cluster's Galera quorum voting membership. Review
  [Choose a safe node count](scaling.md#choose-a-safe-node-count) before changing node
  counts.

## Verify a scaling change

```bash
kubectl get pxc <cluster-name> -n <namespace>
kubectl get pvc -n <namespace>
```

`.status.state` must return `ready`. After a storage change, PVC capacity must show the new size. A PVC stuck at the old size with the cluster otherwise healthy means the storage class didn't accept the expansion — check the PVC events.

## See also

* [Horizontal and vertical scaling](scaling.md)
* [Resize storage](scaling-storage-resize.md)
* [Troubleshoot storage resizing](debug-storage.md)
