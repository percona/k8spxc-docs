# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.11.0


* **Date**

    June 3, 2022



* **Installation**

    [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)


## Release Highlights


* With this release, the Operator turns to a simplified naming convention and
changes its official name to **Percona Operator for MySQL based on Percona XtraDB Cluster**


* The new [backup.backoffLimit](../operator.md#backup-backofflimit) Custom Resource option allows customizing the number of attempts the Operator should make for backup


* The OpenAPI schema is now generated for the Operator
, which allows Kubernetes to validate
Custom Resource and protects users from occasionally applying
`deploy/cr.yaml` with syntax errors

## New Features


* [K8SPXC-936](https://jira.percona.com/browse/K8SPXC-936): Allow modifying the init script via Custom Resource,
which is useful for troubleshooting the Operator’s issues


* [K8SPXC-758](https://jira.percona.com/browse/K8SPXC-758): Allow to [skip TLS verification for backup storage](../operator.md#backup-storages-verifytls),
useful for self-hosted S3-compatible storage with a self-signed certificate

## Improvements


* [K8SPXC-947](https://jira.percona.com/browse/K8SPXC-947): Parametrize the number of attempt the Operator should
make for backup backup through a [Custom Resource option](../operator.md#backup-backofflimit)


* [K8SPXC-738](https://jira.percona.com/browse/K8SPXC-738): Allow to set service labels
[for HAProxy](../operator.md#haproxy-servicelabels) and [ProxySQL](../operator.md#proxysql-servicelabels)
in Custom Resource to enable various integrations with cloud providers or
service meshes


* [K8SPXC-848](https://jira.percona.com/browse/K8SPXC-848): PMM container does not cause the crash of the whole
database Pod if pmm-agent is not working properly


* [K8SPXC-625](https://jira.percona.com/browse/K8SPXC-625): Print the total number of binlogs and the number of
remaining binlogs in the restore log while point-in-time recovery in progress


* [K8SPXC-920](https://jira.percona.com/browse/K8SPXC-920): Using the new [Percona XtraBackup Exponential Backoff feature :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/8.0/xbcloud/xbcloud_exbackoff.html)
decreases the number of occasional unsuccessful backups due to more effective
retries timing (Thanks to Dustin Falgout for reporting this issue)


* [K8SPXC-823](https://jira.percona.com/browse/K8SPXC-823): Make it possible
[to use API Key](../monitoring.md#operator-monitoring-client-token) to authorize within
Percona Monitoring and Management Server

## Bugs Fixed


* [K8SPXC-985](https://jira.percona.com/browse/K8SPXC-985): Fix a bug that caused point-in-time recovery to fail
due to incorrect binlog filtering logic


* [K8SPXC-899](https://jira.percona.com/browse/K8SPXC-899): Fix a bug due to which issued certificates didn’t
cover all hostnames, making `VERIFY_IDENTITY` client mode not working with
HAProxy


* [K8SPXC-750](https://jira.percona.com/browse/K8SPXC-750): Fix a bug that prevented ProxySQL from connecting to
Percona XtraDB Cluster after turning TLS off


* [K8SPXC-896](https://jira.percona.com/browse/K8SPXC-896): Fix a bug due to which the Operator was unable to
create ssl-internal Secret if crash happened in the middle of a reconcile and
restart (Thanks to srteam2020 for contribution)


* [K8SPXC-725](https://jira.percona.com/browse/K8SPXC-725) and [K8SPXC-763](https://jira.percona.com/browse/K8SPXC-763): Fix a bug due to which
ProxySQL StatefulSet,  and Services where
mistakenly deleted by the Operator when reading stale ProxySQL or HAProxy
information (Thanks to srteam2020 for contribution)


* [K8SPXC-957](https://jira.percona.com/browse/K8SPXC-957): Fix a bug due to which `pxc-db` Helm chart didn’t
support setting the `replicasServiceType` Custom Resource option (Thanks to
Carlos Martell for reporting this issue)


* [K8SPXC-534](https://jira.percona.com/browse/K8SPXC-534): Fix a bug that caused some SQL queries to fail during
the pxc StatefulSet update (Thanks to Sergiy Prykhodko for reporting this issue)


* [K8SPXC-1016](https://jira.percona.com/browse/K8SPXC-1016): Fix a bug due to which an empty SSL secret name in
Custom Resource caused the Operator to throw a misleading error message in
the log


* [K8SPXC-994](https://jira.percona.com/browse/K8SPXC-994): Don’t use root user in MySQL Pods to perform checks
during cluster restoration, which may be helpful when restoring from
non-Kubernetes environments


* [K8SPXC-961](https://jira.percona.com/browse/K8SPXC-961): Fix a bug due to which a user-defined sidecar container
image in the Operator Pod could be treated as the initImage (Thanks to Carlos
Martell for reporting this issue)


* [K8SPXC-934](https://jira.percona.com/browse/K8SPXC-934): Fix a bug due to which the the cluster was not starting
as Operator didn’t create the users Secret if the `secretsName` option was
absent in `cr.yaml`


* [K8SPXC-926](https://jira.percona.com/browse/K8SPXC-926): Fix a bug due to which failed Smart Update for one cluster in cluster-wide made the Operator unusable for other clusters


* [K8SPXC-900](https://jira.percona.com/browse/K8SPXC-900): Fix a bug where ProxySQL could not apply new
configuration settings


* [K8SPXC-862](https://jira.percona.com/browse/K8SPXC-862): Fix a bug due to which changing resources as integer
values without quotes in Custom Resource could lead to cluster getting stuck


* [K8SPXC-858](https://jira.percona.com/browse/K8SPXC-858): Fix a bug which could cause a single-node cluster to
jump temporarily into the Error status during the upgrade


* [K8SPXC-814](https://jira.percona.com/browse/K8SPXC-814): Fix a bug when Custom Resource status was missing due
to invalid variable setting in the manifest

## Deprecation, Rename and Removal


* [K8SPXC-823](https://jira.percona.com/browse/K8SPXC-823):  Password-based authorization to Percona Monitoring
and Management Server is now deprecated and will be removed in future releases
in favor of a token-based one. Password-based authorization was used by the
Operator before this release to provide MySQL monitoring, but now using the
API Key [is the recommended authorization method](../monitoring.md#operator-monitoring-client-token)

## Supported Platforms

The following platforms were tested and are officially supported by the Operator
1.11.0:


* [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.7 - 4.10


* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.20 - 1.23


* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.20 - 1.22


* [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.23

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
