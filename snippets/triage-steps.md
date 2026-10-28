Check these sources in order. Each one narrows down the layer.

1. **Custom Resource status and conditions.** `kubectl get pxc cluster1 -o yaml` shows the cluster state, the reconcile error message if any, and scheduling problems. An `error` state with a spec message points to the user. See [Status](architecture-reconciliation.md#status).
2. **Events.** `kubectl get events --sort-by=.lastTimestamp` shows Kubernetes problems: scheduling, volume attachment and resize, image pulls, probe failures. The Operator itself adds events only for full cluster crash recovery, CA rotation and volume resize. See [Check the events](debug-events.md).
3. **Operator logs.** `kubectl logs deployment/percona-xtradb-cluster-operator` shows what the Operator is doing or waiting for: a stuck rolling restart, a skipped backup, broken replication. Most Operator problems appear only here.
4. **Pod and container logs.** `kubectl logs cluster1-pxc-0 -c pxc` shows Galera and MySQL problems: SST failures, quorum loss, `mysqld` start failures. For backup and restore problems, read the logs of the Job. See [Check the logs](debug-logs.md).
