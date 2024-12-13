# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.16.0

* **Date**

   December XX, 2024

* **Installation**

   [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)

## Release Highlights

### Declarative user management (technical preview)

Before the Operator version 1.16.0 custom MySQL users had to be created manually. Now the declarative creation of custom MongoDB users [is supported](../users.md#unprivileged-users) via the `users` subsection in the Custom Resource. You can specify a new user in `deploy/cr.yaml` manifest, setting the user’s login name and host, PasswordSecretRef (a reference to a key in a Secret resource containing user’s password) and as well as databases the user is going to have access to and the appropriate permissions:

```yaml
...
users:
- name: my-user
  dbs:
  - db1
  - db2
  hosts:
  - localhost
  grants:
  - SELECT
  - DELETE
  - INSERT
  withGrantOption: true
  passwordSecretRef:
    name: my-user-pwd
    key: my-user-pwd-key
...
```

See [documentation](../users.md#unprivileged-users) to find more details about this feature with additional explanations and the list of current limitations.

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

The Operator was developed and tested with Percona XtraDB Cluster versions 8.4.2-2.1 (Tech preview), 8.0.39-30.1, and 5.7.44-31.65. Other options may also work but have not been tested. Other software components include:

* Percona XtraBackup versions 8.4.0-1, 8.0.35-30.1 and 2.4.29
* HAProxy 2.8.11
* ProxySQL 2.7.1
* LogCollector based on fluent-bit 3.2.2
* PMM Client 2.43.2

Percona Operators are designed for compatibility with all [CNCF :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) certified Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below for Operator version 1.16.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.28 - 1.30
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.28 - 1.31
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28 - 1.31
* [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14.42 - 4.17.8
* [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.34.0 based on Kubernetes 1.31.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
