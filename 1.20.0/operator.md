> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Custom Resource options reference

Percona Operator for MySQL uses [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) to manage options for the various components of the cluster.

- `PerconaXtraDBCluster` Custom Resource with Percona XtraDB Cluster options,
- `PerconaXtraDBClusterBackup` and `PerconaXtraDBClusterRestore` Custom Resources contain options for Percona XtraBackup used to backup Percona XtraDB Cluster and to restore it from backups.

## PerconaXtraDBCluster Custom Resource options

`PerconaXtraDBCluster` Custom Resource contains options for Percona XtraDB Cluster and can be configured via the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) configuration file.

The metadata part contains the following keys:

- `name` (`cluster1` by default) sets the name of your Percona XtraDB Cluster; it should include only [URL-compatible characters](https://datatracker.ietf.org/doc/html/rfc3986#section-2.3) , not exceed 22 characters, start with an alphabetic character, and end with an alphanumeric character;
- `finalizers` subsection:
  - `percona.com/delete-pods-in-order` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which controls the proper Pods deletion order in case of the cluster deletion event (on by default).
  - `percona.com/delete-pxc-pvc` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes [Persistent Volume Claims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for Percona XtraDB Cluster Pods after the cluster deletion event (off by default). It also deletes user Secrets.
  - `percona.com/delete-proxysql-pvc` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for ProxySQL Pod after the cluster deletion event (off by default).
  - `percona.com/delete-ssl` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes [objects, created for SSL](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/TLS.html) (Secret, certificate, and issuer) after the cluster deletion event (off by default).

The toplevel spec elements of the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) are the following ones:

### `allowUnsafeConfigurations`

Prevents users from configuring a cluster with unsafe parameters such as:

- using an invalid number of Percona XtraDB Cluster nodes, which is:
- less than 3
- more than 5
- an even number (for production use, we recommend a minimum of 3 nodes and a maximum of 5 nodes),
- deploying less than 2 ProxySQL or HAProxy Pods,
- starting the cluster without TLS/SSL certificates.

**This option is deprecated and will be removed in future releases**. Use `unsafeFlags` subsection instead.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `enableCRValidationWebhook`

Enables or disables schema validation before applying `cr.yaml` file (works only in [cluster-wide mode](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/cluster-wide.html) due to [access restrictions](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/faq.html#which-additional-access-permissions-are-used-by-the-custom-resource-validation-webhook)).

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `enableVolumeExpansion`

Enables or disables [automatic storage scaling / volume expansion](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/scaling-storage-resize.html#storage-resizing-with-volume-expansion-capability).

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

This option is deprecated and will be removed in version 1.23.0. Use the [`storageScaling.enableVolumeScaling`](#storagescalingenablevolumescaling) option instead.

### `storageScaling.enableVolumeScaling`

Enables or disables [storage scaling / volume expansion](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/scaling-storage-resize.html#storage-resizing-with-volume-expansion-capability) with Volume Expansion capability.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `storageScaling.enableExternalAutoscaling`

Enables or disables the use of external volume autoscaler. When disabled, the Operator uses its own expansion logic with Volume Expansion capability. Read more about it in [Storage resizing with Volume Expansion capability](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/scaling-storage-resize.html#storage-resizing-with-volume-expansion-capability)

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `storageScaling.autoscaling.enabled`

Enables or disables automatic storage resizing based on user-defined thresholds. Read more about this feature in [Automatic storage resizing](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/scaling-storage-resize.html#automatic-storage-resizing).

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `storageScaling.autoscaling.triggerThresholdPercent`

The percentage of the storage usage that triggers automatic resizing. Minimum value is 50, maximum is 95.

| Value type | Example |
| ---------- | ------- |
| int        | `80`    |

### `storageScaling.autoscaling.growthStep`

The amount to increase the storage during automatic resizing. Default value is 2Gi

| Value type | Example |
| ---------- | ------- |
| string     | `2Gi`   |

### `storageScaling.autoscaling.maxSize`

The maximum size to which storage can be automatically resized.

| Value type | Example |
| ---------- | ------- |
| string     | `10Gi`  |

### `pause`

Pause/resume: setting it to `true` gracefully stops the cluster, and setting it to `false` after shut down starts the cluster back.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `secretsName`

A name for [users secrets](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/users.html#users).

| Value type | Example            |
| ---------- | ------------------ |
| string     | `cluster1-secrets` |

### `crVersion`

Version of the Operator the Custom Resource belongs to.

| Value type | Example  |
| ---------- | -------- |
| string     | `1.20.0` |

### `ignoreAnnotations`

The list of annotations [to be ignored](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/annotations.html#annotations-ignore) by the Operator.

| Value type | Example                  |
| ---------- | ------------------------ |
| subdoc     | `iam.amazonaws.com/role` |

### `ignoreLabels`

The list of labels [to be ignored](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/annotations.html#annotations-ignore) by the Operator.

| Value type | Example |
| ---------- | ------- |
| subdoc     | `rack`  |

### `vaultSecretName`

A secret for the [HashiCorp Vault](https://www.vaultproject.io/) to carry on [Data at Rest Encryption](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/encryption.html).

| Value type | Example                |
| ---------- | ---------------------- |
| string     | `keyring-secret-vault` |

### `sslSecretName`

A secret with TLS certificate generated for *external* communications, see [Transport Layer Security (TLS)](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/TLS.html) for details.

| Value type | Example        |
| ---------- | -------------- |
| string     | `cluster1-ssl` |

### `sslInternalSecretName`

A secret with TLS certificate generated for *internal* communications, see [Transport Layer Security (TLS)](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/TLS.html) for details.

| Value type | Example                 |
| ---------- | ----------------------- |
| string     | `cluster1-ssl-internal` |

### `logCollectorSecretName`

A secret for the [Fluent Bit Log Collector](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/persistent-logging.html).

| Value type | Example                    |
| ---------- | -------------------------- |
| string     | `my-log-collector-secrets` |

### `initImage`

An alternative image for the initial Operator installation. **This option is deprecated and will be removed in future releases**. Use `initContainer.image` instead.

| Value type | Example                                          |
| ---------- | ------------------------------------------------ |
| string     | `percona/percona-xtradb-cluster-operator:1.20.0` |

### `updateStrategy`

A strategy the Operator uses for [upgrades](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/update.html#update-strategies).

| Value type | Example       |
| ---------- | ------------- |
| string     | `SmartUpdate` |

## Unsafe flags section

The `unsafeFlags` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options to prevent users from configuring a cluster with unsafe parameters.

### `unsafeFlags.tls`

Allows users to configure a cluster without TLS/SSL certificates (if `false`, the Operator will detect unsafe parameters, set cluster status to `error`, and print error message in logs).

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `unsafeFlags.pxcSize`

Allows users to configure a cluster with unsafe node counts. For production use, we recommend a minimum of 3 nodes and a maximum of 5 nodes. Even numbers of nodes are not recommended due to quorum voting issues in Galera replication. Higher numbers of nodes (for example, 7) are not recommended due to increased latency from synchronous replication overhead.

Setting this to `true` allows configurations such as:

- Less than 3 nodes
- More than 5 nodes
- Even numbers of nodes

If the option is set to `false`, the Operator detects unsafe parameters, sets clusters status to `error`, and prints error message in logs.

**Note:** Using unsafe configurations may result in reduced availability, split-brain scenarios, or performance degradation. We cannot guarantee proper operation of the cluster with unsafe node counts.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `unsafeFlags.proxySize`

Allows users to configure a cluster with less than 2 ProxySQL or HAProxy Pods (if `false`, the Operator will detect unsafe parameters, set cluster status to `error`, and print error message in logs).

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `unsafeFlags.backupIfUnhealthy`

Allows running a backup even if the cluster status is not `ready`.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

## initContainer configuration section

The `initContainer` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file allows providing an alternative image with various options for the initial Operator installation.

### `initContainer.image`

An alternative image for the initial Operator installation.

| Value type | Example                                          |
| ---------- | ------------------------------------------------ |
| string     | `percona/percona-xtradb-cluster-operator:1.20.0` |

### `initContainer.containerSecurityContext`

A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) for the image used for the initial Operator installation.

| Value type | Example                                              |
| ---------- | ---------------------------------------------------- |
| subdoc     | `privileged: false runAsUser: 1001 runAsGroup: 1001` |

### `initContainer.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `initContainer.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `initContainer.resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `initContainer.resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for an image used while the initial Operator installation.

| Value type | Example |
| ---------- | ------- |
| string     | `1`     |

## TLS (extended cert-manager configuration section)

The `tls` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options for additional customization of the [TLS cert-manager](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/tls-cert-manager.html).

### `tls.enabled`

Enables or disables the [TLS encryption](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/TLS.html). If set to `false`, it also requires setting `unsafeFlags.tls option to`true\`.

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `tls.certValidityDuration`

Validity period for TLS certificates. Minimum required validity is 1 hour. Durations lower than 1 hour are rejected. Setting the duration to exactly 1 hour prevents the Operator from generating the correct certificate object.

| Value type | Example |
| ---------- | ------- |
| string     | `2160h` |

### `tls.caValidityDuration`

Validity period for CA certificate. Minimum accepted duration is 730 hours (approximately 30 days). Setting this value to exactly 730 hours prevents the Operator from generating the correct certificate object. You must set this value greater than 730 hours.

| Value type | Example  |
| ---------- | -------- |
| string     | `26280h` |

### `tls.SANs`

Additional Subject Alternative Name (SAN) domains to add to the TLS certificates. The Operator adds these to both the external and internal certificates, whether the certificates are generated by cert-manager or by the Operator itself.

| Value type | Example                                               |
| ---------- | ----------------------------------------------------- |
| subdoc     | `- “cluster1.example.com” - “*.cluster1.example.com”` |

### `tls.issuerConf.name`

A [cert-manager issuer name](https://cert-manager.io/docs/concepts/issuer/) .

| Value type | Example                     |
| ---------- | --------------------------- |
| string     | `special-selfsigned-issuer` |

### `tls.issuerConf.kind`

A [cert-manager issuer type](https://cert-manager.io/docs/configuration/) .

| Value type | Example         |
| ---------- | --------------- |
| string     | `ClusterIssuer` |

### `tls.issuerConf.group`

A [cert-manager issuer group](https://cert-manager.io/docs/configuration/) . Should be `cert-manager.io` for built-in cert-manager certificate issuers.

| Value type | Example           |
| ---------- | ----------------- |
| string     | `cert-manager.io` |

## Upgrade options section

The `upgradeOptions` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options to control Percona XtraDB Cluster upgrades.

### `upgradeOptions.versionServiceEndpoint`

The Version Service URL used to check versions compatibility for upgrade.

| Value type | Example                     |
| ---------- | --------------------------- |
| string     | `https://check.percona.com` |

### `upgradeOptions.apply`

Specifies how [updates are processed](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/update-automatic.html) by the Operator. `Never` or `Disabled` will completely disable automatic upgrades, otherwise it can be set to `Latest` or `Recommended` or to a specific version string of Percona XtraDB Cluster (e.g. `8.0.19-10.1`) that is wished to be version-locked (so that the user can control the version running, but use automatic upgrades to move between them).

| Value type | Example    |
| ---------- | ---------- |
| string     | `Disabled` |

### `upgradeOptions.schedule`

Scheduled time to check for updates, specified in the [crontab format](https://en.wikipedia.org/wiki/Cron) .

| Value type | Example        |
| ---------- | -------------- |
| string     | `0 2 \* \* \*` |

## PXC section

The `pxc` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains general configuration options for the Percona XtraDB Cluster.

### `pxc.size`

The size of the Percona XtraDB cluster must be 3 or 5 for [High Availability](https://www.percona.com/doc/percona-xtradb-cluster/5.7/intro.html) . Other values are allowed if the `spec.unsafeFlags.pxcSize` key is set to true.

| Value type | Example |
| ---------- | ------- |
| int        | `3`     |

### `pxc.image`

The Docker image of the Percona cluster used (actual image names for Percona XtraDB Cluster 8.0 and Percona XtraDB Cluster 5.7 can be found [in the list of certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html)).

| Value type | Example                                      |
| ---------- | -------------------------------------------- |
| string     | `percona/percona-xtradb-cluster:8.0.45-36.1` |

### `pxc.autoRecovery`

Turns [Automatic Crash Recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/recovery.html#automatic-crash-recovery) on or off.

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `pxc.sstRetryCount`

Limits how many State Snapshot Transfer (SST) retries a joining node can perform before it stops retrying and remains running but unready.

Use this option to avoid endless SST retry loops and make recovery behavior predictable. For details about behavior and recovery steps, see [Limit SST retries](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sst-retry-limit.html).

| Value type        | Example |
| ----------------- | ------- |
| int (minimum `1`) | `3`     |

### `pxc.expose.enabled`

Enable or disable exposing Percona XtraDB Cluster instances with dedicated IP addresses.

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `pxc.expose.type`

The [Kubernetes Service Type](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) used for exposure.

| Value type | Example        |
| ---------- | -------------- |
| string     | `LoadBalancer` |

### `pxc.expose.loadBalancerClass`

Define the implementation of the load balancer you want to use. This setting enables you to select a custom or specific load balancer class instead of the default one provided by the cloud provider.

| Value type | Example                   |
| ---------- | ------------------------- |
| string     | `"eks.amazonaws.com/nlb"` |

### `pxc.expose.trafficPolicy`

Specifies whether Service should [route external traffic to cluster-wide or node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness) **This option is deprecated and will be removed in future releases**. Use `pxc.expose.externalTrafficPolicy` instead.

| Value type | Example |
| ---------- | ------- |
| string     | `Local` |

### `pxc.expose.externalTrafficPolicy`

Specifies whether Service for Percona XtraDB Cluster should [route external traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness).

| Value type | Example |
| ---------- | ------- |
| string     | `Local` |

### `pxc.expose.internalTrafficPolicy`

Specifies whether Service for Percona XtraDB Cluster should [route internal traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type | Example |
| ---------- | ------- |
| string     | `Local` |

### `pxc.expose.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations).

| Value type | Example      |
| ---------- | ------------ |
| string     | `10.0.0.0/8` |

### `pxc.expose.loadBalancerIP`

The static IP-address for the load balancer. **This field is deprecated and scheduled for removal in version 1.21.0.**.

`loadBalancerIP` has been officially deprecated upstream in Kubernetes due to its inconsistent behavior across cloud providers and lack of dual-stack support. As a result, its usage is strongly discouraged.

We recommend using cloud provider-specific annotations instead, as they offer more predictable and portable behavior for managing load balancer IP assignments.

| Value type | Example     |
| ---------- | ----------- |
| string     | `127.0.0.1` |

### `pxc.expose.annotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) .

| Value type | Example                                            |
| ---------- | -------------------------------------------------- |
| string     | `networking.gke.io/load-balancer-type: "Internal"` |

### `pxc.replicationChannels.name`

Name of the replication channel for [cross-site replication](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/replication.html).

| Value type | Example        |
| ---------- | -------------- |
| string     | `pxc1_to_pxc2` |

### `pxc.replicationChannels.isSource`

Should the cluster act as Source (`true`) or Replica (`false`) in [cross-site replication](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/replication.html).

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `pxc.replicationChannels.configuration.sourceRetryCount`

Number of retries Replica should do when the existing connection source fails.

| Value type | Example |
| ---------- | ------- |
| int        | `3`     |

### `pxc.replicationChannels.configuration.sourceConnectRetry`

The interval between reconnection attempts in seconds to be used by Replica when the the existing connection source fails.

| Value type | Example |
| ---------- | ------- |
| int        | `60`    |

### `pxc.replicationChannels.configuration.ssl`

Turns SSL for [replication channels](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/replication.html) on or off.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `pxc.replicationChannels.configuration.sslSkipVerify`

Turns the host name identity verification for SSL-based [replication](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/replication.html) on or off.

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `pxc.replicationChannels.configuration.ca`

The path name of the Certificate Authority (CA) certificate file to be used if the SSL for [replication channels](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/replication.html) is turned on.

| Value type | Example                 |
| ---------- | ----------------------- |
| string     | `/etc/mysql/ssl/ca.crt` |

### `pxc.replicationChannels.sourcesList.host`

For the [cross-site replication](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/replication.html) Replica cluster, this key should contain the hostname or IP address of the Source cluster.

| Value type | Example         |
| ---------- | --------------- |
| string     | `10.95.251.101` |

### `pxc.replicationChannels.sourcesList.port`

For the [cross-site replication](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/replication.html) Replica cluster, this key should contain the Source port number.

| Value type | Example |
| ---------- | ------- |
| int        | `3306`  |

### `pxc.replicationChannels.sourcesList.weight`

For the [cross-site replication](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/replication.html) Replica cluster, this key should contain the Source cluster weight (varies from `1` to `100`, the cluster with the higher number will be selected as the replication source first).

| Value type | Example |
| ---------- | ------- |
| int        | `100`   |

### `pxc.readinessDelaySec`

Adds a delay before a run check to verify the application is ready to process traffic.

This field is deprecated and will be removed in version 1.22.0. Use the [`pxc.readinessProbes.initialDelaySeconds`](#pxcreadinessprobesinitialdelayseconds) option instead.

| Value type | Example |
| ---------- | ------- |
| int        | `15`    |

### `pxc.livenessDelaySec`

Adds a delay before the run check ensures the application is healthy and capable of processing requests.

This field is deprecated and will be removed in version 1.22.0. Use the [`pxc.livenessProbes.initialDelaySeconds`](#pxclivenessprobesinitialdelayseconds) option instead.

| Value type | Example |
| ---------- | ------- |
| int        | `300`   |

### `pxc.configuration`

The `my.cnf` file options to be passed to Percona XtraDB cluster nodes.

| Value type | Example |
| ---------- | ------- |
| string     | \`\`\`  |

### `pxc.imagePullSecrets.name`

The [Kubernetes ImagePullSecret](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) .

| Value type | Example                        |
| ---------- | ------------------------------ |
| string     | `private-registry-credentials` |

### `pxc.priorityClassName`

The [Kubernetes Pod priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) .

| Value type | Example         |
| ---------- | --------------- |
| string     | `high-priority` |

### `pxc.schedulerName`

The [Kubernetes Scheduler](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers) .

| Value type | Example              |
| ---------- | -------------------- |
| string     | `mycustom-scheduler` |

### `pxc.annotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) .

| Value type | Example                            |
| ---------- | ---------------------------------- |
| label      | `iam.amazonaws.com/role: role-arn` |

### `pxc.labels`

[Labels are key-value pairs attached to objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) .

| Value type | Example         |
| ---------- | --------------- |
| label      | `rack: rack-22` |

### `pxc.readinessProbes.initialDelaySeconds`

Number of seconds to wait before performing the first [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `15`    |

### `pxc.readinessProbes.timeoutSeconds`

Number of seconds after which the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type | Example |
| ---------- | ------- |
| int        | `15`    |

### `pxc.readinessProbes.periodSeconds`

How often (in seconds) to perform the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `30`    |

### `pxc.readinessProbes.successThreshold`

Minimum consecutive successes for the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `pxc.readinessProbes.failureThreshold`

When the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before marking the Pod Unready.

| Value type | Example |
| ---------- | ------- |
| int        | `5`     |

### `pxc.livenessProbes.initialDelaySeconds`

Number of seconds to wait before performing the first [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `300`   |

### `pxc.livenessProbes.timeoutSeconds`

Number of seconds after which the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type | Example |
| ---------- | ------- |
| int        | `5`     |

### `pxc.livenessProbes.periodSeconds`

How often (in seconds) to perform the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `10`    |

### `pxc.livenessProbes.successThreshold`

Minimum consecutive successes for the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `pxc.livenessProbes.failureThreshold`

When the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before restarting the container.

| Value type | Example |
| ---------- | ------- |
| int        | `3`     |

### `pxc.envVarsSecret`

A secret with environment variables, see [Define environment variables](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/containers-conf.html) for details.

| Value type | Example              |
| ---------- | -------------------- |
| string     | `my-env-var-secrets` |

### `pxc.mysqlAllocator`

Specifies which memory allocator to use for the MySQL process. Available since Operator version 1.19.0 for Percona XtraDB Cluster 8.0 and later.

Supported values: `jemalloc`, `tcmalloc`. When left empty or omitted, the default `libc` allocator is used.

For how the Operator handles `jemalloc` memory allocator, see [Correct `jemalloc` path on ARM64 based on Percona XtraDB Cluster version](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.20.0.html#version-aware-jemalloc-path-selection-on-arm64-architectures-for-optimized-memory-usage).

| Value type | Example    |
| ---------- | ---------- |
| string     | `jemalloc` |

Warning

If you have `LD_PRELOAD` set in a Secret referenced by `pxc.envVarsSecret`, that value takes precedence over the `mysqlAllocator` option. The Operator checks for `LD_PRELOAD` in the Secret first, and if found, uses that value regardless of the `mysqlAllocator` setting.

### `pxc.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `pxc.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `pxc.resources.requests.ephemeral-storage`

Kubernetes [Ephemeral Storage](https://kubernetes.io/docs/concepts/storage/ephemeral-volumes/) [requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `pxc.resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `pxc.resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type | Example |
| ---------- | ------- |
| string     | `1`     |

### `pxc.resources.limits.ephemeral-storage`

Kubernetes [Ephemeral Storage](https://kubernetes.io/docs/concepts/storage/ephemeral-volumes/) [limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `pxc.nodeSelector`

[Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) .

| Value type | Example         |
| ---------- | --------------- |
| label      | `disktype: ssd` |

### `pxc.topologySpreadConstraints.labelSelector.matchLabels`

The Label selector for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example                                                   |
| ---------- | --------------------------------------------------------- |
| label      | `app.kubernetes.io/name: percona-xtradb-cluster-operator` |

### `pxc.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example |
| ---------- | ------- |
| int        | 1       |

### `pxc.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example                  |
| ---------- | ------------------------ |
| string     | `kubernetes.io/hostname` |

### `pxc.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn’t satisfy the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example         |
| ---------- | --------------- |
| string     | `DoNotSchedule` |

### `pxc.affinity.topologyKey`

The Operator [topology key](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) node anti-affinity constraint.

| Value type | Example                  |
| ---------- | ------------------------ |
| string     | `kubernetes.io/hostname` |

### `pxc.affinity.advanced`

In cases where the Pods require complex tuning the advanced option turns off the `topologyKey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used.

| Value type | Example |
| ---------- | ------- |
| subdoc     |         |

### `pxc.tolerations`

[Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) .

| Value type | Example                                |
| ---------- | -------------------------------------- |
| subdoc     | `node.alpha.kubernetes.io/unreachable` |

### `pxc.podDisruptionBudget.maxUnavailable`

The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) specifies the number of Pods from the set unavailable after the eviction.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `pxc.podDisruptionBudget.minAvailable`

The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) Pods that must be available after an eviction.

| Value type | Example |
| ---------- | ------- |
| int        | `0`     |

### `pxc.volumeSpec.emptyDir`

The [Kubernetes emptyDir volume](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) The directory created on a node and accessible to the Percona XtraDB Cluster Pod containers.

| Value type | Example |
| ---------- | ------- |
| string     | `{}`    |

### `pxc.volumeSpec.hostPath.path`

[Kubernetes hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) The volume that mounts a directory from the host node’s filesystem into your Pod. The path property is required.

| Value type | Example |
| ---------- | ------- |
| string     | `/data` |

### `pxc.volumeSpec.hostPath.type`

The [Kubernetes hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) . An optional property for the hostPath.

| Value type | Example     |
| ---------- | ----------- |
| string     | `Directory` |

### `pxc.volumeSpec.persistentVolumeClaim.storageClassName`

Set the [Kubernetes storage class](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Percona XtraDB Cluster [PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) .

| Value type | Example    |
| ---------- | ---------- |
| string     | `standard` |

### `pxc.volumeSpec.persistentVolumeClaim.accessModes`

The [Kubernetes PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) access modes for the Percona XtraDB cluster.

| Value type | Example           |
| ---------- | ----------------- |
| array      | `[ReadWriteOnce]` |

### `pxc.volumeSpec.persistentVolumeClaim.dataSource.name`

The name of PVC used as a data source to [create the Percona XtraDB Cluster Volumes by cloning](https://kubernetes.io/docs/concepts/storage/volume-pvc-datasource/) .

| Value type | Example             |
| ---------- | ------------------- |
| string     | `new-snapshot-test` |

### `pxc.volumeSpec.persistentVolumeClaim.dataSource.kind`

The [Kubernetes DataSource type](https://kubernetes-csi.github.io/docs/volume-datasources.html#supported-datasources) .

| Value type | Example          |
| ---------- | ---------------- |
| string     | `VolumeSnapshot` |

### `pxc.volumeSpec.persistentVolumeClaim.dataSource.apiGroup`

The [Kubernetes API group](https://kubernetes.io/docs/reference/using-api/#api-groups) to use for [PVC Data Source](https://kubernetes-csi.github.io/docs/volume-datasources.html) .

| Value type | Example                   |
| ---------- | ------------------------- |
| string     | `snapshot.storage.k8s.io` |

### `pxc.extraPVCs.name`

The name of the volume provisioned for the external PersistentVolumeClaim that you mount to Percona XtraDB Cluster pods. In such a way you can attach pre-existing storage volumes to your database instances for use cases such as importing data, sharing configuration files, or accessing external datasets. For more information, see [Add external PersistentVolumeClaims to the Operator](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/external-pvc.html). You can configure external PVCs for both new and running clusters.

| Value type | Example       |
| ---------- | ------------- |
| string     | `shared-data` |

### `pxc.extraPVCs.claimName`

The name of the existing PersistentVolumeClaim to mount. This PVC must exist in the same namespace as your cluster before you apply the configuration. The Operator will mount the existing PVC to all PXC pods.

| Value type | Example           |
| ---------- | ----------------- |
| string     | `my-existing-pvc` |

### `pxc.extraPVCs.mountPath`

The path inside the container where the volume will be mounted.

| Value type | Example            |
| ---------- | ------------------ |
| string     | `/mnt/shared-data` |

### `pxc.extraPVCs.subPath`

An optional folder within the volume to mount. If not specified, the volume’s root is mounted.

| Value type | Example  |
| ---------- | -------- |
| string     | `config` |

### `pxc.extraPVCs.readOnly`

Optional read-only flag. If set to `true`, the volume will be mounted as read-only. Defaults to `false`.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `pxc.gracePeriod`

The [Kubernetes grace period when terminating a Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods) .

| Value type | Example |
| ---------- | ------- |
| int        | `600`   |

### `pxc.containerSecurityContext`

A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type | Example            |
| ---------- | ------------------ |
| subdoc     | `privileged: true` |

### `pxc.podSecurityContext`

A custom [Kubernetes Security Context for a Pod](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type | Example                                                |
| ---------- | ------------------------------------------------------ |
| subdoc     | `fsGroup: 1001 supplementalGroups: [1001, 1002, 1003]` |

### `pxc.serviceAccountName`

The [Kubernetes Service Account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for Percona XtraDB Cluster Pods.

| Value type | Example                                    |
| ---------- | ------------------------------------------ |
| string     | `percona-xtradb-cluster-operator-workload` |

### `pxc.imagePullPolicy`

The [policy used to update images](https://kubernetes.io/docs/concepts/containers/images/#updating-images) .

| Value type | Example  |
| ---------- | -------- |
| string     | `Always` |

### `pxc.runtimeClassName`

Name of the [Kubernetes Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/) for Percona XtraDB Cluster Pods.

| Value type | Example    |
| ---------- | ---------- |
| string     | `image-rc` |

### `pxc.sidecars.image`

Image for the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for Percona XtraDB Cluster Pods.

| Value type | Example   |
| ---------- | --------- |
| string     | `busybox` |

### `pxc.sidecars.command`

Command for the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for Percona XtraDB Cluster Pods.

| Value type | Example       |
| ---------- | ------------- |
| array      | `["/bin/sh"]` |

### `pxc.sidecars.args`

Command arguments for the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for Percona XtraDB Cluster Pods.

| Value type | Example                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| array      | `["-c", "while true; do trap 'exit 0' SIGINT SIGTERM SIGQUIT SIGKILL; done;"]` |

### `pxc.sidecars.name`

Name of the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for Percona XtraDB Cluster Pods.

| Value type | Example        |
| ---------- | -------------- |
| string     | `my-sidecar-1` |

### `pxc.sidecars.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `pxc.sidecars.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container.

| Value type | Example |
| ---------- | ------- |
| string     | `500m`  |

### `pxc.sidecars.resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container.

| Value type | Example |
| ---------- | ------- |
| string     | `2G`    |

### `pxc.sidecars.resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraDB Cluster sidecar container.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `pxc.lifecycle.preStop.exec.command`

Command for the [preStop lifecycle hook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for Percona XtraDB Cluster Pods.

| Value type | Example         |
| ---------- | --------------- |
| array      | `["/bin/true"]` |

### `pxc.lifecycle.postStart.exec.command`

Command for the [postStart lifecycle hook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for Percona XtraDB Cluster Pods.

| Value type | Example         |
| ---------- | --------------- |
| array      | `["/bin/true"]` |

## HAProxy section

The `haproxy` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains configuration options for the HAProxy service.

### `haproxy.enabled`

Enables or disables [load balancing with HAProxy](https://www.percona.com/doc/percona-xtradb-cluster/8.0/howtos/haproxy.html) [Services](https://kubernetes.io/docs/concepts/services-networking/service/) .

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `haproxy.size`

The number of the HAProxy Pods [to provide load balancing](https://www.percona.com/doc/percona-xtradb-cluster/8.0/howtos/haproxy.html) . It should be 2 or more unless the `spec.unsafeFlags.proxySize` key is set to true.

| Value type | Example |
| ---------- | ------- |
| int        | `2`     |

### `haproxy.image`

HAProxy Docker image to use.

| Value type | Example                                                  |
| ---------- | -------------------------------------------------------- |
| string     | `percona/percona-xtradb-cluster-operator:1.20.0-haproxy` |

### `haproxy.imagePullPolicy`

The [policy used to update images](https://kubernetes.io/docs/concepts/containers/images/#updating-images) .

| Value type | Example  |
| ---------- | -------- |
| string     | `Always` |

### `haproxy.imagePullSecrets.name`

The [Kubernetes imagePullSecrets](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for the HAProxy image.

| Value type | Example                        |
| ---------- | ------------------------------ |
| string     | `private-registry-credentials` |

### `haproxy.readinessDelaySec`

Adds a delay before a run check to verify the application is ready to process traffic.

This field is deprecated and will be removed in version 1.22.0. Use the [`haproxy.readinessProbes.initialDelaySeconds`](#haproxyreadinessprobesinitialdelayseconds) option instead.

| Value type | Example |
| ---------- | ------- |
| int        | `15`    |

### `haproxy.livenessDelaySec`

Adds a delay before the run check ensures the application is healthy and capable of processing requests.

This field is deprecated and will be removed in version 1.22.0. Use the [`haproxy.livenessProbes.initialDelaySeconds`](#haproxylivenessprobesinitialdelayseconds) option instead.

| Value type | Example |
| ---------- | ------- |
| int        | `300`   |

### `haproxy.configuration`

The [custom HAProxy configuration file](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/haproxy-conf.html#passing-custom-configuration-options-to-haproxy) contents.

| Value type | Example |
| ---------- | ------- |
| string     |         |

### `haproxy.annotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata.

| Value type | Example                            |
| ---------- | ---------------------------------- |
| label      | `iam.amazonaws.com/role: role-arn` |

### `haproxy.labels`

[Labels are key-value pairs attached to objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) .

| Value type | Example         |
| ---------- | --------------- |
| label      | `rack: rack-22` |

### `haproxy.readinessProbes.initialDelaySeconds`

Number of seconds to wait before performing the first [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `15`    |

### `haproxy.readinessProbes.timeoutSeconds`

Number of seconds after which the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `haproxy.readinessProbes.periodSeconds`

How often (in seconds) to perform the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `5`     |

### `haproxy.readinessProbes.successThreshold`

Minimum consecutive successes for the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `haproxy.readinessProbes.failureThreshold`

When the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) fails, Kubernetes will try this number of times before marking the Pod Unready.

| Value type | Example |
| ---------- | ------- |
| int        | `3`     |

### `haproxy.serviceType`

Specifies the type of [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used for HAProxy. **This option is deprecated and will be removed in future releases**. Use `haproxy.exposePrimary.type` instead.

| Value type | Example     |
| ---------- | ----------- |
| string     | `ClusterIP` |

### `haproxy.externalTrafficPolicy`

Specifies whether Service for HAProxy should [route external traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness). **This option is deprecated and will be removed in future releases**. Use `haproxy.exposePrimary.externalTrafficPolicy` instead.

| Value type | Example   |
| ---------- | --------- |
| string     | `Cluster` |

### `haproxy.livenessProbes.initialDelaySeconds`

Number of seconds to wait before performing the first [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `60`    |

### `haproxy.livenessProbes.timeoutSeconds`

Number of seconds after which the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type | Example |
| ---------- | ------- |
| int        | `5`     |

### `haproxy.livenessProbes.periodSeconds`

How often (in seconds) to perform the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `30`    |

### `haproxy.livenessProbes.successThreshold`

Minimum consecutive successes for the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) to be considered successful after having failed.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `haproxy.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `haproxy.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `haproxy.resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `haproxy.resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main HAProxy container.

| Value type | Example |
| ---------- | ------- |
| string     | `700m`  |

### `haproxy.envVarsSecret`

A secret with environment variables, see [Define environment variables](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/containers-conf.html) for details.

| Value type | Example              |
| ---------- | -------------------- |
| string     | `my-env-var-secrets` |

### `haproxy.priorityClassName`

The [Kubernetes Pod Priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for HAProxy.

| Value type | Example         |
| ---------- | --------------- |
| string     | `high-priority` |

### `haproxy.schedulerName`

The [Kubernetes Scheduler](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers) .

| Value type | Example              |
| ---------- | -------------------- |
| string     | `mycustom-scheduler` |

### `haproxy.nodeSelector`

[Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) .

| Value type | Example         |
| ---------- | --------------- |
| label      | `disktype: ssd` |

### `haproxy.sidecarResources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for default sidecar containers such as `haproxy-monit` running inside HAProxy Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `haproxy.sidecarResources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for default sidecar containers such as `haproxy-monit` running inside HAProxy Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `500m`  |

### `haproxy.sidecarResources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for default sidecar containers such as `haproxy-monit` running inside HAProxy Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `2G`    |

### `haproxy.sidecarResources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for default sidecar containers such as `haproxy-monit` running inside HAProxy Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `haproxy.topologySpreadConstraints.labelSelector.matchLabels`

The Label selector for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example                                                   |
| ---------- | --------------------------------------------------------- |
| label      | `app.kubernetes.io/name: percona-xtradb-cluster-operator` |

### `haproxy.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example |
| ---------- | ------- |
| int        | 1       |

### `haproxy.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example                  |
| ---------- | ------------------------ |
| string     | `kubernetes.io/hostname` |

### `haproxy.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn’t satisfy the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example         |
| ---------- | --------------- |
| string     | `DoNotSchedule` |

### `haproxy.affinity.topologyKey`

The Operator [topology key](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) node anti-affinity constraint.

| Value type | Example                  |
| ---------- | ------------------------ |
| string     | `kubernetes.io/hostname` |

### `haproxy.affinity.advanced`

If available it makes a [topologyKey](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint to be ignored.

| Value type | Example |
| ---------- | ------- |
| subdoc     |         |

### `haproxy.tolerations`

[Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) .

| Value type | Example                                |
| ---------- | -------------------------------------- |
| subdoc     | `node.alpha.kubernetes.io/unreachable` |

### `haproxy.extraPVCs.name`

The name of the volume provisioned for the external PersistentVolumeClaim that you mount to HAProxy pods. In such a way you can attach pre-existing storage volumes to your database instances for use cases such as importing data, sharing configuration files, or accessing external datasets. For more information, see [Add external PersistentVolumeClaims to the Operator](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/external-pvc.html). You can configure external PVCs for both new and running clusters.

| Value type | Example       |
| ---------- | ------------- |
| string     | `shared-data` |

### `haproxy.extraPVCs.claimName`

The name of the existing PersistentVolumeClaim to mount. This PVC must exist in the same namespace as your cluster before you apply the configuration. The Operator will mount the existing PVC to all HAProxy pods.

| Value type | Example           |
| ---------- | ----------------- |
| string     | `my-existing-pvc` |

### `haproxy.extraPVCs.mountPath`

The path inside the container where the volume will be mounted.

| Value type | Example            |
| ---------- | ------------------ |
| string     | `/mnt/shared-data` |

### `haproxy.extraPVCs.subPath`

An optional folder within the volume to mount. If not specified, the volume’s root is mounted.

| Value type | Example  |
| ---------- | -------- |
| string     | `config` |

### `haproxy.extraPVCs.readOnly`

Optional read-only flag. If set to `true`, the volume will be mounted as read-only. Defaults to `false`.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `haproxy.podDisruptionBudget.maxUnavailable`

The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) specifies the number of Pods from the set unavailable after the eviction.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `haproxy.podDisruptionBudget.minAvailable`

The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) Pods that must be available after an eviction.

| Value type | Example |
| ---------- | ------- |
| int        | `0`     |

### `haproxy.gracePeriod`

The [Kubernetes grace period when terminating a Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods) .

| Value type | Example |
| ---------- | ------- |
| int        | `30`    |

### `haproxy.exposePrimary.enabled`

Enables or disables the HAProxy primary instance Service. This field is deprecated starting with the Operator version 1.17.0.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `haproxy.exposePrimary.type`

Specifies the type of [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used for HAProxy primary instance Service.

| Value type | Example     |
| ---------- | ----------- |
| string     | `ClusterIP` |

### `haproxy.exposePrimary.loadBalancerClass`

Define the implementation of the load balancer you want to use. This setting enables you to select a custom or specific load balancer class instead of the default one provided by the cloud provider.

| Value type | Example                   |
| ---------- | ------------------------- |
| string     | `"eks.amazonaws.com/nlb"` |

### `haproxy.exposePrimary.externalTrafficPolicy`

Specifies whether Service for HAProxy should [route external traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness).

| Value type | Example   |
| ---------- | --------- |
| string     | `Cluster` |

### `haproxy.exposePrimary.internalTrafficPolicy`

Specifies whether Service for HAProxy primary instance should [route internal traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type | Example   |
| ---------- | --------- |
| string     | `Cluster` |

### `haproxy.exposePrimary.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations).

| Value type | Example      |
| ---------- | ------------ |
| string     | `10.0.0.0/8` |

### `haproxy.exposePrimary.loadBalancerIP`

The static IP-address for the load balancer. **This field is deprecated and scheduled for removal in version 1.21.0.**.

`loadBalancerIP` has been officially deprecated upstream in Kubernetes due to its inconsistent behavior across cloud providers and lack of dual-stack support. As a result, its usage is strongly discouraged.

We recommend using cloud provider-specific annotations instead, as they offer more predictable and portable behavior for managing load balancer IP assignments.

| Value type | Example     |
| ---------- | ----------- |
| string     | `127.0.0.1` |

### `haproxy.serviceLabels`

The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service. **This option is deprecated and will be removed in future releases**. Use `haproxy.exposePrimary.labels` instead.

| Value type | Example         |
| ---------- | --------------- |
| label      | `rack: rack-22` |

### `haproxy.exposePrimary.labels`

The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service.

| Value type | Example         |
| ---------- | --------------- |
| label      | `rack: rack-22` |

### `haproxy.serviceAnnotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service. **This option is deprecated and will be removed in future releases**. Use `haproxy.exposePrimary.annotations` instead.

| Value type | Example                                                              |
| ---------- | -------------------------------------------------------------------- |
| string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `haproxy.exposePrimary.annotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service.

| Value type | Example                                                              |
| ---------- | -------------------------------------------------------------------- |
| string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `haproxy.replicasServiceEnabled`

Enables or disables `haproxy-replicas` Service. This Service (on by default) forwards requests to all Percona XtraDB Cluster instances, and it *should not be used for write requests*! **This option is deprecated and will be removed in future releases**. Use `haproxy.exposeReplicas.enabled` instead.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `haproxy.exposeReplicas.enabled`

Enables or disables `haproxy-replicas` Service. This Service default forwards requests to all Percona XtraDB Cluster instances, and it **should not be used for write requests**!

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `haproxy.exposeReplicas.onlyReaders`

Setting it to `true` excludes current MySQL primary instance (writer) from the list of Pods, to which `haproxy-replicas` Service directs connections, leaving only the reader instances.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `haproxy.exposeReplicas.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, no limitations).

| Value type | Example      |
| ---------- | ------------ |
| string     | `10.0.0.0/8` |

### `haproxy.exposeReplicas.loadBalancerIP`

The static IP-address for the replicas load balancer. **This field is deprecated and scheduled for removal in version 1.21.0.**.

`loadBalancerIP` has been officially deprecated upstream in Kubernetes due to its inconsistent behavior across cloud providers and lack of dual-stack support. As a result, its usage is strongly discouraged.

We recommend using cloud provider-specific annotations instead, as they offer more predictable and portable behavior for managing load balancer IP assignments.

| Value type | Example     |
| ---------- | ----------- |
| string     | `127.0.0.1` |

### `haproxy.exposeReplicas.type`

Specifies the type of [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used for HAProxy replicas.

| Value type | Example     |
| ---------- | ----------- |
| string     | `ClusterIP` |

### `haproxy.exposeReplicas.loadBalancerClass`

Define the implementation of the load balancer you want to use. This setting enables you to select a custom or specific load balancer class instead of the default one provided by the cloud provider.

| Value type | Example                   |
| ---------- | ------------------------- |
| string     | `"eks.amazonaws.com/nlb"` |

### `haproxy.replicasExternalTrafficPolicy`

Specifies whether Service for HAProxy replicas should [route external traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness). **This option is deprecated and will be removed in future releases**. Use `haproxy.exposeReplicas.externalTrafficPolicy` instead.

| Value type | Example   |
| ---------- | --------- |
| string     | `Cluster` |

### `haproxy.exposeReplicas.externalTrafficPolicy`

Specifies whether Service for HAProxy replicas should [route external traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness).

| Value type | Example   |
| ---------- | --------- |
| string     | `Cluster` |

### `haproxy.exposeReplicas.internalTrafficPolicy`

Specifies whether Service for HAProxy replicas should [route internal traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type | Example   |
| ---------- | --------- |
| string     | `Cluster` |

### `haproxy.exposeReplicas.labels`

The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the `haproxy-replicas` Service.

| Value type | Example         |
| ---------- | --------------- |
| label      | `rack: rack-22` |

### `haproxy.exposeReplicas.annotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the `haproxy-replicas` Service.

| Value type | Example                                                              |
| ---------- | -------------------------------------------------------------------- |
| string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `haproxy.healthCheck.interval`

Interval in milliseconds between HAProxy health checks. The minimum value is 1000 milliseconds.

| Value type | Example |
| ---------- | ------- |
| int        | `10000` |

### `haproxy.healthCheck.fall`

Number of consecutive failed health checks before HAProxy marks a server as down. The minimum value is 1.

| Value type | Example |
| ---------- | ------- |
| int        | `2`     |

### `haproxy.healthCheck.rise`

Number of consecutive successful health checks before HAProxy marks a server as up and running. The minimum value is 1.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `haproxy.containerSecurityContext`

A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type | Example            |
| ---------- | ------------------ |
| subdoc     | `privileged: true` |

### `haproxy.podSecurityContext`

A custom [Kubernetes Security Context for a Pod](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type | Example                                                |
| ---------- | ------------------------------------------------------ |
| subdoc     | `fsGroup: 1001 supplementalGroups: [1001, 1002, 1003]` |

### `haproxy.serviceAccountName`

The [Kubernetes Service Account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for the HAProxy Pod.

| Value type | Example                                    |
| ---------- | ------------------------------------------ |
| string     | `percona-xtradb-cluster-operator-workload` |

### `haproxy.runtimeClassName`

Name of the [Kubernetes Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/) for the HAProxy Pod.

| Value type | Example    |
| ---------- | ---------- |
| string     | `image-rc` |

### `haproxy.sidecars.image`

Image for the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for the HAProxy Pod.

| Value type | Example   |
| ---------- | --------- |
| string     | `busybox` |

### `haproxy.sidecars.command`

Command for the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for the HAProxy Pod.

| Value type | Example       |
| ---------- | ------------- |
| array      | `["/bin/sh"]` |

### `haproxy.sidecars.args`

Command arguments for the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for the HAProxy Pod.

| Value type | Example                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| array      | `["-c", "while true; do trap 'exit 0' SIGINT SIGTERM SIGQUIT SIGKILL; done;"]` |

### `haproxy.sidecars.name`

Name of the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for the HAProxy Pod.

| Value type | Example        |
| ---------- | -------------- |
| string     | `my-sidecar-1` |

### `haproxy.sidecars.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for custom sidecar containers running inside the HAProxy Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `haproxy.sidecars.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for custom sidecar containers running inside the HAProxy Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `500m`  |

### `haproxy.sidecars.resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for custom sidecar containers running inside the HAProxy Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `2G`    |

### `haproxy.sidecars.resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for custom sidecar containers running inside the HAProxy Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `haproxy.lifecycle.preStop.exec.command`

Command for the [preStop lifecycle hook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for HAProxy Pods.

| Value type | Example         |
| ---------- | --------------- |
| array      | `["/bin/true"]` |

### `haproxy.lifecycle.postStart.exec.command`

Command for the [postStart lifecycle hook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for HAProxy Pods.

| Value type | Example         |
| ---------- | --------------- |
| array      | `["/bin/true"]` |

## ProxySQL section

The `proxysql` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains configuration options for the ProxySQL daemon.

### `proxysql.enabled`

Enables or disables [load balancing with ProxySQL](https://docs.percona.com/percona-xtradb-cluster/8.4/load-balance-proxysql.html) Services.

You can also switch to ProxySQL on a running cluster starting with Operator 1.19.0. See [Switching from one proxy to another](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/proxy-switching.html).

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `proxysql.size`

The number of the ProxySQL daemons [to provide load balancing](https://www.percona.com/doc/percona-xtradb-cluster/5.7/howtos/proxysql.html) . It should be 2 or more unless the `spec.unsafeFlags.proxySize` key is set to true.

| Value type | Example |
| ---------- | ------- |
| int        | `2`     |

### `proxysql.image`

ProxySQL Docker image to use.

| Value type | Example                                                   |
| ---------- | --------------------------------------------------------- |
| string     | `percona/percona-xtradb-cluster-operator:1.20.0-proxysql` |

### `proxysql.imagePullPolicy`

The [policy used to update images](https://kubernetes.io/docs/concepts/containers/images/#updating-images) .

| Value type | Example  |
| ---------- | -------- |
| string     | `Always` |

### `proxysql.imagePullSecrets.name`

The [Kubernetes imagePullSecrets](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for the ProxySQL image.

| Value type | Example                        |
| ---------- | ------------------------------ |
| string     | `private-registry-credentials` |

### `proxysql.configuration`

The [custom ProxySQL configuration file](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/proxysql-conf.html#passing-custom-configuration-options-to-proxysql) contents.

| Value type | Example |
| ---------- | ------- |
| string     |         |

### `proxysql.annotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata.

| Value type | Example                            |
| ---------- | ---------------------------------- |
| label      | `iam.amazonaws.com/role: role-arn` |

### `proxysql.labels`

[Labels are key-value pairs attached to objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) .

| Value type | Example         |
| ---------- | --------------- |
| label      | `rack: rack-22` |

### `proxysql.expose.enabled`

Enable or disable exposing ProxySQL nodes with dedicated IP addresses.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `proxysql.expose.type`

Specifies the type of [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be used.

| Value type | Example     |
| ---------- | ----------- |
| string     | `ClusterIP` |

### `proxysql.expose.loadBalancerClass`

Define the implementation of the load balancer you want to use. This setting enables you to select a custom or specific load balancer class instead of the default one provided by the cloud provider.

| Value type | Example                   |
| ---------- | ------------------------- |
| string     | `"eks.amazonaws.com/nlb"` |

### `proxysql.externalTrafficPolicy`

Specifies whether Service for ProxySQL should [route external traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness). **This option is deprecated and will be removed in future releases**. Use `proxysql.expose.externalTrafficPolicy` instead.

| Value type | Example |
| ---------- | ------- |
| string     | `Local` |

### `proxysql.expose.externalTrafficPolicy`

Specifies whether Service for ProxySQL should [route external traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip) (it can influence the load balancing effectiveness).

| Value type | Example |
| ---------- | ------- |
| string     | `Local` |

### `proxysql.expose.internalTrafficPolicy`

Specifies whether Service for ProxySQL should [route internal traffic to cluster-wide or to node-local endpoints](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type | Example |
| ---------- | ------- |
| string     | `Local` |

### `proxysql.serviceAnnotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service. **This option is deprecated and will be removed in future releases**. Use `proxysql.expose.annotations` instead.

| Value type | Example                                                              |
| ---------- | -------------------------------------------------------------------- |
| label      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `proxysql.expose.annotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the load balancer Service.

| Value type | Example                                                              |
| ---------- | -------------------------------------------------------------------- |
| label      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp` |

### `proxysql.serviceLabels`

The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service. **This option is deprecated and will be removed in future releases**. Use `proxysql.expose.labels` instead.

| Value type | Example         |
| ---------- | --------------- |
| label      | `rack: rack-22` |

### `proxysql.expose.labels`

The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the load balancer Service.

| Value type | Example         |
| ---------- | --------------- |
| label      | `rack: rack-22` |

### `proxysql.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations). **This option is deprecated and will be removed in future releases**. Use `proxysql.expose.loadBalancerSourceRanges` instead.

| Value type | Example      |
| ---------- | ------------ |
| string     | `10.0.0.0/8` |

### `proxysql.expose.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations).

| Value type | Example      |
| ---------- | ------------ |
| string     | `10.0.0.0/8` |

### `proxysql.expose.loadBalancerIP`

The static IP-address for the load balancer. **This field is deprecated and scheduled for removal in version 1.21.0.**.

`loadBalancerIP` has been officially deprecated upstream in Kubernetes due to its inconsistent behavior across cloud providers and lack of dual-stack support. As a result, its usage is strongly discouraged.

We recommend using cloud provider-specific annotations instead, as they offer more predictable and portable behavior for managing load balancer IP assignments.

| Value type | Example     |
| ---------- | ----------- |
| string     | `127.0.0.1` |

### `proxysql.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `proxysql.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `proxysql.resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `proxysql.resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the main ProxySQL container.

| Value type | Example |
| ---------- | ------- |
| string     | `700m`  |

### `proxysql.envVarsSecret`

A secret with environment variables, see [Define environment variables](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/containers-conf.html) for details.

| Value type | Example              |
| ---------- | -------------------- |
| string     | `my-env-var-secrets` |

### `proxysql.scheduler.enabled`

Enables the external ProxySQL scheduler for even distribution of read/write traffic across Percona XtraDB Cluster nodes. Available since Operator version 1.19.0

See [ProxySQL scheduler](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/proxysql-conf.html#proxysql-scheduler-tech-preview) for more information.

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `proxysql.scheduler.writerIsAlsoReader`

Controls whether the writer node is included in the read pool. When set to `false`, the writer node is excluded from receiving read queries. If the cluster loses its last reader, the writer is automatically elected as a reader regardless of this setting. Available since Operator version 1.19.0

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `proxysql.scheduler.checkTimeoutMilliseconds`

The maximum time (in milliseconds) allowed for checking a backend PXC node. If checking a node exceeds this timeout, it is not processed. Available since Operator version 1.19.0

| Value type | Example |
| ---------- | ------- |
| int        | `2000`  |

### `proxysql.scheduler.successThreshold`

The number of successful checks required before a failed node is restored to the pool. Available since Operator version 1.19.0

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `proxysql.scheduler.failureThreshold`

The number of failed checks required before a node is marked as DOWN and removed from the pool. Available since Operator version 1.19.0

| Value type | Example |
| ---------- | ------- |
| int        | `3`     |

### `proxysql.scheduler.pingTimeoutMilliseconds`

The connection timeout (in milliseconds) used to test the connection to a PXC server. Available since Operator version 1.19.0

| Value type | Example |
| ---------- | ------- |
| int        | `1000`  |

### `proxysql.scheduler.nodeCheckIntervalMilliseconds`

How frequently (in milliseconds) the scheduler runs to check node health and update the server configuration. Available since Operator version 1.19.0

| Value type | Example |
| ---------- | ------- |
| int        | `2000`  |

### `proxysql.scheduler.maxConnections`

The maximum number of connections from ProxySQL to each backend PXC server. Available since Operator version 1.19.0

| Value type | Example |
| ---------- | ------- |
| int        | `1000`  |

### `proxysql.priorityClassName`

The [Kubernetes Pod Priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for ProxySQL.

| Value type | Example         |
| ---------- | --------------- |
| string     | `high-priority` |

### `proxysql.schedulerName`

The [Kubernetes Scheduler](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers) .

| Value type | Example              |
| ---------- | -------------------- |
| string     | `mycustom-scheduler` |

### `proxysql.nodeSelector`

[Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) .

| Value type | Example         |
| ---------- | --------------- |
| label      | `disktype: ssd` |

### `proxysql.sidecarResources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for default sidecar containers such as `proxysql-monit` running inside ProxySQL Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `proxysql.sidecarResources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for default sidecar containers such as `proxysql-monit` running inside ProxySQL Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `500m`  |

### `proxysql.sidecarResources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for default sidecar containers such as `proxysql-monit` running inside ProxySQL Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `2G`    |

### `proxysql.sidecarResources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for default sidecar containers such as `proxysql-monit` running inside ProxySQL Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `proxysql.topologySpreadConstraints.labelSelector.matchLabels`

The Label selector for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example                                                   |
| ---------- | --------------------------------------------------------- |
| label      | `app.kubernetes.io/name: percona-xtradb-cluster-operator` |

### `proxysql.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example |
| ---------- | ------- |
| int        | 1       |

### `proxysql.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example                  |
| ---------- | ------------------------ |
| string     | `kubernetes.io/hostname` |

### `proxysql.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn’t satisfy the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example         |
| ---------- | --------------- |
| string     | `DoNotSchedule` |

### `proxysql.affinity.topologyKey`

The Operator [topology key](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) node anti-affinity constraint.

| Value type | Example                  |
| ---------- | ------------------------ |
| string     | `kubernetes.io/hostname` |

### `proxysql.affinity.advanced`

If available it makes a [topologyKey](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint to be ignored.

| Value type | Example |
| ---------- | ------- |
| subdoc     |         |

### `proxysql.tolerations`

[Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) .

| Value type | Example                                |
| ---------- | -------------------------------------- |
| subdoc     | `node.alpha.kubernetes.io/unreachable` |

### `proxysql.volumeSpec.emptyDir`

The [Kubernetes emptyDir volume](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) The directory created on a node and accessible to the Percona XtraDB Cluster Pod containers.

| Value type | Example |
| ---------- | ------- |
| string     | `{}`    |

### `proxysql.volumeSpec.hostPath.path`

[Kubernetes hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) The volume that mounts a directory from the host node’s filesystem into your Pod. The path property is required.

| Value type | Example |
| ---------- | ------- |
| string     | `/data` |

### `proxysql.volumeSpec.hostPath.type`

The [Kubernetes hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) . An optional property for the hostPath.

| Value type | Example     |
| ---------- | ----------- |
| string     | `Directory` |

### `proxysql.volumeSpec.persistentVolumeClaim.storageClassName`

Set the [Kubernetes storage class](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Percona XtraDB Cluster [PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) .

| Value type | Example    |
| ---------- | ---------- |
| string     | `standard` |

### `proxysql.volumeSpec.persistentVolumeClaim.accessModes`

The [Kubernetes PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) access modes for the Percona XtraDB cluster.

| Value type | Example           |
| ---------- | ----------------- |
| array      | `[ReadWriteOnce]` |

### `proxysql.volumeSpec.resources.requests.storage`

The [Kubernetes PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) size for the Percona XtraDB cluster.

| Value type | Example |
| ---------- | ------- |
| string     | `6Gi`   |

### `proxysql.extraPVCs.name`

The name of the volume provisioned for the external PersistentVolumeClaim that you mount to ProxySQL pods. In such a way you can attach pre-existing storage volumes to your database instances for use cases such as importing data, sharing configuration files, or accessing external datasets. For more information, see [Add external PersistentVolumeClaims to the Operator](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/external-pvc.html). You can configure external PVCs for both new and running clusters.

| Value type | Example       |
| ---------- | ------------- |
| string     | `shared-data` |

### `proxysql.extraPVCs.claimName`

The name of the existing PersistentVolumeClaim to mount. This PVC must exist in the same namespace as your cluster before you apply the configuration. The Operator will mount the existing PVC to all ProxySQL pods.

| Value type | Example           |
| ---------- | ----------------- |
| string     | `my-existing-pvc` |

### `proxysql.extraPVCs.mountPath`

The path inside the container where the volume will be mounted.

| Value type | Example            |
| ---------- | ------------------ |
| string     | `/mnt/shared-data` |

### `proxysql.extraPVCs.subPath`

An optional folder within the volume to mount. If not specified, the volume’s root is mounted.

| Value type | Example  |
| ---------- | -------- |
| string     | `config` |

### `proxysql.extraPVCs.readOnly`

Optional read-only flag. If set to `true`, the volume will be mounted as read-only. Defaults to `false`.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `proxysql.podDisruptionBudget.maxUnavailable`

The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) specifies the number of Pods from the set unavailable after the eviction.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `proxysql.podDisruptionBudget.minAvailable`

The [Kubernetes podDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#specifying-a-poddisruptionbudget) Pods that must be available after an eviction.

| Value type | Example |
| ---------- | ------- |
| int        | `0`     |

### `proxysql.gracePeriod`

The [Kubernetes grace period when terminating a Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods) .

| Value type | Example |
| ---------- | ------- |
| int        | `30`    |

### `proxysql.containerSecurityContext`

A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type | Example            |
| ---------- | ------------------ |
| subdoc     | `privileged: true` |

### `proxysql.podSecurityContext`

A custom [Kubernetes Security Context for a Pod](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type | Example                                                |
| ---------- | ------------------------------------------------------ |
| subdoc     | `fsGroup: 1001 supplementalGroups: [1001, 1002, 1003]` |

### `proxysql.serviceAccountName`

The [Kubernetes Service Account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) for the ProxySQL Pod.

| Value type | Example                                    |
| ---------- | ------------------------------------------ |
| string     | `percona-xtradb-cluster-operator-workload` |

### `proxysql.runtimeClassName`

Name of the [Kubernetes Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/) for the ProxySQL Pod.

| Value type | Example    |
| ---------- | ---------- |
| string     | `image-rc` |

### `proxysql.sidecars.image`

Image for the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for the ProxySQL Pod.

| Value type | Example   |
| ---------- | --------- |
| string     | `busybox` |

### `proxysql.sidecars.command`

Command for the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for the ProxySQL Pod.

| Value type | Example       |
| ---------- | ------------- |
| array      | `["/bin/sh"]` |

### `proxysql.sidecars.args`

Command arguments for the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for the ProxySQL Pod.

| Value type | Example                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| array      | `["-c", "while true; do trap 'exit 0' SIGINT SIGTERM SIGQUIT SIGKILL; done;"]` |

### `proxysql.sidecars.name`

Name of the [custom sidecar container](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for the ProxySQL Pod.

| Value type | Example        |
| ---------- | -------------- |
| string     | `my-sidecar-1` |

### `proxysql.sidecars.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the custom sidecar containers deployed in ProxySQL Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `proxysql.sidecars.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the custom sidecar containers deployed in ProxySQL Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `500m`  |

### `proxysql.sidecars.resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the custom sidecar containers deployed in ProxySQL Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `2G`    |

### `proxysql.sidecars.resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for the custom sidecar containers deployed in ProxySQL Pods.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `proxysql.sidecars.securityContext`

A custom [Kubernetes Security Context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-container) for a sidecar container to be used instead of the default one.

| Value type | Example           |
| ---------- | ----------------- |
| subdoc     | privileged: false |

### `proxysql.lifecycle.preStop.exec.command`

Command for the [preStop lifecycle hook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for ProxySQL Pods.

| Value type | Example         |
| ---------- | --------------- |
| array      | `["/bin/true"]` |

### `proxysql.lifecycle.postStart.exec.command`

Command for the [postStart lifecycle hook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/) for ProxySQL Pods.

| Value type | Example         |
| ---------- | --------------- |
| array      | `["/bin/true"]` |

## Log Collector section

The `logcollector` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains configuration options for [Fluent Bit Log Collector](https://fluentbit.io) .

### `logcollector.enabled`

Enables or disables [cluster-level logging with Fluent Bit](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/persistent-logging.html).

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `logcollector.image`

Log Collector Docker image to use.

| Value type | Example                                                      |
| ---------- | ------------------------------------------------------------ |
| string     | `percona/percona-xtradb-cluster-operator:1.6.0-logcollector` |

### `logcollector.configuration`

Additional configuration options (see [Fluent Bit official documentation](https://docs.fluentbit.io/manual/administration/configuring-fluent-bit/classic-mode/configuration-file) for details).

| Value type | Example |
| ---------- | ------- |
| subdoc     |         |

### `logcollector.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Log Collector sidecar container in a Percona XtraDB Cluster Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `100M`  |

### `logcollector.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Log collector sidecar container in a Percona XtraDB Cluster Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `200m`  |

### `logcollector.logRotate.schedule`

Cron expression for the logrotate schedule. This field uses a 6-field cron format, including seconds (default: `0 0 0 * * *`).

| Value type | Example         |
| ---------- | --------------- |
| string     | `0 */5 * * * *` |

### `logcollector.logRotate.configuration`

Overrides the default logrotate configuration used by the log collector sidecar container. You must provide the full configuration because the Operator replaces the default configuration with the one you provide.

| Value type | Example |
| ---------- | ------- |
| subdoc     |         |

### `logcollector.logRotate.extraConfig.name`

References a ConfigMap containing additional logrotate configuration. The key name must end with `.conf`.

| Value type | Example               |
| ---------- | --------------------- |
| string     | `my-logrotate-config` |

## Users section

The `users` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains various configuration options [to configure custom MySQL users via the Custom Resource](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/users.html#create-users-in-the-custom-resource).

### `users.name`

The username of the MySQL user.

| Value type | Example   |
| ---------- | --------- |
| string     | `my-user` |

### `users.dbs`

Databases that the user authenticates against. If the specified database is not present, the Operator will create it. When no databases specified, it defaults to all databases (\*). If the user sets administrative grants like SHUTDOWN, this field has to be omitted because administrative privileges are set on a global level.

| Value type | Example      |
| ---------- | ------------ |
| array      | `- db1 -db2` |

### `users.hosts`

Hosts that the users are supposed to connect from (if not specified, defaults to ‘%’ - similar to what is happening in MySQL).

| Value type | Example       |
| ---------- | ------------- |
| array      | `- localhost` |

### `users.passwordSecretRef.name`

Name of the secret that contains the user’s password. If not provided, the Operator will create the `<cluster-name>-custom-user-secret` secret and generate password automatically.

| Value type | Example            |
| ---------- | ------------------ |
| string     | `my-user-password` |

### `users.passwordSecretRef.key`

Key in the secret that corresponds to the value of the user’s password (`password` by default).

| Value type | Example    |
| ---------- | ---------- |
| string     | `password` |

### `spec.users.withGrantOption`

Defines if the user has grant options.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `users.grants`

Privileges granted to the user.

| Value type | Example                      |
| ---------- | ---------------------------- |
| array      | `- SELECT - DELETE - INSERT` |

## PMM section

The `pmm` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains configuration options for Percona Monitoring and Management.

### `pmm.enabled`

Enables or disables [monitoring Percona XtraDB cluster with PMM](https://www.percona.com/doc/percona-xtradb-cluster/5.7/manual/monitoring.html) .

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `pmm.image`

PMM client Docker image to use.

| Value type | Example                       |
| ---------- | ----------------------------- |
| string     | `percona/pmm-client:2.44.1-1` |

### `pmm.serverHost`

Address of the PMM Server to collect data from the cluster.

| Value type | Example              |
| ---------- | -------------------- |
| string     | `monitoring-service` |

### pmm.customClusterName

A custom name to define for a cluster. PMM Server uses this name to properly parse the metrics and display them on dashboards. Using a custom name is useful for clusters deployed in different data centers - PMM Server connects them and monitors them as one deployment. Another use case is for clusters deployed with the same name in different namespaces - PMM treats each cluster separately.

| Value type | Example           |
| ---------- | ----------------- |
| string     | `testClusterName` |

### `pmm.serverUser`

The PMM Server User. The PMM Server password should be configured using Secrets.

| Value type | Example |
| ---------- | ------- |
| string     | `admin` |

### `pmm.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a PMM container.

| Value type | Example |
| ---------- | ------- |
| string     | `150M`  |

### `pmm.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a PMM container.

| Value type | Example |
| ---------- | ------- |
| string     | `300m`  |

### `pmm.pxcParams`

Additional parameters which will be passed to the [pmm-admin add mysql](https://docs.percona.com/percona-monitoring-and-management/3/setting-up/client/mysql.html) command for `pxc` Pods.

| Value type | Example                           |
| ---------- | --------------------------------- |
| string     | `--disable-tablestats-limit=2000` |

### `pmm.proxysqlParams`

Additional parameters which will be passed to the [pmm-admin add proxysql](https://docs.percona.com/percona-monitoring-and-management/3/setting-up/client/proxysql.html) command for `proxysql` Pods.

| Value type | Example                         |
| ---------- | ------------------------------- |
| string     | `--custom-labels=CUSTOM-LABELS` |

### `pmm.containerSecurityContext`

A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type | Example             |
| ---------- | ------------------- |
| subdoc     | `privileged: false` |

### `pmm.readinessProbes.initialDelaySeconds`

The number of seconds to wait before performing the first [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `15`    |

### `pmm.readinessProbes.timeoutSeconds`

The number of seconds after which the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type | Example |
| ---------- | ------- |
| int        | `15`    |

### `pmm.readinessProbes.periodSeconds`

How often to perform the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) . Measured in seconds.

| Value type | Example |
| ---------- | ------- |
| int        | `30`    |

### `pmm.readinessProbes.successThreshold`

The number of successful probes required to mark the container successful.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `pmm.readinessProbes.failureThreshold`

The number of failed probes required to mark the container unready.

| Value type | Example |
| ---------- | ------- |
| int        | `5`     |

### `pmm.livenessProbes.initialDelaySeconds`

The number of seconds to wait before performing the first [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) .

| Value type | Example |
| ---------- | ------- |
| int        | `300`   |

### `pmm.livenessProbes.timeoutSeconds`

The number of seconds after which the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) times out.

| Value type | Example |
| ---------- | ------- |
| int        | `5`     |

### `pmm.livenessProbes.periodSeconds`

How often to perform the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) . Measured in seconds.

| Value type | Example |
| ---------- | ------- |
| int        | `10`    |

### `pmm.livenessProbes.successThreshold`

The number of successful probes required to mark the container successful.

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `pmm.livenessProbes.failureThreshold`

The number of failed probes required to mark the container unhealthy.

| Value type | Example |
| ---------- | ------- |
| int        | `3`     |

## Backup section

The `backup` section in the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml) file contains the following configuration options for the regular Percona XtraDB Cluster backups.

### `backup.allowParallel`

Enables or disables running backup jobs in parallel. By default, parallel backup jobs are enabled. A user can disable them to prevent the cluster overload.

| Value type | Example |
| ---------- | ------- |
| string     | `true`  |

### `backup.image`

The Percona XtraDB cluster Docker image to use for the backup.

| Value type | Example                                                 |
| ---------- | ------------------------------------------------------- |
| string     | `percona/percona-xtradb-cluster-operator:1.20.0-backup` |

### `backup.ttlSecondsAfterFinished`

The time for a backup or restore job to live after it finishes. After this time expires, the Operator removes the backup/restore Job and associated Pod.

Applies to both on-demand/scheduled backups and restores.

When the value is too low, the Operator applies the internal.percona.com/keep-job finalizer to allow the operation to finish. After the operation completes with the Succeeded or Failed status, the finalizer is removed and the Job is cleaned up.

| Value type | Example |
| ---------- | ------- |
| int        | `3600`  |

### `backup.backoffLimit`

The number of retries to make a backup (by default, 10 retries are made).

| Value type | Example |
| ---------- | ------- |
| int        | `6`     |

### `backup.activeDeadlineSeconds`

The timeout value in seconds, after which backup job will automatically fail.

| Value type | Example |
| ---------- | ------- |
| int        | `3600`  |

### `backup.startingDeadlineSeconds`

The maximum time in seconds for a backup to start. The Operator compares the timestamp of the backup object against the current time. If the backup is not started within the set time, the Operator automatically marks it as “failed”.

You can override this setting for a specific backup in the `deploy/backup/backup.yaml` configuration file.

| Value type | Example |
| ---------- | ------- |
| int        | `300`   |

### backup.suspendedDeadlineSeconds

The maximum time in seconds for a backup to remain in a suspended state. The Operator compares the timestamp when the backup job was suspended against the current time. After the defined suspension time expires, the backup is automatically marked as “failed”.

You can override this setting for a specific backup in the `deploy/backup/backup.yaml` configuration file.

| Value type | Example |
| ---------- | ------- |
| int        | `1200`  |

### `backup.imagePullSecrets.name`

The [Kubernetes imagePullSecrets](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for the specified image.

| Value type | Example                        |
| ---------- | ------------------------------ |
| string     | `private-registry-credentials` |

### `backup.storages.STORAGE-NAME.type`

The cloud storage type used for backups. Only `s3`, `azure`, and `filesystem` types are supported.

| Value type | Example |
| ---------- | ------- |
| string     | `s3`    |

### `backup.storages.STORAGE-NAME.verifyTLS`

Enable or disable verification of the storage server TLS certificate. Disabling it may be useful e.g. to skip TLS verification for private S3-compatible storage with a self-issued certificate.

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `backup.storages.STORAGE-NAME.s3.credentialsSecret`

The [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys.

| Value type | Example                     |
| ---------- | --------------------------- |
| string     | `my-cluster-name-backup-s3` |

### `backup.storages.STORAGE-NAME.s3.bucket`

The [Amazon S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) name for backups.

| Value type | Example |
| ---------- | ------- |
| string     |         |

### `backup.storages.STORAGE-NAME.s3.region`

The [AWS region](https://docs.aws.amazon.com/general/latest/gr/rande.html) to use. Set this explicitly for Amazon S3 and S3-compatible storage alike — the Operator derives the storage endpoint from it whenever you don’t also set `endpointUrl`, and a real cloud provider rejects a request signed for the wrong region.

If you leave `region` unset, the fallback depends on which component reads it: the backup and restore Jobs fall back to `us-west-2`, while [point-in-time recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr.html) requires the value explicitly and fails to start without it. Don’t rely on either fallback — set `region` to the value your storage actually uses.

| Value type | Example     |
| ---------- | ----------- |
| string     | `us-east-1` |

### `backup.storages.STORAGE-NAME.s3.endpointUrl`

The endpoint URL of the S3-compatible storage to be used (not needed for the original Amazon S3 cloud).

| Value type | Example |
| ---------- | ------- |
| string     |         |

### `backup.storages.STORAGE-NAME.s3.forcePathStyle`

Enforces the use of path style access to the storage, where the bucket name is in the `endpointURL` path (e.g. `https://host/bucket/prefix`).

If you enforce the path style and specify the bucket name both in the `endpointURL` path and in the `bucket` option, the Operator will use the bucket name from the `endpointURL` and ignore the value specified in `bucket`.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `backup.storages.STORAGE-NAME.s3.skipBucketExistsCheck`

Set to `true` when the credentials cannot check that the bucket exists, for example a scoped policy without that permission. Otherwise the Operator’s default check fails before the backup starts.

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `backup.storages.STORAGE-NAME.s3.prefix`

The path to the data directory in the bucket. If the `bucket` value already contains the prefix, the Operator appends the `prefix` value to the end of the bucket path.

For example, if the `bucket` value is `bucket-name/prefix1` and the `prefix` value is `prefix2`, the resulting bucket path is `bucket-name/prefix1/prefix2`.

| Value type | Example     |
| ---------- | ----------- |
| string     | `my-prefix` |

### `backup.storages.STORAGE-NAME.s3.checksumAlgorithm`

Enables you to specify the checksum algorithm used to verify data integrity during uploads to AWS S3 storage.

See the [list of supported checksum algorithms](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html) .

This option applies to [point-in-time recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr.html) binary log uploads and to backups made with the [XtraBackup sidecar method](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-methods.html). The default SST backup method doesn’t use it.

| Value type | Example  |
| ---------- | -------- |
| string     | `SHA256` |

### `backup.storages.STORAGE-NAME.s3.caBundle.name`

The name of the Secret that stores custom TLS certificates for TLS communication with S3 storage. See [Configure TLS verification with custom certificates](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage-s3.html#configure-tls-verification-with-custom-certificates) for more information.

| Value type | Example               |
| ---------- | --------------------- |
| string     | `s3-ca-bundle-secret` |

### `backup.storages.STORAGE-NAME.s3.caBundle.key`

The custom CA certificate for TLS communication with S3 storage. See [Configure TLS verification with custom certificates](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage-s3.html#configure-tls-verification-with-custom-certificates) for more information.

| Value type | Example  |
| ---------- | -------- |
| string     | `ca.crt` |

### `backup.storages.STORAGE-NAME.azure.endpointUrl`

The endpoint URL of the Azure Blob storage service to use, instead of the default Azure endpoint. Set this for an Azure-compatible emulator or a sovereign cloud, such as Azure Government or Azure China. If you leave it unset, the Operator derives the endpoint from your storage account name.

| Value type | Example |
| ---------- | ------- |
| string     |         |

### `backup.storages.STORAGE-NAME.azure.storageClass`

The [Azure Blob storage access tier](https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview) to store the backup in.

| Value type | Example |
| ---------- | ------- |
| string     | `Cool`  |

### `backup.storages.STORAGE-NAME.azure.blockSize`

The block size, in bytes, the Operator uses when uploading backup data to Azure Blob storage. Consider raising this for large backups to reduce the number of blocks per blob.

| Value type | Example   |
| ---------- | --------- |
| int        | `4194304` |

### `backup.storages.STORAGE-NAME.azure.concurrency`

The number of concurrent upload operations the Operator uses when writing backup data to Azure Blob storage.

| Value type | Example |
| ---------- | ------- |
| int        | `4`     |

### `backup.storages.STORAGE-NAME.volume.persistentVolumeClaim.type`

The persistent volume claim storage type.

| Value type | Example      |
| ---------- | ------------ |
| string     | `filesystem` |

### `backup.storages.STORAGE-NAME.volume.persistentVolumeClaim.storageClassName`

Set the [Kubernetes Storage Class](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Percona XtraDB Cluster backups [PersistentVolumeClaims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) for the `filesystem` storage type.

| Value type | Example    |
| ---------- | ---------- |
| string     | `standard` |

### `backup.storages.STORAGE-NAME.volume.persistentVolumeClaim.accessModes`

The [Kubernetes PersistentVolume access modes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes) .

| Value type | Example          |
| ---------- | ---------------- |
| array      | `[ReadWriteOne]` |

### `backup.storages.STORAGE-NAME.volume.persistentVolumeClaim.resources.requests.storage`

Storage size for the PersistentVolume.

| Value type | Example |
| ---------- | ------- |
| string     | `6Gi`   |

### `backup.storages.STORAGE-NAME.annotations`

The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) .

| Value type | Example                            |
| ---------- | ---------------------------------- |
| label      | `iam.amazonaws.com/role: role-arn` |

### `backup.storages.STORAGE-NAME.labels`

[Labels are key-value pairs attached to objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) .

| Value type | Example         |
| ---------- | --------------- |
| label      | `rack: rack-22` |

### `backup.storages.STORAGE-NAME.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraBackup container.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `backup.storages.STORAGE-NAME.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraBackup container.

| Value type | Example |
| ---------- | ------- |
| string     | `600m`  |

### `backup.storages.STORAGE-NAME.resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraBackup container.

| Value type | Example |
| ---------- | ------- |
| string     | `1.5G`  |

### `backup.storages.STORAGE-NAME.resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a Percona XtraBackup container.

| Value type | Example |
| ---------- | ------- |
| string     | `700m`  |

### `backup.storages.STORAGE-NAME.nodeSelector`

[Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) .

| Value type | Example         |
| ---------- | --------------- |
| label      | `disktype: ssd` |

### `backup.storages.STORAGE-NAME.topologySpreadConstraints.labelSelector.matchLabels`

The Label selector for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example                                                   |
| ---------- | --------------------------------------------------------- |
| label      | `app.kubernetes.io/name: percona-xtradb-cluster-operator` |

### `backup.storages.STORAGE-NAME.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example |
| ---------- | ------- |
| int        | `1`     |

### `backup.storages.STORAGE-NAME.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example                  |
| ---------- | ------------------------ |
| string     | `kubernetes.io/hostname` |

### `backup.storages.STORAGE-NAME.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn’t satisfy the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

| Value type | Example         |
| ---------- | --------------- |
| string     | `DoNotSchedule` |

### `backup.storages.STORAGE-NAME.affinity.nodeAffinity`

The Operator [node affinity](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) constraint.

| Value type | Example |
| ---------- | ------- |
| subdoc     |         |

### `backup.storages.STORAGE-NAME.tolerations`

[Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) .

| Value type | Example        |
| ---------- | -------------- |
| subdoc     | `backupWorker` |

### `backup.storages.STORAGE-NAME.priorityClassName`

The [Kubernetes Pod priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) .

| Value type | Example         |
| ---------- | --------------- |
| string     | `high-priority` |

### `backup.storages.STORAGE-NAME.schedulerName`

The [Kubernetes Scheduler](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers) .

| Value type | Example              |
| ---------- | -------------------- |
| string     | `mycustom-scheduler` |

### `backup.storages.STORAGE-NAME.containerSecurityContext`

A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type | Example            |
| ---------- | ------------------ |
| subdoc     | `privileged: true` |

### `backup.storages.STORAGE-NAME.podSecurityContext`

A custom [Kubernetes Security Context for a Pod](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type | Example                                                |
| ---------- | ------------------------------------------------------ |
| subdoc     | `fsGroup: 1001 supplementalGroups: [1001, 1002, 1003]` |

### `backup.storages.STORAGE-NAME.containerOptions.env`

The [environment variables set as key-value pairs](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) for the backup container.

| Value type | Example                               |
| ---------- | ------------------------------------- |
| subdoc     | `- name: VERIFY_TLS   value: “false”` |

### `backup.storages.STORAGE-NAME.containerOptions.args.xtrabackup`

Custom [command line options](https://docs.percona.com/percona-xtrabackup/latest/xtrabackup-option-reference.html) for the `xtrabackup` Percona XtraBackup tool.

| Value type | Example             |
| ---------- | ------------------- |
| subdoc     | `- “–someflag=abc”` |

### `backup.storages.STORAGE-NAME.containerOptions.args.xbcloud`

Custom [command line options](https://docs.percona.com/percona-xtrabackup/latest/xbcloud-options.html) for the `xbcloud` Percona XtraBackup tool.

| Value type | Example             |
| ---------- | ------------------- |
| subdoc     | `- “–someflag=abc”` |

### `backup.storages.STORAGE-NAME.containerOptions.args.xbstream`

Custom [command line options](https://docs.percona.com/percona-xtrabackup/latest/xbstream-options.html) for the `xbstream` Percona XtraBackup tool.

| Value type | Example             |
| ---------- | ------------------- |
| subdoc     | `- “–someflag=abc”` |

### `backup.schedule.name`

The backup name.

| Value type | Example            |
| ---------- | ------------------ |
| string     | `sat-night-backup` |

### `backup.schedule.schedule`

Scheduled time to make a backup specified in the [crontab format](https://en.wikipedia.org/wiki/Cron) .

| Value type | Example       |
| ---------- | ------------- |
| string     | `0 0 \* \* 6` |

### `backup.schedule.keep`

The amount of most recent backups to store. Older backups are automatically deleted. Set `keep` to zero or completely remove it to disable automatic deletion of backups. **This option is deprecated and will be removed in version 1.21.0**.

| Value type | Example |
| ---------- | ------- |
| int        | `3`     |

### `backup.schedule.retention.type`

Defines how to retain backups. The type of retention defaults to `count`.

| Value type | Example |
| ---------- | ------- |
| string     | `count` |

### `backup.schedule.retention.count`

Defines the number of backups to store. Older backups are automatically deleted from the cluster.

| Value type | Example |
| ---------- | ------- |
| string     | `count` |

### `backup.schedule.retention.deleteFromStorage`

Defines if the backups are deleted from the cloud storage too. Supported only for AWS and Azure storage. Does not apply to backups made to Persistent Volume.

| Value type | Example |
| ---------- | ------- |
| boolean    | `true`  |

### `backup.schedule.storageName`

The name of the storage for the backups configured in the `storages` or `fs-pvc` subsection.

| Value type | Example      |
| ---------- | ------------ |
| string     | `s3-us-west` |

### `backup.pitr.enabled`

Enables or disables [point-in-time-recovery functionality](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr.html).

| Value type | Example |
| ---------- | ------- |
| boolean    | `false` |

### `backup.pitr.storageName`

The name of the storage for the backups configured in the `storages` subsection, which will be reused to store binlog for point-in-time-recovery.

| Value type | Example      |
| ---------- | ------------ |
| string     | `s3-us-west` |

### `backup.pitr.timeBetweenUploads`

Seconds between running the binlog uploader.

| Value type | Example |
| ---------- | ------- |
| int        | `60`    |

### `backup.pitr.timeoutSeconds`

Timeout in seconds for the binlog to be uploaded; the binlog uploader container will be restarted after exceeding this timeout |

| Value type | Example |
| ---------- | ------- |
| int        | `60`    |

### `backup.pitr.resources.requests.memory`

The [Kubernetes memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a binlog collector Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `0.1G`  |

### `backup.pitr.resources.requests.cpu`

[Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a binlog collector Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `100m`  |

### `backup.pitr.resources.limits.memory`

[Kubernetes memory limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a binlog collector Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `1G`    |

### `backup.pitr.resources.limits.cpu`

[Kubernetes CPU limits](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for a binlog collector Pod.

| Value type | Example |
| ---------- | ------- |
| string     | `700m`  |

## Password generation section

This section contains the options to customize password generation for user Secrets

### `passwordGenerationOptions.symbols`

Specify what special symbols to use when generating user passwords. The passwords must contain only ASCII characters to ensure authentication to MySQL.

| Value type | Example                      |
| ---------- | ---------------------------- |
| string     | `"!#$%&()*+,-.<=>?@[]^_{}~"` |

### `passwordGenerationOptions.maxLength`

Specify the max password length for user passwords

| Value type | Example |
| ---------- | ------- |
| int        | `20`    |

### `passwordGenerationOptions.minLength`

Specify the min password length for user passwords

| Value type | Example |
| ---------- | ------- |
| int        | `16`    |
