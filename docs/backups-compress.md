# Enable compression for backups

There is a possibility to enable [LZ4 compression](https://en.wikipedia.org/wiki/LZ4_(compression_algorithm))
for backups.

!!! note

    This feature is available only with Percona XtraDB Cluster 8.0 and not
    Percona XtraDB Cluster 5.7.

To enable compression, use [pxc.configuration](operator.md#pxc-configuration)
key in the `deploy/cr.yaml` configuration file to supply Percona XtraDB Cluster
nodes with two additional `my.cnf` options under its `[sst]` and `[xtrabackup]`
sections as follows:

```yaml
pxc:
  image: percona/percona-xtradb-cluster:8.0.19-10.1
  configuration: |
    ...
    [sst]
    xbstream-opts=--decompress
    [xtrabackup]
    compress=lz4
    ...
```

When enabled, compression will be used for both backups and [SST](https://www.percona.com/doc/percona-xtradb-cluster/8.0/manual/state_snapshot_transfer.html).


