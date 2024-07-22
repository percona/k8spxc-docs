# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.12.0

* **Date**

   December 7, 2022

* **Installation**

   [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)

## Release Highlights

* [Azure Kubernetes Service (AKS)](../aks.md) is now officially supported platform, so developers and vendors of the solutions based on the Azure platform can take advantage of the official support from Percona or just use officially certified Percona Operator for MysQL images; also, [Azure Blob Storage can now be used for backups](../backups.md#backups-scheduled-azure)
* This release also includes fixes to the following CVEs (Common Vulnerabilities and Exposures): [CVE-2021-20329 :octicons-link-external-16:](https://nvd.nist.gov/vuln/detail/CVE-2021-20329) (potential injections in MongoDB Go Driver used HAProxy, which had no effect on Percona Operator for MySQL), and  [CVE-2022-42898 :octicons-link-external-16:](https://access.redhat.com/security/cve/CVE-2022-42898) (images used by the Operator suffering from the unauthenticated denial of service vulnerability). Users of previous Operator versions are advised to [upgrade](../update.md) to version 1.12.0 which resolves this issue

## New Features

* {{ k8spxcjira(1043) }} and {{ k8spxcjira(1005) }}: Add support for the [Azure Kubernetes Service (AKS)](../aks.md) platform and allow [using Azure Blob Storage](../backups.md#backups-scheduled-azure) for backups
* {{ k8spxcjira(1010) }}: Allow [using templates](../options.md#auto-tuning-mysql-options) to define `innodb_buffer_pool_size` auto-tuning based on container memory limits
* {{ k8spxcjira(1082) }}: New `ignoreAnnotations` and `ignoreLabels` Custom Resource options allow to list [specific annotations and labels](../annotations.md) for Kubernetes Service objects, which the Operator should ignore (useful with various Kubernetes flavors which add annotations to the objects managed by the Operator)
* {{ k8spxcjira(1120) }}: Add [headless service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services) support for the restore Pod to [make it possible](../backups.md#backups-headless-service) restoring backups from a Persistent Volume on a tenant network (thanks to Zulh for contribution)
* {{ k8spxcjira(1140) }}: The Operator now [allows using SSL channel](../replication.md#replication-ssl) for cross-site replication (thanks to Alvaro Aguilar-Tablada Espinosa for contribution)

## Improvements

* {{ k8spxcjira(1104) }}: Starting from now, the Operator changed its API version to v1 instead of having a separate API version for each release. Three last API version are supported in addition to `v1`, which substantially reduces the size of Custom Resource Definition to prevent reaching the etcd limit
* {{ k8spxcjira(955) }}: Add Custom Resource options to set static IP-address for the [HAProxy](../operator.md#haproxy-loadbalancerip) and [ProxySQL](../operator.md#proxysql-loadbalancerip) LoadBalancers
* {{ k8spxcjira(1032) }}: Disable [automated upgrade](../update.md#operator-update-smartupdates) by default to prevent an unplanned downtime for user applications and to provide defaults more focused on strict user’s control over the cluster
* {{ k8spxcjira(1095) }}: Process the SIGTERM signal to avoid unneeded lags in case of Percona XtraDB Cluster recovery or using the debug image to start up
* {{ k8spxcjira(1113) }}: Utilize dual password feature of MySQL 8 to avoid cluster restart when changing password of the `monitor` user
* {{ k8spxcjira(1125) }}: The Operator now does not attempt to start Percona Monitoring and Management (PMM) client sidecar if the corresponding secret does not contain the `pmmserver` or `pmmserverkey` key
* {{ k8spxcjira(1153) }}: Configuring the log structuring and leveling [is now supported](../debug.md#changing-logs-representation) using the `LOG_STRUCTURED` and `LOG_LEVEL` environment variables. This reduces the information overload in logs, still leaving the possibility of getting more details when needed, for example, for debugging
* {{ k8spxcjira(1123) }}: Starting from now, installing the Operator for cluster-wide (multi-namespace) doesn’t require to add Operator’s own namespace to the list of watched namespaces (thanks to Bart Vercoulen for reporting this issue)
* {{ k8spxcjira(1030) }}: The new [delete-ssl](../operator.md#finalizers-delete-ssl) finalizer can now be used to automatically delete objects created for SSL (Secret, certificate, and issuer) in case of cluster deletion

## Bugs Fixed

* {{ k8spxcjira(1158) }}: Fix [CVE-2022-42898 :octicons-link-external-16:](https://access.redhat.com/security/cve/CVE-2022-42898) vulnerability found in MIT krb5, which made images used by the Operator vulnerable to DoS attacks
* {{ k8spxcjira(1028) }}: Fix a bug that prevented the Operator to automatically tune `innodb_buffer_pool_size` and `innodb_buffer_pool_chunk_size` variables
* {{ k8spxcjira(1036) }}: Fix the bug that caused Liveness Probe failure when XtraBackup was running and the `wsrep_sync_wait` option was set, making the instance to be rejected from the cluster
* {{ k8spxcjira(1065) }}: Fix a bug due to which, in a pair of scheduled backups close in time, the next backup could overwrite the previous one: bucket destination was made more unique by including seconds
* {{ k8spxcjira(1059) }}: Fix a bug due to which `pxc-monit` and `proxysql-monit` containers were printing passwords in their logs (thanks to zlcnju for contribution)
* {{ k8spxcjira(1099) }}: Fix CrashLoopBackOff error caused by incorrect (non-atomic) multi-user password change
* {{ k8spxcjira(1100) }}: Fix a bug that made it impossible to use slash characters in the monitor user’s password
* {{ k8spxcjira(1118) }}: Fix a bug due to which the point-in-time recovery collector only reported  warnings in logs when the gaps in binlogs were found. Starting from now, such backups are marked as not suitable for consistent PITR, and [restoring them with point-in-time recovery fails](../backups.md#backup-pitr-binlog-gaps) without manual user’s intervention
* {{ k8spxcjira(1137) }}: Fix a bug that prevented adding, deleting or updating ProxySQL Service labels/annotations except at the Service creation time
* {{ k8spxcjira(1138) }}: Fix a bug due to which not enough responsive scripts for readiness and liveness Probes could be the reason of killing the overloaded database Pods

## Supported Platforms

The following platforms were tested and are officially supported by the Operator
1.12.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.21 - 1.24

* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.21 - 1.24

* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.22 - 1.24

* [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.11

* [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.28

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
