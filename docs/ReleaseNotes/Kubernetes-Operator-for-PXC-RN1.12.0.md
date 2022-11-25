# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.12.0

* **Date**

    November 30, 2022

* **Installation**

    [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](index.md#quickstart-guides)

## Release Highlights

* [Azure Kubernetes Service (AKS)](../aks.md) is now officially supported platform, so developers and vendors of the solutions based on the Azure platform can take advantage of the official support from Percona or just use officially certified Percona Operator for MongoDB images

## New Features

* {{ k8spsmdbjira(1043) }} Support for the [Azure Kubernetes Service (AKS)](../aks.md)
* {{ k8spsmdbjira(1005) }} Add support of Microsoft Azure Blob storage for the backups
* {{ k8spsmdbjira(1010) }} template innodb_buffer_pool_size with instance memory size
* {{ k8spsmdbjira(1082) }} Ability to ignore specific annotations for k8s Service objects
* {{ k8spsmdbjira(1120) }} Add headless service support for restore pod
* {{ k8spsmdbjira(1140) }} Allow replication channels over SSL (thanks to Alvaro Aguilar-Tablada Espinosa for contribution)

## Improvements

* {{ k8spsmdbjira(955) }} Provide static IP-address for LoadBalancer
* {{ k8spsmdbjira(1032) }} Disable [automated upgrade](../update.md#operator-update-smartupdates) by default to prevent an unplanned downtime for user applications and to provide defaults more focused on strict user’s control over the cluster
* {{ k8spsmdbjira(1095) }} process the sigterm signal
* {{ k8spxcjira(1104) }} Starting from now, the Opearator changed its API version to v1 instead of having a separate API version for each release. Three last API version are supported in addition to `v1`, which substantially reduces the size of Custom Resource Definition to prevent reaching the etcd limit
* {{ k8spsmdbjira(1113) }} Utilize dual password MySQL feature to change passwords
* {{ k8spsmdbjira(1125) }} Operator should not try to start PMM if there is no 'pmmserverkey or pmmserver' key in secret
* {{ k8spsmdbjira(1153) }} Improve logging
* {{ k8spsmdbjira(1039) }} get primary pxc pod: failed to get proxySQL db

## Bugs Fixed

* {{ k8spsmdbjira(1065) }} Make bucket destination more unique
* {{ k8spsmdbjira(1096) }} Possible data loss with default helm chart settings for pxc operator **Open**
* {{ k8spsmdbjira(1110) }} backup fails but is marked as finished **Open**
* {{ k8spsmdbjira(1123) }} PXC operator can not find own Pod (thanks to Bart Vercoulen for reporting this issue)
* {{ k8spsmdbjira(835) }} proxysql errors when used in replica cluster
* {{ k8spsmdbjira(898) }} Unstable scheduled backups with PXC 8.0.23
* {{ k8spsmdbjira(924) }} Operator goes in CrashLoopBackOff when the node running the pod crashes
* {{ k8spsmdbjira(1028) }} auto tuning for innodb_buffer_pool variables is not ok
* {{ k8spsmdbjira(1029) }} replica cluster (cross-site) doesn't work with proxysql **Open**
* {{ k8spsmdbjira(1030) }} cert manager certificate renew is not working after delete+apply
* {{ k8spsmdbjira(1036) }} Liveness check fails when XtraBackup is running and wsrep_sync_wait is set
* {{ k8spsmdbjira(1042) }} Avoid 'syntax error' in backup.sh in case of not getting cluster size
* {{ k8spsmdbjira(1059) }} pxc-monit and proxysql-monit containers print passwords
* {{ k8spsmdbjira(1099) }} CrashLoopBackOff after password change with password_history or password validation
* {{ k8spsmdbjira(1100) }} can't use slash in a password for monitor user **In progress**
* {{ k8spsmdbjira(1118) }} PITR collector gaps hard to monitor
* {{ k8spsmdbjira(1122) }} The S3 backup MySQL Binlogs certificate verification fails (thanks to  Draken for reporting this issue)
* {{ k8spsmdbjira(1137) }} Unable to add, delete and update service labels/annotations for proxysql
* {{ k8spsmdbjira(1138) }} Improve readiness/liveness probs
* {{ k8spsmdbjira(997) }} **PRIVATE** PXC 5.7 backups missing (at least) one failure condition

## Supported Platforms

The following platforms were tested and are officially supported by the Operator
1.12.0:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.21 - 1.24

* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.21 - 1.24

* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.22 - 1.24

* [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.11

* [Minikube](https://minikube.sigs.k8s.io/docs/) 1.28

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
