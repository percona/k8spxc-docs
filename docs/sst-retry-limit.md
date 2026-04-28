# Limit SST retries

When a Percona XtraDB Cluster node joins or rejoins the cluster, it receives  data from an existing cluster member using the State Snapshot Transfer (SST) method. If SST fails repeatedly, the node can quickly enter an endless retry loop, using resources such network bandwidth and impacting the overall cluster performance.

To prevent excessive and ineffective SST retry loops, you can set a limit on SST attempts for each joining node using the `spec.pxc.sstRetryCount` option in the Custom Resource. The Operator counts SST retries and records them in the `/var/lib/mysql/sst_retry_count` file inside the Pod.

When the number of SST attempts exceeds the specified threshold, the following occurs:

* The Operator creates the `/var/lib/mysql/sst_retry_limit_reached` marker file and further SST attempts are stopped.
* Liveness checks on the Pod continue to pass
* Readiness checks fail
* The Pod stays running, but remains unready
* The `SST retry limit reached` message is written in the container logs

This behavior lets you inspect the Pod and decide when to resume retries.

## Configure the retry limit

Set `spec.pxc.sstRetryCount` in your Custom Resource:

```yaml
apiVersion: pxc.percona.com/v1
kind: PerconaXtraDBCluster
metadata:
  name: cluster1
spec:
  pxc:
    sstRetryCount: 3
```

The value must be an integer greater than or equal to `1`.

## Resume SST retries

To allow retries again, remove the marker file inside the affected Pod:

```bash
kubectl exec -it cluster1-pxc-2 -c pxc -- rm -f /var/lib/mysql/sst_retry_limit_reached
```

The retry state is cleared automatically after the node successfully reaches the `joined` or `synced` state.
