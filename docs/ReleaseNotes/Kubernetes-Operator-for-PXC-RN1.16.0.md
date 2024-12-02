# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.16.0

* **Date**

   December XX, 2024

* **Installation**

   [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)

## Release Highlights


## New Features 

* {{ k8spxcjira(1421) }}: Provide documentation how to restore from xbstream file 
* {{ k8spxcjira(1433) }}: Explain in which situations cluster-wide/multi-namespace installation should be used over single-namespace one
* {{ k8spxcjira(1456) }}: Custom initContainers with custom securityContext for PXC pods

## Improvements

* {{ k8spxcjira(1411) }}: Allow enabling/disabling TLS in a running cluster
* {{ k8spxcjira(1451) }}: Disable PVC resize by default
* {{ k8spxcjira(1503) }}: Fix exec in pitr and proxysql pods

## Bugs Fixed

* {{ k8spxcjira(1398) }}: Scheduled PXC backup job pod fails to complete the process successfully in randomly/sporadically fashion
* {{ k8spxcjira(1413) }}: PXC operator pod segfaults when restoring a backup without backup source populated in cr.yaml
* {{ k8spxcjira(1416) }}: allowParallel:false leads to stuck backups if there is a failed backup
* {{ k8spxcjira(1420) }}: PITR restore hung with duplicate key error
* {{ k8spxcjira(1422) }}: Cluster Endpoint Change when Uprgading
* {{ k8spxcjira(1443) }}: Operator can't survive system users "Host" part change
* {{ k8spxcjira(1444) }}: PXC cluster initial creation state changed to error if backup restore happens for too long
* {{ k8spxcjira(1396) }}: The `xtrabackup` user didn't have rights to grant privileges available in its own privilege level to other users, which caused the point-in-time recovery fail due to access denied
* {{ k8spxcjira(1454) }}: Operator generate ssl secrets as soon as it was updates to v1.15.0
* {{ k8spxcjira(1458) }}: Fix panic when getting storage type
* {{ k8spxcjira(1464) }}: haproxy can't start after kubelet/worker node restart
* {{ k8spxcjira(1500) }}: Backup job doesn't fail and garbd doesn't stop after xbcloud upload failure

## Supported Platforms

The Operator was developed and tested with Percona XtraDB Cluster versions 8.0.36-28.1 and 5.7.44-31.65. Other options may also work but have not been tested. Other software components include:

* Percona XtraBackup versions 8.0.35-30.1 and 2.4.29-1
* HAProxy 2.8.5
* ProxySQL 2.5.5
* LogCollector based on fluent-bit 3.1.4
* PMM Client 2.42.0

The following platforms were tested and are officially supported by the Operator
1.15.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.27 - 1.30
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.28 - 1.30
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28 - 1.30
* [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.13.46 - 4.16.7
* [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.33.1 based on Kubernetes 1.30.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
