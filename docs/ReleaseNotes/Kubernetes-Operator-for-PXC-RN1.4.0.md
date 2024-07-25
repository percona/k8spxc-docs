# *Percona Kubernetes Operator for Percona XtraDB Cluster* 1.4.0


* **Date**

    April 29, 2020



* **Installation**

    [Installing Percona Kubernetes Operator for Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)


## New Features


* [K8SPXC-172](https://jira.percona.com/browse/K8SPXC-172): Full data-at-rest encryption available in PXC 8.0 is now supported by the Operator. This feature is implemented with the help of the `keyring_vault` plugin which ships with PXC 8.0.  By utilizing [Vault :octicons-link-external-16:](https://www.vaultproject.io) we enable our customers to follow best practices with encryption in their environment.


* [K8SPXC-125](https://jira.percona.com/browse/K8SPXC-125): Percona XtraDB Cluster 8.0 is now supported


* [K8SPXC-95](https://jira.percona.com/browse/K8SPXC-95): Amazon Elastic Container Service for Kubernetes (EKS)
was added to the list of the officially supported platforms


* The OpenShift Container Platform 4.3 is now supported

## Improvements


* [K8SPXC-262](https://jira.percona.com/browse/K8SPXC-262): The Operator allows setting ephemeral-storage requests and limits on all Pods


* [K8SPXC-221](https://jira.percona.com/browse/K8SPXC-221): The Operator now updates observedGeneration status message to allow better monitoring of the cluster rollout or backup/restore process


* [K8SPXC-213](https://jira.percona.com/browse/K8SPXC-213): A special [PXC debug image](../debug-images.md) is now available. It avoids restarting on fail and contains additional tools useful for debugging


* [K8SPXC-100](https://jira.percona.com/browse/K8SPXC-100): The Operator now implements the crash tolerance on the one member crash. The implementation is based on starting Pods with `mysqld --wsrep_recover` command if there was no graceful shutdown

## Bugs Fixed


* [K8SPXC-153](https://jira.percona.com/browse/K8SPXC-153): S3 protocol credentials were not masked in logs during the PXC backup & restore process


* [K8SPXC-222](https://jira.percona.com/browse/K8SPXC-222): The Operator got caught in reconciliation error in case of the erroneous/absent API version in the `deploy/cr.yaml` file


* [K8SPXC-261](https://jira.percona.com/browse/K8SPXC-261): ProxySQL logs were showing the root password


* [K8SPXC-220](https://jira.percona.com/browse/K8SPXC-220): The inability to update or delete existing CRD was possible because of too large records in etcd, resulting in “request is too large” errors. Only 20 last status changes are now stored in etcd to avoid this problem.


* [K8SPXC-52](https://jira.percona.com/browse/K8SPXC-52): The Operator produced an unclear error message in case of fail caused by the absent or malformed pxc section in the `deploy/cr.yaml` file


* [K8SPXC-269](https://jira.percona.com/browse/K8SPXC-269): The `copy-backup.sh` script didn’s work correctly in case of an existing secret with the AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY credentials and prevented users from copying backups (e.g. to a local machine)


* [K8SPXC-263](https://jira.percona.com/browse/K8SPXC-263): The `kubectl get pxc` command was unable to show the correct ProxySQL external endpoint


* [K8SPXC-219](https://jira.percona.com/browse/K8SPXC-219): PXC Helm charts were incompatible with the version 3 of the Helm package manager


* [K8SPXC-40](https://jira.percona.com/browse/K8SPXC-40): The cluster was unable to reach “ready” status in case if `ProxySQL.Enabled` field was set to `false`


* [K8SPXC-34](https://jira.percona.com/browse/K8SPXC-34): Change of the `proxysql.servicetype` filed was not detected by the Operator and thus had no effect
