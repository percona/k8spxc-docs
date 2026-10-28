# Compare various solutions to deploy MySQL in Kubernetes

There are multiple ways to deploy and manage MySQL in Kubernetes. Here we will focus on comparing the following open source solutions:

* [KubeDB :octicons-link-external-16:](https://github.com/kubedb)
* [Bitpoke MySQL Operator (former Presslabs) :octicons-link-external-16:](https://github.com/bitpoke/mysql-operator/)
* [Oracle MySQL Operator :octicons-link-external-16:](https://github.com/mysql/mysql-operator)
* [MariaDB Operator :octicons-link-external-16:](https://github.com/mariadb-operator/mariadb-operator)
* [Moco :octicons-link-external-16:](https://github.com/cybozu-go/moco) by Cybozu
* [Vitess Operator :octicons-link-external-16:](https://github.com/planetscale/vitess-operator) by PlanetScale
* Percona Operator for MySQL:
  
    * [based on Percona XtraDB Cluster :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator)
    * [based on Percona Server for MySQL :octicons-link-external-16:](https://github.com/percona/percona-server-mysql-operator/)

## Generic

The review of generic features, such as supported MySQL versions, open source models and more.

| Feature/Product        | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |      Moco       | Oracle MySQL Operator | MariaDB Operator |    Vitess      |
|------------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:--------------:|:---------------------:|:---:|:--------------:|
| Open source model      |                 Apache 2.0                 |                Apache 2.0                |       Apache 2.0       |   Apache 2.0   | UPL 1.0 | MIT |   Apache 2.0   |
| MySQL versions         |                5.7, 8.0, 8.4                | 8.0, 8.4 |           5.7          |       8.0      | 8.4, 9.7, 26.7 | MariaDB 10.6 and newer (not MySQL) |    5.7, 8.0    |
| Kubernetes conformance |         Various versions are tested        |        Various versions are tested       |     Not guaranteed     | Not guaranteed |     Not guaranteed    | Not documented | Not guaranteed |
| Paid support           |             :white_check_mark:             |            :white_check_mark:            |     :no_entry_sign:    | :no_entry_sign:|  :white_check_mark:   | MariaDB plc (separate Enterprise Operator) | :no_entry_sign:|
| Web-based GUI          |  [Percona Everest](https://docs.percona.com/everest/index.html) |   :no_entry_sign:   |     :no_entry_sign:    | :no_entry_sign:| [Oracle Enterprise Manager](https://www.mysql.com/products/enterprise/em.html) | MaxScale GUI (requires MaxScale) | :no_entry_sign:|

## MySQL Topologies

Focus on replication capabilities and proxies integrations.

| Feature/Product          | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |      Moco      | Oracle MySQL Operator | MariaDB Operator |    Vitess        |
|--------------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:-------------:|:---------------------:|:---:|:----------------:|
| Replication              |              Sync with Galera              | Group Replication; async (tech preview) |          Async         |   Semi-sync   |   Group Replication   | Sync with Galera; async and semi-sync |     Async        |
| Proxy                    |            HAProxy and ProxySQL            |         HAProxy and MySQL Router         |          None          |     None      |      MySQL Router     | MaxScale |     VTGate       |
| Multi-cluster deployment |             :white_check_mark:             | :white_check_mark: (InnoDB ClusterSet) |     :no_entry_sign:    |:no_entry_sign:| Undocumented (ClusterSet in code) | :white_check_mark: | :no_entry_sign:  |
| Sharding                 |              :no_entry_sign:               |              :no_entry_sign:             |     :no_entry_sign:    |:no_entry_sign:|     :no_entry_sign:   | :no_entry_sign: |:white_check_mark:|

## Backups

Here are the backup and restore capabilities of each solution.

| Feature/Product     | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |       Moco        | Oracle MySQL Operator | MariaDB Operator |      Vitess      |
|---------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:----------------:|:---------------------:|:---:|:----------------:|
| Scheduled backups   |             :white_check_mark:             |            :white_check_mark:            |   :white_check_mark:   |:white_check_mark:|     :white_check_mark:     | :white_check_mark: |:white_check_mark:|
| Incremental backups |               :no_entry_sign:              | Tech preview |     :no_entry_sign:    |:white_check_mark:|     :no_entry_sign:   | :no_entry_sign: | :no_entry_sign:  |
| PITR                |             :white_check_mark:             | Tech preview |     :no_entry_sign:    | :no_entry_sign:  |     :no_entry_sign:   | Async replication topology only | :no_entry_sign:  |
| PVCs for backups    |             :white_check_mark:             |              :no_entry_sign:             |     :no_entry_sign:    | :no_entry_sign:  |     :white_check_mark:    | :white_check_mark: | :no_entry_sign:  |

## Monitoring

Monitoring is crucial for any operations team.

| Feature/Product    | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |       Moco       | Oracle MySQL Operator | MariaDB Operator |     Vitess    |
|--------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:---------------:|:---------------------:|:---:|:-------------:|
| Custom exporters   |              Through sidecars              |             Through sidecars             |     mysqld_exporter    | mysqld_exporter | Exporter sidecar | Exporters |:no_entry_sign:|
| PMM                |             :white_check_mark:             |            :white_check_mark:            |     :no_entry_sign:    | :no_entry_sign: |     :no_entry_sign:   | :no_entry_sign: |:no_entry_sign:|

## Miscellaneous

Compare various features that are not a good fit for other categories.

| Feature/Product      | Percona Operator for MySQL  (based on PXC) | Percona Operator for MySQL (based on PS) | Bitpoke MySQL Operator |       Moco        | Oracle MySQL Operator | MariaDB Operator |      Vitess      |
|----------------------|:------------------------------------------:|:----------------------------------------:|:----------------------:|:----------------:|:---------------------:|:---:|:----------------:|
| Customize MySQL      |           ConfigMaps and Secrets           |          ConfigMaps and Secrets          |       ConfigMaps       |    ConfigMaps    |      ConfigMaps       | ConfigMaps | :no_entry_sign:  |
| Helm                 |             :white_check_mark:             |            :white_check_mark:            |   :white_check_mark:   |:white_check_mark:|  :white_check_mark:   | :white_check_mark: | :no_entry_sign:  |
| Transport encryption |             :white_check_mark:             |            :white_check_mark:            |     :no_entry_sign:    | :no_entry_sign:  |  :white_check_mark:   | :white_check_mark: |:white_check_mark:|
| Encryption-at-rest   |             :white_check_mark:             |            :white_check_mark:            |     :no_entry_sign:    | :no_entry_sign:  | :white_check_mark: | Not documented | :no_entry_sign:  |
