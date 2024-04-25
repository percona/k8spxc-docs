# Percona certified images

Following table presents Percona’s certified docker images to be used with the
Percona Operator for MySQL based on Percona XtraDB Cluster.

| Image                                                                  | Digest                                                           |
|:-----------------------------------------------------------------------|:-----------------------------------------------------------------|
| **Images released with the Operator version {{ release }}:** | |
| percona/percona-xtradb-cluster-operator:1.14.0 (x86_64)                | 370f425280233a6beaed74d8173a2b836145596d1feb05fe1c8831d382a101db |
| percona/percona-xtradb-cluster-operator:1.14.0 (ARM64)                 | 5aaddf5d88fbe34cb5ee5ee042b116a162273a4863c856f66909231fe6f8d502 |
| percona/percona-xtradb-cluster-operator:1.14.0-haproxy                 | 15b9dad6d59c7995456b92fb1b5c17501ecbc8bafb758ff6e7417d409f06bbbd |
| percona/percona-xtradb-cluster-operator:1.14.0-proxysql                | 333d0949eb048e927ac62389a5ced838dfdffe89605b30e543c10c59feb6dca2 |
| percona/percona-xtradb-cluster-operator:1.14.0-pxc8.0-backup-pxb8.0.35 | a9cd538dc713462b147a9866152bda042e326b125a9f6bd5684b9b46e75a8b01 |
| percona/percona-xtradb-cluster-operator:1.14.0-pxc5.7-backup-pxb2.4.29 | e4871437d1a6952f67c43bd10a236dd36c72519220971a8ce644e9320a2a642e |
| percona/percona-xtradb-cluster-operator:1.14.0-logcollector            | f8f56b8da5b1d9859dded3f89b7ce41c5b3ceba6d78f7d4152bd0b14bafc60f4 |
| percona/pmm-client:2.41.1                                              | b10b771da20150390c8151cd1a3213a43348ec699064c953b2ad10783f8d7b1c |
| percona/percona-xtradb-cluster:8.0.35-27.1                             | 1ef24953591ef1c1ce39576843d5615d4060fd09458c7a39ebc3e2eda7ef486b |
| percona/percona-xtradb-cluster:8.0.32-24.2                             | 1f978ab8912e1b5fc66570529cb7e7a4ec6a38adbfce1ece78159b0fcfa7d47a |
| percona/percona-xtradb-cluster:8.0.31-23.2                             | e47110307e9733fbcc55e5587652e41bbcf794063b021533d5e705062da97927 |
| percona/percona-xtradb-cluster:8.0.29-21.1                             | 96c6bb8189280aeb773e74ed46aa41c01781b62947ed70c89efeb9f41c367ee7 |
| percona/percona-xtradb-cluster:8.0.25-15.1                             | 529e979c86442429e6feabef9a2d9fc362f4626146f208fbfac704e145a492dd |
| percona/percona-xtradb-cluster:5.7.44-31.65                            | 36fafdef46485839d4ff7c6dc73b4542b07031644c0152e911acb9734ff2be85 |
| percona/percona-xtradb-cluster:5.7.42-31.65                            | 9dab86780f86ec9caf8e1032a563c131904b75a37edeaec159a93f7d0c16c603 |
| percona/percona-xtradb-cluster:5.7.39-31.61                            | 9013170a71559bbac92ba9c2e986db9bda3a8a9e39ee1ee350e0ee94488bb6d7 |
| percona/percona-xtradb-cluster:5.7.36-31.55                            | c7bad990fc7ca0fde89240e921052f49da08b67c7c6dc54239593d61710be504 |
| percona/percona-xtradb-cluster:5.7.34-31.51                            | f8d51d7932b9bb1a5a896c7ae440256230eb69b55798ff37397aabfd58b80ccb |
| **Images added to support Percona XtraDB Cluster 8.0.36**: | |
| percona/percona-xtradb-cluster-operator:1.14.0-proxysql2.5.5-1.2       | fcd7c1366f26f3dbaeff65d7ee08c43bbb88838cec9a0085447c1b56c717870d |
| percona/percona-xtradb-cluster-operator:1.14.0-pxc8.0.36-backup-pxb8.0.35 | c17261dc7c40af2ab28510e702d4b6a2fb76b30001991fad3ddfa4271cc18157 |
| percona/pmm-client:2.41.2                                              | 16d2499c1cbcc1af51bd3752fe7623b0d0a319ee128b12d41cadf8080d1ce56b |
| percona/percona-xtradb-cluster:8.0.36-28.1                             | ed99f585a27257726a985fee5f50cd957f94f5b9ae70a5d2f0fa1e68336f3abe |

Image tags are starting with the Operator's version and include a number of
optional fields: the Percona XtraDB Cluster version ("pxc8.0.36"), name of the
actual component in the image ("haproxy", "backup", etc.), and the version of
this component ("pxb8.0.35"):

`operator_version-[pxc_version]-[component_name]-[component_version]`

An example looks as follows: `1.14.0-pxc8.0-backup-pxb8.0.35`

Percona XtraDB Cluster versions may have different
detalization ("pxc" prefix with major and minor numbers, like "pxc8.0", or
with minor, major, and patch numbers, like "pxc8.0.36", or the full XtraDB
Cluster version without prefix: major, minor, and patch numbers followed by
a dash and the version of Percona Server this XtraDB Cluster version is based
on, like "8.0.36-28.1").

Note, that PMM Client images have their own tags, just containing the version
of PMM.

