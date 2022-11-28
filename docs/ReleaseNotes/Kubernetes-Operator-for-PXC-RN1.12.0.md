# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.12.0

* **Date**

   November 30, 2022

* **Installation**

   [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](index.md#quickstart-guides)

## Release Highlights

* [Azure Kubernetes Service (AKS)](../aks.md) is now officially supported platform, so developers and vendors of the solutions based on the Azure platform can take advantage of the official support from Percona or just use officially certified Percona Operator for MongoDB images

## New Features

* {{ k8spsmdbjira(1043) }}: Support for the [Azure Kubernetes Service (AKS)](../aks.md)
* {{ k8spsmdbjira(1005) }}: Add support of Microsoft Azure Blob storage for the backups
* {{ k8spsmdbjira(1010) }}: The `innodb_buffer_pool_size` auto-tuning now makes calculations based the instance memory size instead of using the 75% of the available RAM, which could be unacceptable for some environments
* {{ k8spsmdbjira(1082) }}: New [ignoreAnnotations](operator.md#ignoreannotations) and [ignoreLabels](operator.md#ignorelabels) Custom Resource options allow to list specific  annotations and labels for Kubernetes Service objects, which the Operator should ignore (useful with various Kubernetes flavors which add annotations to the objects managed by the Operator)
* {{ k8spsmdbjira(1120) }}: Add [headless service](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services) support for the restore Pod (thanks to Zulh for contribution)
* {{ k8spsmdbjira(1140) }}: The Operator now allows using SSL channel for cross-site replication (thanks to Alvaro Aguilar-Tablada Espinosa for contribution)

## Improvements

* {{ k8spxcjira(1104) }}: Starting from now, the Operator changed its API version to v1 instead of having a separate API version for each release. Three last API version are supported in addition to `v1`, which substantially reduces the size of Custom Resource Definition to prevent reaching the etcd limit
* {{ k8spsmdbjira(955) }}: Add Custom Resource options to set static IP-address for the [HAProxy](operator.md#haproxy-loadbalancerip) and [ProxySQL](operator.md#proxysql-loadbalancerip) LoadBalancers
* {{ k8spsmdbjira(1032) }}: Disable [automated upgrade](../update.md#operator-update-smartupdates) by default to prevent an unplanned downtime for user applications and to provide defaults more focused on strict user’s control over the cluster
* {{ k8spsmdbjira(1095) }}: Process the SIGTERM signal to avoid unneeded lags in case of Percona XtraDB Cluster recovery or using the debug image to start up
* {{ k8spsmdbjira(1113) }}: Utilize dual password MySQL feature to change passwords
* {{ k8spsmdbjira(1125) }}: The Operator now does not attempt to start PMM if the corresponding secret does not contain the `pmmserver` or `pmmserverkey` key.
* {{ k8spsmdbjira(1153) }}: Configuring the log structuring and leveling [is now supported](../debug.md#changing-logs-representation) using the `LOG_STRUCTURED` and `LOG_LEVEL` environment variables. This reduces the information overload in logs, still leaving the possibility of getting more details when needed, for example, for debugging

## Bugs Fixed

* {{ k8spsmdbjira(1065) }}: Make bucket destination more unique for scheduled backups by including seconds in it
* {{ k8spsmdbjira(1096) }}: Possible data loss with default helm chart settings for pxc operator **Open**
* {{ k8spsmdbjira(1110) }}: backup fails but is marked as finished **Open**
* {{ k8spsmdbjira(1123) }}: PXC operator can not find own Pod (thanks to Bart Vercoulen for reporting this issue)
* {{ k8spsmdbjira(1028) }}: Fix a bug that prevented the Operator to automatically tune `innodb_buffer_pool_size` and `innodb_buffer_pool_chunk_size` variables
* {{ k8spsmdbjira(1029) }} and {{ k8spsmdbjira(835) }}: Fix a bug that prevented ProxySQL to be used in replica cluster at [cross-site replication](replication.md) **Open**
* {{ k8spsmdbjira(1030) }}: Fix the bug of cert-manager certificate being not deleted with the cluster deletion, which caused it being not renewed by cert-manager for a deleted-and-recreated cluster; the new [delete-ssl](operator.md#finalizers-delete-ssl) finalizer was introduced to address the issue
* {{ k8spsmdbjira(1036) }}: Fix the bug that caused Liveness Probe failure when XtraBackup is running and the `wsrep_sync_wait` option is set, making the instance to be rejected from the cluster
* {{ k8spsmdbjira(1042) }}: Fix a bug which caused 'syntax error' in backup.sh script if unable getting the cluster size due to some cluster misconfiguration issues 
* {{ k8spsmdbjira(1059) }}: Fix a bug due to which pxc-monit and proxysql-monit containers were printing passwords in their logs (thanks to zlcnju for contribution)
* {{ k8spsmdbjira(1099) }}: Fix CrashLoopBackOff error caused by incorrect (non-atomic) multi-user password change
* {{ k8spsmdbjira(1100) }}: Fix a bug that made it impossible to use slash characters in the monitor user's password **In progress**
* {{ k8spsmdbjira(1118) }}: PITR collector gaps hard to monitor
* {{ k8spsmdbjira(1122) }}: Fix a bug that caused S3 backups fail with error about unsuccessful binlogs certificate verification (thanks to Draken for reporting this issue)
* {{ k8spsmdbjira(1137) }}: Fix a bug that prevented adding, deleting or updating ProxySQL Service labels/annotations except at the Service creation time
* {{ k8spsmdbjira(1138) }}: Fix a bug due to which not enough responsive scripts for readiness and liveness Probes could be the reason of killing the overloaded database Pods
* {{ k8spsmdbjira(997) }}: **PRIVATE** PXC 5.7 backups missing (at least) one failure condition

## Supported Platforms

The following platforms were tested and are officially supported by the Operator
1.12.0:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.21 - 1.24

* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.21 - 1.24

* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.22 - 1.24

* [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.11

* [Minikube](https://minikube.sigs.k8s.io/docs/) 1.28

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
