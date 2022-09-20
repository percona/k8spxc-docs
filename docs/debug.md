# Debug

## Cluster-level logging

Cluster-level logging involves collecting logs from all Percona XtraDB Cluster
Pods in the cluster to some persistent storage. This feature gives the logs a
lifecycle independent of nodes, Pods and containers in which they were
collected. Particularly, it ensures that Pod logs from previous failures are
available for later review.

Log collector is turned on by the `logcollector.enabled` key in the
`deploy/cr.yaml` configuration file (`true` by default).

The Operator collects logs using [Fluent Bit Log Processor](https://fluentbit.io/),
which supports many output plugins and has broad forwarding capabilities.
If necessary, Fluent Bit filtering and advanced features can be configured via
the `logcollector.configuration` key in the `deploy/cr.yaml` configuration
file.

Logs are stored for 7 days and then rotated.

Collected logs can be examined using the following command:

```bash
$ kubectl logs cluster1-pxc-1 -c logs
```

**NOTE**: Technically, logs are stored on the same Persistent Volume, which is
used with the corresponding Percona XtraDB Cluster Pod. Therefore collected
logs can be found in `DATADIR` (`var/lib/mysql/`).

**NOTE**: You can parse output of the logs with [jq JSON processor](https://stedolan.github.io/jq/) as follows:  `kubectl logs cluster1-pxc-1 -c logs -f | jq -R 'fromjson?'`.

## Avoid the restart-on-fail loop for Percona XtraDB Cluster containers

The restart-on-fail loop takes place when the container entry point fails
(e.g. `mysqld` crashes). In such a situation, Pod is continuously restarting.
Continuous restarts prevent to get console access to the container, and so a
special approach is needed to make fixes.

You can prevent such infinite boot loop by putting the Percona XtraDB Cluster
containers into the infinity loop *without* starting mysqld. This behavior
of the container entry point is triggered by the presence of the
`/var/lib/mysql/sleep-forever` file.

For example, you can do it for the `pxc` container of an appropriate Percona
XtraDB Cluster instance as follows:

```bash
$ kubectl exec -it cluster1-pxc-0 -c pxc -- sh -c 'touch /var/lib/mysql/sleep-forever'
```

If `pxc` container can’t start, you can use `logs` container instead:

```bash
$ kubectl exec -it cluster1-pxc-0 -c logs -- sh -c 'touch /var/lib/mysql/sleep-forever'
```

The instance will restart automatically and run in its usual way as soon as you
remove this file (you can do it with a command similar to the one you have used
to create the file, just substitute `touch` to `rm` in it).

## Special debug images

For the cases when Pods are failing for some reason or just show abnormal
behavior, the Operator can be used with a special *debug images*. Percona XtraDB
Cluster debug image has the following specifics:


* it avoids restarting on fail,


* it contains additional tools useful for debugging (sudo, telnet, gdb, etc.),


* it has debug mode enabled for the logs.

There are debug versions for all [Percona XtraDB Cluster images](images.md#custom-registry-images): they have same names as normal images with a special `-debug` suffix in their version tag: for example, `percona-xtradb-cluster:{{ pxc80recommended }}-debug`.

To use the debug image instead of the normal one, find the needed image name
[in the list of certified images](images.md#custom-registry-images) and set it
for the proper key in the `deploy/cr.yaml` configuration file. For example,
set the following value of the `pxc.image` key to use the Percona XtraDB
Cluster debug image:


* `percona/percona-xtradb-cluster:{{ pxc80recommended }}-debug` for Percona XtraDB Cluster 8.0,


* `percona/percona-xtradb-cluster:{{ pxc57recommended }}-debug` for Percona XtraDB Cluster 5.7.

The Pod should be restarted to get the new image.

**NOTE**: When the Pod is continuously restarting, you may have to delete it
to apply image changes.
