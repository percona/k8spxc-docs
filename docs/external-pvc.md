# Add external PersistentVolumeClaims to the Operator

One of the first things to think about when you run a database cluster on Kubernetes is data persistence. You want to make sure that if a Pod restarts, your data doesn't vanish with it. That's where Persistent Volumes (PVs) and Persistent Volume Claims (PVCs) come in.

A PV is a chunk of storage in your Kubernetes cluster, provisioned either by a cluster admin or dynamically via a storage class. A PVC is how your Pod asks for that storage. When you deploy a database cluster using an Operator, each pod automatically gets its own PVC. That PVC binds to a Persistent Volume that matches the pod's needs such as size, access mode, and storage class. This ensures that your database has durable, pod-specific storage.

Sometimes your database needs access to data it doesn't own. An example of such data is externally generated lookup tables, reference files, or large binary objects. These aren't part of the database's internal storage, but they may be essential to its operation. 

To ensure the smooth operation of your client applications and the database itself, you can add external PVCs that store such data to the Operator. This gives you a clean separation between the cluster’s internal storage and shared or external data. You can update or replace the shared data independently of the cluster lifecycle, while still staying fully compatible with the Operator's management flow.

You can add external PVCs either when creating the cluster or at runtime. You can mount them into PXC pods, ProxySQL, or HAProxy, depending on where your database needs them. Since the Operator doesn't create nor manage these PVCs, they must already exist in the same namespace as your cluster before you deploy or update it. 

To add an external PVC, edit your `deploy/cr.yaml` file and include the following under the `pxc.extraPVCs`, `proxysql.extraPVCs`, or `haproxy.extraPVCs` sections:

```yaml
pxc:
  extraPVCs:
    - name: shared-data
      claimName: my-existing-pvc
      mountPath: /mnt/shared-data
      readOnly: false
```

After you apply the changes, the Operator will mount the existing PVC `my-existing-pvc` into your PXC pod at `/mnt/shared-data`. You're in control of the data, and the database gets exactly what it needs.

