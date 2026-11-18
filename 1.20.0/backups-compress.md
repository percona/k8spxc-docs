> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Enable compression for backups

You can enable [ZSTD compression](https://en.wikipedia.org/wiki/Zstd) for backups if you run Percona XtraDB Cluster 8.0.34 and higher.

To enable compression, use the [pxc.configuration](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#pxcconfiguration) key in the `deploy/cr.yaml` configuration file. Specify the following options from the `my.cnf` configuration file in the `[sst]` and `[xtrabackup]` sections:

```
pxc:
  image: percona/percona-xtradb-cluster:8.4.0-5.1
  configuration: |
    ...
    [sst]
    xbstream-opts=--decompress
    [xtrabackup]
    compress=zstd
    ...
```

When enabled, compression will be used for both backups and [SST](https://docs.percona.com/percona-xtradb-cluster/8.0/state-snapshot-transfer.html) .
