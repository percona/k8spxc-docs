# *Percona Kubernetes Operator for Percona XtraDB Cluster* 1.8.0


* **Date**

    April 26, 2021



* **Installation**

    [Installing Percona Kubernetes Operator for Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)


## Release Highlights


* It is now [possible](../scaling.md)
to use `kubectl scale` command to scale Percona XtraDB Cluster horizontally
(add or remove Replica Set instances). You can also use  [Horizontal Pod
Autoscaler :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
which will scale your database cluster based on various metrics, such as CPU utilization.


* Support for [custom sidecar containers](../sidecar.md). The Operator makes
it possible now to deploy additional (sidecar) containers to the Pod. This
feature can be useful to run debugging tools or some specific monitoring
solutions, etc. Sidecar containers can be added to
[pxc](../operator.md#pxcsidecarsimage),
[haproxy](../operator.md#haproxysidecarsimage), and
[proxysql](../operator.md#proxysqlimage) sections of the `deploy/cr.yaml`
configuration file.

## New Features


* [K8SPXC-528](https://jira.percona.com/browse/K8SPXC-528): Support for [custom sidecar containers](../sidecar.md)
to extend the Operator capabilities


* [K8SPXC-647](https://jira.percona.com/browse/K8SPXC-647): Allow the cluster [scale in and scale out](../scaling.md)
with the `kubectl scale` command or Horizontal Pod Autoscaler


* [K8SPXC-643](https://jira.percona.com/browse/K8SPXC-643): Operator can now automatically recover Percona XtraDB
Cluster after the [network partitioning :octicons-link-external-16:](https://en.wikipedia.org/wiki/Network_partition)

## Improvements


* [K8SPXC-442](https://jira.percona.com/browse/K8SPXC-442): The Operator can now automatically remove old backups
from S3 storage if the retention period is set (thanks to Davi S Evangelista
for reporting this issue)


* [K8SPXC-697](https://jira.percona.com/browse/K8SPXC-697): Add namespace support in the
[script used to copy backups](../backups-copy.md) from remote storage to a
local machine


* [K8SPXC-627](https://jira.percona.com/browse/K8SPXC-627): Point-in-time recovery uploader now chooses the Pod
with the oldest binary log in the cluster to ensure log consistency


* [K8SPXC-618](https://jira.percona.com/browse/K8SPXC-618): Add debug symbols from the [percona-xtradb-cluster-server-debuginfo :octicons-link-external-16:](https://www.percona.com/doc/percona-server/8.0/installation/yum_repo.html#what-s-in-each-rpm-package)
package to the Percona XtraDB Cluster debug docker image to simplify
troubleshooting


* [K8SPXC-599](https://jira.percona.com/browse/K8SPXC-599): It is now possible to
[recover](../backups-restore.md#restore-the-cluster-with-point-in-time-recovery) databases up to a specific transaction
with the Point-in-time Recovery feature. Previously the user could only
recover to specific date and time


* [K8SPXC-598](https://jira.percona.com/browse/K8SPXC-598): Point-in-time recovery feature now works with
compressed backups


* [K8SPXC-536](https://jira.percona.com/browse/K8SPXC-536): It is now possible to explicitly set the version of
Percona XtraDB Cluster for newly provisioned clusters. Before that, all new
clusters were started with the latest PXC version if Version Service was
enabled


* [K8SPXC-522](https://jira.percona.com/browse/K8SPXC-522): Add support for the `runtimeClassName` Kubernetes
feature for selecting the container runtime


* K8SPXC-519, K8SPXC-558, and K8SPXC-637: Various improvements of Operator log
messages

## Known Issues and Limitations


* [K8SPXC-701](https://jira.percona.com/browse/K8SPXC-701): Scheduled backups are not compatible with Kubernetes
1.20 in cluster-wide mode.

## Bugs Fixed


* [K8SPXC-654](https://jira.percona.com/browse/K8SPXC-654): Use MySQL administrative port for Kubernetes
liveness/readiness probes to avoid false positive failures


* [K8SPXC-614](https://jira.percona.com/browse/K8SPXC-614), [K8SPXC-619](https://jira.percona.com/browse/K8SPXC-619), [K8SPXC-545](https://jira.percona.com/browse/K8SPXC-545), [K8SPXC-641](https://jira.percona.com/browse/K8SPXC-641), [K8SPXC-576](https://jira.percona.com/browse/K8SPXC-576): Fix multiple bugs due to which changes of various objects in `deploy/cr.yaml` were not applied to the running cluster (thanks to Sergiy Prykhodko for reporting some of these issues)


* [K8SPXC-596](https://jira.percona.com/browse/K8SPXC-596): Fix a bug due to which liveness probe for `pxc`
container could cause zombie processes


* [K8SPXC-632](https://jira.percona.com/browse/K8SPXC-632): Fix a bug preventing point-in-time recovery when
multiple clusters were uploading binary logs to a single S3 bucket


* [K8SPXC-573](https://jira.percona.com/browse/K8SPXC-573): Fix a bug that prevented using special characters in
XtraBackup password (thanks to Gertjan Bijl for reporting this issue)


* [K8SPXC-571](https://jira.percona.com/browse/K8SPXC-571): Fix a bug where Percona XtraDB Cluster went into a
desynced state at backup job crash (Thanks to Dimitrij Hilt for reporting this
issue)


* [K8SPXC-430](https://jira.percona.com/browse/K8SPXC-430): Galera Arbitrator used for backups does not break the
cluster anymore in various cases


* [K8SPXC-684](https://jira.percona.com/browse/K8SPXC-684): Fix a bug due to which point-in-time recovery backup
didn’t allow specifying the `endpointUrl` for Amazon S3 storage


* [K8SPXC-681](https://jira.percona.com/browse/K8SPXC-681): Fix operator crash which occurred when non-existing
storage name was specified for point-in-time recovery


* [K8SPXC-638](https://jira.percona.com/browse/K8SPXC-638): Fix unneeded delay in showing logs with
the `kubectl logs` command for the logs container


* [K8SPXC-609](https://jira.percona.com/browse/K8SPXC-609): Fix frequent HAProxy service NodePort updates which
were causing issues with load balancers


* [K8SPXC-542](https://jira.percona.com/browse/K8SPXC-542): Fix a bug due to which  backups were taken only for one
cluster out of many controlled by one Operator


* [CLOUD-611](https://jira.percona.com/browse/CLOUD-611): Stop using the already deprecated runtime/scheme package
(Thanks to Jerome Küttner for reporting this issue)
