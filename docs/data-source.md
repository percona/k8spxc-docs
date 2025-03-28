# Clone a cluster with the same data set

A good practice is to test a new functionality or an upgraded version of the database in a testing / staging environment. As a developer, you would want the data in the staging database cluster, so that your applications can start immediately. 

The [`dataSource` :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#volume-cloning) functionality allows doing just that. Instead of creating a new PVC for a new cluster, you can clone the existing one. This enables you to spin up a new cluster with the data in it almost in no time which is especially beneficial if you use CI/CD for that.

For example, you have the production Percona XtraDB Cluster `cluster1`. To test a new feature in your app, you need a staging cluster `cluster2` with the data set from `cluster1`. 

To create it, create the `cluster2-cr.yaml` Custom Resource manifest. You can use the existing [`deploy/cr.yaml` ](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/{{release}}/deploy/cr.yaml) for convenience. Specify the PVC from `cluster1` as the `dataSource` for it:

```yaml
pxc:
  volumeSpec:
    persistentVolumeClaim:
      dataSource:
        name: cluster1-pvc
        kind: PersistentVolumeClaim

```

This configuration instructs the Operator to create a direct clone of the PVC from `cluster1`. If you have a snapshot of the PVC, you can use that as a data source for your staging cluster. Here’s how you define it:

```yaml
persistentVolumeClaim:
  dataSource:
    name: cluster1-pvc-snapshot1
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
```

To create a database cluster, apply the `cluster2-cr.yaml`.
