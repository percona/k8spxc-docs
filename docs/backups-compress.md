# Enable compression for backups

You can enable [LZ4 compression :octicons-link-external-16:](https://en.wikipedia.org/wiki/LZ4_(compression_algorithm))
for backups if you run Percona XtraDB Cluster 8.0 and higher.

To enable compression, use the [pxc.configuration](operator.md#pxcconfiguration)
key in the `deploy/cr.yaml` configuration file. Specify the following options from the `my.cnf` configuration file in the `[sst]` and `[xtrabackup]` sections:

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

When enabled, compression will be used for both backups and [SST :octicons-link-external-16:](https://docs.percona.com/percona-xtradb-cluster/8.0/state-snapshot-transfer.html).


