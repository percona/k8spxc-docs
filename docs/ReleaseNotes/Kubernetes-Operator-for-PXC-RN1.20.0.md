# Percona Operator for MySQL based on Percona XtraDB Cluster 1.20.0 ({{date.1_20_0}})

[Installation](../System-Requirements.md#installation-guidelines){.md-button}

## What's new at a glance

- Full ARM64 support for all Operator images

**Security & compliance**

- [Automated TLS certificates rotation](#automated-tls-certificates-rotation) - no downtime, update via Secret

**Performance & reliability**

- [Automatic storage resizing](#automatic-storage-resizing) - expand PVCs before disks fill up
- [Configure file descriptor limit for HAProxy](#configure-file-descriptor-limit-for-haproxy) - faster, more stable health checks
- [Version-aware `jemalloc` path selection](#version-aware-jemalloc-path-selection-for-optimized-memory-usage) - correct library path per PXC version
- [Percona XtraDB clusters 8.4 have NUMA disabled by default](#percona-xtradb-clusters-84-have-numa-disabled-by-default) - fewer warnings in Kubernetes

**Operational excellence**

- [Configurable leader election for the Operator Deployment](#configurable-leader-election-for-the-operator-deployment) - tune resilience in unstable networks

**Deprecation:** [PMM2 support](#deprecated-support-for-pmm2) is deprecated; plan migration to PMM3 (removal in 1.22.0)

**Plus:** 25+ bug fixes and stability improvements

## Release Highlights

This release of Percona Operator for MySQL based on Percona XtraDB Cluster includes the following new features and improvements:

### Automatic storage resizing

Starting with version 1.20.0, the Operator can automatically resize Persistent Volume Claims (PVCs) for Percona XtraDB Cluster Pods based on your configured thresholds. The Operator monitors storage usage and when it exceeds the defined threshold, triggers resizing until it reaches the maximum storage size. This gives you:

* Fewer outages from full disks because storage grows with demand
* Less guesswork in capacity planning and fewer last-minute fixes
* Lower operational effort for developers and platform engineers
* Cost control by expanding only when needed
* A more predictable environment so teams can focus on delivery

To enable automatic storage resizing, edit the Custom Resource manifest as follows:

```yaml
spec:
  storageScaling:
    enableVolumeScaling: true
    autoscaling:
      enabled: true
      triggerThresholdPercent: 80
      growthStep: 2Gi
      maxSize: "10Gi"
```

Learn more about the workflow and troubleshooting tips in our [documentation](../scaling.md#automatic-storage-resizing).

### Automated TLS certificates rotation

You no longer need to go through the long manual procedure of updating the TLS certificates issued by the Operator. With this release, the Operator handles certificate update automatically. All you need to do is to provide new CA, server and key certificates to the operator via a Secret object. Note that the Secret must have the name in the format `<existing-secre>-new` because the Operator expects the `-new` suffix to trigger the update. On the next reconciliation loop the Operator detects the new TLS certificates and updates them accordingly.

This automation removes a major source of operational overhead and significantly reduces the risk of human error when managing TLS for your Percona XtraDB Cluster.

To learn more about the exact steps and what happens behind the hood, [follow our documentation](../tls-update.md).

### Configurable leader election for the Operator Deployment

You can now tune leader election settings for the Operator Deployment via environment variables. This helps when the Operator hits leader election failures, for example in high-latency or resource-constrained clusters.

* Use the `PXCO_LEADER_ELECTION_LEASE_DURATION`, `PXCO_LEADER_ELECTION_RENEW_DEADLINE`, `PXCO_LEADER_ELECTION_RETRY_PERIOD` environment variables to adjust timing for lease acquisition and renewal.
* Use the `PXCO_LEADER_ELECTION_ENABLED` environment variable to turn on or off leader election for single-replica deployments
* Use the `PXCO_LEADER_ELECTION_LEASE_NAME` environment variable to use a custom Lease resource for a leader lock.

Learn more about available environment variables in our [documentation](../env-vars-operator.md).

### Configure file descriptor limit for HAProxy

When HAProxy performs external MySQL health checks, it tries to close every file descriptor (FD) up to the system limit before executing the check script. Some systems set this limit extremely high, so HAProxy ends up looping through millions or even billions of numbers. This causes heavy CPU use, long delays and timeouts.

This release sets a safe file descriptor limit in the entrypoint script before HAProxy container starts. The default FD limit value is 1048576.
You can change this limit with the `HA_RLIMIT_NOFILE` environment variable. The value is checked, and if it is invalid, the Operator falls back to the default value. If the value is too large, the Operator uses the hard limit file descriptor value. This makes external checks fast, stable, and predictable.

See how to set HAProxy environment variables in the [documentation](../env-vars-cluster.md#configure-haproxy-environment-variables).

### Version-aware `jemalloc` path selection for optimized memory usage

When you configure a memory allocator to `jemalloc` using the Custom Resource, the Operator correctly sets the path to `jemalloc` shared library based on the deployed Percona XtraDB Cluster version:

* For version 8.4 and newer, the Operator uses `/usr/lib64/libjemalloc.so.2`
* For version 8.0, the path to jemalloc is `/usr/lib64/libjemalloc.so.1`

Since Percona XtraDB Cluster 8.4 is the default and recommended version for new clusters, the default `jemalloc` path is changed to `/usr/lib64/libjemalloc.so.2`.

The Operator determines the PXC version from the image tag. If you deploy images where Percona XtraDB Cluster is referenced using a `sha256` digest, such as from a Red Hat Container Registry or some custom images, the Operator cannot detect the version and therefore falls back to the default `jemalloc` path `/usr/lib64/libjemalloc.so.2`. To avoid this, consider upgrading to Percona XtraDB Cluster 8.4 or [specify the memory allocator using the environment variable](../env-vars-cluster.md#configure-alternative-memory-allocator).

This change ensures your memory allocation settings work smoothly and without manual intervention.

### Percona XtraDB clusters 8.4 have NUMA disabled by default

`innodb_numa_interleave` is a MySQL configuration variable that spreads memory allocation across multiple NUMA (Non Uniform Memory Access) nodes.
MySQL 8.4 turns this setting on by default to improve performance on servers with NUMA architecture, particularly when using a large InnoDB buffer pool.  

In Kubernetes, containers are not allowed to modify memory allocation policies due to common security restrictions. When MySQL tries to enable NUMA interleaving, Kubernetes blocks the request, which can lead to warnings or confusing log messages.

Because most cloud servers for Kubernetes use servers with only a single NUMA node, this MySQL setting provides no performance benefit in containerized environments. To keep MySQL behavior predictable and reduce unnecessary noise, the Operator now sets `innodb_numa_interleave` to `OFF` by default when it deploys Percona XtraDB Cluster 8.4. This reduces false alarms, and ensures MySQL runs smoothly in hardened Kubernetes environments.

You can still enable NUMA interleaving for your Percona XtraDB Cluster by passing custom MySQL options through the Operator. Be sure you understand the implications, as this requires a Kubernetes environment that allows NUMA policies.

### The Operator is now fully supported on ARM64 architectures

All Operator images are now available for ARM64, giving you native support on ARM based clusters with no extra setup.

### Improved binlog availability validation for point-in-time recovery after a base backup

Starting with this release, the Operator checks whether binary logs exist in storage during a point-in-time recovery process. 

In situations when you restore a cluster, take a new full backup as the baseline and then run a point-in-time recovery before any new data is written to the database, no binlogs exist in the database yet. The result of point-in-time recovery in this case depends on the `pitr.type` you choose:

* **`latest`** — The restore succeeds bringing the database to the state captured by the base backup itself. The point-in-time recovery job skips all binlogs, logs this event and completes successfully.
* **`date`** — The restore fails because there are no binlogs in the storage to roll forward to the requested date and time.
* **`transaction` or `skip`** — The restore fails because there are no  binlogs in storage to apply the specified GTID.

Learn more about point-in-time recovery in the [documentation](../backups-restore.md#restore-with-point-in-time-recovery).

## Deprecation, rename, removal

### Deprecated support for PMM2

The Operator deprecates support for PMM2 as this version entered end-of-life stage. PMM2 remains available so you can still monitor the health of your database using this version. However, we encourage you to plan migration to PMM3 to enjoy all features and fixes that this version provides. See the [PMM upgrade documentation :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/pmm-upgrade/migrating_from_pmm_2.html) for steps.

The support for PMM2 will be dropped in the Operator in release 1.22.0.

## Changelog

### New Features

* [K8SPXC-1076](https://perconadev.atlassian.net/browse/K8SPXC-1076) - Added automatic PVC resizing to prevent database downtime when disk space runs low. The Operator now monitors user-defined storage utilization thresholds and automatically triggers size expansion on supporting CSI volume plugins.
  
* [K8SPXC-1389](https://perconadev.atlassian.net/browse/K8SPXC-1389) - Introduced a limit on connection retry attempts when executing operational commands like user management. This optimization prevents the Operator from exhausting maximum database connections and impacting application availability during temporary failures.
  
* [K8SPXC-1619](https://perconadev.atlassian.net/browse/K8SPXC-1619) - Added a configurable threshold to limit the number of consecutive State Snapshot Transfer (SST) retry attempts. This feature prevents infinite restart loops from continuously consuming excessive cluster network bandwidth and degrading donor node performance.
  
* [K8SPXC-1728](https://perconadev.atlassian.net/browse/K8SPXC-1728) - Introduced full support of all [Operator images](#percona-certified-images) on ARM64 architectures. This empowers users to deploy high-availability database clusters on cost-effective ARM-based cloud instances and infrastructure.
  
* [K8SPXC-1754](https://perconadev.atlassian.net/browse/K8SPXC-1754) - Enabled automatic seamless TLS certificate rotation without requiring database cluster downtime. The Operator now coordinates the update of TLS secrets smoothly without interrupting client connections or replication traffic.
  
* [K8SPXC-1789](https://perconadev.atlassian.net/browse/K8SPXC-1789) - Added support for custom logrotate configurations within the database and utility containers. This grants users precise control over log retention policies, file sizes, and rotation schedules to manage storage consumption effectively.

### Improvements

???? status Open * [K8SPXC-804](https://perconadev.atlassian.net/browse/K8SPXC-804) - Marked PXC container restarts in logs container output for improved log clarity.

* [K8SPXC-1318](https://perconadev.atlassian.net/browse/K8SPXC-1318) - Added verification of point-in-time recovery targets prior to initiating the database restoration workflow. By confirming that the requested timestamp is reachable via existing binary logs, the Operator prevents unnecessary database downtime from a failed recovery path.

??? Open * [K8SPXC-1555](https://perconadev.atlassian.net/browse/K8SPXC-1555) - Clarified documentation regarding official support for a single database version.

* [K8SPXC-1634](https://perconadev.atlassian.net/browse/K8SPXC-1634) - Introduced upfront validation for the `pitr.type` configuration parameter in the Custom Resource definition. Early structural validation prevents the cluster from entering an irrecoverable or broken state due to type mismatches specified during a restore process.

* [K8SPXC-1635](https://perconadev.atlassian.net/browse/K8SPXC-1635) - Added validation for the `pitr.gtid` field prior to executing point-in-time recovery routines. This structural safeguard prevents unvalidated or corrupted GTID targets from corrupting cluster recovery steps or causing unneeded application downtime.

??? In progress * [K8SPXC-1679](https://perconadev.atlassian.net/browse/K8SPXC-1679) - Improved configuration options for backup storages. This backend refinement makes the declaration of advanced bucket options cleaner and more reliable

* [K8SPXC-1751](https://perconadev.atlassian.net/browse/K8SPXC-1751) - Increased log verbosity and visibility regarding the selection of specific binary log source nodes during point-in-time recovery. These additional diagnostic messages make it easier for cluster administrators to monitor and audit log sync health during recovery operations.

* [K8SPXC-1793](https://perconadev.atlassian.net/browse/K8SPXC-1793) - Added comprehensive Custom Resource Definition (CRD) level validation for all Point-in-Time Recovery targets. This prevents from specifying erroneous target dates or invalid formatting, saving time and keeping data states consistent.

* [K8SPXC-1805](https://perconadev.atlassian.net/browse/K8SPXC-1805) - Made the Operator's leader election parameters fully configurable to enhance resilience in unstable networks. Administrators can now customize lease durations and renewal deadlines to prevent unintended operator failovers or transient API server crashes.

* [K8SPXC-1828](https://perconadev.atlassian.net/browse/K8SPXC-1828) - Enhanced automated full cluster crash recovery mechanisms to prevent potential data loss following sudden concurrent node power-offs. The refined logic ensures that the node with the highest and most accurate sequence number is automatically chosen as the safe primary bootstrap source.

* [K8SPXC-1834](https://perconadev.atlassian.net/browse/K8SPXC-1834) - Optimized how file descriptors are managed in the HAProxy entrypoint to avoid performance bottlenecks. This fix prevents HAProxy from attempting to close thousands of unused file descriptors during health checks.

* [K8SPXC-1851](https://perconadev.atlassian.net/browse/K8SPXC-1851) - Fixed a code vulnerability that could cause a nil pointer dereference during specific database restore scenarios. The `getStorageType` handling logic has been corrected to safely validate and check storage types before assessing their attributes, preventing runtime panic events. (Thank you DimitriosLisenko for contribution)

* [K8SPXC-1862](https://perconadev.atlassian.net/browse/K8SPXC-1862) - Added support for audit log component for Percona XtraDB Cluster 8.4 in logrotate scripts. This ensures proper functioning of audit log functionality with version 8.4.

* [K8SPXC-1873](https://perconadev.atlassian.net/browse/K8SPXC-1873) - Made bucket existence check optional to allow flexible backup configurations.(Thank you DimitriosLisenko for reporting and contribution to this issue)

### Bugs Fixed

* [K8SPXC-1438](https://perconadev.atlassian.net/browse/K8SPXC-1438) - Fixed an issue where the Operator attempted unnecessary storage resizing when working with CSI storage drivers that declare capacity with a generic "G" unit. The updated size parsing accurately translates raw values to standardized Kubernetes notation to avoid false resizing actions on platforms like k3d.

* [K8SPXC-1589](https://perconadev.atlassian.net/browse/K8SPXC-1589) - Fixed an issue where the Operator process would unexpectedly crash with a stack trace during temporary API server communication drops. Additional reconnect validation and retry handling have been integrated into the leader election path to guarantee smooth automated recovery. 

* [K8SPXC-1626](https://perconadev.atlassian.net/browse/K8SPXC-1626) - Resolved an issue where the specified `internalTrafficPolicy` parameter was not being applied to generated Kubernetes Services. The Operator now respects this setting, allowing optimal regional network routing for cluster endpoints. 

??? In progress * [K8SPXC-1648](https://perconadev.atlassian.net/browse/K8SPXC-1648) - Fixed a bug where storage expansion actions entered an error state if the requested value rounded up to the same integer GiB value as the current volume. The Operator now detects identical post-rounding values gracefully and prevents invalid StatefulSet specification update errors.

* [K8SPXC-1685](https://perconadev.atlassian.net/browse/K8SPXC-1685) - Fixed an issue where automated volume expansion validation did not align with the underlying storage class capabilities. The system now respects the explicit volume expansion settings before requesting backend storage infrastructure shifts. 

* [K8SPXC-1700](https://perconadev.atlassian.net/browse/K8SPXC-1700) - Fixed an issue where newly generated TLS certificates had expiration timelines tied incorrectly to the Operator's initialization time. Expiration metrics are now properly computed from the exact certificate creation date to prevent unexpected pre-mature expiration events. (Thank you David Gloe for reporting this issue)

??? Internal task * [K8SPXC-1724](https://perconadev.atlassian.net/browse/K8SPXC-1724) - Resolved a race condition where the Operator prematurely terminated active State Snapshot Transfer (SST) processes on large database deployments. Extended timeouts and advanced execution checks now ensure that data cloning operations over 1TB can complete without being interrupted.

* [K8SPXC-1737](https://perconadev.atlassian.net/browse/K8SPXC-1737) - Fixed a panic inside the reconciliation routine triggered during the CompareMySQLVersion verification step. The version checking logic was hardened to seamlessly process unstructured release identifiers without throwing errors.

* [K8SPXC-1784](https://perconadev.atlassian.net/browse/K8SPXC-1784) - Fixed a rolling restart failure occurring in environments where cert-manager version 1.18.0 is installed. The Operator was adapted to align smoothly with cert-manager's updated default certificate rotation policy to ensure seamless rotation behavior. 

* [K8SPXC-1796](https://perconadev.atlassian.net/browse/K8SPXC-1796) - Fixed a bug where native compression options were omitted from backups scheduled via the xtrabackup sidecar. This ensures that storage-saving parameters are passed successfully down to the backup execution engine. (Thank you DimitriosLisenko for reporting this issue)

* [K8SPXC-1800](https://perconadev.atlassian.net/browse/K8SPXC-1800) - Resolved a bug that caused point-in-time recovery processes to fail when matching user Secret tokens were missing from the restore context. The Operator now runs validation and preparatory jobs correctly ahead of time to verify all authorization components. 

* ??? Open [K8SPXC-1817](https://perconadev.atlassian.net/browse/K8SPXC-1817) Plugin/Component Configuration

* [K8SPXC-1821](https://perconadev.atlassian.net/browse/K8SPXC-1821) - Fixed a container failure where the logrotate process crashed on ARM64 platforms due to an unresolved cron package binary dependency. The container structure was rewritten to ensure multi-arch compliance and stable runtime utility availability for log rotation chores.

* [K8SPXC-1822](https://perconadev.atlassian.net/browse/K8SPXC-1822) - Fixed an issue in point-in-time recovery where the binary log collector mistakenly reported gaps in backups if a single transaction was split across multiple files. The log parsing process was improved to correctly assemble and recognize these fragmented transactions, preventing false gap alerts and validation errors. (Thank you to Bernard Grymonpon for reporting and contributing to this fix.)
  
* [K8SPXC-1829](https://perconadev.atlassian.net/browse/K8SPXC-1829) - Fixed an issue where the default enablement of NUMA interleaving in MySQL 8.4 caused container deployment errors under hardened security policies. The Operator now correctly restricts this option inside host VMs where MPOL_INTERLEAVE limits are active to guarantee pod initialization stability.

* [K8SPXC-1830](https://perconadev.atlassian.net/browse/K8SPXC-1830) - Fixed a monitoring breakdown where ProxySQL metric collection failed when working alongside PMM 3.5 and MySQL 8.4 components. Internal authentication handling has been updated to fully support `caching_sha2_password` rules for seamless service monitoring. 

* [K8SPXC-1831](https://perconadev.atlassian.net/browse/K8SPXC-1831) - Fixed a startup failure where the memory allocator looked for a legacy library version. The Operator detects the MySQL version and uses the correct path to memory allocator library.

* ??? In progress [K8SPXC-1843](https://perconadev.atlassian.net/browse/K8SPXC-1843) - Fixed a bug where a running backup task became permanently stuck if the Joiner node unexpectedly disconnected from the Donor. Reliable session timeouts and state verification handlers have been incorporated to ensure stuck backup resources fail gracefully and release locks.

* [K8SPXC-1847](https://perconadev.atlassian.net/browse/K8SPXC-1847) - Fixed a bug where automated CA certificate rotation by cert-manager broke cluster TLS by invalidating all existing leaf certificates. The Operator now actively detects CA certificate rotation and automatically re-issues all dependent leaf TLS certificates, preventing cluster connection failures. (Thank you Dong Ma for reporting this issue and contributing to the fix)

* [K8SPXC-1861](https://perconadev.atlassian.net/browse/K8SPXC-1861) - Resolved a data discrepancy bug where point-in-time recovery processes generated inconsistent or mismatched GTID tracking catalogs. The state file assembly code was hardened to preserve linear transaction ordering when building master replication mappings.

??? Open * [K8SPXC-1866](https://perconadev.atlassian.net/browse/K8SPXC-1866) - Fixed a crash in the point-in-time recovery subsystem where the binlog collector failed with an HTTP/2 protocol error when targeting Google Cloud Storage through an S3-compatible path. The underlying storage driver's HTTP network layer was updated to handle streaming multi-part requests more reliably. (Thank you Thomas Einwaller for reporting this issue)

* [K8SPXC-1870](https://perconadev.atlassian.net/browse/K8SPXC-1870) - Fixed a bug where running the Operator with multiple replicas caused intermittent webhook TLS verification failures. The Operator now persists the self-signed CA and certificate material into the pxc-webhook-ssl Secret upon first issuance, ensuring that all replica pods reuse the same certificate data rather than independently generating conflicting authorities on startup. (Thank you user konoox for reporting this issue)

* [K8SPXC-1872](https://perconadev.atlassian.net/browse/K8SPXC-1872) - Fixed a bug where initiating a point-in-time recovery using the latest option could accidentally replay stale transaction history from an outdated timeline. The restore job configuration has been corrected to explicitly evaluate the active cluster timeline name when generating binlog filters, ensuring that only current binary logs are replayed.

* [K8SPXC-1877](https://perconadev.atlassian.net/browse/K8SPXC-1877) - Fixed an issue where switching binary log source nodes threw false gap detection alarms due to differing log rotation granularities between hosts. The collection coordinator now reviews global cluster GTID status rather than file indexes to avoid crashing during node transitions.
  
??? internal * [K8SPXC-1886](https://perconadev.atlassian.net/browse/K8SPXC-1886) - Resolved a security vulnerability where unvalidated text strings inside Custom Resource configuration parameters allowed Server-Side Template Injection (SSTI) via the pongo2 engine. Strict sandboxing, tag restrictions, and input sanitization layers have been implemented around the rendering engine to prevent unauthorized code execution.

* [K8SPXC-1892](https://perconadev.atlassian.net/browse/K8SPXC-1892) - Fixed a bug where the `latestRestorableTime` property was incorrectly evaluated when multiple independent database clusters resided inside the same Kubernetes namespace. The tracking filter was updated to isolate backup queries cleanly by individual cluster name fields to prevent timestamp cross-contamination.

### Documentation improvements

* Added instructions how to install the Operator with customized parameters using Helm as well as how to override release names.
- Added a new chapter to the documentation covering how to extend MySQL with plugins and components, including an [overview](../mysql-plugins-components.md) and [practical configuration examples](../mysql-plugins-components-examples.md).

## Supported Software

The Operator was developed and tested with the following software:

- Percona XtraDB Cluster versions 8.4.7-7.1, 8.0.44-35.1, and 5.7.44-31.65 
- Percona XtraBackup versions 8.4.0-5.1, 8.0.35-34.1, and 2.4.29  
- HAProxy 2.8.17  
- ProxySQL 2.7.3-1.2, 3.0.1-1.2
- LogCollector based on fluent-bit 4.0.1-1 
- PMM Client 2.44.1-1 and 3.5.0  

Other options may also work but have not been tested.


## Supported Platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below:

--8<-- [start:platforms]

- [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.31 - 1.33  
- [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.32 - 1.34  
- [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.32 - 1.34  
- [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.17 - 4.20  
- [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.37.0 based on Kubernetes 1.34.0  

--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.

## Percona certified images

Find Percona's certified Docker images that you can use with the
Percona Operator for MySQL based on Percona XtraDB Cluster in the following table.

--8<-- [start:images]

| Image                                                  | Digest                                                           |
|:-------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-xtradb-cluster-operator:1.19.0         | 6ccbac5e74f5b5309fd4788c5b8d91d5abd01850a4a356ad9eff9f82d20afb51 |
| percona/percona-xtradb-cluster-operator:1.19.0 (ARM64) | 1ed2a5ab22ee7588aa17ec2339876dc72c9724dc9a81506ff449a2b1aa085024 |
| percona/percona-xtradb-cluster:8.4.7-7.1               | 5b18775ad62a1c5f8d8bffc63a1518360d2e7a82c1bed7cbd8a15011f6cdff9f |
| percona/percona-xtradb-cluster:8.4.7-7.1 (ARM64)       | 4c3785f5befd001ca3ae035f42c9b586447b874158b0d9b26afb8ff87658829f |
| percona/percona-xtradb-cluster:8.0.44-35.1             | f91026ec8427ace53dc31f3b00ec14cebdc0868bda921ae0713e8ad3af71ba1f |
| percona/percona-xtradb-cluster:8.0.44-35.1 (ARM64)     | 33a0f32c1d42cf6e74f45aeebd6422cfdea6c8c8bc3cce600e46c4661b0183be |
| percona/percona-xtradb-cluster:5.7.44-31.65            | 36fafdef46485839d4ff7c6dc73b4542b07031644c0152e911acb9734ff2be85 |
| percona/percona-xtrabackup:8.4.0-5.1                   | 1b81d06b1beb6a126b493d11532a5c71d1b1c2a1d13cb655e3cc5760c0896035 |
| percona/percona-xtrabackup:8.4.0-5.1 (ARM64)           | ca40d7975ae39bd5dd652487a1389b823cbf788e9948db6cf53ebb0d3f57c51b |
| percona/percona-xtrabackup:8.0.35-34.1                 | 967bafa0823c90aa8fa9c25a9012be36b0deef64e255294a09148d77ce6aea68 |
| percona/percona-xtrabackup:8.0.35-34.1 (ARM64)         | 83f814dca9ed398b585938baa86508bda796ba301e34c948a5106095d27bf86e |
| percona/percona-xtrabackup:2.4.29                      | 11b92a7f7362379fc6b0de92382706153f2ac007ebf0d7ca25bac2c7303fdf10 |
| percona/fluentbit:4.0.1-1                               | 65bdf7d38cbceed6b6aa6412aea3fb4a196000ac6c66185f114a0a62c4a442ad |
| percona/fluentbit:4.0.1-1 (ARM64)                      | dabda77b298b67d30d7f53b5cdb7215ad19dabb22b9543e3fd8aedb74ab24733 |
| percona/pmm-client:3.5.0                               | 352aee74f25b3c1c4cd9dff1f378a0c3940b315e551d170c09953bf168531e4a |
| percona/pmm-client:3.5.0 (ARM64)                       | cbbb074d51d90a5f2d6f1d98a05024f6de2ffdcb5acab632324cea4349a820bd |
| percona/pmm-client:2.44.1-1                            | 52a8fb5e8f912eef1ff8a117ea323c401e278908ce29928dafc23fac1db4f1e3 |
| percona/pmm-client:2.44.1-1 (ARM64)                    | 390bfd12f981e8b3890550c4927a3ece071377065e001894458047602c744e3b |
| percona/haproxy:2.8.17                                 | ef8486b39a1e8dca97b5cdf1135e6282be1757ad188517b889d12c5a3470eeda |
| percona/haproxy:2.8.17 (ARM64)                         | bbc5b3b66ac985d1a4500195539e7dff5196245a5a842a6858ea0848ec089967 |
| percona/proxysql2:2.7.3-1.2                            | 719d0ab363c65c7f75431bbed7ec0d9f2af7e691765c489da954813c552359a2 |
| percona/proxysql2:2.7.3-1.2 (ARM64)                    | 4c4d094652c9f2eb097be5d92dcc05da61c9e8699ac7321def959d5a205a89f7 |
| percona/proxysql3:3.0.1-1.2                            | f3fb43d4ef2467f207ecd66c51414520a100a0474807f307775a985303c56ec5 |
| percona/proxysql3:3.0.1-1.2 (ARM64)                    | d21ba769b9e364a1a0c1d5e9d3b6287e8051efcf79cd6ec3df5756278961bbec |
