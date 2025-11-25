# Enable compression for backups

You can enable [ZSTD compression :octicons-link-external-16:](https://en.wikipedia.org/wiki/Zstd)
for backups if you run Percona XtraDB Cluster 8.0.34 and higher.

To enable compression, use the [pxc.configuration](operator.md#pxcconfiguration)
key in the `deploy/cr.yaml` configuration file. Specify the following options from the `my.cnf` configuration file in the `[sst]` and `[xtrabackup]` sections:

```yaml
pxc:
  image: percona/percona-xtradb-cluster:{{pxb80recommended}}
  configuration: |
    ...
    [sst]
    xbstream-opts=--decompress
    [xtrabackup]
    compress=zstd
    ...
```

When enabled, compression will be used for both backups and [SST :octicons-link-external-16:](https://docs.percona.com/percona-xtradb-cluster/8.4/state-snapshot-transfer.html).


