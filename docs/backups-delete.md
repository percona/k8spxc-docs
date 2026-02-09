# Delete the unneeded backup

The maximum amount of stored backups is controlled by the [backup.schedule.keep](operator.md#backupschedulekeep)
option (only successful backups are counted). Older backups are automatically
deleted, so that amount of stored backups do not exceed this number. Setting
`keep=0` or removing this option from `deploy/cr.yaml` disables automatic
deletion of backups.

Manual deleting of a previously saved backup requires not more than the backup
name. This name can be taken from the list of available backups returned
by the following command:

```bash
kubectl get pxc-backup
```

When the name is known, backup can be deleted as follows:

```bash
kubectl delete pxc-backup/<backup-name>
```
