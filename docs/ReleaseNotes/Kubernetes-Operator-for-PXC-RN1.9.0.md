# *Percona Distribution for MySQL Operator* 1.9.0


* **Date**

    August 9, 2021



* **Installation**

    For installation please refer to [the documentation page](../System-Requirements.md#installation-guidelines)


## Release Highlights


* Starting from this release, the Operator changes its official name to
**Percona Distribution for MySQL Operator**. This new name emphasizes
gradual changes which incorporated a collection of Percona’s solutions to run
and operate Percona Server for MySQL and Percona XtraDB Cluster, available
separately as [Percona Distribution for MySQL :octicons-link-external-16:](https://www.percona.com/doc/percona-distribution-mysql/8.0/index.html).


* Now you can [see HAProxy metrics :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/2/setting-up/client/haproxy.html) in your favorite Percona Monitoring and Management (PMM) dashboards automatically.


* The [cross-site replication](../replication.md) feature allows an
asynchronous replication between two Percona XtraDB Clusters, including
scenarios when one of the clusters is outside of the Kubernetes environment.
The feature is intended for the following use cases:


    * provide migrations of your Percona XtraDB Cluster to Kubernetes or vice
versa,


    * migrate regular MySQL database to Percona XtraDB Cluster under the Operator
control, or carry on backward migration,


    * enable disaster recovery capability for your cluster deployment.

## New Features


* [K8SPXC-657](https://jira.percona.com/browse/K8SPXC-657): Use Secrets to store custom configuration with
sensitive data for [Percona XtraDB Cluster](../options.md#use-a-secret-object),
[HAProxy](../haproxy-conf.md#use-a-secret-object), and [ProxySQL](../proxysql-conf.md#use-a-secret-object)
Pods


* [K8SPXC-308](https://jira.percona.com/browse/K8SPXC-308): Implement Percona XtraDB Cluster
[asynchronous replication](../replication.md) within the Operator


* [K8SPXC-688](https://jira.percona.com/browse/K8SPXC-688): Define [environment variables](../containers-conf.md) in the
Custom Resource to provide containers with additional customizations

## Improvements


* [K8SPXC-673](https://jira.percona.com/browse/K8SPXC-673): HAProxy Pods now come with Percona Monitoring and
Management integration and support


* [K8SPXC-791](https://jira.percona.com/browse/K8SPXC-791): Allow
[stopping the restart-on-fail loop](../debug-images.md) for Percona
XtraDB Cluster and Log Collector Pods without special debug images


* [K8SPXC-764](https://jira.percona.com/browse/K8SPXC-764): Unblock backups even if just a single instance is
available by setting the `allowUnsafeConfigurations` flag to true


* [K8SPXC-765](https://jira.percona.com/browse/K8SPXC-765): Automatically delete custom configuration ConfigMaps if
the variable in Custom Resource was unset (Thanks to Oleksandr Levchenkov for
contributing)


* [K8SPXC-734](https://jira.percona.com/browse/K8SPXC-734): Simplify manual recovery by automatically getting
Percona XtraDB Cluster namespace in the pxc container entrypoint script
(Thanks to Michael Lin for contributing)


* [K8SPXC-656](https://jira.percona.com/browse/K8SPXC-656): imagePullPolicy is now set for init container as well
to avoid pulling and simplifying deployments in air-gapped environments
(Thanks to Herberto Graça for contributing)


* [K8SPXC-511](https://jira.percona.com/browse/K8SPXC-511): Secret object containing system users passwords is now
deleted along with the Cluster if `delete-pxc-pvc` finalizer is enabled
(Thanks to Matthias Baur for contributing)


* [K8SPXC-772](https://jira.percona.com/browse/K8SPXC-772): All Service objects now have Percona XtraDB Cluster
labels attached to them to enable label selector usage


* [K8SPXC-731](https://jira.percona.com/browse/K8SPXC-731): It is now possible to see the overall progress of the
provisioning of Percona XtraDB Cluster resources and dependent components in
Custom Resource status


* [K8SPXC-730](https://jira.percona.com/browse/K8SPXC-730): Percona XtraDB Cluster resource statuses in Custom
Resource output (e.g. returned by `kubectl get pxc` command) have been
improved and now provide more precise reporting


* [K8SPXC-697](https://jira.percona.com/browse/K8SPXC-697): Add namespace support in the `copy-backup` script


* [K8SPXC-321](https://jira.percona.com/browse/K8SPXC-321), [K8SPXC-556](https://jira.percona.com/browse/K8SPXC-556), [K8SPXC-568](https://jira.percona.com/browse/K8SPXC-568): Restrict
the minimal number of ProxySQL and HAProxy Pods and the maximal number of
Percona XtraDB Cluster Pods if the unsafe flag is not set


* [K8SPXC-554](https://jira.percona.com/browse/K8SPXC-554): Reduced the number of various etcd and k8s object
updates from the Operator to minimize the pressure on the Kubernetes cluster


* [K8SPXC-421](https://jira.percona.com/browse/K8SPXC-421): It is now possible to [use X Plugin :octicons-link-external-16:](https://www.percona.com/blog/2019/01/07/understanding-mysql-x-all-flavors/)
with Percona XtraDB Cluster Pods

## Known Issues and Limitations


* [K8SPXC-835](https://jira.percona.com/browse/K8SPXC-835): ProxySQL will fail to start on a Replica Percona XtraDB
Cluster for cross-site replication in this release

## Bugs Fixed


* [K8SPXC-757](https://jira.percona.com/browse/K8SPXC-757): Fixed a bug where manual crash recovery interfered with
auto recovery functionality even with the `auto_recovery` flag set to false


* [K8SPXC-706](https://jira.percona.com/browse/K8SPXC-706): TLS certificates
[renewal by a cert-manager was failing](../TLS.md#update-certificates)
(Thanks to Jeff Andrews for reporting this issue)


* [K8SPXC-785](https://jira.percona.com/browse/K8SPXC-785): Fixed a bug where backup to S3 was producing
false-positive error messages even if backup was successful


* [K8SPXC-642](https://jira.percona.com/browse/K8SPXC-642): Fixed a bug where PodDisruptionBudget was blocking the
upgrade of HAProxy (Thanks to Davi S Evangelista for reporting this issue)


* [K8SPXC-585](https://jira.percona.com/browse/K8SPXC-585): Fixed a bug where the Operator got stuck if the wrong
user credentials were set in the Secret object (Thanks to Sergiy Prykhodko for
reporting this issue)


* [K8SPXC-756](https://jira.percona.com/browse/K8SPXC-756): Fixed a bug where the Operator was scheduling backups
even when the cluster was paused (Thanks to Dmytro for reporting this issue)


* [K8SPXC-813](https://jira.percona.com/browse/K8SPXC-813): Fixed a bug where backup restore didn’t return error on
incorrect AWS credentials


* [K8SPXC-805](https://jira.percona.com/browse/K8SPXC-805): Fixed a bug that made pxc-backups object deletion hang
if the Operator couldn’t list objects from the S3 bucket (e.g. due to wrong S3
credentials)


* [K8SPXC-787](https://jira.percona.com/browse/K8SPXC-787): Fixed the “initializing” status of ready clusters
caused by the xtrabackup user password change


* [K8SPXC-775](https://jira.percona.com/browse/K8SPXC-775): Fixed a bug where errors in custom mysqld config
settings were not detected by the Operator if the config was modified after
the initial cluster was created


* [K8SPXC-767](https://jira.percona.com/browse/K8SPXC-767): Fixed a bug where on-demand backup hung up if created
while the cluster was in the “initializing” state


* [K8SPXC-726](https://jira.percona.com/browse/K8SPXC-726): Fixed a bug where the `delete-s3-backup` finalizer
prevented deleting a backup stored on Persistent Volume


* [K8SPXC-682](https://jira.percona.com/browse/K8SPXC-682): Fixed auto-tuning feature setting wrong
`innodb_buffer_pool_size` value in some cases
