# Custom Resource options reference

Percona Operator for MySQL uses [Custom Resources :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) to manage options for the various components of the cluster.

* `PerconaXtraDBCluster` Custom Resource with Percona XtraDB Cluster options,
* `PerconaXtraDBClusterBackup` and `PerconaXtraDBClusterRestore` Custom Resources contain options for Percona XtraBackup used to backup Percona XtraDB Cluster and to restore it from backups.

## PerconaXtraDBCluster Custom Resource options

`PerconaXtraDBCluster` Custom Resource contains options for Percona XtraDB Cluster and can be configured via the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) configuration file.


The metadata part contains the following keys:

* <a name="metadata-name"></a> `name` (`cluster1` by default) sets the name of your Percona
XtraDB Cluster; it should include only [URL-compatible characters :octicons-link-external-16:](https://datatracker.ietf.org/doc/html/rfc3986#section-2.3),
not exceed 22 characters, start with an alphabetic character, and end with an
alphanumeric character;
* `finalizers` subsection:
    * `percona.com/delete-pods-in-order` if present, activates the [Finalizer :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which controls the proper Pods deletion order in case of the cluster deletion event (on by default).
    * `percona.com/delete-pxc-pvc` if present, activates the [Finalizer :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes [Persistent Volume Claims :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for Percona XtraDB Cluster Pods after the cluster deletion event (off by default).
    * `percona.com/delete-proxysql-pvc` if present, activates the [Finalizer :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes [Persistent Volume Claim :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for ProxySQL Pod after the cluster deletion event (off by default).
    * <a name="finalizers-delete-ssl"></a> `percona.com/delete-ssl` if present, activates the [Finalizer :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes [objects, created for SSL](TLS.md) (Secret, certificate, and issuer) after the cluster deletion event (off by default).

The toplevel spec elemets of the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) are the following ones:

### `allowUnsafeConfigurations`

Prevents users from configuring a cluster with unsafe parameters such as starting the cluster with the number of Percona XtraDB Cluster instances which is less than 3, more than 5, or is an even number, with less than 2 ProxySQL or HAProxy Pods, or without TLS/SSL certificates. **This option is deprecated and will be removed in future releases**. Use `unsafeFlags` subsection instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `enableCRValidationWebhook`

Enables or disables schema validation before applying `cr.yaml` file (works only in [cluster-wide mode](cluster-wide.md) due to [access restrictions](faq.md#which-additional-access-permissions-are-used-by-the-custom-resource-validation-webhook)).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true`  |

### `enableVolumeExpansion`

Enables or disables [automatic storage scaling / volume expansion](scaling.md#automated-scaling-with-volume-expansion-capability).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`  |

### `pause`

Pause/resume: setting it to `true` gracefully stops the cluster, and setting it to `false` after shut down starts the cluster back.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `secretsName`

A name for [users secrets](users.md#users).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `cluster1-secrets`         |

### `crVersion`

Version of the Operator the Custom Resource belongs to.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `{{ release }}`                   |

### `ignoreAnnotations`

The list of annotations [to be ignored](annotations.md#annotations-ignore) by the Operator.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `iam.amazonaws.com/role`   |

### `ignoreLabels`

The list of labels [to be ignored](annotations.md#annotations-ignore) by the Operator.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `rack`                     |

### `vaultSecretName`

A secret for the [HashiCorp Vault :octicons-link-external-16:](https://www.vaultproject.io/) to carry on [Data at Rest Encryption](encryption.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `keyring-secret-vault`     |


### `sslSecretName`

A secret with TLS certificate generated for *external* communications, see [Transport Layer Security (TLS)](TLS.md) for details.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `cluster1-ssl`             |

### `sslInternalSecretName`

A secret with TLS certificate generated for *internal* communications, see [Transport Layer Security (TLS)](TLS.md) for details.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `cluster1-ssl-internal`    |

### `logCollectorSecretName`

A secret for the [Fluent Bit Log Collector](debug-logs.md#cluster-level-logging).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-log-collector-secrets` |

### `initImage`

An alternative image for the initial Operator installation. **This option is deprecated and will be removed in future releases**. Use `initContainer.image` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona-xtradb-cluster-operator:{{ release }}` |

### `updateStrategy`

A strategy the Operator uses for [upgrades](update.md#update-strategies).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `SmartUpdate`              | 

## <a name="operator-unsafeflags-section"></a>Unsafe flags section

The `unsafeFlags` section in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options to prevent users from configuring a cluster with unsafe parameters.

### `unsafeFlags.tls`

Allows users to configure a cluster without TLS/SSL certificates (if `false`, the Operator will detect unsafe parameters, set cluster status to `error`, and print error message in logs).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     |`false` |

### `unsafeFlags.pxcSize`

Allows users to configure a cluster with less than 3 Percona XtraDB Cluster instances (if `false`, the Operator will detect unsafe parameters, set cluster status to `error`, and print error message in logs).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     |`false` |

### `unsafeFlags.proxySize`

Allows users to configure a cluster with less than 2 ProxySQL or HAProxy Pods (if `false`, the Operator will detect unsafe parameters, set cluster status to `error`, and print error message in logs).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     |`false` |

### `unsafeFlags.backupIfUnhealthy`

Allows running a backup even if the cluster status is not `ready`.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     |`false` |

## <a name="operator-initcontainer-section"></a>initContainer configuration section

The `initContainer` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file 
allows providing an alternative image with various options for the initial Operator installation.

### `initContainer.image`

An alternative image for the initial Operator installation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona-xtradb-cluster-operator:{{ release }}` |

###`initContainer.containerSecurityContext`

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) for the image used for the initial Operator installation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>privileged: false<br>runAsUser: 1001<br>runAsGroup: 1001</pre> |

### `initContainer.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `initContainer.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `600m` |

### `initContainer.resources.limits.memory`

[Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `initContainer.resources.limits.cpu`

[Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1` |

## <a name="operator-issuerconf-section"></a>TLS (extended cert-manager configuration section)

The `tls` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options for additional customization of the [TLS cert-manager](TLS.md#tls-certs-certmanager).

### `tls.enabled`

Enables or disables the [TLS encryption](TLS.md). If set to `false`,
 it also requires setting `unsafeFlags.tls option to `true`.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true` |

### `tls.SANs`

Additional domains (SAN) to be added to the TLS certificate within the extended cert-manager configuration.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | |

### `tls.issuerConf.name`

A [cert-manager issuer name :octicons-link-external-16:](https://cert-manager.io/docs/concepts/issuer/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `special-selfsigned-issuer` |

### `tls.issuerConf.kind`

A [cert-manager issuer type :octicons-link-external-16:](https://cert-manager.io/docs/configuration/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `ClusterIssuer` |

### `tls.issuerConf.group`

A [cert-manager issuer group :octicons-link-external-16:](https://cert-manager.io/docs/configuration/). Should be `cert-manager.io` for built-in cert-manager certificate issuers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `cert-manager.io` |

## <a name="operator-upgradeoptions-section"></a>Upgrade options section

The `upgradeOptions` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options to control Percona XtraDB Cluster upgrades.

### `upgradeOptions.versionServiceEndpoint`

The Version Service URL used to check versions compatibility for upgrade.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `https://check.percona.com` |

### `upgradeOptions.apply`

Specifies how [updates are processed](update-automatic.md) by the Operator. `Never` or `Disabled` will completely disable automatic upgrades, otherwise it can be set to `Latest` or `Recommended` or to a specific version string of Percona XtraDB Cluster (e.g. `8.0.19-10.1`) that is wished to be version-locked (so that the user can control the version running, but use automatic upgrades to move between them).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Disabled` |

### `upgradeOptions.schedule`

Scheduled time to check for updates, specified in the [crontab format :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0 2 \* \* \*` |

## <a name="operator-pxc-section"></a>PXC section

The `pxc` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains general
configuration options for the Percona XtraDB Cluster.

### `pxc.size`

The size of the Percona XtraDB cluster must be 3 or 5 for [High Availability :octicons-link-external-16:](https://www.percona.com/doc/percona-xtradb-cluster/5.7/intro.html). Other values are allowed if the `spec.unsafeFlags.pxcSize` key is set to true.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3` |

### `pxc.image`

The Docker image of the Percona cluster used (actual image names for Percona XtraDB Cluster 8.0 and Percona XtraDB Cluster 5.7 can be found [in the list of certified images](images.md)).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona-xtradb-cluster:{{ pxc80recommended }}` |

### `pxc.autoRecovery`

Turns [Automatic Crash Recovery](recovery.md#automatic-crash-recovery) on or off.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true` |

### `pxc.expose.enabled`

Enable or disable exposing Percona XtraDB Cluster instances with dedicated IP addresses.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true` |

### `pxc.expose.type`

The [Kubernetes Service Type :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) used for exposure.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `LoadBalancer` |

### `pxc.expose.loadbalancerClass`

Define the implementation of the load balancer you want to use. This setting enables you to select a custom or specific load balancer class instead of the default one provided by the cloud provider.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `"eks.amazonaws.com/nlb"` |

### `pxc.expose.trafficPolicy`

Specifies whether Service should [route external traffic to cluster-wide or node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness) **This option is deprecated and will be removed in future releases**. Use `pxc.expose.externalTrafficPolicy` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Local` |

### `pxc.expose.externalTrafficPolicy`

Specifies whether Service for Percona XtraDB Cluster should [route external traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Local` |

### `pxc.expose.internalTrafficPolicy`

Specifies whether Service for Percona XtraDB Cluster should [route internal traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Local` |

### `pxc.expose.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations). 

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `10.0.0.0/8` |

### `pxc.expose.loadBalancerIP`

The static IP-address for the load balancer. **This field is deprecated and scheduled for removal in version 1.21.0.**. 

`loadBalancerIP` has been officially deprecated upstream in Kubernetes due to its inconsistent behavior across cloud providers and lack of dual-stack support. As a result, its usage is strongly discouraged.

We recommend using cloud provider-specific annotations instead, as they offer more predictable and portable behavior for managing load balancer IP assignments.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `127.0.0.1` |

### `pxc.expose.annotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `networking.gke.io/load-balancer-type: "Internal"` |

### `pxc.replicationChannels.name`

Name of the replication channel for [cross-site replication](replication.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `pxc1_to_pxc2` |

### `pxc.replicationChannels.isSource`

Should the cluster act as Source (`true`) or Replica (`false`)
in [cross-site replication](replication.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `pxc.replicationChannels.configuration.sourceRetryCount`

Number of retries Replica should do when the existing connection source fails.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3` |

### `pxc.replicationChannels.configuration.sourceConnectRetry`

The interval between reconnection attempts in seconds to be used by Replica when the the existing connection source fails.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `60` |

### `pxc.replicationChannels.configuration.ssl`

Turns SSL for [replication channels](replication.md) on or off.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `pxc.replicationChannels.configuration.sslSkipVerify`

Turns the host name identity verification for SSL-based [replication](replication.md) on or off.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true` |

### `pxc.replicationChannels.configuration.ca`

The path name of the Certificate Authority (CA) certificate file to be used if the SSL for [replication channels](replication.md) is turned on.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `/etc/mysql/ssl/ca.crt` |

### `pxc.replicationChannels.sourcesList.host`

For the [cross-site replication](replication.md) Replica cluster, this key should contain the hostname or IP address of the Source cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `10.95.251.101` |

### `pxc.replicationChannels.sourcesList.port`

For the [cross-site replication](replication.md) Replica cluster, this key should contain the Source port number.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3306` |

### `pxc.replicationChannels.sourcesList.weight`

For the [cross-site replication](replication.md) Replica cluster, this key should contain the Source cluster weight (varies from `1` to `100`, the cluster with the higher number will be selected as the replication source first).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `100` |

### `pxc.readinessDelaySec`

Adds a delay before a run check to verify the application is ready to process traffic.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `15` |

### `pxc.livenessDelaySec`

Adds a delay before the run check ensures the application is healthy and capable of processing requests.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `300` |

### `pxc.configuration`

The `my.cnf` file options to be passed to Percona XtraDB cluster nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | <pre>&#124;<br>[mysqld]<br>wsrep_debug=ON<br>wsrep-provider_options=gcache.size=1G;gcache.recover=yes</pre> |

### `pxc.imagePullSecrets.name`

The [Kubernetes ImagePullSecret :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `private-registry-credentials` |

### `pxc.priorityClassName`

The [Kubernetes Pod priority class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `high-priority` |

### `pxc.schedulerName`

The [Kubernetes Scheduler :octicons-link-external-16:](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `mycustom-scheduler` |

### `pxc.annotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `iam.amazonaws.com/role: role-arn` |

### `pxc.labels`

[Labels are key-value pairs attached to objects :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `rack: rack-22` |

### `pxc.readinessProbes.initialDelaySeconds`

Number of seconds to wait before performing the first [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `15` |

### `pxc.readinessProbes.timeoutSeconds`

Number of seconds after which the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `15` |

### `pxc.readinessProbes.periodSeconds`

How often (in seconds) to perform the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `30` |

### `pxc.readinessProbes.successThreshold`

Minimum consecutive successes for the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |

### `pxc.readinessProbes.failureThreshold`

When the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before marking the Pod Unready.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `5` |

### `pxc.livenessProbes.initialDelaySeconds`

Number of seconds to wait before performing the first [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `300` |

### `pxc.livenessProbes.timeoutSeconds`

Number of seconds after which the [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `5` |

### `pxc.livenessProbes.periodSeconds`

How often (in seconds) to perform the [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `10` |

### `pxc.livenessProbes.successThreshold`

Minimum consecutive successes for the [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |

### `pxc.livenessProbes.failureThreshold`

When the [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before restarting the container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3` |

### `pxc.envVarsSecret`

A secret with environment variables, see [Define environment variables](containers-conf.md) for details.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-env-var-secrets` |

### `pxc.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `pxc.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `600m` |

### `pxc.resources.requests.ephemeral-storage`

Kubernetes [Ephemeral Storage :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/ephemeral-volumes/) [requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `pxc.resources.limits.memory`

[Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `pxc.resources.limits.cpu`

[Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1` |

### `pxc.resources.limits.ephemeral-storage`

Kubernetes [Ephemeral Storage :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/ephemeral-volumes/) [limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `pxc.nodeSelector`

[Kubernetes nodeSelector :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `disktype: ssd` |

### `pxc.topologySpreadConstraints.labelSelector.matchLabels`

The Label selector for the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `app.kubernetes.io/name: percona-xtradb-cluster-operator` |

### `pxc.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | 1 |

### `pxc.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `pxc.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `DoNotSchedule` |

### `pxc.affinity.topologyKey`

The Operator [topology key :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) node anti-affinity constraint.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `pxc.affinity.advanced`

In cases where the Pods require complex tuning the advanced option turns off the `topologyKey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | |

### `pxc.tolerations`

[Kubernetes Pod tolerations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `node.alpha.kubernetes.io/unreachable` |

### `pxc.podDisruptionBudget.maxUnavailable`

The [Kubernetes podDisruptionBudget :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) specifies the number of Pods from the set unavailable after the eviction.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |

### `pxc.podDisruptionBudget.minAvailable`

The [Kubernetes podDisruptionBudget :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) Pods that must be available after an eviction.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `0` |

### `pxc.volumeSpec.emptyDir`

The [Kubernetes emptyDir volume :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) The directory created on a node and accessible to the Percona XtraDB Cluster Pod containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `{}` |

### `pxc.volumeSpec.hostPath.path`

[Kubernetes hostPath :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) The volume that mounts a directory from the host node’s filesystem into your Pod. The path property is required.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `/data` |

### `pxc.volumeSpec.hostPath.type`

The [Kubernetes hostPath :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath). An optional property for the hostPath.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Directory` |

### `pxc.volumeSpec.persistentVolumeClaim.storageClassName`

Set the [Kubernetes storage class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Percona XtraDB Cluster [PersistentVolumeClaim :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `standard` |

### `pxc.volumeSpec.persistentVolumeClaim.accessModes`

The [Kubernetes PersistentVolumeClaim :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) access modes for the Percona XtraDB cluster.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `[ReadWriteOnce]` |

### `pxc.volumeSpec.persistentVolumeClaim.dataSource.name`

The name of PVC used as a data source to [create the Percona XtraDB Cluster Volumes by cloning :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volume-pvc-datasource/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `new-snapshot-test` |

### `pxc.volumeSpec.persistentVolumeClaim.dataSource.kind`

The  [Kubernetes DataSource type :octicons-link-external-16:](https://kubernetes-csi.github.io/docs/volume-datasources.html#supported-datasources).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `VolumeSnapshot` |

### `pxc.volumeSpec.persistentVolumeClaim.dataSource.apiGroup`

The [Kubernetes API group :octicons-link-external-16:](https://kubernetes.io/docs/reference/using-api/#api-groups) to use for [PVC Data Source :octicons-link-external-16:](https://kubernetes-csi.github.io/docs/volume-datasources.html).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `snapshot.storage.k8s.io` |

### `pxc.gracePeriod`

The [Kubernetes grace period when terminating a Pod :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `600` |

### `pxc.containerSecurityContext`

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `privileged: true` |

### `pxc.podSecurityContext`

A custom [Kubernetes Security Context for a Pod :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>fsGroup: 1001<br>supplementalGroups: [1001, 1002, 1003]</pre> |

### `pxc.serviceAccountName`

The [Kubernetes Service Account :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for Percona XtraDB Cluster Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona-xtradb-cluster-operator-workload` |

### `pxc.imagePullPolicy`

The [policy used to update images :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/images/#updating-images).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Always` |

### `pxc.runtimeClassName`

Name of the [Kubernetes Runtime Class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for Percona XtraDB Cluster Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `image-rc` |

### `pxc.sidecars.image`

Image for the [custom sidecar container](sidecar.md) for Percona XtraDB Cluster Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `busybox` |

### `pxc.sidecars.command`

Command for the [custom sidecar container](sidecar.md) for Percona XtraDB Cluster Pods.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["/bin/sh"]` |

### `pxc.sidecars.args`

Command arguments for the [custom sidecar container](sidecar.md) for Percona XtraDB Cluster Pods.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["-c", "while true; do trap 'exit 0' SIGINT SIGTERM SIGQUIT SIGKILL; done;"]` |

### `pxc.sidecars.name`

Name of the [custom sidecar container](sidecar.md) for Percona XtraDB Cluster Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-sidecar-1` |

### `pxc.sidecars.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `pxc.sidecars.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `500m` |

### `pxc.sidecars.resources.limits.memory`

[Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `2G` |

### `pxc.sidecars.resources.limits.cpu`

[Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `600m` |

### `pxc.lifecycle.preStop.exec.command`

Command for the [preStop lifecycle hook :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for Percona XtraDB Cluster Pods.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["/bin/true"]` |

### `pxc.lifecycle.postStart.exec.command`

Command for the [postStart lifecycle hook :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for Percona XtraDB Cluster Pods.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["/bin/true"]` |

## <a name="operator-haproxy-section"></a>HAProxy section

The `haproxy` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains
configuration options for the HAProxy service.

### `haproxy.enabled`

Enables or disables [load balancing with HAProxy :octicons-link-external-16:](https://www.percona.com/doc/percona-xtradb-cluster/8.0/howtos/haproxy.html) [Services :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true` |

### `haproxy.size`

The number of the HAProxy Pods [to provide load balancing :octicons-link-external-16:](https://www.percona.com/doc/percona-xtradb-cluster/8.0/howtos/haproxy.html). It should be 2 or more unless the `spec.unsafeFlags.proxySize` key is set to true.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `2` |

### `haproxy.image`

HAProxy Docker image to use.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona-xtradb-cluster-operator:{{ release }}-haproxy` |

### `haproxy.imagePullPolicy`

The [policy used to update images :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/images/#updating-images).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Always` |

### `haproxy.imagePullSecrets.name`

The [Kubernetes imagePullSecrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for the HAProxy image.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `private-registry-credentials` |

### `haproxy.readinessDelaySec`

Adds a delay before a run check to verify the application is ready to process traffic.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `15` |

### `haproxy.livenessDelaySec`

Adds a delay before the run check ensures the application is healthy and capable of processing requests.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `300` |

### `haproxy.configuration`

The [custom HAProxy configuration file](haproxy-conf.md#passing-custom-configuration-options-to-haproxy) contents.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | |

### `haproxy.annotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `iam.amazonaws.com/role: role-arn` |

### `haproxy.labels`

[Labels are key-value pairs attached to objects :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `rack: rack-22` |

### `haproxy.readinessProbes.initialDelaySeconds`

Number of seconds to wait before performing the first [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `15` |

### `haproxy.readinessProbes.timeoutSeconds`

Number of seconds after which the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |

### `haproxy.readinessProbes.periodSeconds`

How often (in seconds) to perform the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `5` |

### `haproxy.readinessProbes.successThreshold`

Minimum consecutive successes for the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |

### `haproxy.readinessProbes.failureThreshold`

When the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before marking the Pod Unready.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3` |

### `haproxy.serviceType`

Specifies the type of [Kubernetes Service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used for HAProxy. **This option is deprecated and will be removed in future releases**. Use `haproxy.exposePrimary.type` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `ClusterIP` |

### `haproxy.externalTrafficPolicy`

Specifies whether Service for HAProxy should [route external traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness). **This option is deprecated and will be removed in future releases**. Use `haproxy.exposePrimary.externalTrafficPolicy` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Cluster` |

### `haproxy.livenessProbes.initialDelaySeconds`

Number of seconds to wait before performing the first [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `60` |

### `haproxy.livenessProbes.timeoutSeconds`

Number of seconds after which the [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `5` |

### `haproxy.livenessProbes.periodSeconds`

How often (in seconds) to perform the [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `30` |

### `haproxy.livenessProbes.successThreshold`

Minimum consecutive successes for the [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |


### `haproxy.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `haproxy.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `600m` |

### `haproxy.resources.limits.memory`

[Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `haproxy.resources.limits.cpu`

[Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `700m` |

### `haproxy.envVarsSecret`

A secret with environment variables, see [Define environment variables](containers-conf.md) for details.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-env-var-secrets` |

### `haproxy.priorityClassName`

The [Kubernetes Pod Priority class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for HAProxy.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `high-priority` |

### `haproxy.schedulerName`

The [Kubernetes Scheduler :octicons-link-external-16:](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `mycustom-scheduler` |

### `haproxy.nodeSelector`

[Kubernetes nodeSelector :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `disktype: ssd` |

### `haproxy.topologySpreadConstraints.labelSelector.matchLabels`

The Label selector for the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `app.kubernetes.io/name: percona-xtradb-cluster-operator` |

### `haproxy.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | 1 |

### `haproxy.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `haproxy.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `DoNotSchedule` |

### `haproxy.affinity.topologyKey`

The Operator [topology key :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) node anti-affinity constraint.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `haproxy.affinity.advanced`

If available it makes a [topologyKey :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint to be ignored.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | |

### `haproxy.tolerations`

[Kubernetes Pod tolerations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `node.alpha.kubernetes.io/unreachable` |

### `haproxy.podDisruptionBudget.maxUnavailable`

The [Kubernetes podDisruptionBudget :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) specifies the number of Pods from the set unavailable after the eviction.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |

### `haproxy.podDisruptionBudget.minAvailable`

The [Kubernetes podDisruptionBudget :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) Pods that must be available after an eviction.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `0` |

### `haproxy.gracePeriod`

The [Kubernetes grace period when terminating a Pod :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `30` |

### `haproxy.exposePrimary.enabled`

Enables or disables the HAProxy primary instance Service. This field is deprecated starting with the Operator version 1.17.0.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `haproxy.exposePrimary.type`

Specifies the type of [Kubernetes Service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used for HAProxy primary instance Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `ClusterIP` |

### `haproxy.exposePrimary.loadBalancerClass`

Define the implementation of the load balancer you want to use. This setting enables you to select a custom or specific load balancer class instead of the default one provided by the cloud provider.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `"eks.amazonaws.com/nlb"` |

### `haproxy.exposePrimary.externalTrafficPolicy`

Specifies whether Service for HAProxy should [route external traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Cluster` |

### `haproxy.exposePrimary.internalTrafficPolicy`

Specifies whether Service for HAProxy primary instance should [route internal traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Cluster` |

### `haproxy.exposePrimary.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `10.0.0.0/8` |

### `haproxy.exposePrimary.loadBalancerIP`

The static IP-address for the load balancer. **This field is deprecated and scheduled for removal in version 1.21.0.**.

`loadBalancerIP` has been officially deprecated upstream in Kubernetes due to its inconsistent behavior across cloud providers and lack of dual-stack support. As a result, its usage is strongly discouraged.

We recommend using cloud provider-specific annotations instead, as they offer more predictable and portable behavior for managing load balancer IP assignments.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `127.0.0.1` |

### `haproxy.serviceLabels`

The [Kubernetes labels :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service. **This option is deprecated and will be removed in future releases**. Use `haproxy.exposePrimary.labels` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `rack: rack-22` |

### `haproxy.exposePrimary.labels`

The [Kubernetes labels :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `rack: rack-22` |

### `haproxy.serviceAnnotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service. **This option is deprecated and will be removed in future releases**. Use `haproxy.exposePrimary.annotations` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `haproxy.exposePrimary.annotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `haproxy.replicasServiceEnabled`

Enables or disables `haproxy-replicas` Service. This Service (on by default) forwards requests to all Percona XtraDB Cluster instances, and it *should not be used for write requests*! **This option is deprecated and will be removed in future releases**. Use `haproxy.exposeReplicas.enabled` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `haproxy.exposeReplicas.enabled`

Enables or disables `haproxy-replicas` Service. This Service default forwards requests to all Percona XtraDB Cluster instances, and it **should not be used for write requests**!

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true` |

### `haproxy.exposeReplicas.onlyReaders`

Setting it to `true` excludes current MySQL primary instance (writer) from the list of Pods, to which `haproxy-replicas` Service directs connections, leaving only the reader instances.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `haproxy.exposeReplicas.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, no limitations).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `10.0.0.0/8` |

### `haproxy.exposeReplicas.loadBalancerIP`

The static IP-address for the replicas load balancer. **This field is deprecated and scheduled for removal in version 1.21.0.**.

`loadBalancerIP` has been officially deprecated upstream in Kubernetes due to its inconsistent behavior across cloud providers and lack of dual-stack support. As a result, its usage is strongly discouraged.

We recommend using cloud provider-specific annotations instead, as they offer more predictable and portable behavior for managing load balancer IP assignments.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `127.0.0.1` |

### `haproxy.exposeReplicas.type`

Specifies the type of [Kubernetes Service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used for HAProxy replicas.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `ClusterIP` |

### `haproxy.exposeReplicas.loadBalancerClass`

Define the implementation of the load balancer you want to use. This setting enables you to select a custom or specific load balancer class instead of the default one provided by the cloud provider.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `"eks.amazonaws.com/nlb"` |

### `haproxy.replicasExternalTrafficPolicy`

Specifies whether Service for HAProxy replicas should [route external traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness). **This option is deprecated and will be removed in future releases**. Use `haproxy.exposeReplicas.externalTrafficPolicy` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Cluster` |

### `haproxy.exposeReplicas.externalTrafficPolicy`

Specifies whether Service for HAProxy replicas should [route external traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Cluster` |

### `haproxy.exposeReplicas.internalTrafficPolicy`

Specifies whether Service for HAProxy replicas should [route internal traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Cluster` |

### `haproxy.exposeReplicas.labels`

The [Kubernetes labels :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the `haproxy-replicas` Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `rack: rack-22` |

### `haproxy.exposeReplicas.annotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the `haproxy-replicas` Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `haproxy.containerSecurityContext`

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `privileged: true` |

### `haproxy.podSecurityContext`

A custom [Kubernetes Security Context for a Pod :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>fsGroup: 1001<br>supplementalGroups: [1001, 1002, 1003]</pre> |

### `haproxy.serviceAccountName`

The [Kubernetes Service Account :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for the HAProxy Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona-xtradb-cluster-operator-workload` |

### `haproxy.runtimeClassName`

Name of the [Kubernetes Runtime Class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for the HAProxy Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `image-rc` |

### `haproxy.sidecars.image`

Image for the [custom sidecar container](sidecar.md) for the HAProxy Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `busybox` |

### `haproxy.sidecars.command`

Command for the [custom sidecar container](sidecar.md) for the HAProxy Pod.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["/bin/sh"]` |

### `haproxy.sidecars.args`

Command arguments for the [custom sidecar container](sidecar.md) for the HAProxy Pod.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["-c", "while true; do trap 'exit 0' SIGINT SIGTERM SIGQUIT SIGKILL; done;"]` |

### `haproxy.sidecars.name`

Name of the [custom sidecar container](sidecar.md) for the HAProxy Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-sidecar-1` |

### `haproxy.sidecars.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar HAProxy containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `haproxy.sidecars.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar HAProxy containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `500m` |

### `haproxy.sidecars.resources.limits.memory`

[Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar HAProxy containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `2G` |

### `haproxy.sidecars.resources.limits.cpu`

[Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar HAProxy containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `600m` |

### `haproxy.lifecycle.preStop.exec.command`

Command for the [preStop lifecycle hook :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for HAProxy Pods.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["/bin/true"]` |

### `haproxy.lifecycle.postStart.exec.command`

Command for the [postStart lifecycle hook :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for HAProxy Pods.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["/bin/true"]` |

## <a name="operator-proxysql-section"></a>ProxySQL section

The `proxysql` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains
configuration options for the ProxySQL daemon.

### `proxysql.enabled`

Enables or disables [load balancing with ProxySQL :octicons-link-external-16:](https://www.percona.com/doc/percona-xtradb-cluster/5.7/howtos/proxysql.html) [Services :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/) **ProxySQL can be enabled only at cluster creation time**; otherwise you will be limited to HAProxy load balancing.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `proxysql.size`

The number of the ProxySQL daemons [to provide load balancing :octicons-link-external-16:](https://www.percona.com/doc/percona-xtradb-cluster/5.7/howtos/proxysql.html). It should be 2 or more unless the `spec.unsafeFlags.proxySize` key is set to true.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `2` |

### `proxysql.image`

ProxySQL Docker image to use.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona-xtradb-cluster-operator:{{ release }}-proxysql` |

### `proxysql.imagePullPolicy`

The [policy used to update images :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/images/#updating-images).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Always` |

### `proxysql.imagePullSecrets.name`

The [Kubernetes imagePullSecrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for the ProxySQL image.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `private-registry-credentials` |

### `proxysql.readinessDelaySec`

Adds a delay before a run check to verify the application is ready to process traffic.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `15` |

### `proxysql.livenessDelaySec`

Adds a delay before the run check ensures the application is healthy and capable of processing requests.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `300` |

### `proxysql.configuration`

The [custom ProxySQL configuration file](proxysql-conf.md#passing-custom-configuration-options-to-proxysql) contents.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | |

### `proxysql.annotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `iam.amazonaws.com/role: role-arn` |

### `proxysql.labels`

[Labels are key-value pairs attached to objects :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `rack: rack-22` |

### `proxysql.expose.enabled`

Enable or disable exposing ProxySQL nodes with dedicated IP addresses.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `proxysql.expose.type`

Specifies the type of [Kubernetes Service :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `ClusterIP` |

### `proxysql.expose.loadBalancerClass`

Define the implementation of the load balancer you want to use. This setting enables you to select a custom or specific load balancer class instead of the default one provided by the cloud provider.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `"eks.amazonaws.com/nlb"` |

### `proxysql.externalTrafficPolicy`

Specifies whether Service for ProxySQL should [route external traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness). **This option is deprecated and will be removed in future releases**. Use `proxysql.expose.externalTrafficPolicy` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Local` |

### `proxysql.expose.externalTrafficPolicy`

Specifies whether Service for ProxySQL should [route external traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Local` |

### `proxysql.expose.internalTrafficPolicy`

Specifies whether Service for ProxySQL should [route internal traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Local` |

### `proxysql.serviceAnnotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service. **This option is deprecated and will be removed in future releases**. Use `proxysql.expose.annotations` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `proxysql.expose.annotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `proxysql.serviceLabels`

The [Kubernetes labels :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service. **This option is deprecated and will be removed in future releases**. Use `proxysql.expose.labels` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `rack: rack-22` |

### `proxysql.expose.labels`

The [Kubernetes labels :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `rack: rack-22` |

### `proxysql.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations). **This option is deprecated and will be removed in future releases**. Use `proxysql.expose.loadBalancerSourceRanges` instead.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `10.0.0.0/8` |

### `proxysql.expose.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `10.0.0.0/8` |

### `proxysql.expose.loadBalancerIP`

The static IP-address for the load balancer. **This field is deprecated and scheduled for removal in version 1.21.0.**.

`loadBalancerIP` has been officially deprecated upstream in Kubernetes due to its inconsistent behavior across cloud providers and lack of dual-stack support. As a result, its usage is strongly discouraged.

We recommend using cloud provider-specific annotations instead, as they offer more predictable and portable behavior for managing load balancer IP assignments.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `127.0.0.1` |

### `proxysql.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `proxysql.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `600m` |

### `proxysql.resources.limits.memory`

[Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `proxysql.resources.limits.cpu`

[Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `700m` |

### `proxysql.envVarsSecret`

A secret with environment variables, see [Define environment variables](containers-conf.md) for details.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-env-var-secrets` |

### `proxysql.priorityClassName`

The [Kubernetes Pod Priority class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for ProxySQL.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `high-priority` |

### `proxysql.schedulerName`

The [Kubernetes Scheduler :octicons-link-external-16:](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `mycustom-scheduler` |

### `proxysql.nodeSelector`

[Kubernetes nodeSelector :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `disktype: ssd` |

### `proxysql.topologySpreadConstraints.labelSelector.matchLabels`

The Label selector for the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `app.kubernetes.io/name: percona-xtradb-cluster-operator` |

### `proxysql.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | 1 |

### `proxysql.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `proxysql.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `DoNotSchedule` |

### `proxysql.affinity.topologyKey`

The Operator [topology key :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) node anti-affinity constraint.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `proxysql.affinity.advanced`

If available it makes a [topologyKey :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint to be ignored.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | |

### `proxysql.tolerations`

[Kubernetes Pod tolerations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `node.alpha.kubernetes.io/unreachable` |

### `proxysql.volumeSpec.emptyDir`

The [Kubernetes emptyDir volume :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) The directory created on a node and accessible to the Percona XtraDB Cluster Pod containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `{}` |

### `proxysql.volumeSpec.hostPath.path`

[Kubernetes hostPath :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) The volume that mounts a directory from the host node’s filesystem into your Pod. The path property is required.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `/data` |

### `proxysql.volumeSpec.hostPath.type`

The [Kubernetes hostPath :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath). An optional property for the hostPath.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Directory` |

### `proxysql.volumeSpec.persistentVolumeClaim.storageClassName`

Set the [Kubernetes storage class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Percona XtraDB Cluster [PersistentVolumeClaim :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `standard` |

### `proxysql.volumeSpec.persistentVolumeClaim.accessModes`

The [Kubernetes PersistentVolumeClaim :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) access modes for the Percona XtraDB cluster.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `[ReadWriteOnce]` |

### `proxysql.volumeSpec.resources.requests.storage`

The [Kubernetes PersistentVolumeClaim :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) size for the Percona XtraDB cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `6Gi` |

### `proxysql.podDisruptionBudget.maxUnavailable`

The [Kubernetes podDisruptionBudget :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) specifies the number of Pods from the set unavailable after the eviction.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |

### `proxysql.podDisruptionBudget.minAvailable`

The [Kubernetes podDisruptionBudget :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) Pods that must be available after an eviction.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `0` |

### `proxysql.gracePeriod`

The [Kubernetes grace period when terminating a Pod :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `30` |

### `proxysql.containerSecurityContext`

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `privileged: true` |

### `proxysql.podSecurityContext`

A custom [Kubernetes Security Context for a Pod :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>fsGroup: 1001<br>supplementalGroups: [1001, 1002, 1003]</pre> |

### `proxysql.serviceAccountName`

The [Kubernetes Service Account :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for the ProxySQL Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona-xtradb-cluster-operator-workload` |

### `proxysql.runtimeClassName`

Name of the [Kubernetes Runtime Class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for the ProxySQL Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `image-rc` |

### `proxysql.sidecars.image`

Image for the [custom sidecar container](sidecar.md) for the ProxySQL Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `busybox` |

### `proxysql.sidecars.command`

Command for the [custom sidecar container](sidecar.md) for the ProxySQL Pod.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["/bin/sh"]` |

### `proxysql.sidecars.args`

Command arguments for the [custom sidecar container](sidecar.md) for the ProxySQL Pod.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["-c", "while true; do trap 'exit 0' SIGINT SIGTERM SIGQUIT SIGKILL; done;"]` |

### `proxysql.sidecars.name`

Name of the [custom sidecar container](sidecar.md) for the ProxySQL Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-sidecar-1` |

### `proxysql.sidecars.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar ProxySQL containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `proxysql.sidecars.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar ProxySQL containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `500m` |

### `proxysql.sidecars.resources.limits.memory`

[Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar ProxySQL containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `2G` |

### `proxysql.sidecars.resources.limits.cpu`

[Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the sidecar ProxySQL containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `600m` |

### `proxysql.lifecycle.preStop.exec.command`

Command for the [preStop lifecycle hook :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for ProxySQL Pods.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["/bin/true"]` |

### `proxysql.lifecycle.postStart.exec.command`

Command for the [postStart lifecycle hook :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for ProxySQL Pods.

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `["/bin/true"]` |

## <a name="operator-logcollector-section"></a>Log Collector section

The `logcollector` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
file contains configuration options for [Fluent Bit Log Collector :octicons-link-external-16:](https://fluentbit.io).

### `logcollector.enabled`

Enables or disables [cluster-level logging with Fluent Bit](debug-logs.md#cluster-level-logging).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true` |

### `logcollector.image`

Log Collector Docker image to use.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona-xtradb-cluster-operator:1.6.0-logcollector` |

### `logcollector.configuration`

Additional configuration options (see [Fluent Bit official documentation :octicons-link-external-16:](https://docs.fluentbit.io/manual/administration/configuring-fluent-bit/classic-mode/configuration-file) for details).

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | |

### `logcollector.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Log Collector sidecar container in a Percona XtraDB Cluster Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `100M` |

### `logcollector.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Log collector sidecar container in a Percona XtraDB Cluster Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `200m` |

## <a name="operator-users-section"></a>Users section

The `users` section in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options [to configure custom MySQL users via the Custom Resource](users.md#create-users-in-the-custom-resource).

### `users.name`

The username of the MySQL user.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `my-user` |

### `users.dbs`

Databases that the user authenticates against. If the specified database is not present, the Operator will create it. When no databases specified, it defaults to all databases (*). If the user sets administrative grants like SHUTDOWN, this field has to be omitted because administrative privileges are set on a global level.

| Value type | Example |
| ---------- | ------- |
| :material-application-array-outline: array | <pre>- db1<br>-db2</pre> |

### `users.hosts`

Hosts that the users are supposed to connect from (if not specified, defaults to '%' - similar to what is happening in MySQL). 

| Value type | Example |
| ---------- | ------- |
| :material-application-array-outline: array | `- localhost` |

### `users.passwordSecretRef.name`

Name of the secret that contains the user's password. If not provided, the Operator will create the `<cluster-name>-<custom-user-name>-secret` secret and generate password automatically.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `my-user-password` |

### `users.passwordSecretRef.key`

Key in the secret that corresponds to the value of the user's password (`password` by default).

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `password` |



### `spec.users.withGrantOption`

Defines if the user has grant options.

| Value type | Example |
| ---------- | ------- |
| :material-toggle-switch-outline: boolean  | `false` |

### `users.grants`

Privileges granted to the user.

| Value type | Example |
| ---------- | ------- |
| :material-application-array-outline: array | <pre>- SELECT<br>- DELETE<br>- INSERT</pre> |

## <a name="operator-pmm-section"></a>PMM section

The `pmm` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains configuration
options for Percona Monitoring and Management.

### `pmm.enabled`

Enables or disables [monitoring Percona XtraDB cluster with PMM :octicons-link-external-16:](https://www.percona.com/doc/percona-xtradb-cluster/5.7/manual/monitoring.html).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `pmm.image`

PMM client Docker image to use.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/pmm-client:{{ pmm2recommended }}` |

### `pmm.serverHost`

Address of the PMM Server to collect data from the cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `monitoring-service` |

### pmm.customClusterName

A custom name to define for a cluster. PMM Server uses this name to properly parse the metrics and display them on dashboards. Using a custom name is useful for clusters deployed in different data centers - PMM Server connects them and monitors them as one deployment. Another use case is for clusters deployed with the same name in different namespaces - PMM treats each cluster separately.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `testClusterName` |


### `pmm.serverUser`

The PMM Server User. The PMM Server password should be configured using Secrets.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `admin` |

### `pmm.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a PMM container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `150M` |

### `pmm.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a PMM container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m` |

### `pmm.pxcParams`

Additional parameters which will be passed to the [pmm-admin add mysql :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/setting-up/client/mysql.html) command for `pxc` Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `--disable-tablestats-limit=2000` |

### `pmm.proxysqlParams`

Additional parameters which will be passed to the [pmm-admin add proxysql :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/setting-up/client/proxysql.html) command for `proxysql` Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `--custom-labels=CUSTOM-LABELS` |

### `pmm.containerSecurityContext`

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `privileged: false` |

### `pmm.readinessProbes.initialDelaySeconds`

The number of seconds to wait before performing the first [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `15` |

### `pmm.readinessProbes.timeoutSeconds`

The number of seconds after which the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `15` |

### `pmm.readinessProbes.periodSeconds`

How often to perform the [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/). Measured in seconds.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `30` |

### `pmm.readinessProbes.successThreshold`

The number of successful probes required to mark the container successful.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |

### `pmm.readinessProbes.failureThreshold`

The number of failed probes required to mark the container unready.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `5` |

### `pmm.livenessProbes.initialDelaySeconds`

The number of seconds to wait before performing the first [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `300` |

### `pmm.livenessProbes.timeoutSeconds`

The number of seconds after which the [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `5` |

### `pmm.livenessProbes.periodSeconds`

How often to perform the [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/). Measured in seconds.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `10` |

### `pmm.livenessProbes.successThreshold`

The number of successful probes required to mark the container successful.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |


### `pmm.livenessProbes.failureThreshold`

The number of failed probes required to mark the container unhealthy.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3` |

## <a name="operator-backup-section"></a>Backup section

The `backup` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
file contains the following configuration options for the regular Percona XtraDB Cluster backups.

### `backup.allowParallel`

Enables or disables running backup jobs in parallel. By default, parallel backup jobs are enabled. A user can disable them to prevent the cluster overload.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `true` |

### `backup.image`

The Percona XtraDB cluster Docker image to use for the backup.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona-xtradb-cluster-operator:{{ release }}-backup` |

### `backup.backoffLimit`

The number of retries to make a backup (by default, 10 retries are made).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `6` |

### `backup.activeDeadlineSeconds`

The timeout value in seconds, after which backup job will automatically fail.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3600` |

### backup.startingDeadlineSeconds

The maximum time in seconds for a backup to start. The Operator compares the timestamp of the backup object against the current time. If the backup is not started within the set time, the Operator automatically marks it as "failed". 

You can override this setting for a specific backup in the `deploy/backup/backup.yaml` configuration file.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `300` |

### backup.suspendedDeadlineSeconds

The maximum time in seconds for a backup to remain in a suspended state. The Operator compares the timestamp when the backup job was suspended against the current time. After the defined suspension time expires, the backup is automatically marked as "failed".  

You can override this setting for a specific backup in the `deploy/backup/backup.yaml` configuration file.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1200` |


### `backup.imagePullSecrets.name`

The [Kubernetes imagePullSecrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for the specified image.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `private-registry-credentials` |

### `backup.storages.STORAGE-NAME.type`

The cloud storage type used for backups. Only `s3`, `azure`, and `filesystem` types are supported.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `s3` |

### `backup.storages.STORAGE-NAME.verifyTLS`

Enable or disable verification of the storage server TLS certificate. Disabling it may be useful e.g. to skip TLS verification for private S3-compatible storage with a self-issued certificate.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true` |

### `backup.storages.STORAGE-NAME.s3.credentialsSecret`

The [Kubernetes secret :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name-backup-s3` |

### `backup.storages.STORAGE-NAME.s3.bucket`

The [Amazon S3 bucket :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) name for backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | |

### `backup.storages.STORAGE-NAME.s3.region`

The [AWS region :octicons-link-external-16:](https://docs.aws.amazon.com/general/latest/gr/rande.html) to use. Please note **this option is mandatory** for Amazon and all S3-compatible storages.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `us-east-1` |

### `backup.storages.STORAGE-NAME.s3.endpointUrl`

The endpoint URL of the S3-compatible storage to be used (not needed for the original Amazon S3 cloud).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | |

### `backup.storages.STORAGE-NAME.persistentVolumeClaim.type`

The persistent volume claim storage type.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `filesystem` |

### `backup.storages.STORAGE-NAME.persistentVolumeClaim.storageClassName`

Set the [Kubernetes Storage Class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Percona XtraDB Cluster backups [PersistentVolumeClaims :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) for the `filesystem` storage type.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `standard` |

### `backup.storages.STORAGE-NAME.volume.persistentVolumeClaim.accessModes`

The [Kubernetes PersistentVolume access modes :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes).

| Value type  | Example    |
| ----------- | ---------- |
|:material-application-array-outline: array     | `[ReadWriteOne]` |

### `backup.storages.STORAGE-NAME.volume.persistentVolumeClaim.resources.requests.storage`

Storage size for the PersistentVolume.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `6Gi` |

### `backup.storages.STORAGE-NAME.annotations`

The [Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `iam.amazonaws.com/role: role-arn` |

### `backup.storages.STORAGE-NAME.labels`

[Labels are key-value pairs attached to objects :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `rack: rack-22` |

### `backup.storages.STORAGE-NAME.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraBackup container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `backup.storages.STORAGE-NAME.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraBackup container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `600m` |

### `backup.storages.STORAGE-NAME.resources.limits.memory`

[Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraBackup container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1.5G` |

### `backup.storages.STORAGE-NAME.resources.limits.cpu`

[Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraBackup container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `700m` |

### `backup.storages.STORAGE-NAME.nodeSelector`

[Kubernetes nodeSelector :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `disktype: ssd` |

### `backup.storages.STORAGE-NAME.topologySpreadConstraints.labelSelector.matchLabels`

The Label selector for the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `app.kubernetes.io/name: percona-xtradb-cluster-operator` |

### `backup.storages.STORAGE-NAME.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `1` |

### `backup.storages.STORAGE-NAME.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `backup.storages.STORAGE-NAME.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `DoNotSchedule` |

### `backup.storages.STORAGE-NAME.affinity.nodeAffinity`

The Operator [node affinity :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) constraint.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | |

### `backup.storages.STORAGE-NAME.tolerations`

[Kubernetes Pod tolerations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `backupWorker` |

### `backup.storages.STORAGE-NAME.priorityClassName`

The [Kubernetes Pod priority class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `high-priority` |

### `backup.storages.STORAGE-NAME.schedulerName`

The [Kubernetes Scheduler :octicons-link-external-16:](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `mycustom-scheduler` |

### `backup.storages.STORAGE-NAME.containerSecurityContext`

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `privileged: true` |

### `backup.storages.STORAGE-NAME.podSecurityContext`

A custom [Kubernetes Security Context for a Pod :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>fsGroup: 1001<br>supplementalGroups: [1001, 1002, 1003]</pre> |

### `backup.storages.STORAGE-NAME.containerOptions.env`

The [environment variables set as key-value pairs :octicons-link-external-16:](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) for the backup container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>- name: VERIFY_TLS<br>  value: "false"</pre> |

### `backup.storages.STORAGE-NAME.containerOptions.args.xtrabackup`

Custom [command line options :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/innovation-release/xtrabackup-option-reference.html) for the `xtrabackup` Percona XtraBackup tool.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>- "--someflag=abc"</pre> |

### `backup.storages.STORAGE-NAME.containerOptions.args.xbcloud`

Custom [command line options :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/innovation-release/xbcloud-options.html) for the `xbcloud` Percona XtraBackup tool.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>- "--someflag=abc"</pre> |

### `backup.storages.STORAGE-NAME.containerOptions.args.xbstream`

Custom [command line options :octicons-link-external-16:](https://docs.percona.com/percona-xtrabackup/innovation-release/xbstream-options.html) for the `xbstream` Percona XtraBackup tool.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>- "--someflag=abc"</pre> |

### `backup.schedule.name`

The backup name.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `sat-night-backup` |

### `backup.schedule.schedule`

Scheduled time to make a backup specified in the [crontab format :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0 0 \* \* 6` |

### `backup.schedule.keep`

The amount of most recent backups to store. Older backups are automatically deleted. Set `keep` to zero or completely remove it to disable automatic deletion of backups. **This option is deprecated and will be removed in version 1.21.0**.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3` |

### `backup.schedule.retention.type`

Defines how to retain backups. The type of retention defaults to `count`.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `count` |

### `backup.schedule.retention.count`

Defines the number of backups to store. Older backups are automatically deleted from the cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `count` |

### `backup.schedule.retention.deleteFromStorage`

Defines if the backups are deleted from the cloud storage too. Supported only for AWS and Azure storage. Does not apply to backups made to Persistent Volume.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true` |

### `backup.schedule.storageName`

The name of the storage for the backups configured in the `storages` or `fs-pvc` subsection.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `s3-us-west` |

### `backup.pitr.enabled`

Enables or disables [point-in-time-recovery functionality](backups-pitr.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false` |

### `backup.pitr.storageName`

The name of the storage for the backups configured in the `storages` subsection, which will be reused to store binlog for point-in-time-recovery.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `s3-us-west` |

### `backup.pitr.timeBetweenUploads`

Seconds between running the binlog uploader.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `60` |

### `backup.pitr.timeoutSeconds`

Timeout in seconds for the binlog to be uploaded; the  binlog uploader container will be restarted after exceeding this timeout |

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `60` |

### `backup.pitr.resources.requests.memory`

The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a binlog collector Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0.1G` |

### `backup.pitr.resources.requests.cpu`

[Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a binlog collector Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `100m` |

### `backup.pitr.resources.limits.memory`

[Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a binlog collector Pod.
| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G` |

### `backup.pitr.resources.limits.cpu`

[Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a binlog collector Pod.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `700m` |

## <a name="operator-backupsource-section"></a> PerconaXtraDBClusterRestore Custom Resource options

[Percona XtraDB Cluster Restore](backups-restore.md) options are managed by the Operator via the 
`PerconaXtraDBClusterRestore` [Custom Resource :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) and can be configured via the
[deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/backup/restore.yaml)
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
| requests.memory  | string            | The [Kubernetes memory requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job (the specified value is used if memory limits are not set)   | false    |
| requests.cpu     | string            | [Kubernetes CPU requests :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job (the specified value is used if CPU limits are not set)                | false    |
| limits.memory    | string            | The [Kubernetes memory limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job (if set, the value will be used for memory requests as well) | false    |
| limits.cpu       | string            | [Kubernetes CPU limits :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the restore job (if set, the value will be used for CPU requests as well)              | false    |

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
| storageClass     | string            | The storage class name of the azure blob storage    | false    |
| blockSize        | integer           | The size of a block of data to save and retrieve from the azure blob storage 
| concurrency      | integer           | The number of writers to the same blob

### <a name="operator-restore-pitr-options-section"></a>pitr subsection

| Key              | Value type        | Description                                    | Required |
| ---------------- | ----------------- | ---------------------------------------------- | -------- |
| type             | string            | The type of PITR recover                       | true     |
| date             | string            | The exact date of recovery                     | true     |
| gtid             | string            | The exact GTID for PITR recover                | true     |
| spec.backupSource| [subdoc](operator.md#operator-restore-backupsource-options-section)| Percona XtraDB Cluster backups section     | true  |
| s3               | [subdoc](operator.md#operator-restore-s3-options-section)    | Defines configuration for S3 compatible storages | false |
| azure            | [subdoc](operator.md#operator-restore-azure-options-section) | Defines configuration for azure blob storage     | false |

