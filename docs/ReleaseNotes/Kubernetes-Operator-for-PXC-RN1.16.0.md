# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.16.0

* **Date**

   December 18, 2024

* **Installation**

   [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)

## Release Highlights

### Declarative user management (technical preview)

Before the Operator version 1.16.0 custom MySQL users had to be created manually. Now the declarative creation of custom MongoDB users [is supported](../users.md#unprivileged-users) via the `users` subsection in the Custom Resource. You can specify a new user in `deploy/cr.yaml` manifest, setting the user’s login name and hosts this user is allowed to connect from, PasswordSecretRef (a reference to a key in a Secret resource containing user’s password) and as well as databases the user is going to have access to and the appropriate permissions:

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

* {{ k8spxcjira(377) }}: It is now possible to create and manage users via the Custom Resource
* {{ k8spxcjira(1456) }}: Now the user can run Percona XtraDB Cluster Pods initContainers [with a security context different](../operator.md#initcontainercontainersecuritycontext) from the Pods security context, which may be useful to make customization for tuned Kubernetes environments (Thanks to Vlad Gusev for contribution)

## Improvements

* {{ k8spxcjira(1411) }}: Enabling/disabling TLS on a running cluster [is now possible](../TLS.md#enabling-or-disabling-tls-on-a-running-cluster) simply by toggling the appropriate Custom Resource option
* {{ k8spxcjira(1451) }}: The [automated storage scaling](../scaling.md#automated-scaling-with-volume-expansion-capability) by default and need to be explicitly enabled with the `enableVolumeExpansion` Custom Resource option
* {{ k8spxcjira(1503) }}: Logic improvement saves logs from a number of temporary non-critical errors related to ProxySQL user sync and non-presence of point-in-time recovery files (Thanks to dcaputo-harmoni for contribution)

## Bugs Fixed

* {{ k8spxcjira(1398) }}: Fix a bug which sporadically prevented the scheduled backup job Pod from successfully completing the process
* {{ k8spxcjira(1413) }}: Fix the Operator Pod segfault which was occurring when restoring a backup without backup source specified in the Custom Resource
* {{ k8spxcjira(1416) }}: Fix a bug where disabling parallel backups in Custom Resource caused all backups to stuck in presence of any failed backup
* {{ k8spxcjira(1420) }}: Fix a bug where HAProxy exposed at the time of point-in-time restore could make conflicting transactions, causing the PITR Pod stuck on the duplicate key error
* {{ k8spxcjira(1422) }}: Fix the cluster endpoint change from the external IP to the service name when upgrading the Operator
* {{ k8spxcjira(1443) }}: Operator can't survive system users "Host" part change **Needs checking**
* {{ k8spxcjira(1444) }}: Fix a bug where Percona XtraDB Cluster initial creation state was changing to "error" if the backup restore was taking too long
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
