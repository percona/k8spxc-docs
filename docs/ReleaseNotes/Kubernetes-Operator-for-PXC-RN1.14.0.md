# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.14.0

* **Date**

   January 1X, 2024

* **Installation**

   [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)

## Release Highlights

## New Features 

* {{ k8spxcjira(1237) }}: Do not start restore if credentials are invalid or backup doesn't exist
* {{ k8spxcjira(1298) }}: Prefix support for PMM
* {{ k8spxcjira(1313) }}: Add 'Earliest restorable time' and 'Latest restorable time' for PITR
* {{ k8spxcjira(1334) }}: Add support for postStart/preStop hooks

## Improvements

* {{ k8spxcjira(1079) }}: Standardize cluster and components service exposure
* {{ k8spxcjira(1105) }}: PiTR support for self-signed S3 certificates
* {{ k8spxcjira(1128) }}: mc: <ERROR> Unable to initialize new alias from the provided credentials. The secret key required to complete authentication could not be found. The region must be specified if this is not the home region f │ │ or the tenancy.
* {{ k8spxcjira(1144) }}: Mark backups in S3 bucket as PITR unready
* {{ k8spxcjira(1147) }}:Print Last_IO_Error for replication channel if it's not empty 
* {{ k8spxcjira(1151) }}: Improve PITR restore status
* {{ k8spxcjira(1230) }}: Add Labels for all the k8s objects created by Operator
* {{ k8spxcjira(1254) }}: Missing upgrade documentation for Percona XtraDB Cluster in multi-namespace (cluster-wide) mode
* {{ k8spxcjira(1264) }}: Liveness probe does not work if sql_mode ANSI_QUOTES is enabled
* {{ k8spxcjira(1271) }}: Backup stalls with S3 upload network issue
* {{ k8spxcjira(1294) }}: PITR process should have a readiness probe
* {{ k8spxcjira(1301) }}: Ability to run the operator locally against a remote K8S cluster
* {{ k8spxcjira(1317) }}: Reduce hits to version service 
* {{ k8spxcjira(1323) }}: Adding "prefix" to XtraDB Backup Operator CRD
* {{ k8spxcjira(200) }}: Add support for custom options for xtrabackup, xbstream, xbcloud
* {{ k8spxcjira(345) }}: Add topologySpreadConstraints to the specs for even distribution of the pods
* {{ k8spxcjira(927) }}: Service Labels and Annotation for PXC

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
* {{ k8spxcjira(1293) }}: pitr process hanging indefinitely while connecting to mysql
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
