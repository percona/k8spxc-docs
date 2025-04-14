# Percona Operator for MySQL based on Percona XtraDB Cluster 1.17.0 ({{date.1_17_0}})

[Installation](../System-Requirements.md#installation-guidelines){.md-button}

## Release Highlights

This release of Percona Operator for MySQL based on Percona XtraDB Cluster includes the following new features and improvements:

### Improved observability for HAProxy and ProxySQL

Get insights into the HAProxy and ProxySQL performance by connecting to their statistics pages. Use the `cluster-name-haproxy:8084` and `cluster-name-proxysql:6070` endpoints to do so. Learn about other available ports in the [documentation](../haproxy-conf.md).

### Improved cluster load management during backups

If parallel backups overload your cluster, you can turn off parallel execution to prevent this. Previously, this meant that you could only run one backup at a time - no new backups could start until the current one was finished. Now, the Operator queues backups and runs them one after another automatically. You can fine-tune the backup sequence by setting the start time for all backups or for a specific on-demand one using the [`spec.backup.startingDeadlineSeconds`](../operator.md#backupstartingdeadlineseconds) Custom Resource option. This provides greater control over backup operations.

Another improvement is for the case when your database cluster becomes unhealthy, for example, when a Pod crashes or restarts. The Operator suspends running backups to reduce the cluster's load. Once the cluster recovers and reports a Ready status, the Operator resumes the suspended backup. To further offload the cluster during an unhealthy state, you can configure how long a backup remains suspended by using the [`spec.backup.suspendedDeadlineSeconds`](../operator.md#backupsuspendeddeadlineseconds) Custom Resource option. If this time expires before the cluster recovers, the backup is marked as "failed."
 
### Monitor PMM Client health and status

Percona Monitoring and Management (PMM) is a great tool to [monitor the health of your database cluster](../monitoring.md). Now you can also learn if PMM itself is healthy using probes - a Kubernetes diagnostics mechanism to check the health and status of containers. Use the [`spec.pmm.readinessProbes.*`](../operator.md#pmmreadinessprobesinitialdelayseconds) and [`spec.pmm.livenessProbes.*`](../operator.md#pmmlivenessprobesinitialdelayseconds) Custom Resource options to fine-tune Readiness and Liveness probes for PMM Client.

### Improved observability of binary log backups

Get insights into the success and failure rates of binlog operations, timeliness of processing and uploads and potential gaps or inconsistencies in binlog data with the Prometheus metrics added for the Operator. Gather this data by connecting to the `<pitr-pod-service>:8080/metrics` endpoint. Learn more about the available metrics in the [documentation](../backups-pitr.md#binary-logs-statistics).

## Deprecation, Rename and Removal

The `spec.haproxy.exposePrimary.enabled` field is deprecated. If enabled via the `spec.haproxy.enabled`, the HAProxy primary service is already exposed. 

## New Features 

* [K8SPXC-747](https://perconadev.atlassian.net/browse/K8SPXC-747), [K8SPXC-1473](https://perconadev.atlassian.net/browse/K8SPXC-1473) - Add the ability to access the statistics pages for HAProxy and ProxySQL

* [K8SPXC-1366](https://perconadev.atlassian.net/browse/K8SPXC-1366) - Add the ability to queue backups and run them sequentially, and to optimize the cluster load with the ability to suspend backups for an unhealthy cluster. A user can assign the start time and suspension time to backups to manage them better.

* [K8SPXC-1432](https://perconadev.atlassian.net/browse/K8SPXC-1432) - Enable users to configure cluster-wide Operator deployments in OpenShift certified catalog using OLM. 

## Improvements

* [K8SPXC-1367](https://perconadev.atlassian.net/browse/K8SPXC-1367) - Now a user can configure Readiness and Liveness probes for PMM Client container to check its health and status

* [K8SPXC-1461](https://perconadev.atlassian.net/browse/K8SPXC-1461) - Improve logging for resizing PVC with the information about successful and failed PVC resize. Log errors on resize attempts if the Storage Class doesn't support resizing.

* [K8SPXC-1466](https://perconadev.atlassian.net/browse/K8SPXC-1466) - Mark the containers that provide the service as default ones with the annotation. This enables a user to connect to a Pod without explicitly specifying a container.

* [K8SPXC-1473](https://perconadev.atlassian.net/browse/K8SPXC-1473) - Add the ability to connect to the built-in statistics pages for HAProxy and ProxySQL by exposing the ports for those pages

* [K8SPXC-1475](https://perconadev.atlassian.net/browse/K8SPXC-1475) - Update the backup image to use AWS CLI instead of MinIO CLI due to the license change

* [K8SPXC-1510](https://perconadev.atlassian.net/browse/K8SPXC-1510) - Add the ability to suppress messages about the use of deprecated features in MySQL Error Log by adding the `log_error_suppression_list` key from the `my.cnf` configuration file and defining the message number in the `spec.pxc.configuration` subsection of the Custom Resource manifest. See [how to change MySQL options](../options.md) for steps. This improves readability for MySQL error log.

* [K8SPXC-1512](https://perconadev.atlassian.net/browse/K8SPXC-1512) - For Percona XtraDB Cluster version 8.4 and above, binary log user defined functions for point-in-time recovery (`binlog_utils_udf`) are now installed as a component instead of a plugin. This improves their compatibility across platforms and provides automatic dependency handling.

* [K8SPXC-1542](https://perconadev.atlassian.net/browse/K8SPXC-1542) - Improve binlog upload for large files to Azure blob storage with the ability to define the block size and the number of concurrent writers for the upload (Thanks to user dcaputo-harmoni for contribution)

* [K8SPXC-1543](https://perconadev.atlassian.net/browse/K8SPXC-1543) - Set PITR controller reference for binlog-collector deployment the same way as it's set for PXC and proxy StatefulSets. This creates a connection between PITR deployment and cluster resource (Thank you Vlad Gusev for the contribution)

* [K8SPXC-1544](https://perconadev.atlassian.net/browse/K8SPXC-1544) - Improve observability of binlog collector by adding the support of basic Prometheus metrics (Thank you Vlad Gusev for the contribution)

* [K8SPXC-1567](https://perconadev.atlassian.net/browse/K8SPXC-1567) - Normalize duplicate slashes if the bucket path for binlog collector ends with a slash (`/`) (Thank you Vlad Gusev for the contribution)

* [K8SPXC-1596](https://perconadev.atlassian.net/browse/K8SPXC-1596) - Assign a correct status to a backup if data upload fails due to incomplete backup

* [K8SPXC-1620](https://perconadev.atlassian.net/browse/K8SPXC-1620) - Fixed the issue with a failing backup by adding a retry logic to the cloud storage cleanup task to check for uploaded files and clean them up before uploading new files


## Bugs Fixed

* [K8SPXC-1152](https://perconadev.atlassian.net/browse/K8SPXC-1152) Fixed the issue with the restore process being stuck when the Operator is restarted by setting annotations on the `perconaxtradbclusterrestores` object

* [K8SPXC-1482](https://perconadev.atlassian.net/browse/K8SPXC-1482) Fixed the issue with the excessive connection resets on every pod recreation because the cluster's peer-list is not aware of Time To Live (TTL) defined for Kubernetes DNS records. Now there's a 30 second waiting period after a peer update (Thank you Vlad Gusev for reporting this issue and contributing to it)

* [K8SPXC-1483](https://perconadev.atlassian.net/browse/K8SPXC-1483) - Fixed the bug where the point-in-time recovery collector process hangs if `mysqlbinlog` cannot connect to the database and start. Now the named pipeline is created with the `O_RDONLY` (Open for Read Only) and `O_NONBLOCK` (Non-Blocking Mode) to unlock the point-in-time recovery collector process.  (Thank you Vlad Gusev for reporting this issue and contributing to it)

* [K8SPXC-1509](https://perconadev.atlassian.net/browse/K8SPXC-1509) - Fixed the bug where the cluster enters the error state temporarily if point-in-time is enabled for it.

* [K8SPXC-1534](https://perconadev.atlassian.net/browse/K8SPXC-1534) - Fixed the issue with the inconsistent secret reconciliation by improving the controller's behavior to timely sync the secret cache and create an internal Secret immediately after its reconciliation.

* [K8SPXC-1538](https://perconadev.atlassian.net/browse/K8SPXC-1538) - Fixed the issue with the Operator failing when it tries to reconcile the Custom Resource for the `haproxy-replica` service if the `haproxy-primary` service has the type `LoadBalancer` and the `LoadBalancerSourceRanges` value defined. Now the `haproxy-replica` service inherits this configuration.

* [K8SPXC-1546](https://perconadev.atlassian.net/browse/K8SPXC-1546), [K8SPXC-1549](https://perconadev.atlassian.net/browse/K8SPXC-1549) -  Fixed the issue with the PITR pod crashing on attempt to assign a GTID
set to each binlog if the database cluster has a large number of binlogs by caching the `binlog->gtid` set pairs

* [K8SPXC-1547](https://perconadev.atlassian.net/browse/K8SPXC-1547) - Removed the outdated example from the `backup.yaml` manifest and update the documentation how to track backup progress 

* [K8SPXC-1616](https://perconadev.atlassian.net/browse/K8SPXC-1616) - Fixed a bug where the ProxySQL fails to be configured if the password for a `proxysqladmin` user starts with a star (`*`) character by reporting an error and making the Operator regenerate a new password that doesn't start with a star (Thank you Chris Fidao for reporting this issue and contribution)


## Supported Software

The Operator was developed and tested with the following software:

* Percona XtraDB Cluster versions 8.4.3-3.1 (Tech preview), 8.0.41-32.1, and 5.7.44-31.65  
* Percona XtraBackup versions 8.4.0-1, 8.0.35-32, and 2.4.29  
* HAProxy 2.8.14  
* ProxySQL 2.7.1-1  
* LogCollector based on fluent-bit 4.0.0  
* PMM Client 2.44.0  

Other options may also work but have not been tested.

## Supported Platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below for Operator version 1.16.0:

--8<-- [start:platforms]

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.29 - 1.32  
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.30 - 1.32  
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.30 - 1.32  
* [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14 - 4.18  
* [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.35.0 based on Kubernetes 1.32.0  

--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.


## Percona certified images

Find Percona's certified Docker images that you can use with the
Percona Operator for MySQL based on Percona XtraDB Cluster in the following table.

**Images released with the Operator version {{ release }}:** 

--8<-- [start:images]

| Image                                                                  | Digest                                                           |
|:-----------------------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-xtradb-cluster-operator:1.17.0 (x86_64)                | da9aa5c7cb546c60624b927bdd273fc3646bc5a027bcc6f138291bad4da9b7b8 |
| percona/percona-xtradb-cluster-operator:1.17.0 (ARM64)         | 2b61ed62848521071bea18988461e99123ea5d5a92465ab046d0f179b5c0b8ac         |
| percona/haproxy:2.8.14                                         | 6de8c402d83b88dae7403c05183fd75100774defa887c05a57ec04bc25be2305         |
| percona/proxysql2:2.7.1                                        | 975d5c8cc7b5714a0df4dfd2111391a7a79cfa3a217f1dd6de77a83550812fc4         |
| percona/percona-xtradb-cluster-operator:1.17.0-pxc8.4-backup-pxb8.4.0  |3a7a8a47ad12ce783feb089e7035d50f6d5b803cec97a16067f476a426f6fda8 |
| percona/percona-xtradb-cluster-operator:1.17.0-pxc8.0-backup-pxb8.0.35 | 2f28c09027a249426b2f4393aa8b76971583d80e0c56be37f77dad49cb5cd5c4 |
| percona/percona-xtradb-cluster-operator:1.17.0-pxc5.7-backup-pxb2.4.29 | bf494243d9784a016bb4c98bd2690b0fc5fbba1aa7d45d98502dff353fb68bee |
| percona/percona-xtradb-cluster-operator:1.17.0-logcollector-fluentbit4.0.0 | 9fc0b4097c93f6dba8441d9bcb2803dc62dd8328b84288294444fbadb347f6d7 |
| percona/pmm-client:2.44.0                                      | 19a07dfa8c12a0554308cd11d7d38494ea02a14cfac6c051ce8ff254b7d0a4a7 |
| percona/percona-xtradb-cluster:8.4.3-3.1                              |b7b198133e70cb1bd9d5cd1730373a62e976fd2b9bb9ca5a696fd970c1ac09bf |
| percona/percona-xtradb-cluster:8.0.41-32.1                                 | 8a6799cbded5524c6979442f8d7097831c8c6481f5106a856b44b2791ccaf0fb        |
| percona/percona-xtradb-cluster:8.0.39-30.1                             | 6a53a6ad4e7d2c2fb404d274d993414a22cb67beecf7228df9d5d994e7a09966 |
| percona/percona-xtradb-cluster:8.0.36-28.1                                 | b5cc4034ccfb0186d6a734cb749ae17f013b027e9e64746b2c876e8beef379b3        |
| percona/percona-xtradb-cluster:8.0.35-27.1                                 | 1ef24953591ef1c1ce39576843d5615d4060fd09458c7a39ebc3e2eda7ef486b        |
| percona/percona-xtradb-cluster:8.0.32-24.2                                 | 1f978ab8912e1b5fc66570529cb7e7a4ec6a38adbfce1ece78159b0fcfa7d47a |
| percona/percona-xtradb-cluster:5.7.44-31.65                                | 36fafdef46485839d4ff7c6dc73b4542b07031644c0152e911acb9734ff2be85        |
| percona/percona-xtradb-cluster:5.7.42-31.65                                | 9dab86780f86ec9caf8e1032a563c131904b75a37edeaec159a93f7d0c16c603        |
| percona/percona-xtradb-cluster:5.7.39-31.61                                | 9013170a71559bbac92ba9c2e986db9bda3a8a9e39ee1ee350e0ee94488bb6d7        |
| percona/percona-xtradb-cluster:5.7.36-31.55                                | c7bad990fc7ca0fde89240e921052f49da08b67c7c6dc54239593d61710be504        |
| percona/percona-xtradb-cluster:5.7.34-31.51                                | f8d51d7932b9bb1a5a896c7ae440256230eb69b55798ff37397aabfd58b80ccb |

--8<-- [end:images]


