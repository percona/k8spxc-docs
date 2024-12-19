# Percona certified images

Following table presents Percona’s certified docker images to be used with the
Percona Operator for MySQL based on Percona XtraDB Cluster.

| Image                                                                  | Digest                                                           |
|:-----------------------------------------------------------------------|:-----------------------------------------------------------------|
| **Images released with the Operator version {{ release }}:** | |
| percona/percona-xtradb-cluster-operator:1.16.0 (x86_64)                | ddab83ee4610df03636bbbfb159379b96ef36593681879997d74ebe0d08e0ef9 |
| percona/percona-xtradb-cluster-operator:1.16.0 (ARM64)                 | c0a75755218c19834e586643f75f61efd4964199147fa969d01fd3d881d03fbe |
| percona/haproxy:2.8.11                                                 | 422a210b4170a973f8582ef3d7ddcc879c32bc48f6c66fad8b3154bce4e79b84 |
| percona/proxysql2:2.7.1                                                | b1c5cd48b218d19386724fa823d20a8454b2de87f4ab445903e8daeb3b6b015b |
| percona/percona-xtradb-cluster-operator:1.16.0-pxc8.4-backup-pxb8.4.0  | 500f20baa21a7df71a517c9434d1907e4cb482fdd58784975f97976a0bce699d |
| percona/percona-xtradb-cluster-operator:1.16.0-pxc8.0-backup-pxb8.0.35 | 55281c818a78162cac0c87257915d74f321a4663f3f60457da2566c64610bf49 |
| percona/percona-xtradb-cluster-operator:1.16.0-pxc5.7-backup-pxb2.4.29 | ddcec747748dccfbf4d7a6ba9c6a34f09cb7814ab59c49e73dff239949012039 |
| percona/percona-xtradb-cluster-operator:1.16.0-logcollector-fluentbit3.2.2 | 122a103902d27890dceaf1855f175ea706a126aac940feb1089520029937f4a9 |
| percona/pmm-client:2.44.0                                              | 0737f73449263a14d7000fbe7cd88dfd589dfed975cbb16bd29eee06a5dbd49e |
| percona/percona-xtradb-cluster:8.4.2-2.1                               | ee8be9e7e2ecc1fdfebb29141f5f15abcd15490213f6bdbe0a53a1e6cc942fa8 |
| percona/percona-xtradb-cluster:8.0.39-30.1                             | 6a53a6ad4e7d2c2fb404d274d993414a22cb67beecf7228df9d5d994e7a09966 |
| percona/percona-xtradb-cluster:8.0.36-28.1                             | b5cc4034ccfb0186d6a734cb749ae17f013b027e9e64746b2c876e8beef379b3 |
| percona/percona-xtradb-cluster:8.0.35-27.1                             | 1ef24953591ef1c1ce39576843d5615d4060fd09458c7a39ebc3e2eda7ef486b |
| percona/percona-xtradb-cluster:8.0.32-24.2                             | 1f978ab8912e1b5fc66570529cb7e7a4ec6a38adbfce1ece78159b0fcfa7d47a |
| percona/percona-xtradb-cluster:8.0.31-23.2                             | ed1ceea0b594ae34a92c891b4e42bc543d24999c82e47382cf53e33be4ae1d71 |
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

An example looks as follows: `1.16.0-pxc8.0-backup-pxb8.0.35`

Percona XtraDB Cluster versions may have different
detalization ("pxc" prefix with major and minor numbers, like "pxc8.0", or
with minor, major, and patch numbers, like "pxc8.0.36", or the full XtraDB
Cluster version without prefix: major, minor, and patch numbers followed by
a dash and the version of Percona Server this XtraDB Cluster version is based
on, like "8.0.36-28.1").

Note, that PMM Client images have their own tags, just containing the version
of PMM.

