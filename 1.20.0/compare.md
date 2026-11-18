> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Compare various solutions to deploy MySQL in Kubernetes

There are multiple ways to deploy and manage MySQL in Kubernetes. Here we will focus on comparing the following open source solutions:

- [KubeDB](https://github.com/kubedb)

- [Bitpoke MySQL Operator (former Presslabs)](https://github.com/bitpoke/mysql-operator/)

- [Oracle MySQL Operator](https://github.com/mysql/mysql-operator)

- [MariaDB Operator](https://github.com/mariadb-operator/mariadb-operator)

- [Moco](https://github.com/cybozu-go/moco) by Cybozu

- [Vitess Operator](https://github.com/planetscale/vitess-operator) by PlanetScale

- Percona Operator for MySQL:

  - [based on Percona XtraDB Cluster](https://github.com/percona/percona-xtradb-cluster-operator)
  - [based on Percona Server for MySQL](https://github.com/percona/percona-server-mysql-operator/)

## Generic

The review of generic features, such as supported MySQL versions, open source models and more.

| Feature/Product        | Percona Operator for MySQL (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator | Moco           | Oracle MySQL Operator                                                          | Vitess         |
| ---------------------- | ----------------------------------------- | ---------------------------------------- | ---------------------- | -------------- | ------------------------------------------------------------------------------ | -------------- |
| Open source model      | Apache 2.0                                | Apache 2.0                               | Apache 2.0             | Apache 2.0     | Apache 2.0                                                                     | Apache 2.0     |
| MySQL versions         | 5.7, 8.0                                  | 8.0                                      | 5.7                    | 8.0            | 8.0                                                                            | 5.7, 8.0       |
| Kubernetes conformance | Various versions are tested               | Various versions are tested              | Not guaranteed         | Not guaranteed | Not guaranteed                                                                 | Not guaranteed |
| Paid support           |                                           |                                          |                        |                |                                                                                |                |
| Web-based GUI          | [Open Everest](http://openeverest.io/)    |                                          |                        |                | [Oracle Enterprise Manager](https://www.mysql.com/products/enterprise/em.html) |                |

## MySQL Topologies

Focus on replication capabilities and proxies integrations.

| Feature/Product          | Percona Operator for MySQL (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator | Moco      | Oracle MySQL Operator             | MariaDB Operator                      | Vitess |
| ------------------------ | ----------------------------------------- | ---------------------------------------- | ---------------------- | --------- | --------------------------------- | ------------------------------------- | ------ |
| Replication              | Sync with Galera                          | Group Replication; async (tech preview)  | Async                  | Semi-sync | Group Replication                 | Sync with Galera; async and semi-sync | Async  |
| Proxy                    | HAProxy and ProxySQL                      | HAProxy and MySQL Router                 | None                   | None      | MySQL Router                      | MaxScale                              | VTGate |
| Multi-cluster deployment |                                           | (InnoDB ClusterSet)                      |                        |           | Undocumented (ClusterSet in code) |                                       |        |
| Sharding                 |                                           |                                          |                        |           |                                   |                                       |        |

## Backups

Here are the backup and restore capabilities of each solution.

| Feature/Product     | Percona Operator for MySQL (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator | Moco | Oracle MySQL Operator | MariaDB Operator                | Vitess |
| ------------------- | ----------------------------------------- | ---------------------------------------- | ---------------------- | ---- | --------------------- | ------------------------------- | ------ |
| Scheduled backups   |                                           |                                          |                        |      |                       |                                 |        |
| Incremental backups |                                           | Tech preview                             |                        |      |                       |                                 |        |
| PITR                |                                           | Tech preview                             |                        |      |                       | Async replication topology only |        |
| PVCs for backups    |                                           |                                          |                        |      |                       |                                 |        |

## Monitoring

Monitoring is crucial for any operations team.

| Feature/Product  | Percona Operator for MySQL (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator | Moco            | Oracle MySQL Operator | MariaDB Operator | Vitess |
| ---------------- | ----------------------------------------- | ---------------------------------------- | ---------------------- | --------------- | --------------------- | ---------------- | ------ |
| Custom exporters | Through sidecars                          | Through sidecars                         | mysqld_exporter        | mysqld_exporter | Exporter sidecar      | Exporters        |        |
| PMM              |                                           |                                          |                        |                 |                       |                  |        |

## Miscellaneous

Compare various features that are not a good fit for other categories.

| Feature/Product      | Percona Operator for MySQL (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator | Moco       | Oracle MySQL Operator | MariaDB Operator | Vitess |
| -------------------- | ----------------------------------------- | ---------------------------------------- | ---------------------- | ---------- | --------------------- | ---------------- | ------ |
| Customize MySQL      | ConfigMaps and Secrets                    | ConfigMaps and Secrets                   | ConfigMaps             | ConfigMaps | ConfigMaps            | ConfigMaps       |        |
| Helm                 |                                           |                                          |                        |            |                       |                  |        |
| Transport encryption |                                           |                                          |                        |            |                       |                  |        |
| Encryption-at-rest   |                                           |                                          |                        |            |                       | Not documented   |        |
