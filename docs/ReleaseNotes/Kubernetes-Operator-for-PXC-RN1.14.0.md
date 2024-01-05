# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.14.0

* **Date**

   January 1X, 2024

* **Installation**

   [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)

## Release Highlights

## New Features 

* {{ k8spxcjira(1237) }}: The operator now checks if the needed Secrets exist and connects to the storage to check the existence of a backup before starting the restore process
* {{ k8spxcjira(1298) }}: Configuring custom [prefix](../containers-conf.md) for Percona Monitoring and Management (PMM) environment variables Secret will allow using one PMM Server with multiple same name clusters
* {{ k8spxcjira(1313) }}: The `kubectl get pxc-backup` command now shows Latest restorable time to make it easier to pick a point-in-time recovery target
* {{ k8spxcjira(1334) }}: The new `lifecycle.postStart` and `lifecycle.preStop` Custom Resource options allow configuring [postStart and preStop hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for ProxySQL and HAProxy Pods


## Improvements

* {{ k8spxcjira(1079) }}: Standardize cluster and components service [exposure](../expose.md) to have unification of the expose configuration across all Percona Operators
* {{ k8spxcjira(1105) }}: Allow point-in-time recovery backups on S3-compatible storage with using self-signed certificates
* {{ k8spxcjira(1128) }}: mc: <ERROR> Unable to initialize new alias from the provided credentials. The secret key required to complete authentication could not be found. The region must be specified if this is not the home region f │ │ or the tenancy (thanks to Cagri Biroglu for contributing)
* {{ k8spxcjira(1144) }}: Mark backups in S3 bucket as PITR unready
* {{ k8spxcjira(1147) }}: Improve log messages by printing the `Last_IO_Error` for a replication channel if it's not empty
* {{ k8spxcjira(1151) }}: The `kubectl get pxc-restore` command now shows the "Starting cluster" status to indicate that the point-in-time recovery process is finished
* {{ k8spxcjira(1230) }}: Add Labels for all Kubernetes objects created by Operator (backups/restores, Secrets, Volumes, etc.) to make them clearly distinguishable
* {{ k8spxcjira(1264) }}: Liveness probe didn't work if `sql_mode` ANSI_QUOTES enabled **BUG FIX?**
* {{ k8spxcjira(1271) }}: Use timeout to avoid backup stalls in case of the S3 upload network issues
* {{ k8spxcjira(1293) }} and {{ k8spxcjira(1294) }}: The new `backup.pitr.timeoutSeconds` Custom Resource option allows setting a timeout for the point-in-time recovery process
* {{ k8spxcjira(1301) }}: The Operator can now be [run locally](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/CONTRIBUTING.md#1-contributing-to-the-source-tree) against a remote Kubernetes cluster, which simplifies the development process, substantially shortening the way to make and try minor code improvements
* {{ k8spxcjira(1317) }}: Reduce hits to version service by using a one hour interval
* {{ k8spxcjira(200) }}: The new `containerOptions` subsections were added to pxc-backup, pxc-restore and pxc Custom Resourcess to allow setting custom options for xtrabackup, xbstream, xbcloud tools used by the Operator
* {{ k8spxcjira(345) }}: The new `topologySpreadConstraints` Custom Resource option allows to use [Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/workloads/pods/pod-topology-spread-constraints/#spread-constraints-for-pods) to achieve even distribution of Pods across the Kubernetes cluster
* {{ k8spxcjira(927) }}: The new `serviceLabel` and `serviceAnnotation` Custom Resource options allow setting Service Labels and Annotation for XtraDB Cluster Pods

## Bugs Fixed

* {{ k8spxcjira(1029) }}: replica cluster (cross-site) doesn't work with proxysql
* {{ k8spxcjira(1067) }}: Changes to certain fields in cr.spec.haproxy does not upgrade the haproxy statefulset
* {{ k8spxcjira(1106) }}: PiTR silently not uploading files if a corrupted binlog file exists in /var/lib/mysql
* {{ k8spxcjira(1159) }}: cluster status flapping on invalid password change
* {{ k8spxcjira(1256) }}: Operator cannot clean replication's failover sources if replications have been stopped
* {{ k8spxcjira(1263) }}: PiTR restore fails if xtrabackup user password is changed in binary log files
* {{ k8spxcjira(1268) }}: pxc-container restarted immediately if /var/lib/mysql/sleep-forever file is removed
* {{ k8spxcjira(1269) }}: wrong message about switching from haproxy to proxysql
* {{ k8spxcjira(1274) }}: PXC init container inherits PXC node resource requirements
* {{ k8spxcjira(1275) }}: Replication error due to caching_sha2_password
* {{ k8spxcjira(1276) }}: HAProxy should be configured in a way it logs connection problems
* {{ k8spxcjira(1277) }}: HAProxy logs do not have timestamps
* {{ k8spxcjira(1281) }}: Fix replication for cross-site
* {{ k8spxcjira(1286) }}: tls certificate page is not up to date
* {{ k8spxcjira(1288) }}: Make backup schedule name mandatory
* {{ k8spxcjira(1302) }}: finalizers delete-s3-backup with GCS protection will cause an OOM
* {{ k8spxcjira(1329) }}: pmm agent is failing in openshift with temp folder permission issue
* {{ k8spxcjira(1333) }}: Scheduled backup failed if pxc cluster name is not unique across namespaces
* {{ k8spxcjira(1335) }}: Haproxy is not stopping connections after failover from pxc-2 to pxc-0
* {{ k8spxcjira(878) }}: Check if we still use "clustercheck" user somewhere


## Supported Platforms

The Operator was developed and tested with Percona XtraDB Cluster versions 8.0.32-24.2 and 5.7.42-31.65. Other options may also work but have not been tested. Other software components include:

* Percona XtraBackup versions 2.4.28 and 8.0.32-26
* HAProxy 2.6.12
* ProxySQL 2.5.1-1.1
* LogCollector based on fluent-bit 2.1.5
* PMM Client 2.38

The following platforms were tested and are officially supported by the Operator
1.14.0:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.24 - 1.27
* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.23 - 1.27
* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.24 - 1.26
* [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.13
* [Minikube](https://minikube.sigs.k8s.io/docs/) 1.30 (based on Kubernetes 1.27)

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
