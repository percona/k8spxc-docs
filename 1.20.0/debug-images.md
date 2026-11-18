> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Special debug images

For the cases when Pods are failing for some reason or just show abnormal behavior, the Operator can be used with a special *debug images*. Percona XtraDB Cluster debug image has the following specifics:

- it avoids restarting on fail,
- it contains additional tools useful for debugging (sudo, telnet, gdb, etc.),
- it has debug mode enabled for the logs.

There are debug versions for all [Percona XtraDB Cluster images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html): they have same names as normal images with a special `-debug` suffix in their version tag: for example, `percona-xtradb-cluster:8.4.8-8.1-debug`.

To use the debug image instead of the normal one, find the needed image name [in the list of certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html) and set it for the proper key in the `deploy/cr.yaml` configuration file. For example, set the following value of the `pxc.image` key to use the Percona XtraDB Cluster debug image:

- `percona/percona-xtradb-cluster:8.4.8-8.1-debug` for Percona XtraDB Cluster 8.4,
- `percona/percona-xtradb-cluster:8.0.45-36.1-debug` for Percona XtraDB Cluster 8.0,
- `percona/percona-xtradb-cluster:5.7.44-31.65-debug` for Percona XtraDB Cluster 5.7.

The Pod should be restarted to get the new image.

Note

When the Pod is continuously restarting, you may have to delete it to apply image changes.
