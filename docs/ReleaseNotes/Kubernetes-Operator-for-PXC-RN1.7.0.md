# *Percona Kubernetes Operator for Percona XtraDB Cluster* 1.7.0


* **Date**

    February 2, 2021



* **Installation**

    [Installing Percona Kubernetes Operator for Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)


## New Features


* [K8SPXC-530](https://jira.percona.com/browse/K8SPXC-530): Add support for [point-in-time recovery](../backups.md#backups-pitr-binlog)


* [K8SPXC-564](https://jira.percona.com/browse/K8SPXC-564): PXC cluster will now recover automatically from a full crash when Pods are stuck in CrashLoopBackOff status


* [K8SPXC-497](https://jira.percona.com/browse/K8SPXC-497): Official support for [Percona Monitoring and Management (PMM) v.2](../monitoring.md#operator-monitoring)

**NOTE**: Monitoring with PMM v.1 configured according to the [unofficial instruction](https://www.percona.com/blog/2020/07/23/using-percona-kubernetes-operators-with-percona-monitoring-and-management/)
will not work after the upgrade. Please switch to PMM v.2.

## Improvements


* [K8SPXC-485](https://jira.percona.com/browse/K8SPXC-485): [Percona XtraDB Cluster Pod logs are now stored on Persistent Volumes](../debug.md#debug-images-logs). Users can debug the issues even after the Pod restart


* [K8SPXC-389](https://jira.percona.com/browse/K8SPXC-389): User can now change ServiceType for HAProxy replicas Kubernetes service


* [K8SPXC-546](https://jira.percona.com/browse/K8SPXC-546): Reduce the number of ConfigMap object updates from the Operator to improve performance of the Kubernetes cluster


* [K8SPXC-553](https://jira.percona.com/browse/K8SPXC-553): Change default configuration of ProxySQL to WRITERS_ARE_READERS=yes so Percona XtraDB Cluster continues operating with a single node left


* [K8SPXC-512](https://jira.percona.com/browse/K8SPXC-512): User can now limit cluster-wide Operator access to specific namespaces (Thanks to user mgar for contribution)


* [K8SPXC-490](https://jira.percona.com/browse/K8SPXC-490): Improve error message when not enough memory is set for auto-tuning


* [K8SPXC-312](https://jira.percona.com/browse/K8SPXC-312): Add schema validation for Custom Resource. Now `cr.yaml` is validated by a WebHook for syntax typos before being applied. It works only in cluster-wide mode due to access restrictions


* [K8SPXC-510](https://jira.percona.com/browse/K8SPXC-510): Percona XtraDB Cluster operator can now be [deployed through RedHat Marketplace](https://marketplace.redhat.com/en-us/products/percona-kubernetes-operator-for-percona-server-for-xtradb-cluster)


* [K8SPXC-543](https://jira.percona.com/browse/K8SPXC-543): Check HAProxy custom configuration for syntax errors before applying it to avoid Pod getting stuck in CrashLoopBackOff status (Thanks to user pservit for reporting this issue)

## Bugs Fixed


* [K8SPXC-544](https://jira.percona.com/browse/K8SPXC-544): Add a liveness probe for HAProxy so it is not stuck and automatically restarted when crashed (Thanks to user pservit for reporting this issue)


* [K8SPXC-500](https://jira.percona.com/browse/K8SPXC-500): Fix a bug that prevented creating a backup in cluster-wide mode if default cr.yaml is used (Thanks to user michael.lin1 for reporting this issue)


* [K8SPXC-491](https://jira.percona.com/browse/K8SPXC-491): Fix a bug due to which compressed backups didn’t work with the Operator (Thanks to user dejw for reporting this issue)


* [K8SPXC-570](https://jira.percona.com/browse/K8SPXC-570): Fix a bug causing backups to fail with some S3-compatible storages (Thanks to user dimitrij for reporting this issue)


* [K8SPXC-517](https://jira.percona.com/browse/K8SPXC-517): Fix a bug causing Operator crash if Custom Resource backup section is missing (Thanks to user deamonmv for reporting this issue)


* [K8SPXC-253](https://jira.percona.com/browse/K8SPXC-253): Fix a bug preventing rolling out Custom Resource changes (Thanks to user bitsbeats for reporting this issue)


* [K8SPXC-552](https://jira.percona.com/browse/K8SPXC-552): Fix a bug when HAProxy secrets cannot be updated by the user


* [K8SPXC-551](https://jira.percona.com/browse/K8SPXC-551): Fix a bug due to which cluster was not initialized when the password had an end of line symbol in `secret.yaml`


* [K8SPXC-526](https://jira.percona.com/browse/K8SPXC-526): Fix a bug due to which not all clusters managed by the Operator were upgraded by the automatic update


* [K8SPXC-523](https://jira.percona.com/browse/K8SPXC-523): Fix a bug putting cluster into unhealthy status after the clustercheck secret changed


* [K8SPXC-521](https://jira.percona.com/browse/K8SPXC-521): Fix automatic upgrade job repeatedly looking for an already removed cluster


* [K8SPXC-520](https://jira.percona.com/browse/K8SPXC-520): Fix Smart update in cluster-wide mode adding version service check job repeatedly instead of doing it only once


* [K8SPXC-463](https://jira.percona.com/browse/K8SPXC-463): Fix a bug due to which wsrep_recovery log was unavailable after the Pod restart


* [K8SPXC-424](https://jira.percona.com/browse/K8SPXC-424): Fix a bug due to which HAProxy health-check spammed in logs, making them hardly unreadable


* [K8SPXC-379](https://jira.percona.com/browse/K8SPXC-379): Fix a bug due to which the Operator user credentials were not added into internal secrets when upgrading from 1.4.0 (Thanks to user pservit for reporting this issue)
