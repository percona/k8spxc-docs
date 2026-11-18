> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.14.0

- **Date**

March 4, 2024

- **Installation**

[Installing Percona Operator for MySQL based on Percona XtraDB Cluster](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/System-Requirements.html#installation-guidelines)

## Release Highlights

### Quickstart guide

Within this release, a [Quickstart guide](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/quickstart.html) was added to the Operator docs, that’ll set you up and running in no time! Taking a look at this guide you’ll be guided step by step through quick installing (multiple options), connecting to the database, inserting data, making a backup, and even integrating with Percona Monitoring and Management (PMM) to monitor your cluster.

### Automated volume resizing

Kubernetes supports the Persistent Volume expansion as a stable feature since v1.24. Using it with the Operator previously involved manual operations. Now this is automated, and users can resize their PVCs [by just changing the value](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/scaling.html#scale-storage) of the `resources.requests.storage` option in the PerconaXtraDBCluster custom resource. This feature is in a technical preview stage and is not recommended for production environments.

*Update from November 24, 2025* Though the Operator automates the storage resizing, the users must still trigger the process by modifying the Custom Resource and applying the new configuration.

## New Features

- [K8SPXC-1298](https://jira.percona.com/browse/K8SPXC-1298): Custom [prefix](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/containers-conf.html) for Percona Monitoring and Management (PMM) allows using one PMM Server to monitor multiple databases even if they have identical cluster names
- [K8SPXC-1334](https://jira.percona.com/browse/K8SPXC-1334): The new `lifecycle.postStart` and `lifecycle.preStop` Custom Resource options allow configuring [postStart and preStop hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for ProxySQL and HAProxy Pods
- [K8SPXC-1341](https://jira.percona.com/browse/K8SPXC-1341): It is now possible to resize Persistent Volume Claims by patching the PerconaXtraDBCluster custom resource. Change `persistentVolumeClaim.resources.requests.storage` and let the Operator do the scaling

## Improvements

- [K8SPXC-1313](https://jira.percona.com/browse/K8SPXC-1313): The `kubectl get pxc-backup` command now shows Latest restorable time to make it easier to pick a point-in-time recovery target
- [K8SPXC-1237](https://jira.percona.com/browse/K8SPXC-1237): The Operator now checks if the needed Secrets exist and connects to the storage to check the existence of a backup before starting the restore process
- [K8SPXC-1079](https://jira.percona.com/browse/K8SPXC-1079): Standardize cluster and components service [exposure](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/expose.html) to have unification of the expose configuration across all Percona Operators
- [K8SPXC-1147](https://jira.percona.com/browse/K8SPXC-1147): Improve log messages by printing the `Last_IO_Error` for a replication channel if it’s not empty
- [K8SPXC-1151](https://jira.percona.com/browse/K8SPXC-1151): The `kubectl get pxc-restore` command now shows the “Starting cluster” status to indicate that the point-in-time recovery process is finished
- [K8SPXC-1230](https://jira.percona.com/browse/K8SPXC-1230): Add Labels for all Kubernetes objects created by Operator (backups/restores, Secrets, Volumes, etc.) to make them clearly distinguishable
- [K8SPXC-1271](https://jira.percona.com/browse/K8SPXC-1271): Use timeout to avoid backup stalls in case of the S3 upload network issues
- [K8SPXC-1293](https://jira.percona.com/browse/K8SPXC-1293) and [K8SPXC-1294](https://jira.percona.com/browse/K8SPXC-1294): The new `backup.pitr.timeoutSeconds` Custom Resource option allows setting a timeout for the point-in-time recovery process
- [K8SPXC-1301](https://jira.percona.com/browse/K8SPXC-1301): The Operator can now be [run locally](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/CONTRIBUTING.md#1-contributing-to-the-source-tree) against a remote Kubernetes cluster, which simplifies the development process, substantially shortening the way to make and try minor code improvements
- [K8SPXC-200](https://jira.percona.com/browse/K8SPXC-200) and [K8SPXC-1128](https://jira.percona.com/browse/K8SPXC-1128): The new `containerOptions` subsections were added to `pxc-backup`, `pxc-restore`, and `pxc` Custom Resources to allow setting custom options for xtrabackup, xbstream, and xbcloud tools used by the Operator
- [K8SPXC-345](https://jira.percona.com/browse/K8SPXC-345): The new `topologySpreadConstraints` Custom Resource option allows to use [Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/workloads/pods/pod-topology-spread-constraints/#spread-constraints-for-pods) to achieve even distribution of Pods across the Kubernetes cluster
- [K8SPXC-927](https://jira.percona.com/browse/K8SPXC-927): The new `serviceLabel` and `serviceAnnotation` Custom Resource options allow setting Service Labels and Annotations for XtraDB Cluster Pods
- [K8SPXC-1340](https://jira.percona.com/browse/K8SPXC-1340): The new Custom Resource option allows setting custom containerSecurityContext for PMM containers (thanks Marko Weiß for report)
- [K8SPXC-1254](https://jira.percona.com/browse/K8SPXC-1254): Upgrade instructions for Percona XtraDB Cluster in multi-namespace (cluster-wide) mode [were added to documentation](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/cluster-wide.html#upgrading-the-operator-in-cluster-wide-mode)
- [K8SPXC-1276](https://jira.percona.com/browse/K8SPXC-1276) and [K8SPXC-1277](https://jira.percona.com/browse/K8SPXC-1277): HAProxy log format was changed to JSON with additional information such as timestamps to simplify troubleshooting

## Bugs Fixed

- [K8SPXC-1264](https://jira.percona.com/browse/K8SPXC-1264): Liveness probe didn’t work if `sql_mode` ANSI_QUOTES enabled
- [K8SPXC-1067](https://jira.percona.com/browse/K8SPXC-1067): Fix a bug that caused the Operator not tracking changes in a number of Custom Resource options in the `haproxy` subsection
- [K8SPXC-1105](https://jira.percona.com/browse/K8SPXC-1105): Fix a bug that didn’t allow point-in-time recovery backups on S3-compatible storage with using self-signed certificates
- [K8SPXC-1106](https://jira.percona.com/browse/K8SPXC-1106): Fix a bug which caused point-in-time recovery silently not uploading files if a corrupted binlog file existed in /var/lib/mysql
- [K8SPXC-1159](https://jira.percona.com/browse/K8SPXC-1159): Cluster status was repeatedly switching between “ready” and “error” if the password change did not satisfy the complexity and was rejected by MySQL
- [K8SPXC-1256](https://jira.percona.com/browse/K8SPXC-1256): Fix a bug where the Operator was unable to perform a cleanup by deleting a replication channel if the replication was already stopped
- [K8SPXC-1263](https://jira.percona.com/browse/K8SPXC-1263): Fix a bug where point-in-time recovery was failing if the xtrabackup user password was changed in the binary log files
- [K8SPXC-1269](https://jira.percona.com/browse/K8SPXC-1269): Fix a bug due to which switching from HAProxy to ProxySQL was broken for Percona XtraDB Cluster 5.7
- [K8SPXC-1274](https://jira.percona.com/browse/K8SPXC-1274): PXC init container used by XtraDB Cluster and HAProxy instances inherited XtraDB Cluster resource requirements which was too much for HAProxy (Thanks Tristan for reporting)
- [K8SPXC-1275](https://jira.percona.com/browse/K8SPXC-1275): Fix a bug which caused replication error after switching system accounts to caching_sha2_password authentication plugin which became available in the previous release
- [K8SPXC-1288](https://jira.percona.com/browse/K8SPXC-1288): The Operator didn’t treat the name for scheduled backup as a mandatory field
- [K8SPXC-1302](https://jira.percona.com/browse/K8SPXC-1302): Fix a bug where the Operator was continuously trying to delete a backup from an S3 bucket that has a retention policy configured and `delete-s3-backup` finalizer present, which could cause out-of-memory issue in case of tight Pod’s memory limits
- [K8SPXC-1333](https://jira.percona.com/browse/K8SPXC-1333): Scheduled backup was failing if Percona XtraDB Cluster name was not unique across namespaces
- [K8SPXC-1335](https://jira.percona.com/browse/K8SPXC-1335): Fix a bug where HAProxy was not stopping existing connections to primary in case of Percona XtraDB Cluster instance failover but only routed new ones to another instance
- [K8SPXC-1339](https://jira.percona.com/browse/K8SPXC-1339): Fix a bug where HAProxy was not aware of the IP address change in case of the restarted Percona XtraDB Cluster Pod and couldn’t reach it until the DNS cache update
- [K8SPXC-1345](https://jira.percona.com/browse/K8SPXC-1345): Fix a regression where the Operator was unable to customize readinessProbe of the pxc container
- [K8SPXC-1350](https://jira.percona.com/browse/K8SPXC-1350): Fix a bug due to which log rotate could cause locking TOI ([Total Order Isolation](https://galeracluster.com/library/documentation/schema-upgrades.html#toi) ) DDL operation on the cluster with flush error logs, resulting in unnecessary synchronization on the whole cluster and possible warnings in logs

## Deprecation, Rename and Removal

- [K8SPXC-1079](https://jira.percona.com/browse/K8SPXC-1079): Custom Resource options for service exposure of Percona XtraDB Cluster HAProxy Primary, HAProxy Replicas, and ProxySQL were moved to dedicated `pxc.expose`, `haproxy.exposePrimary`, `haproxy.exposeReplicas`, and `proxysql.expose` subsections. This brings more structure to the Custom Resource and implements the same approach across all Percona Operators. Old variants of service exposure options **are now deprecated** and will be removed in next releases
- [K8SPXC-1274](https://jira.percona.com/browse/K8SPXC-1274): The `initImage` Custom Resource option which allows providing an alternative image with various options for the initial Operator installation, was moved to a dedicated subsection and is now available as `initContainer.image`
- [K8SPXC-878](https://jira.percona.com/browse/K8SPXC-878): The `clustercheck` system user deprecated in v1.12.0 was completely removed in this release

## Supported Platforms

The Operator was developed and tested with Percona XtraDB Cluster versions 8.0.35-27.1 and 5.7.44-31.65. Other options may also work but have not been tested. Other software components include:

- Percona XtraBackup versions 2.4.29-1 and 8.0.35-30.1
- HAProxy 2.8.5-1
- ProxySQL 2.5.5-1.1
- LogCollector based on fluent-bit 2.1.10-1
- PMM Client 2.41.1

The following platforms were tested and are officially supported by the Operator 1.14.0:

- [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.25 - 1.29
- [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.24 - 1.29
- [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.26 - 1.28
- [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.12.50 - 4.14.13
- [Minikube](https://minikube.sigs.k8s.io/docs/) 1.32.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
