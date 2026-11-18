> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.16.0

- **Date**

December 19, 2024

- **Installation**

[Installing Percona Operator for MySQL based on Percona XtraDB Cluster](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/System-Requirements.html#installation-guidelines)

## Release Highlights

### Declarative user management (technical preview)

Before the Operator version 1.16.0 custom MySQL users had to be created manually. Now the declarative creation of custom MySQL users [is supported](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/users.html#unprivileged-users) via the `users` subsection in the Custom Resource. You can specify a new user in `deploy/cr.yaml` manifest, setting the user’s login name and hosts this user is allowed to connect from, PasswordSecretRef (a reference to a key in a Secret resource containing user’s password) and as well as databases the user is going to have access to and the appropriate permissions:

```
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

See [documentation](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/users.html#unprivileged-users) to find more details about this feature with additional explanations and the list of current limitations.

### Percona XtraDB Cluster 8.4 support (technical preview)

Percona XtraDB Cluster based on Percona Server for MySQL 8.4 versions is now supported by the Operator in addition to 8.0 and 5.7 versions. The appropriate images for Percona XtraDB Cluster and Percona XtraBackup are included into the [list of Percona-certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html). Being a technical preview, Percona XtraDB Cluster 8.4 is not yet recommended for production environments.

## New Features

- [K8SPXC-377](https://jira.percona.com/browse/K8SPXC-377): It is now possible to create and manage users via the Custom Resource
- [K8SPXC-1456](https://jira.percona.com/browse/K8SPXC-1456): Now the user can run Percona XtraDB Cluster Pods initContainers [with a security context different](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#initcontainercontainersecuritycontext) from the Pods security context, useful to customize deployment on tuned Kubernetes environments (Thanks to Vlad Gusev for contribution)

## Improvements

- [K8SPXC-1230](https://jira.percona.com/browse/K8SPXC-1230) and [K8SPXC-1378](https://jira.percona.com/browse/K8SPXC-1378): Now the Operator assigns labels to all Kubernetes objects it creates (backups/restores, Secrets, Volumes, etc.) to make them clearly distinguishable
- [K8SPXC-1411](https://jira.percona.com/browse/K8SPXC-1411): Enabling/disabling TLS on a running cluster [is now possible](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/tls-disable.html) simply by toggling the appropriate Custom Resource option
- [K8SPXC-1451](https://jira.percona.com/browse/K8SPXC-1451): The [automated storage scaling](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/scaling.html#storage-resizing-with-volume-expansion-capability) is now disabled by default and needs to be explicitly enabled with the `enableVolumeExpansion` Custom Resource option
- [K8SPXC-1462](https://jira.percona.com/browse/K8SPXC-1462): A restart of Percona XtraDB Cluster Pods is now triggered by the monitor user’s password change if the user secret is used within a sidecar container, which can be useful for custom monitoring solutions (Thanks to Vlad Gusev for contribution)
- [K8SPXC-1503](https://jira.percona.com/browse/K8SPXC-1503): Improved logic saves logs from the appearance of a number of temporary non-critical errors related to ProxySQL user sync and non-presence of point-in-time recovery files (Thanks to dcaputo-harmoni for contribution)
- [K8SPXC-1500](https://jira.percona.com/browse/K8SPXC-1500): A new `backup.activeDeadlineSeconds` Custom Resource option was added to fail the backup job automatically after the specified timeout (Thanks to Vlad Gusev for contribution)
- [K8SPXC-1532](https://jira.percona.com/browse/K8SPXC-1532): The peer-list tool used by the Operator was removed from standard HAProxy, ProxySQL and PXC Docker images because recent Operator versions are adding it with the initContainer approach

## Bugs Fixed

- [K8SPXC-1222](https://jira.percona.com/browse/K8SPXC-1222): Fix a bug where upgrading a cluster with hundreds of thousands of tables would fail due to a timeout
- [K8SPXC-1398](https://jira.percona.com/browse/K8SPXC-1398): Fix a bug which sporadically prevented the scheduled backup job Pod from successfully completing the process
- [K8SPXC-1413](https://jira.percona.com/browse/K8SPXC-1413) and [K8SPXC-1458](https://jira.percona.com/browse/K8SPXC-1458): Fix the Operator Pod segfault which was occurring when restoring a backup without backupSource Custom Resource subsection or without storage specified in the backupSource
- [K8SPXC-1416](https://jira.percona.com/browse/K8SPXC-1416): Fix a bug where disabling parallel backups in Custom Resource caused all backups to get stuck in presence of any failed backup
- [K8SPXC-1420](https://jira.percona.com/browse/K8SPXC-1420): Fix a bug where HAProxy exposed at the time of point-in-time restore could make conflicting transactions, causing the PITR Pod stuck on the duplicate key error
- [K8SPXC-1422](https://jira.percona.com/browse/K8SPXC-1422): Fix the cluster endpoint change from the external IP to the service name when upgrading the Operator
- [K8SPXC-1444](https://jira.percona.com/browse/K8SPXC-1444): Fix a bug where Percona XtraDB Cluster initial creation state was changing to “error” if the backup restore was taking too long
- [K8SPXC-1454](https://jira.percona.com/browse/K8SPXC-1454): Fix a bug where the Operator erroneously generated SSL secrets when upgrading from 1.14.0 to 1.15.0 with `allowUnsafeConfigurations: true`Custom Resource option

## Deprecation, Rename and Removal

Operator versions older than 1.14.1 become incompatible with new HAProxy, ProxySQL and PXC Docker images due to the absence of the peer-list tool in them. If you are still using the older Operator version, make sure to update the Operator before switching to the latest database and proxy images. You can see the [list of Percona certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html) for the current release, and check image versions certified for previous releases in the [documentation archive](https://docs.percona.com/legacy-documentation/) .

## Known limitations

Being a technical preview, Percona XtraDB Cluster 8.4 doesn’t support the full set of features available within 8.0. Percona XtraDB Cluster 8.4 support has following limitations in this Operator release:

- [K8SPXC-1529](https://jira.percona.com/browse/K8SPXC-1529): Cross-site replication is not yet supported,
- [K8SPXC-1512](https://jira.percona.com/browse/K8SPXC-1512): Point-in-time recovery doesn’t work yet,
- [K8SPXC-1511](https://jira.percona.com/browse/K8SPXC-1511): Encryption is not yet supported,
- [K8SPXC-1513](https://jira.percona.com/browse/K8SPXC-1513): Version service does not support XtraDB Cluster 8.4 yet as well.

## Supported Platforms

The Operator was developed and tested with Percona XtraDB Cluster versions 8.4.2-2.1 (Tech preview), 8.0.39-30.1, and 5.7.44-31.65. Other options may also work but have not been tested. Other software components include:

- Percona XtraBackup versions 8.4.0-1, 8.0.35-30.1 and 2.4.29
- HAProxy 2.8.11
- ProxySQL 2.7.1
- LogCollector based on fluent-bit 3.2.2
- PMM Client 2.44.0

Percona Operators are designed for compatibility with all [CNCF-certified](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below for Operator version 1.16.0:

- [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.28 - 1.30
- [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.28 - 1.31
- [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28 - 1.31
- [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14.42 - 4.17.8
- [Minikube](https://minikube.sigs.k8s.io/docs/) 1.34.0 based on Kubernetes 1.31.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
