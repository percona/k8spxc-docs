> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Configure Persistent Volume storage for backups

Persistent Volume backup storage does not use a Secret. Configure it in the Custom Resource only.

Set a volume large enough for the backup

The example below requests 6G. That size may be too small for production backups. Calculate the volume depending on your dataset size. An uncompressed backup is about the size of the data in the cluster. Add space for each backup you plan to keep on this volume.

You can change the size later. Edit the `deploy/cr.yaml` manifest and apply it with `kubectl`.

Here is an example of the `deploy/cr.yaml` backup section fragment, which configures a Persistent Volume for filesystem-type storage:

```
...
backup:
  ...
  storages:
    fs-pvc:
      type: filesystem
      volume:
        persistentVolumeClaim:
          accessModes: [ "ReadWriteOnce" ]
          resources:
            requests:
              storage: 6G
  ...
```

You can also set [`volume.persistentVolumeClaim.storageClassName`](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-namevolumepersistentvolumeclaimstorageclassname) to use a specific storage class for the Persistent Volume Claim instead of the cluster default.

For more configuration options, see the [Operator Custom Resource options](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#operator-backup-section).

## Next step

[On-demand backup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-ondemand.html) [Scheduled backup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-scheduled.html)
