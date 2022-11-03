# Compare various solutions to deploy MySQL in Kubernetes

There are multiple ways to deploy and manage MySQL in Kubernetes. Here we will focus on comparing the following open source solutions:

* [Bitnami Helm chart](https://github.com/bitnami/charts/tree/master/bitnami/mongodb)

* [KubeDB](https://github.com/kubedb)

* [MongoDB Community Operator](https://github.com/mongodb/mongodb-kubernetes-operator)

* [Percona Operator for MongoDB](https://github.com/percona/percona-server-mongodb-operator/)

* [Bitpoke MySQL Operator (former Presslabs)](https://github.com/bitpoke/mysql-operator/)
* [Oracle MySQL Operator](https://github.com/mysql/mysql-operator)
* [Moco](https://github.com/cybozu-go/moco) by Cybozu
* [Vitess Operator](https://github.com/planetscale/vitess-operator) by PlanetScale
* Percona Operator for MySQL
** [based on Percona XtraDB Cluster](https://github.com/percona/percona-xtradb-cluster-operator/)
** [based on Percona Server for MySQL](https://github.com/percona/percona-server-mysql-operator/)

## Generic

The review of generic features, such as supported MySQL versions, open source models and more.

| Feature/Product        | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |      Moco      | Oracle MySQL Operator | Vitess         |
|------------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:--------------:|:---------------------:|----------------|
| Open source model      |                 Apache 2.0                 |                Apache 2.0                |       Apache 2.0       |   Apache 2.0   |       Apache 2.0      |   Apache 2.0   |
| MySQL versions         |                  5.7, 8.0                  |                    8.0                   |           5.7          |       8.0      |          8.0          |    5.7, 8.0    |
| Kubernetes conformance |         Various versions are tested        |        Various versions are tested       |     Not guaranteed     | Not guaranteed |     Not guaranteed    | Not guaranteed |
| Paid support           |                     Yes                    |                    Yes                   |           No           |       No       |          Yes          |       No       |

## MySQL Topologies

Focus on replication capabilities and proxies integrations.

| Feature/Product          | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |    Moco   | Oracle MySQL Operator | Vitess |
|--------------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:---------:|:---------------------:|--------|
| Replication              |              Sync with Galera              |        Async and Group Replication       |          Async         | Semi-sync |   Group Replication   |  Async |
| Proxy                    |            HAProxy and ProxySQL            |         HAProxy and MySQL Router         |          None          |    None   |      MySQL Router     | VTGate |
| Multi-cluster deployment |                     Yes                    |                    No                    |           No           |     No    |           No          |   No   |
| Sharding                 |                     No                     |                    No                    |           No           |     No    |           No          |   Yes  |

## Backups

Here are the backup and restore capabilities of each solution.

| Feature/Product     | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator | Moco | Oracle MySQL Operator | Vitess |
|---------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:----:|:---------------------:|--------|
| Scheduled backups   |                     Yes                    |                    Yes                   |           Yes          |  Yes |           No          |   Yes  |
| Incremental backups |                     No                     |                    No                    |           No           |  Yes |           No          |   No   |
| PITR                |                     Yes                    |                    Yes                   |           No           |  No  |           No          |   No   |
| PVCs for backups    |                     Yes                    |                    No                    |           No           |  No  |           No          |   No   |

## Monitoring

Monitoring is crucial for any operations team.

| Feature/Product    | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |       Moco      | Oracle MySQL Operator | Vitess |
|--------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:---------------:|:---------------------:|--------|
| Custom exporters   |            Yes, through sidecars           |           Yes, through sidecars          |     mysqld_exporter    | mysqld_exporter |           No          |   No   |
| PMM                |                     Yes                    |                    Yes                   |           No           |        No       |           No          |   No   |

## Miscellaneous

Compare various features that are not a good fit for other categories.

| Feature/Product      | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |       Moco      | Oracle MySQL Operator | Vitess |
|----------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:---------------:|:---------------------:|--------|
| Customize MySQL      |         Yes, ConfigMaps and Secrets        |        Yes, ConfigMaps and Secrets       |     Yes, ConfigMaps    | Yes, ConfigMaps |    Yes, ConfigMaps    |   No   |
| Helm                 |                     Yes                    |                    Yes                   |           Yes          |       Yes       |          Yes          |   No   |
| Transport encryption |                     Yes                    |                    Yes                   |           No           |        No       |          Yes          |   Yes  |
| Encryption-at-rest   |                     Yes                    |                    Yes                   |           No           |        No       |           No          |   No   |
