# *Percona Kubernetes Operator for Percona XtraDB Cluster* 1.6.0


* **Date**

    October 9, 2020



* **Installation**

    [Installing Percona Kubernetes Operator for Percona XtraDB Cluster](https://www.percona.com/doc/kubernetes-operator-for-pxc/index.html#quickstart-guides)


## New Features


* [K8SPXC-394](https://jira.percona.com/browse/K8SPXC-394): Support of [“cluster-wide” mode](../cluster-wide.md#install-clusterwide) for Percona XtraDB Cluster Operator


* [K8SPXC-416](https://jira.percona.com/browse/K8SPXC-416): [Support of the proxy-protocol](../haproxy-conf.md#haproxy-conf-protocol) in HAProxy (to use this feature, you should have a Percona XtraDB Cluster image version `8.0.21` or newer)


* [K8SPXC-429](https://jira.percona.com/browse/K8SPXC-429): A possibility to [restore backups to a new Kubernetes-based environment](../backups.md#backups-restore) with no existing Percona XtraDB Cluster Custom Resource


* [K8SPXC-343](https://jira.percona.com/browse/K8SPXC-343): Helm chart [officially provided with the Operator](../helm.md#install-helm)

## Improvements


* [K8SPXC-144](https://jira.percona.com/browse/K8SPXC-144): Allow [adding ProxySQL configuration options](../proxysql-conf.md#proxysql-conf-custom)


* [K8SPXC-398](https://jira.percona.com/browse/K8SPXC-398): New `crVersion key` in `deploy/cr.yaml` to indicate the API version that the Custom Resource corresponds to (thanks to user mike.saah for contribution)


* [K8SPXC-474](https://jira.percona.com/browse/K8SPXC-474): The init container now has the same resource requests as the main container of a correspondent Pod (thanks to user yann.leenhardt for contribution)


* [K8SPXC-372](https://jira.percona.com/browse/K8SPXC-372): Support new versions of cert-manager by the Operator (thanks to user rf_enigm for contribution)


* [K8SPXC-317](https://jira.percona.com/browse/K8SPXC-317): Possibility to configure the `imagePullPolicy` Operator option (thanks to user imranrazakhan for contribution)


* [K8SPXC-462](https://jira.percona.com/browse/K8SPXC-462): Add readiness probe for HAProxy


* [K8SPXC-411](https://jira.percona.com/browse/K8SPXC-411): Extend cert-manager configuration to add additional domains (multiple SAN) to a certificate


* [K8SPXC-375](https://jira.percona.com/browse/K8SPXC-375): Improve HAProxy behavior in case of switching writer node to a new one and back


* [K8SPXC-368](https://jira.percona.com/browse/K8SPXC-368): Autoupdate system users by changing the appropriate Secret name

## Known Issues and Limitations


* OpenShift 3.11 requires additional configuration for the correct HAProxy operation:
the feature gate `PodShareProcessNamespace` should be set to `true`. If
getting it enabled is not possible, we recommend using ProxySQL instead of
HAProxy with OpenShift 3.11. Other OpenShift and Kubernetes versions are not affected.


* [K8SPXC-491](https://jira.percona.com/browse/K8SPXC-491): Compressed backups are not compatible with the Operator 1.6.0
(`percona/percona-xtradb-cluster-operator:1.5.0-pxc8.0-backup` or
`percona/percona-xtradb-cluster-operator:1.5.0-pxc5.7-backup` image can be
used as a workaround if needed).

## Bugs Fixed


* [K8SPXC-431](https://jira.percona.com/browse/K8SPXC-431): HAProxy unable to start on OpenShift with the default `cr.yaml` file


* [K8SPXC-408](https://jira.percona.com/browse/K8SPXC-408): Insufficient MAX_USER_CONNECTIONS=10 for ProxySQL monitor user (increased to 100)


* [K8SPXC-391](https://jira.percona.com/browse/K8SPXC-391): HAProxy and PMM cannot be enabled at the same time (thanks to user rf_enigm for reporting this issue)


* [K8SPXC-406](https://jira.percona.com/browse/K8SPXC-406): Second node (XXX-pxc-1) always selected as a donor (thanks to user pservit for reporting this issue)


* [K8SPXC-390](https://jira.percona.com/browse/K8SPXC-390): Crash on missing HAProxy PodDisruptionBudget


* [K8SPXC-355](https://jira.percona.com/browse/K8SPXC-355): Counterintuitive YYYY-DD-MM dates in the S3 backup folder names (thanks to user graham-web for contribution)


* [K8SPXC-305](https://jira.percona.com/browse/K8SPXC-305): ProxySQL not working in case of passwords with a `%` symbol in the Secrets object (thanks to user ben.wilson for reporting this issue)


* [K8SPXC-278](https://jira.percona.com/browse/K8SPXC-278): ProxySQL never getting ready status in some environments after the cluster launch due to the `proxysql-monit` Pod crash (thanks to user lots0logs for contribution)


* [K8SPXC-274](https://jira.percona.com/browse/K8SPXC-274): The 1.2.0 -> 1.3.0 -> 1.4.0 upgrade path not working (thanks to user martin.atroo for reporting this issue)


* [K8SPXC-476](https://jira.percona.com/browse/K8SPXC-476): SmartUpdate failing to fetch version from Version Service in case of incorrectly formatted Percona XtraDB Cluster patch version higher than the last known one


* [K8SPXC-454](https://jira.percona.com/browse/K8SPXC-454): After the cluster creation, pxc-0 Pod restarting due to Operator not waiting for cert-manager to issue requested certificates (thanks to user mike.saah for reporting this issue)


* [K8SPXC-450](https://jira.percona.com/browse/K8SPXC-450): TLS annotations causing unnecessary HAProxy Pod restarts


* [K8SPXC-443](https://jira.percona.com/browse/K8SPXC-443) and [K8SPXC-456](https://jira.percona.com/browse/K8SPXC-456): The outdated version service endpoint URL (fix with preserving backward compatibility)


* [K8SPXC-435](https://jira.percona.com/browse/K8SPXC-435): MySQL root password visible through `kubectl logs`


* [K8SPXC-426](https://jira.percona.com/browse/K8SPXC-426): mysqld recovery logs not logged to file and not available through `kubectl logs`


* [K8SPXC-423](https://jira.percona.com/browse/K8SPXC-423): HAProxy not refreshing IP addresses even when the node gets a different address


* [K8SPXC-419](https://jira.percona.com/browse/K8SPXC-419): Percona XtraDB Cluster incremental state transfers not taken into account by readiness/liveness checks


* [K8SPXC-418](https://jira.percona.com/browse/K8SPXC-418): HAProxy not routing traffic for 1 donor, 2 joiners


* [K8SPXC-417](https://jira.percona.com/browse/K8SPXC-417): Cert-manager not compatible with Kubernetes versions below v1.15 due to unnecessarily high API version demand


* [K8SPXC-384](https://jira.percona.com/browse/K8SPXC-384): Debug images were not fully functional for the latest version of the Operator because of having no infinity loop


* [K8SPXC-383](https://jira.percona.com/browse/K8SPXC-383): DNS warnings in PXC Pods when using HAProxy


* [K8SPXC-364](https://jira.percona.com/browse/K8SPXC-364): Smart Updates showing empty “from” versions for non-PXC objects in logs


* [K8SPXC-379](https://jira.percona.com/browse/K8SPXC-379): The Operator user credentials not added into internal secrets when upgrading from 1.4.0 (thanks to user pservit for reporting this issue)
