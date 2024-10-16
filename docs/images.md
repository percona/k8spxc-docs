# Percona certified images

Following table presents Percona’s certified docker images to be used with the
Percona Operator for MySQL based on Percona XtraDB Cluster.

| Image                                                                  | Digest                                                           |
|:-----------------------------------------------------------------------|:-----------------------------------------------------------------|
| **Images released with the Operator version {{ release }}:** | |
| percona/percona-xtradb-cluster-operator:1.15.0 (x86_64)                | 16a0078b5ededc4ae346168ee005aedf17f9ddddebf1eca067244d2f907bb7fa |
| percona/percona-xtradb-cluster-operator:1.15.0 (ARM64)                 | 862c0be9f278aed33c521dabb55986b33da5eddb52cc99e205c7bb8feac9b22f |
| percona/haproxy:2.8.5                                                  | 941f3bd0977bff9145e904bf8f8298a1a024d7f03152edaea0cf65fd1c137340 |
| percona/proxysql2:2.5.5                                                | d95b0c6782447fef22adea3e8b8143e79a6a757666ffd34a8c3eddd9f82d629c |
| percona/percona-xtradb-cluster-operator:1.15.1-pxc8.0-backup-pxb8.0.35 | 6395019766db6118f61b8085c720d1d574c73511f84c9db5d222460f790649fb |
| percona/percona-xtradb-cluster-operator:1.15.1-pxc5.7-backup-pxb2.4.29 | dfe6545b83b18450a3243441e6b43c3a6ed05dcc24a464286ffb9a7328fdb13f |
| percona/percona-xtradb-cluster-operator:1.15.1-logcollector-fluentbit3.1.4 | 24b068d55559cbe5dbadc2f52e5c096f7df60374e47c6b4d1a5e331fd2a75014 |
| percona/pmm-client:2.42.0                                              | 14cb96de47e3bc239bf285f22ec6f170b4a1181301b19100f5b7dc22c210bf8c |
| percona/percona-xtradb-cluster:8.0.36-28.1                             | b5cc4034ccfb0186d6a734cb749ae17f013b027e9e64746b2c876e8beef379b3 |
| percona/percona-xtradb-cluster:8.0.35-27.1                             | 1ef24953591ef1c1ce39576843d5615d4060fd09458c7a39ebc3e2eda7ef486b |
| percona/percona-xtradb-cluster:8.0.32-24.2                             | 1f978ab8912e1b5fc66570529cb7e7a4ec6a38adbfce1ece78159b0fcfa7d47a |
| percona/percona-xtradb-cluster:8.0.31-23.2                             | ed1ceea0b594ae34a92c891b4e42bc543d24999c82e47382cf53e33be4ae1d71 |
| percona/percona-xtradb-cluster:8.0.29-21.1                             | 96c6bb8189280aeb773e74ed46aa41c01781b62947ed70c89efeb9f41c367ee7 |
| percona/percona-xtradb-cluster:5.7.44-31.65                            | 36fafdef46485839d4ff7c6dc73b4542b07031644c0152e911acb9734ff2be85 |
| percona/percona-xtradb-cluster:5.7.42-31.65                            | 9dab86780f86ec9caf8e1032a563c131904b75a37edeaec159a93f7d0c16c603 |
| percona/percona-xtradb-cluster:5.7.39-31.61                            | 9013170a71559bbac92ba9c2e986db9bda3a8a9e39ee1ee350e0ee94488bb6d7 |
| percona/percona-xtradb-cluster:5.7.36-31.55                            | c7bad990fc7ca0fde89240e921052f49da08b67c7c6dc54239593d61710be504 |
| percona/percona-xtradb-cluster:5.7.34-31.51                            | f8d51d7932b9bb1a5a896c7ae440256230eb69b55798ff37397aabfd58b80ccb |

Image tags are starting with the Operator's version and include a number of
optional fields: the Percona XtraDB Cluster version ("pxc8.0.36"), name of the
actual component in the image ("haproxy", "backup", etc.), and the version of
this component ("pxb8.0.35"):

`operator_version-[pxc_version]-[component_name]-[component_version]`

An example looks as follows: `1.15.0-pxc8.0-backup-pxb8.0.35`

Percona XtraDB Cluster versions may have different
detalization ("pxc" prefix with major and minor numbers, like "pxc8.0", or
with minor, major, and patch numbers, like "pxc8.0.36", or the full XtraDB
Cluster version without prefix: major, minor, and patch numbers followed by
a dash and the version of Percona Server this XtraDB Cluster version is based
on, like "8.0.36-28.1").

Note, that PMM Client images have their own tags, just containing the version
of PMM.
