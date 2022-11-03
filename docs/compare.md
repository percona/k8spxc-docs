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

| Feature/Product        | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |      Moco      | Oracle MySQL Operator |    Vitess      |
|------------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:--------------:|:---------------------:|----------------|
| Open source model      |                 Apache 2.0                 |                Apache 2.0                |       Apache 2.0       |   Apache 2.0   |       Apache 2.0      |   Apache 2.0   |
| MySQL versions         |                  5.7, 8.0                  |                    8.0                   |           5.7          |       8.0      |          8.0          |    5.7, 8.0    |
| Kubernetes conformance |         Various versions are tested        |        Various versions are tested       |     Not guaranteed     | Not guaranteed |     Not guaranteed    | Not guaranteed |
| Paid support           |             :heavy_check_mark:             |            :heavy_check_mark:            |     :no_entry_sign:    | :no_entry_sign:|  :heavy_check_mark:   | :no_entry_sign:|

## MySQL Topologies

Focus on replication capabilities and proxies integrations.

| Feature/Product          | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |      Moco     | Oracle MySQL Operator |    Vitess        |
|--------------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:-------------:|:---------------------:|------------------|
| Replication              |              Sync with Galera              |        Async and Group Replication       |          Async         |   Semi-sync   |   Group Replication   |     Async        |
| Proxy                    |            HAProxy and ProxySQL            |         HAProxy and MySQL Router         |          None          |     None      |      MySQL Router     |     VTGate       |
| Multi-cluster deployment |             :heavy_check_mark:             |              :no_entry_sign:             |     :no_entry_sign:    |:no_entry_sign:|     :no_entry_sign:   | :no_entry_sign:  |
| Sharding                 |              :no_entry_sign:               |              :no_entry_sign:             |     :no_entry_sign:    |:no_entry_sign:|     :no_entry_sign:   |:heavy_check_mark:|

## Backups

Here are the backup and restore capabilities of each solution.

| Feature/Product     | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |       Moco       | Oracle MySQL Operator |      Vitess      |
|---------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:----------------:|:---------------------:|------------------|
| Scheduled backups   |             :heavy_check_mark:             |            :heavy_check_mark:            |   :heavy_check_mark:   |:heavy_check_mark:|     :no_entry_sign:   |:heavy_check_mark:|
| Incremental backups |               :no_entry_sign:              |              :no_entry_sign:             |     :no_entry_sign:    |:heavy_check_mark:|     :no_entry_sign:   | :no_entry_sign:  |
| PITR                |             :heavy_check_mark:             |            :heavy_check_mark:            |     :no_entry_sign:    | :no_entry_sign:  |     :no_entry_sign:   | :no_entry_sign:  |
| PVCs for backups    |             :heavy_check_mark:             |              :no_entry_sign:             |     :no_entry_sign:    | :no_entry_sign:  |     :no_entry_sign:   | :no_entry_sign:  |

## Monitoring

Monitoring is crucial for any operations team.

| Feature/Product    | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |       Moco      | Oracle MySQL Operator |     Vitess    |
|--------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:---------------:|:---------------------:|---------------|
| Custom exporters   |              Through sidecars              |             Through sidecars             |     mysqld_exporter    | mysqld_exporter |     :no_entry_sign:   |:no_entry_sign:|
| PMM                |             :heavy_check_mark:             |            :heavy_check_mark:            |     :no_entry_sign:    | :no_entry_sign: |     :no_entry_sign:   |:no_entry_sign:|

## Miscellaneous

Compare various features that are not a good fit for other categories.

| Feature/Product      | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |       Moco       | Oracle MySQL Operator |      Vitess      |
|----------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:----------------:|:---------------------:|------------------|
| Customize MySQL      |           ConfigMaps and Secrets           |          ConfigMaps and Secrets          |       ConfigMaps       |    ConfigMaps    |      ConfigMaps       | :no_entry_sign:  |
| Helm                 |             :heavy_check_mark:             |            :heavy_check_mark:            |   :heavy_check_mark:   |:heavy_check_mark:|  :heavy_check_mark:   | :no_entry_sign:  |
| Transport encryption |             :heavy_check_mark:             |            :heavy_check_mark:            |     :no_entry_sign:    | :no_entry_sign:  |  :heavy_check_mark:   |:heavy_check_mark:|
| Encryption-at-rest   |             :heavy_check_mark:             |            :heavy_check_mark:            |     :no_entry_sign:    | :no_entry_sign:  |     :no_entry_sign:   | :no_entry_sign:  |
