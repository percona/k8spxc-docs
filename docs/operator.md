# Custom Resource options reference

Percona Operator for MySQL uses [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) to manage options for the various components of the cluster.

* `PerconaXtraDBCluster` Custom Resource with Percona XtraDB Cluster options,
* `PerconaXtraDBClusterBackup` and `PerconaXtraDBClusterRestore` Custom Resources contain options for Percona XtraBackup used to backup Percona XtraDB Cluster and to restore it from backups.

## PerconaXtraDBCluster Custom Resource options

`PerconaXtraDBCluster` Custom Resource contains options for Percona XtraDB Cluster and can be configured via the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) configuration file.


The metadata part contains the following keys:

* `name` (`cluster1` by default) sets the name of your Percona
XtraDB Cluster; it should include only [URL-compatible characters](https://datatracker.ietf.org/doc/html/rfc3986#section-2.3),
not exceed 22 characters, start with an alphabetic character, and end with an
alphanumeric character;

* `finalizers.delete-pods-in-order` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which controls the proper Pods deletion order in case of the cluster deletion event (on by default).

* `finalizers.delete-pxc-pvc` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes [Persistent Volume Claims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for Percona XtraDB Cluster Pods after the cluster deletion event (off by default).

* `finalizers.delete-proxysql-pvc` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for ProxySQL Pod after the cluster deletion event (off by default).

* <a name="finalizers-delete-ssl"></a> `finalizers.delete-ssl` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes [objects, created for SSL](TLS.md) (Secret, certificate, and issuer) after the cluster deletion event (off by default).
 

The spec part of the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) contains the following sections:

| Key             | Value type        | Default | Description                                    |
| --------------- | ----------------- | ------- | ---------------------------------------------- |
| upgradeOptions  | [subdoc](#upgrade-options-section)|         | Percona XtraDB Cluster upgrade options section |
| pxc             | [subdoc](#pxc-section)            |         | Percona XtraDB Cluster general section         |
| haproxy         | [subdoc](#haproxy-section)        |         | HAProxy section                                |
| proxysql        | [subdoc](#proxysql-section)       |         | ProxySQL section                               |
| pmm             | [subdoc](#pmm-section)            |         | Percona Monitoring and Management section      |
| backup          | [subdoc](#backup-section)         |         | Percona XtraDB Cluster backups section         |
| allowUnsafeConfigurations | boolean | `false` | Prevents users from configuring a cluster with unsafe parameters such as starting the cluster with the number of Percona XtraDB Cluster instances which is less than 3, more than 5, or is an even number, with less than 2 ProxySQL or HAProxy Pods, or without TLS/SSL certificates (if `false`, unsafe parameters will be automatically changed to safe defaults)                             |
| enableCRValidationWebhook | boolean | `true`  | Enables or disables schema validation before applying `cr.yaml` file (works only in [cluster-wide mode](cluster-wide.md#install-clusterwide) due to [access restrictions](faq.md#faq-validation)) |
| pause           | boolean           | `false`                    | Pause/resume: setting it to `true` gracefully stops the cluster, and setting it to `false` after shut down starts the cluster back  |
| secretsName     | string            | `cluster1-secrets`         | A name for [users secrets](users.md#users)                             |
| crVersion       | string            | `{{ release }}`                   | Version of the Operator the Custom Resource belongs to                 |
|ignoreAnnotations| subdoc            | `iam.amazonaws.com/role`   | The list of annotations [to be ignored](annotations.md#annotations-ignore) by the Operator |
| ignoreLabels    | subdoc            | `rack`                     | The list of labels [to be ignored](annotations.md#annotations-ignore) by the Operator |
| vaultSecretName | string            | `keyring-secret-vault`     | A secret for the [HashiCorp Vault](https://www.vaultproject.io/) to carry on [Data at Rest Encryption](encryption.md#encryption)    |
| sslSecretName   | string            | `cluster1-ssl`             | A secret with TLS certificate generated for *external* communications, see [Transport Layer Security (TLS)](TLS.md#tls) for details |
| sslInternalSecretName  | string     | `cluster1-ssl-internal`    | A secret with TLS certificate generated for *internal* communications, see [Transport Layer Security (TLS)](TLS.md#tls) for details |
| logCollectorSecretName | string     | `my-log-collector-secrets` | A secret for the [Fluent Bit Log Collector](debug-logs.md#cluster-level-logging)      |
| initContainer   | [subdoc](#operator-initcontainer-section) |    | An alternative image for the initial Operator installation |
| tls             | [subdoc](#tls-extended-cert-manager-configuration-section) |                            | Extended cert-manager configuration section  |
| updateStrategy  | string            | `SmartUpdate`              | A strategy the Operator uses for [upgrades](update.md#operator-update) |


### <a name="operator-initcontainer-section"></a>initContainer configuration section

The `initContainer` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file 
allows providing an alternative image with various options for the initial Operator installation.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('initContainer.image') }} |
| **Value**       | string |
| **Example**     | `percona/percona-xtradb-cluster-operator:{{ release }}` |
| **Description** | An alternative image for the initial Operator installation |
|                 | |
| **Key**         | {{ optionlink('initContainer.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation |
|                 | |
| **Key**         | {{ optionlink('initContainer.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `600m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation |
|                 | |
| **Key**         | {{ optionlink('initContainer.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | [Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation |
|                 | |
| **Key**         | {{ optionlink('initContainer.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `1` |
| **Description** | [Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation |


### <a name="operator-issuerconf-section"></a>TLS (extended cert-manager configuration section)

The `tls` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options for additional customization of the [TLS cert-manager](TLS.md#tls-certs-certmanager).

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('tls.SANs') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | Additional domains (SAN) to be added to the TLS certificate within the extended cert-manager configuration |
|                 | |
| **Key**         | {{ optionlink('tls.issuerConf.name') }} |
| **Value**       | string |
| **Example**     | `special-selfsigned-issuer` |
| **Description** | A [cert-manager issuer name](https://cert-manager.io/docs/concepts/issuer/) |
|                 | |
| **Key**         | {{ optionlink('tls.issuerConf.kind') }} |
| **Value**       | string |
| **Example**     | `ClusterIssuer` |
| **Description** | A [cert-manager issuer type](https://cert-manager.io/docs/configuration/) |
|                 | |
| **Key**         | {{ optionlink('tls.issuerConf.group') }} |
| **Value**       | string |
| **Example**     | `cert-manager.io` |
| **Description** | A [cert-manager issuer group](https://cert-manager.io/docs/configuration/). Should be `cert-manager.io` for built-in cert-manager certificate issuers |

### <a name="operator-upgradeoptions-section"></a>Upgrade options section

The `upgradeOptions` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options to control Percona XtraDB Cluster upgrades.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('upgradeOptions.versionServiceEndpoint') }} |
| **Value**       | string |
| **Example**     | `https://check.percona.com` |
| **Description** | The Version Service URL used to check versions compatibility for upgrade |
|                 | |
| **Key**         | {{ optionlink('upgradeOptions.apply') }} |
| **Value**       | string |
| **Example**     | `Disabled` |
| **Description** | Specifies how [updates are processed](update.md#operator-update-smartupdates) by the Operator. `Never` or `Disabled` will completely disable automatic upgrades, otherwise it can be set to `Latest` or `Recommended` or to a specific version string of Percona XtraDB Cluster (e.g. `8.0.19-10.1`) that is wished to be version-locked (so that the user can control the version running, but use automatic upgrades to move between them) |
|                 | |
| **Key**         | {{ optionlink('upgradeOptions.schedule') }} |
| **Value**       | string |
| **Example**     | `0 2 \* \* \*` |
| **Description** | Scheduled time to check for updates, specified in the [crontab format](https://en.wikipedia.org/wiki/Cron) |

### <a name="operator-pxc-section"></a>PXC section

The `pxc` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains general
configuration options for the Percona XtraDB Cluster.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('pxc.size') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | The size of the Percona XtraDB cluster must be 3 or 5 for [High Availability](https://www.percona.com/doc/percona-xtradb-cluster/5.7/intro.html). other values are allowed if the `spec.allowUnsafeConfigurations` key is set to true |
|                 | |
| **Key**         | {{ optionlink('pxc.image') }} |
| **Value**       | string |
| **Example**     | `percona/percona-xtradb-cluster:{{ pxc80recommended }}` |
| **Description** | The Docker image of the Percona cluster used (actual image names for Percona XtraDB Cluster 8.0 and Percona XtraDB Cluster 5.7 can be found [in the list of certified images](images.md#custom-registry-images)) |
|                 | |
| **Key**         | {{ optionlink('pxc.autoRecovery') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Turns [Automatic Crash Recovery](recovery.md#recovery-auto) on or off |
|                 | |
| **Key**         | {{ optionlink('pxc.expose.enabled') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Enable or disable exposing Percona XtraDB Cluster nodes with dedicated IP addresses |
|                 | |
| **Key**         | {{ optionlink('pxc.expose.type') }} |
| **Value**       | string |
| **Example**     | `LoadBalancer` |
| **Description** | The [Kubernetes Service Type](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) used for xposure |
|                 | |
| **Key**         | {{ optionlink('pxc.expose.trafficPolicy') }} |
| **Value**       | string |
| **Example**     | `Local` |
| **Description** | Specifies whether Service should [route external traffic to cluster-wide or node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness) |
|                 | |
| **Key**         | {{ optionlink('pxc.expose.loadBalancerSourceRanges') }} |
| **Value**       | string |
| **Example**     | `10.0.0.0/8` |
| **Description** | The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) |
|                 | |
| **Key**         | {{ optionlink('pxc.expose.annotations') }} |
| **Value**       | string |
| **Example**     | `networking.gke.io/load-balancer-type: "Internal"` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.name') }} |
| **Value**       | string |
| **Example**     | `pxc1_to_pxc2` |
| **Description** | Name of the replication channel for [cross-site replication](replication.md#operator-replication) |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.isSource') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Should the cluster act as Source (`true`) or Replica (`false`)
in [cross-site replication](replication.md#operator-replication) |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.configuration.sourceRetryCount') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | Number of retries Replica should do when the existing connection source fails |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.configuration.sourceConnectRetry') }} |
| **Value**       | int |
| **Example**     | `60` |
| **Description** | The interval between reconnection attempts in seconds to be used by Replica when the the existing connection source fails |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.configuration.ssl') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Turns SSL for [replication channels](replication.md) on or off |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.configuration.sslSkipVerify') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Turns the host name identity verification for SSL-based [replication](replication.md) on or off |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.configuration.ca') }} |
| **Value**       | string |
| **Example**     | `/etc/mysql/ssl/ca.crt` |
| **Description** | The path name of the Certificate Authority (CA) certificate file to be used if the SSL for [replication channels](replication.md) is turned on |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.sourcesList.host') }} |
| **Value**       | string |
| **Example**     | `10.95.251.101` |
| **Description** | For the [cross-site replication](replication.md#operator-replication) Replica cluster, this key should contain the hostname or IP address of the Source cluster |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.sourcesList.port') }} |
| **Value**       | int |
| **Example**     | `3306` |
| **Description** | For the [cross-site replication](replication.md#operator-replication) Replica cluster, this key should contain the Source port number |
|                 | |
| **Key**         | {{ optionlink('pxc.replicationChannels.sourcesList.weight') }} |
| **Value**       | int |
| **Example**     | `100` |
| **Description** | For the [cross-site replication](replication.md#operator-replication) Replica cluster, this key should contain the Source cluster weight (varies from `1` to `100`, the cluster with the higher number will be selected as the replication source first) |
|                 | |
| **Key**         | {{ optionlink('pxc.readinessDelaySec') }} |
| **Value**       | int |
| **Example**     | `15` |
| **Description** | Adds a delay before a run check to verify the application is ready to process traffic |
|                 | |
| **Key**         | {{ optionlink('pxc.livenessDelaySec') }} |
| **Value**       | int |
| **Example**     | `300` |
| **Description** | Adds a delay before the run check ensures the application is healthy and capable of processing requests |
|                 | |
| **Key**         | {{ optionlink('pxc.configuration') }} |
| **Value**       | string |
| **Example**     | <pre>&#124;<br>[mysqld]<br>wsrep_debug=ON<br>wsrep-provider_options=gcache.size=1G;gcache.recover=yes</pre> |
| **Description** | The `my.cnf` file options to be passed to Percona XtraDB cluster nodes |
|                 | |
| **Key**         | {{ optionlink('pxc.imagePullSecrets.name') }} |
| **Value**       | string |
| **Example**     | `private-registry-credentials` |
| **Description** | The [Kubernetes ImagePullSecret](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) |
|                 | |
| **Key**         | {{ optionlink('pxc.priorityClassName') }} |
| **Value**       | string |
| **Example**     | `high-priority` |
| **Description** | The [Kubernetes Pod priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) |
|                 | |
| **Key**         | {{ optionlink('pxc.schedulerName') }} |
| **Value**       | string |
| **Example**     | `mycustom-scheduler` |
| **Description** | The [Kubernetes Scheduler](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers) |
|                 | |
| **Key**         | {{ optionlink('pxc.annotations') }} |
| **Value**       | label |
| **Example**     | `iam.amazonaws.com/role: role-arn` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) |
|                 | |
| **Key**         | {{ optionlink('pxc.labels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-22` |
| **Description** | [Labels are key-value pairs attached to objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) |
|                 | |
| **Key**         | {{ optionlink('pxc.readinessProbes.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `15` |
| **Description** | Number of seconds to wait before performing the first [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
|                 | |
| **Key**         | {{ optionlink('pxc.readinessProbes.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `15` |
| **Description** | Number of seconds after which the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out |
|                 | |
| **Key**         | {{ optionlink('pxc.readinessProbes.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `30` |
| **Description** | How often (in seconds) to perform the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
|                 | |
| **Key**         | {{ optionlink('pxc.readinessProbes.successThreshold') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | Minimum consecutive successes for the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed |
|                 | |
| **Key**         | {{ optionlink('pxc.readinessProbes.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `5` |
| **Description** | When the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before marking the Pod Unready |
|                 | |
| **Key**         | {{ optionlink('pxc.livenessProbes.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `300` |
| **Description** | Number of seconds to wait before performing the first [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
|                 | |
| **Key**         | {{ optionlink('pxc.livenessProbes.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `5` |
| **Description** | Number of seconds after which the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out |
|                 | |
| **Key**         | {{ optionlink('pxc.livenessProbes.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `10` |
| **Description** | How often (in seconds) to perform the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
|                 | |
| **Key**         | {{ optionlink('pxc.livenessProbes.successThreshold') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | Minimum consecutive successes for the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed |
|                 | |
| **Key**         | {{ optionlink('pxc.livenessProbes.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | When the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before restarting the container |
|                 | |
| **Key**         | {{ optionlink('pxc.envVarsSecret') }} |
| **Value**       | string |
| **Example**     | `my-env-var-secrets` |
| **Description** | A secret with environment variables, see [Define environment variables](containers-conf.md#faq-env) for details |
|                 | |
| **Key**         | {{ optionlink('pxc.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container |
|                 | |
| **Key**         | {{ optionlink('pxc.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `600m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container |
|                 | |
| **Key**         | {{ optionlink('pxc.resources.requests.ephemeral-storage') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | Kubernetes [Ephemeral Storage](https://kubernetes.io/docs/concepts/storage/ephemeral-volumes/) [requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container |
|                 | |
| **Key**         | {{ optionlink('pxc.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | [Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container |
|                 | |
| **Key**         | {{ optionlink('pxc.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `1` |
| **Description** | [Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container |
|                 | |
| **Key**         | {{ optionlink('pxc.resources.limits.ephemeral-storage') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | Kubernetes [Ephemeral Storage](https://kubernetes.io/docs/concepts/storage/ephemeral-volumes/) [limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container |
|                 | |
| **Key**         | {{ optionlink('pxc.nodeSelector') }} |
| **Value**       | label |
| **Example**     | `disktype: ssd` |
| **Description** | [Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) |
|                 | |
| **Key**         | {{ optionlink('pxc.affinity.topologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The Operator [topology key](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) node anti-affinity constraint |
|                 | |
| **Key**         | {{ optionlink('pxc.affinity.advanced') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | In cases where the Pods require complex tuning the advanced option turns off the `topologyKey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used |
|                 | |
| **Key**         | {{ optionlink('pxc.tolerations') }} |
| **Value**       | subdoc |
| **Example**     | `node.alpha.kubernetes.io/unreachable` |
| **Description** | [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) |
|                 | |
| **Key**         | {{ optionlink('pxc.podDisruptionBudget.maxUnavailable') }} | |
| **Example**     | `1` |
| **Description** | The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) specifies the number of Pods from the set unavailable after the eviction |
|                 | |
| **Key**         | {{ optionlink('pxc.podDisruptionBudget.minAvailable') }} |
| **Value**       | int |
| **Example**     | `0` |
| **Description** | The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) Pods that must be available after an eviction |
|                 | |
| **Key**         | {{ optionlink('pxc.volumeSpec.emptyDir') }} |
| **Value**       | string |
| **Example**     | `{}` |
| **Description** | The [Kubernetes emptyDir volume](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) The directory created on a node and accessible to the Percona XtraDB Cluster Pod containers |
|                 | |
| **Key**         | {{ optionlink('pxc.volumeSpec.hostPath.path') }} |
| **Value**       | string |
| **Example**     | `/data` |
| **Description** | [Kubernetes hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) The volume that mounts a directory from the host node’s filesystem into your Pod. The path property is required |
|                 | |
| **Key**         | {{ optionlink('pxc.volumeSpec.hostPath.type') }} |
| **Value**       | string |
| **Example**     | `Directory` |
| **Description** | The [Kubernetes hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath). An optional property for the hostPath |
|                 | |
| **Key**         | {{ optionlink('pxc.volumeSpec.persistentVolumeClaim.storageClassName') }} |
| **Value**       | string |
| **Example**     | `standard` |
| **Description** | Set the [Kubernetes storage class](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Percona XtraDB Cluster [PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) |
|                 | |
| **Key**         | {{ optionlink('pxc.volumeSpec.persistentVolumeClaim.accessModes') }} |
| **Value**       | array |
| **Example**     | `[ReadWriteOnce]` |
| **Description** | The [Kubernetes PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) access modes for the Percona XtraDB cluster |
|                 | |
| **Key**         | {{ optionlink('pxc.volumeSpec.resources.requests.storage') }} |
| **Value**       | string |
| **Example**     | `6Gi` |
| **Description** | The [Kubernetes PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) size for the Percona XtraDB cluster |
|                 | |
| **Key**         | {{ optionlink('pxc.gracePeriod') }} |
| **Value**       | int |
| **Example**     | `600` |
| **Description** | The [Kubernetes grace period when terminating a Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods) |
|                 | |
| **Key**         | {{ optionlink('pxc.containerSecurityContext') }} |
| **Value**       | subdoc |
| **Example**     | `privileged: true` |
| **Description** | A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one |
|                 | |
| **Key**         | {{ optionlink('pxc.podSecurityContext') }} |
| **Value**       | subdoc |
| **Example**     | <pre>fsGroup: 1001<br>supplementalGroups: [1001, 1002, 1003]</pre> |
| **Description** | A custom [Kubernetes Security Context for a Pod](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one |
|                 | |
| **Key**         | {{ optionlink('pxc.serviceAccountName') }} |
| **Value**       | string |
| **Example**     | `percona-xtradb-cluster-operator-workload` |
| **Description** | The [Kubernetes Service Account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for Percona XtraDB Cluster Pods |
|                 | |
| **Key**         | {{ optionlink('pxc.imagePullPolicy') }} |
| **Value**       | string |
| **Example**     | `Always` |
| **Description** | The [policy used to update images](https://kubernetes.io/docs/concepts/containers/images/#updating-images) |
|                 | |
| **Key**         | {{ optionlink('pxc.runtimeClassName') }} |
| **Value**       | string |
| **Example**     | `image-rc` |
| **Description** | Name of the [Kubernetes Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/) for Percona XtraDB Cluster Pods |
|                 | |
| **Key**         | {{ optionlink('pxc.sidecars.image') }} |
| **Value**       | string |
| **Example**     | `busybox` |
| **Description** | Image for the [custom sidecar container](faq.md#faq-sidecar) for Percona XtraDB Cluster Pods |
|                 | |
| **Key**         | {{ optionlink('pxc.sidecars.command') }} |
| **Value**       | array |
| **Example**     | `["/bin/sh"]` |
| **Description** | Command for the [custom sidecar container](faq.md#faq-sidecar) for Percona XtraDB Cluster Pods |
|                 | |
| **Key**         | {{ optionlink('pxc.sidecars.args') }} |
| **Value**       | array |
| **Example**     | `["-c", "while true; do trap 'exit 0' SIGINT SIGTERM SIGQUIT SIGKILL; done;"]` |
| **Description** | Command arguments for the [custom sidecar container](faq.md#faq-sidecar) for Percona XtraDB Cluster Pods |
|                 | |
| **Key**         | {{ optionlink('pxc.sidecars.name') }} |
| **Value**       | string |
| **Example**     | `my-sidecar-1` |
| **Description** | Name of the [custom sidecar container](faq.md#faq-sidecar) for Percona XtraDB Cluster Pods |
|                 | |
| **Key**         | {{ optionlink('pxc.sidecars.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container |
|                 | |
| **Key**         | {{ optionlink('pxc.sidecars.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `500m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container |
|                 | |
| **Key**         | {{ optionlink('pxc.sidecars.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `2G` |
| **Description** | [Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container |
|                 | |
| **Key**         | {{ optionlink('pxc.sidecars.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `600m` |
| **Description** | [Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container |

### <a name="operator-haproxy-section"></a>HAProxy section

The `haproxy` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains
configuration options for the HAProxy service.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('haproxy.enabled') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Enables or disables [load balancing with HAProxy](https://www.percona.com/doc/percona-xtradb-cluster/8.0/howtos/haproxy.html) [Services](https://kubernetes.io/docs/concepts/services-networking/service/) |
|                 | |
| **Key**         | {{ optionlink('haproxy.size') }} |
| **Value**       | int |
| **Example**     | `2` |
| **Description** | The number of the HAProxy Pods [to provide load balancing](https://www.percona.com/doc/percona-xtradb-cluster/8.0/howtos/haproxy.html). It should be 2 or more unless the `spec.allowUnsafeConfigurations` key is set to true |
|                 | |
| **Key**         | {{ optionlink('haproxy.image') }} |
| **Value**       | string |
| **Example**     | `percona/percona-xtradb-cluster-operator:{{ release }}-haproxy` |
| **Description** | HAProxy Docker image to use |
|                 | |
| **Key**         | {{ optionlink('haproxy.imagePullPolicy') }} |
| **Value**       | string |
| **Example**     | `Always` |
| **Description** | The [policy used to update images](https://kubernetes.io/docs/concepts/containers/images/#updating-images) |
|                 | |
| **Key**         | {{ optionlink('haproxy.imagePullSecrets.name') }} |
| **Value**       | string |
| **Example**     | `private-registry-credentials` |
| **Description** | The [Kubernetes imagePullSecrets](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for the HAProxy image |
|                 | |
| **Key**         | {{ optionlink('haproxy.readinessDelaySec') }} |
| **Value**       | int |
| **Example**     | `15` |
| **Description** | Adds a delay before a run check to verify the application is ready to process traffic |
|                 | |
| **Key**         | {{ optionlink('haproxy.livenessDelaySec') }} |
| **Value**       | int |
| **Example**     | `300` |
| **Description** | Adds a delay before the run check ensures the application is healthy and capable of processing requests |
|                 | |
| **Key**         | {{ optionlink('haproxy.configuration') }} |
| **Value**       | string |
| **Example**     | |
| **Description** | The [custom HAProxy configuration file](haproxy-conf.md#haproxy-conf-custom) contents |
|                 | |
| **Key**         | {{ optionlink('haproxy.annotations') }} |
| **Value**       | label |
| **Example**     | `iam.amazonaws.com/role: role-arn` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata |
|                 | |
| **Key**         | {{ optionlink('haproxy.labels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-22` |
| **Description** | [Labels are key-value pairs attached to objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) |
|                 | |
| **Key**         | {{ optionlink('haproxy.readinessProbes.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `15` |
| **Description** | Number of seconds to wait before performing the first [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
|                 | |
| **Key**         | {{ optionlink('haproxy.readinessProbes.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | Number of seconds after which the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out |
|                 | |
| **Key**         | {{ optionlink('haproxy.readinessProbes.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `5` |
| **Description** | How often (in seconds) to perform the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
|                 | |
| **Key**         | {{ optionlink('haproxy.readinessProbes.successThreshold') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | Minimum consecutive successes for the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed |
|                 | |
| **Key**         | {{ optionlink('haproxy.readinessProbes.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | When the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before marking the Pod Unready |
|                 | |
| **Key**         | {{ optionlink('haproxy.livenessProbes.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `60` |
| **Description** | Number of seconds to wait before performing the first [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
|                 | |
| **Key**         | {{ optionlink('haproxy.livenessProbes.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `5` |
| **Description** | Number of seconds after which the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out |
|                 | |
| **Key**         | {{ optionlink('haproxy.livenessProbes.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `30` |
| **Description** | How often (in seconds) to perform the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
|                 | |
| **Key**         | {{ optionlink('haproxy.livenessProbes.successThreshold') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | Minimum consecutive successes for the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed |
|                 | |
| **Key**         | {{ optionlink('haproxy.readinessProbes.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `4` |
| **Description** | When the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before marking the Pod Unready |
|                 | |
| **Key**         | {{ optionlink('haproxy.serviceType') }} |
| **Value**       | string |
| **Example**     | `ClusterIP` |
| **Description** | Specifies the type of [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used for HAProxy |
|                 | |
| **Key**         | {{ optionlink('haproxy.externalTrafficPolicy') }} |
| **Value**       | string |
| **Example**     | `Cluster` |
| **Description** | Specifies whether Service for HAProxy should [route external traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness) |
|                 | |
| **Key**         | {{ optionlink('haproxy.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container |
|                 | |
| **Key**         | {{ optionlink('haproxy.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `600m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container |
|                 | |
| **Key**         | {{ optionlink('haproxy.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | [Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container |
|                 | |
| **Key**         | {{ optionlink('haproxy.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `700m` |
| **Description** | [Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container |
|                 | |
| **Key**         | {{ optionlink('haproxy.envVarsSecret') }} |
| **Value**       | string |
| **Example**     | `my-env-var-secrets` |
| **Description** | A secret with environment variables, see [Define environment variables](containers-conf.md#faq-env) for details |
|                 | |
| **Key**         | {{ optionlink('haproxy.priorityClassName') }} |
| **Value**       | string |
| **Example**     | `high-priority` |
| **Description** | The [Kubernetes Pod Priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for HAProxy |
|                 | |
| **Key**         | {{ optionlink('haproxy.schedulerName') }} |
| **Value**       | string |
| **Example**     | `mycustom-scheduler` |
| **Description** | The [Kubernetes Scheduler](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers) |
|                 | |
| **Key**         | {{ optionlink('haproxy.nodeSelector') }} |
| **Value**       | label |
| **Example**     | `disktype: ssd` |
| **Description** | [Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) |
|                 | |
| **Key**         | {{ optionlink('haproxy.affinity.topologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The Operator [topology key](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) node anti-affinity constraint |
|                 | |
| **Key**         | {{ optionlink('haproxy.affinity.advanced') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | If available it makes a [topologyKey](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint to be ignored |
|                 | |
| **Key**         | {{ optionlink('haproxy.tolerations') }} |
| **Value**       | subdoc |
| **Example**     | `node.alpha.kubernetes.io/unreachable` |
| **Description** | [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) |
|                 | |
| **Key**         | {{ optionlink('haproxy.podDisruptionBudget.maxUnavailable') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) specifies the number of Pods from the set unavailable after the eviction |
|                 | |
| **Key**         | {{ optionlink('haproxy.podDisruptionBudget.minAvailable') }} |
| **Value**       | int |
| **Example**     | `0` |
| **Description** | The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) Pods that must be available after an eviction |
|                 | |
| **Key**         | {{ optionlink('haproxy.gracePeriod') }} |
| **Value**       | int |
| **Example**     | `30` |
| **Description** | The [Kubernetes grace period when terminating a Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods) |
|                 | |
| **Key**         | {{ optionlink('haproxy.loadBalancerSourceRanges') }} |
| **Value**       | string |
| **Example**     | `10.0.0.0/8` |
| **Description** | The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) |
|                 | |
| **Key**         | {{ optionlink('haproxy.loadBalancerIP') }} |
| **Value**       | string |
| **Example**     | `127.0.0.1` |
| **Description** | The static IP-address for the load balancer |
|                 | |
| **Key**         | {{ optionlink('haproxy.serviceLabels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-23` |
| **Description** | The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service |
|                 | |
| **Key**         | {{ optionlink('haproxy.serviceAnnotations') }} |
| **Value**       | string |
| **Example**     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service |
|                 | |
| **Key**         | {{ optionlink('haproxy.replicasServiceEnabled') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Enables or disables `haproxy-replicas` Service. This Service (on by default) forwards requests to all Percona XtraDB Cluster instances, and it **should not be used for write requests**! |
|                 | |
| **Key**         | {{ optionlink('haproxy.replicasLoadBalancerSourceRanges') }} |
| **Value**       | string |
| **Example**     | `10.0.0.0/8` |
| **Description** | The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) |
|                 | |
| **Key**         | {{ optionlink('haproxy.replicasLoadBalancerIP') }} |
| **Value**       | string |
| **Example**     | `127.0.0.1` |
| **Description** | The static IP-address for the replicas load balancer |
|                 | |
| **Key**         | {{ optionlink('haproxy.replicasServiceType') }} |
| **Value**       | string |
| **Example**     | `ClusterIP` |
| **Description** | Specifies the type of [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used for HAProxy replicas |
|                 | |
| **Key**         | {{ optionlink('haproxy.replicasExternalTrafficPolicy') }} |
| **Value**       | string |
| **Example**     | `Cluster` |
| **Description** | Specifies whether Service for HAProxy replicas should [route external traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness) |
|                 | |
| **Key**         | {{ optionlink('haproxy.replicasServiceLabels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-23` |
| **Description** | The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the `haproxy-replicas` Service |
|                 | |
| **Key**         | {{ optionlink('haproxy.replicasServiceAnnotations') }} |
| **Value**       | string |
| **Example**     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the `haproxy-replicas` Service |
|                 | |
| **Key**         | {{ optionlink('haproxy.containerSecurityContext') }} |
| **Value**       | subdoc |
| **Example**     | `privileged: true` |
| **Description** | A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one |
|                 | |
| **Key**         | {{ optionlink('haproxy.podSecurityContext') }} |
| **Value**       | subdoc |
| **Example**     | <pre>fsGroup: 1001<br>supplementalGroups: [1001, 1002, 1003]</pre> |
| **Description** | A custom [Kubernetes Security Context for a Pod](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one |
|                 | |
| **Key**         | {{ optionlink('haproxy.serviceAccountName') }} |
| **Value**       | string |
| **Example**     | `percona-xtradb-cluster-operator-workload` |
| **Description** | The [Kubernetes Service Account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for the HAProxy Pod |
|                 | |
| **Key**         | {{ optionlink('haproxy.runtimeClassName') }} |
| **Value**       | string |
| **Example**     | `image-rc` |
| **Description** | Name of the [Kubernetes Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/) for the HAProxy Pod |
|                 | |
| **Key**         | {{ optionlink('haproxy.sidecars.image') }} |
| **Value**       | string |
| **Example**     | `busybox` |
| **Description** | Image for the [custom sidecar container](faq.md#faq-sidecar) for the HAProxy Pod |
|                 | |
| **Key**         | {{ optionlink('haproxy.sidecars.command') }} |
| **Value**       | array |
| **Example**     | `["/bin/sh"]` |
| **Description** | Command for the [custom sidecar container](faq.md#faq-sidecar) for the HAProxy Pod |
|                 | |
| **Key**         | {{ optionlink('haproxy.sidecars.args') }} |
| **Value**       | array |
| **Example**     | `["-c", "while true; do trap 'exit 0' SIGINT SIGTERM SIGQUIT SIGKILL; done;"]` |
| **Description** | Command arguments for the [custom sidecar container](faq.md#faq-sidecar) for the HAProxy Pod |
|                 | |
| **Key**         | {{ optionlink('haproxy.sidecars.name') }} |
| **Value**       | string |
| **Example**     | `my-sidecar-1` |
| **Description** | Name of the [custom sidecar container](faq.md#faq-sidecar) for the HAProxy Pod |
|                 | |
| **Key**         | {{ optionlink('haproxy.sidecars.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar HAProxy containers |
|                 | |
| **Key**         | {{ optionlink('haproxy.sidecars.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `500m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar HAProxy containers |
|                 | |
| **Key**         | {{ optionlink('haproxy.sidecars.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `2G` |
| **Description** | [Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar HAProxy containers |
|                 | |
| **Key**         | {{ optionlink('haproxy.sidecars.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `600m` |
| **Description** | [Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar HAProxy containers |

### <a name="operator-proxysql-section"></a>ProxySQL section

The `proxysql` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains
configuration options for the ProxySQL daemon.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('proxysql.enabled') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Enables or disables [load balancing with ProxySQL](https://www.percona.com/doc/percona-xtradb-cluster/5.7/howtos/proxysql.html) [Services](https://kubernetes.io/docs/concepts/services-networking/service/) **ProxySQL can be enabled only at cluster creation time**; otherwise you will be limited to HAProxy load balancing |
|                 | |
| **Key**         | {{ optionlink('proxysql.size') }} |
| **Value**       | int |
| **Example**     | `2` |
| **Description** | The number of the ProxySQL daemons [to provide load balancing](https://www.percona.com/doc/percona-xtradb-cluster/5.7/howtos/proxysql.html). It should be 2 or more unless the `spec.allowUnsafeConfigurations` key is set to true|
|                 | |
| **Key**         | {{ optionlink('proxysql.image') }} |
| **Value**       | string |
| **Example**     | `percona/percona-xtradb-cluster-operator:{{ release }}-proxysql` |
| **Description** | ProxySQL Docker image to use |
|                 | |
| **Key**         | {{ optionlink('proxysql.imagePullPolicy') }} |
| **Value**       | string |
| **Example**     | `Always` |
| **Description** | The [policy used to update images](https://kubernetes.io/docs/concepts/containers/images/#updating-images) |
|                 | |
| **Key**         | {{ optionlink('proxysql.imagePullSecrets.name') }} |
| **Value**       | string |
| **Example**     | `private-registry-credentials` |
| **Description** | The [Kubernetes imagePullSecrets](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for the ProxySQL image |
|                 | |
| **Key**         | {{ optionlink('proxysql.readinessDelaySec') }} |
| **Value**       | int |
| **Example**     | `15` |
| **Description** | Adds a delay before a run check to verify the application is ready to process traffic |
|                 | |
| **Key**         | {{ optionlink('proxysql.livenessDelaySec') }} |
| **Value**       | int |
| **Example**     | `300` |
| **Description** | Adds a delay before the run check ensures the application is healthy and capable of processing requests |
|                 | |
| **Key**         | {{ optionlink('proxysql.configuration') }} |
| **Value**       | string |
| **Example**     | |
| **Description** | The [custom ProxySQL configuration file](proxysql-conf.md#proxysql-conf-custom) contents |
|                 | |
| **Key**         | {{ optionlink('proxysql.annotations') }} |
| **Value**       | label |
| **Example**     | `iam.amazonaws.com/role: role-arn` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata |
|                 | |
| **Key**         | {{ optionlink('proxysql.labels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-22` |
| **Description** | [Labels are key-value pairs attached to objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) |
|                 | |
| **Key**         | {{ optionlink('proxysql.serviceType') }} |
| **Value**       | string |
| **Example**     | `ClusterIP` |
| **Description** | Specifies the type of [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used |
|                 | |
| **Key**         | {{ optionlink('proxysql.externalTrafficPolicy') }} |
| **Value**       | string |
| **Example**     | `Cluster` |
| **Description** | Specifies whether Service should [route external traffic to cluster-wide or node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness) |
|                 | |
| **Key**         | {{ optionlink('proxysql.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container |
|                 | |
| **Key**         | {{ optionlink('proxysql.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `600m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container |
|                 | |
| **Key**         | {{ optionlink('proxysql.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | [Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container |
|                 | |
| **Key**         | {{ optionlink('proxysql.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `700m` |
| **Description** | [Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container |
|                 | |
| **Key**         | {{ optionlink('proxysql.envVarsSecret') }} |
| **Value**       | string |
| **Example**     | `my-env-var-secrets` |
| **Description** | A secret with environment variables, see [Define environment variables](containers-conf.md#faq-env) for details |
|                 | |
| **Key**         | {{ optionlink('proxysql.priorityClassName') }} |
| **Value**       | string |
| **Example**     | `high-priority` |
| **Description** | The [Kubernetes Pod Priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for ProxySQL |
|                 | |
| **Key**         | {{ optionlink('proxysql.schedulerName') }} |
| **Value**       | string |
| **Example**     | `mycustom-scheduler` |
| **Description** | The [Kubernetes Scheduler](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers) |
|                 | |
| **Key**         | {{ optionlink('proxysql.nodeSelector') }} |
| **Value**       | label |
| **Example**     | `disktype: ssd` |
| **Description** | [Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) |
|                 | |
| **Key**         | {{ optionlink('proxysql.affinity.topologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The Operator [topology key](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) node anti-affinity constraint |
|                 | |
| **Key**         | {{ optionlink('proxysql.affinity.advanced') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | If available it makes a [topologyKey](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint to be ignored |
|                 | |
| **Key**         | {{ optionlink('proxysql.tolerations') }} |
| **Value**       | subdoc |
| **Example**     | `node.alpha.kubernetes.io/unreachable` |
| **Description** | [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) |
|                 | |
| **Key**         | {{ optionlink('proxysql.volumeSpec.emptyDir') }} |
| **Value**       | string |
| **Example**     | `{}` |
| **Description** | The [Kubernetes emptyDir volume](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) The directory created on a node and accessible to the Percona XtraDB Cluster Pod containers |
|                 | |
| **Key**         | {{ optionlink('proxysql.volumeSpec.hostPath.path') }} |
| **Value**       | string |
| **Example**     | `/data` |
| **Description** | [Kubernetes hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) The volume that mounts a directory from the host node’s filesystem into your Pod. The path property is required |
|                 | |
| **Key**         | {{ optionlink('proxysql.volumeSpec.hostPath.type') }} |
| **Value**       | string |
| **Example**     | `Directory` |
| **Description** | The [Kubernetes hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath). An optional property for the hostPath |
|                 | |
| **Key**         | {{ optionlink('proxysql.volumeSpec.persistentVolumeClaim.storageClassName') }} |
| **Value**       | string |
| **Example**     | `standard` |
| **Description** | Set the [Kubernetes storage class](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Percona XtraDB Cluster [PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) |
|                 | |
| **Key**         | {{ optionlink('proxysql.volumeSpec.persistentVolumeClaim.accessModes') }} |
| **Value**       | array |
| **Example**     | `[ReadWriteOnce]` |
| **Description** | The [Kubernetes PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) access modes for the Percona XtraDB cluster |
|                 | |
| **Key**         | {{ optionlink('proxysql.volumeSpec.resources.requests.storage') }} |
| **Value**       | string |
| **Example**     | `6Gi` |
| **Description** | The [Kubernetes PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) size for the Percona XtraDB cluster |
|                 | |
| **Key**         | {{ optionlink('proxysql.podDisruptionBudget.maxUnavailable') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) specifies the number of Pods from the set unavailable after the eviction |
|                 | |
| **Key**         | {{ optionlink('proxysql.podDisruptionBudget.minAvailable') }} |
| **Value**       | int |
| **Example**     | `0` |
| **Description** | The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) Pods that must be available after an eviction |
|                 | |
| **Key**         | {{ optionlink('proxysql.gracePeriod') }} |
| **Value**       | int |
| **Example**     | `30` |
| **Description** | The [Kubernetes grace period when terminating a Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods) |
|                 | |
| **Key**         | {{ optionlink('proxysql.loadBalancerSourceRanges') }} |
| **Value**       | string |
| **Example**     | `10.0.0.0/8` |
| **Description** | The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) |
|                 | |
| **Key**         | {{ optionlink('proxysql.serviceLabels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-23` |
| **Description** | The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service |
|                 | |
| **Key**         | {{ optionlink('proxysql.serviceAnnotations') }} |
| **Value**       | string |
| **Example**     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service |
|                 | |
| **Key**         | {{ optionlink('proxysql.containerSecurityContext') }} |
| **Value**       | subdoc |
| **Example**     | `privileged: true` |
| **Description** | A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one |
|                 | |
| **Key**         | {{ optionlink('proxysql.podSecurityContext') }} |
| **Value**       | subdoc |
| **Example**     | <pre>fsGroup: 1001<br>supplementalGroups: [1001, 1002, 1003]</pre> |
| **Description** | A custom [Kubernetes Security Context for a Pod](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one |
|                 | |
| **Key**         | {{ optionlink('proxysql.serviceAccountName') }} |
| **Value**       | string |
| **Example**     | `percona-xtradb-cluster-operator-workload` |
| **Description** | The [Kubernetes Service Account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for the ProxySQL Pod |
|                 | |
| **Key**         | {{ optionlink('proxysql.runtimeClassName') }} |
| **Value**       | string |
| **Example**     | `image-rc` |
| **Description** | Name of the [Kubernetes Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/) for the ProxySQL Pod |
|                 | |
| **Key**         | {{ optionlink('proxysql.sidecars.image') }} |
| **Value**       | string |
| **Example**     | `busybox` |
| **Description** | Image for the [custom sidecar container](faq.md#faq-sidecar) for the ProxySQL Pod |
|                 | |
| **Key**         | {{ optionlink('proxysql.sidecars.command') }} |
| **Value**       | array |
| **Example**     | `["/bin/sh"]` |
| **Description** | Command for the [custom sidecar container](faq.md#faq-sidecar) for the ProxySQL Pod |
|                 | |
| **Key**         | {{ optionlink('proxysql.sidecars.args') }} |
| **Value**       | array |
| **Example**     | `["-c", "while true; do trap 'exit 0' SIGINT SIGTERM SIGQUIT SIGKILL; done;"]` |
| **Description** | Command arguments for the [custom sidecar container](faq.md#faq-sidecar) for the ProxySQL Pod |
|                 | |
| **Key**         | {{ optionlink('proxysql.sidecars.name') }} |
| **Value**       | string |
| **Example**     | `my-sidecar-1` |
| **Description** | Name of the [custom sidecar container](faq.md#faq-sidecar) for the ProxySQL Pod |
|                 | |
| **Key**         | {{ optionlink('proxysql.sidecars.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar ProxySQL containers |
|                 | |
| **Key**         | {{ optionlink('proxysql.sidecars.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `500m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar ProxySQL containers |
|                 | |
| **Key**         | {{ optionlink('proxysql.sidecars.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `2G` |
| **Description** | [Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar ProxySQL containers |
|                 | |
| **Key**         | {{ optionlink('proxysql.sidecars.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `600m` |
| **Description** | [Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar ProxySQL containers |

### <a name="operator-logcollector-section"></a>Log Collector section

The `logcollector` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
file contains configuration options for [Fluent Bit Log Collector](https://fluentbit.io).

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('logcollector.enabled') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Enables or disables [cluster-level logging with Fluent Bit](debug.md#debug-images-logs) |
|                 | |
| **Key**         | {{ optionlink('logcollector.image') }} |
| **Value**       | string |
| **Example**     | `percona/percona-xtradb-cluster-operator:1.6.0-logcollector` |
| **Description** | Log Collector Docker image to use |
|                 | |
| **Key**         | {{ optionlink('logcollector.configuration') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | Additional configuration options (see [Fluent Bit official documentation](https://docs.fluentbit.io/manual/administration/configuring-fluent-bit/configuration-file) for details) |
|                 | |
| **Key**         | {{ optionlink('logcollector.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `100M` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Log Collector container |
|                 | |
| **Key**         | {{ optionlink('logcollector.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `200m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Log collector container |

### <a name="operator-pmm-section"></a>PMM section

The `pmm` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains configuration
options for Percona Monitoring and Management.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('pmm.enabled') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Enables or disables [monitoring Percona XtraDB cluster with PMM](https://www.percona.com/doc/percona-xtradb-cluster/5.7/manual/monitoring.html) |
|                 | |
| **Key**         | {{ optionlink('pmm.image') }} |
| **Value**       | string |
| **Example**     | `percona/pmm-client:{{ pmm2recommended }}` |
| **Description** | PMM client Docker image to use |
|                 | |
| **Key**         | {{ optionlink('pmm.serverHost') }} |
| **Value**       | string |
| **Example**     | `monitoring-service` |
| **Description** | Address of the PMM Server to collect data from the cluster |
|                 | |
| **Key**         | {{ optionlink('pmm.serverUser') }} |
| **Value**       | string |
| **Example**     | `admin` |
| **Description** | The [PMM Serve_User](https://www.percona.com/doc/percona-monitoring-and-management/glossary.option.html). The PMM Server password should be configured using Secrets |
|                 | |
| **Key**         | {{ optionlink('pmm.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `150M` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a PMM container |
|                 | |
| **Key**         | {{ optionlink('pmm.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `300m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a PMM container |
|                 | |
| **Key**         | {{ optionlink('pmm.pxcParams') }} |
| **Value**       | string |
| **Example**     | `--disable-tablestats-limit=2000` |
| **Description** | Additional parameters which will be passed to the [pmm-admin add mysql](https://docs.percona.com/percona-monitoring-and-management/setting-up/client/mysql.html) command for `pxc` Pods |
|                 | |
| **Key**         | {{ optionlink('pmm.proxysqlParams') }} |
| **Value**       | string |
| **Example**     | `--custom-labels=CUSTOM-LABELS` |
| **Description** | Additional parameters which will be passed to the [pmm-admin add proxysql](https://docs.percona.com/percona-monitoring-and-management/setting-up/client/proxysql.html) command for `proxysql` Pods |

### <a name="operator-backup-section"></a>Backup section

The `backup` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
file contains the following configuration options for the regular Percona XtraDB Cluster backups.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('backup.allowParallel') }} |
| **Value**       | string |
| **Example**     | `true` |
| **Description** | Enables or disables running backup jobs in parallel. By default, parallel backup jobs are enabled. A user can disable them to prevent the cluster overload |
|                 | |
| **Key**         | {{ optionlink('backup.image') }} |
| **Value**       | string |
| **Example**     | `percona/percona-xtradb-cluster-operator:{{ release }}-backup` |
| **Description** | The Percona XtraDB cluster Docker image to use for the backup |
|                 | |
| **Key**         | {{ optionlink('backup.backoffLimit') }} |
| **Value**       | int |
| **Example**     | `6` |
| **Description** | The number of retries to make a backup |
|                 | |
| **Key**         | {{ optionlink('backup.imagePullSecrets.name') }} |
| **Value**       | string |
| **Example**     | `private-registry-credentials` |
| **Description** | The [Kubernetes imagePullSecrets](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for the specified image |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.type') }} |
| **Value**       | string |
| **Example**     | `s3` |
| **Description** | The cloud storage type used for backups. Only `s3`, `azure`, and `filesystem` types are supported |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.verifyTLS') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Enable or disable verification of the storage server TLS certificate. Disabling it may be useful e.g. to skip TLS verification for private S3-compatible storage with a self-issued certificate |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.credentialsSecret') }} |
| **Value**       | string |
| **Example**     | `my-cluster-name-backup-s3` |
| **Description** | The [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.bucket') }} |
| **Value**       | string |
| **Example**     | |
| **Description** | The [Amazon S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) name for backups |
|                 | |
| **Key**         | {{ optionlink('backup.storages.s3.&lt;storage-name&gt;.region') }} |
| **Value**       | string |
| **Example**     | `us-east-1` |
| **Description** | The [AWS region](https://docs.aws.amazon.com/general/latest/gr/rande.html) to use. Please note **this option is mandatory** for Amazon and all S3-compatible storages |
|                 | |
| **Key**         | {{ optionlink('backup.storages.s3.&lt;storage-name&gt;.endpointUrl') }} |
| **Value**       | string |
| **Example**     | |
| **Description** | The endpoint URL of the S3-compatible storage to be used (not needed for the original Amazon S3 cloud) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.persistentVolumeClaim.type') }} |
| **Value**       | string |
| **Example**     | `filesystem` |
| **Description** | The persistent volume claim storage type |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.persistentVolumeClaim.storageClassName') }} |
| **Value**       | string |
| **Example**     | `standard` |
| **Description** | Set the [Kubernetes Storage Class](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Percona XtraDB Cluster backups [PersistentVolumeClaims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) for the `filesystem` storage type |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.volume.persistentVolumeClaim.accessModes') }} |
| **Value**       | array |
| **Example**     | `[ReadWriteOne]` |
| **Description** | The [Kubernetes PersistentVolume access modes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.volume.persistentVolumeClaim.resources.requests.storage') }} |
| **Value**       | string |
| **Example**     | `6Gi` |
| **Description** | Storage size for the PersistentVolume |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.annotations') }} |
| **Value**       | label |
| **Example**     | `iam.amazonaws.com/role: role-arn` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.labels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-22` |
| **Description** | [Labels are key-value pairs attached to objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `600m` |
| **Description** | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `1G` |
| **Description** | [Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.nodeSelector') }} |
| **Value**       | label |
| **Example**     | `disktype: ssd` |
| **Description** | [Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.affinity.nodeAffinity') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | The Operator [node affinity](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) constraint |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.tolerations') }} |
| **Value**       | subdoc |
| **Example**     | `backupWorker` |
| **Description** | [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.priorityClassName') }} |
| **Value**       | string |
| **Example**     | `high-priority` |
| **Description** | The [Kubernetes Pod priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.schedulerName') }} |
| **Value**       | string |
| **Example**     | `mycustom-scheduler` |
| **Description** | The [Kubernetes Scheduler](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.containerSecurityContext') }} |
| **Value**       | subdoc |
| **Example**     | `privileged: true` |
| **Description** | A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.podSecurityContext') }} |
| **Value**       | subdoc |
| **Example**     | <pre>fsGroup: 1001<br>supplementalGroups: [1001, 1002, 1003]</pre> |
| **Description** | A custom [Kubernetes Security Context for a Pod](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one |
|                 | |
| **Key**         | {{ optionlink('backup.schedule.name') }} |
| **Value**       | string |
| **Example**     | `sat-night-backup` |
| **Description** | The backup name |
|                 | |
| **Key**         | {{ optionlink('backup.schedule.schedule') }} |
| **Value**       | string |
| **Example**     | `0 0 \* \* 6` |
| **Description** | Scheduled time to make a backup specified in the [crontab format](https://en.wikipedia.org/wiki/Cron) |
|                 | |
| **Key**         | {{ optionlink('backup.schedule.keep') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | The amount of most recent backups to store. Older backups are automatically deleted. Set `keep` to zero or completely remove it to disable automatic deletion of backups |
|                 | |
| **Key**         | {{ optionlink('backup.schedule.storageName') }} |
| **Value**       | string |
| **Example**     | `s3-us-west` |
| **Description** | The name of the storage for the backups configured in the `storages` or `fs-pvc` subsection |
|                 | |
| **Key**         | {{ optionlink('backup.pitr.enabled') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Enables or disables [point-in-time-recovery functionality](backups.md#backups-pitr-binlog) |
|                 | |
| **Key**         | {{ optionlink('backup.pitr.storageName') }} |
| **Value**       | string |
| **Example**     | `s3-us-west` |
| **Description** | The name of the storage for the backups configured in the `storages` subsection, which will be reused to store binlog for point-in-time-recovery |
|                 | |
| **Key**         | {{ optionlink('backup.pitr.timeBetweenUploads') }} |
| **Value**       | int |
| **Example**     | `60` |
| **Description** | Seconds between running the binlog uploader |

## <a name="operator-backupsource-section"></a> PerconaXtraDBClusterRestore Custom Resource options

[Percona XtraDB Cluster Restore](backups.md#restoring-backup) options are managed by the Operator via the 
`PerconaXtraDBClusterRestore` [Custom Resource](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) and can be configured via the
[deploy/backup/restore.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml)
configuration file. This Custom Resource contains the following options:

| Key              | Value type        | Description                                    | Required |
| ---------------- | ----------------- | ---------------------------------------------- | -------- |
| metadata.name    | string            | The name of the restore                        | true     |
| spec.pxcCluster  | string            | Percona XtraDB Cluster name (the name of your running cluster) | true |
| spec.backupName  | string            | The name of the backup which should be restored| false    |
| spec.resources   | [subdoc](operator.md#operator-restore-resources-options-section)| Defines resources limits for the restore job | false |
| spec.backupSource| [subdoc](operator.md#operator-restore-backupsource-options-section)| Defines configuration for different restore sources | false |
| spec.pitr        | [subdoc](operator.md#operator-restore-pitr-options-section) | Defines configuration for PITR restore | false |

### <a name="operator-restore-resources-options-section"></a>resources section

| Key              | Value type        | Description                                    | Required |
| ---------------- | ----------------- | ---------------------------------------------- | -------- |
| requests.memory  | string            | The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job (the specified value is used if memory limits are not set)   | false    |
| requests.cpu     | string            | [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job (the specified value is used if CPU limits are not set)                | false    |
| limits.memory    | string            | The [Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job (if set, the value will be used for memory requests as well) | false    |
| limits.cpu       | string            | [Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job (if set, the value will be used for CPU requests as well)              | false    |

### <a name="operator-restore-backupsource-options-section"></a>backupSource section

| Key              | Value type        | Description                                    | Required |
| ---------------- | ----------------- | ---------------------------------------------- | -------- |
| destination      | string            | Path to the backup                             | false    |
| storageName      | string            | The storage name from CR `spec.backup.storages`| false    |
| verifyTLS        | boolean           | Enable or disable verification of the storage server TLS certificate. Disabling it may be useful e.g. to skip TLS verification for private S3-compatible storage with a self-issued certificate | true |
| s3               | [subdoc](operator.md#operator-restore-s3-options-section)    | Define configuration for S3 compatible storages | false |
| azure            | [subdoc](operator.md#operator-restore-azure-options-section) | Define configuration for azure blob storage     | false |

### <a name="operator-restore-s3-options-section"></a>backupSource.s3 subsection

| Key              | Value type        | Description                                    | Required |
| ---------------- | ----------------- | ---------------------------------------------- | -------- |
| bucket           | string            | The bucket with a backup                       | true     |
| credentialsSecret| string            | The Secret name for the backup                 | true     |
| endpointUrl      | string            | A valid endpoint URL                           | false    |
| region           | string            | The region corresponding to the S3 bucket      | false    |

### <a name="operator-restore-azure-options-section"></a>backupSource.azure subsection

| Key              | Value type        | Description                                    | Required |
| ---------------- | ----------------- | ---------------------------------------------- | -------- |
| credentialsSecret| string            | The Secret name for the azure blob storage     | true     |
| container        | string            | The container name of the azure blob storage   | true     |
| endpointUrl      | string            | A valid endpoint URL                           | false    |
| storageClass     | string            | The storage class name of the azure storage    | false    |

### <a name="operator-restore-pitr-options-section"></a>pitr subsection

| Key              | Value type        | Description                                    | Required |
| ---------------- | ----------------- | ---------------------------------------------- | -------- |
| type             | string            | The type of PITR recover                       | true     |
| date             | string            | The exact date of recovery                     | true     |
| gtid             | string            | The exact GTID for PITR recover                | true     |
| spec.backupSource| [subdoc](operator.md#operator-restore-backupsource-options-section)| Percona XtraDB Cluster backups section     | true  |
| s3               | [subdoc](operator.md#operator-restore-s3-options-section)    | Defines configuration for S3 compatible storages | false |
| azure            | [subdoc](operator.md#operator-restore-azure-options-section) | Defines configuration for azure blob storage     | false |

