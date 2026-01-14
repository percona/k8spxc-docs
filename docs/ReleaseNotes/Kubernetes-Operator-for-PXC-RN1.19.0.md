# Percona Operator for MySQL based on Percona XtraDB Cluster 1.19.0 ({{date.1_19_0}})

[Installation](../System-Requirements.md#installation-guidelines){.md-button}

## What's new at a glance

- Percona XtraDB Cluster 8.4 is the default version for cluster deployments

**Security & Compliance**

- [Data-at-rest encryption for Percona XtraDB Cluster 8.4](#ensure-data-security-for-percona-xtradb-cluster-84-with-data-at-rest-encryption)
- [Custom CA certificates for S3 backups](#use-your-own-ca-certificates-for-tls-verification) 
- [Configurable certificate lifetimes](#configure-duration-for-certificates-issued-by-cert-manager)
- [Security context for ProxySQL sidecars](#security-context-for-proxysql-sidecar-containers)

**Performance & reliability**

- [ProxySQL scheduler](#improved-load-balancing-with-proxysql-scheduler-tech-preview) (tech preview) - improved query routing
- [Faster HAProxy failover](#customize-haproxy-backend-health-check-intervals-and-failover-behavior) (seconds instead of 20s)
- [Direct-access backups via sidecar](#direct-access-backups-improved-performance-and-reliability-with-sidecars-tech-preview)
- [Memory allocator configuration](#configure-memory-allocator-in-the-operator)

**Operational excellence**

- [Switch between HAProxy and ProxySQL at runtime](#switch-from-haproxy-to-proxysql-at-runtime)
- [Automatic cleanup of backup/restore jobs](#automatic-cleanup-of-backup-and-restore-jobs-and-associated-pods)
- [External PVC mounting for shared data](#attach-external-pvcs-for-shared-data-access-across-applications-and-the-database-cluster)
- [Custom password generation rules](#customize-password-generation-by-the-operator)

**Plus:** 15+ bug fixes and stability improvements

## Release Highlights

This release of Percona Operator for MySQL based on Percona XtraDB Cluster includes the following new features and improvements:

### Ensure data security for Percona XtraDB Cluster 8.4 with data-at-rest encryption

Data at rest encryption ensures that sensitive information stored on disk remains protected from unauthorized access, even if the physical media is compromised. It is a foundational safeguard for compliance, trust and security in modern database environments.

The Operator supports data at rest encryption for MySQL 8.0 with HashiCorp Vault using the `keyring_vault` *plugin*. Now, it also supports data at rest encryption for MySQL 8.4, leveraging the `keyring_vault` *component*.

This enhancement enables you to benefit from the rich feature set of the latest major version of Percona XtraDB Cluster 8.4 while ensuring your sensitive data is secured. In doing so, you can meet compliance requirements and protect critical information without added operational complexity. Learn how to [configure data at rest encryption for Percona XtraDB Cluster 8.4](../encryption-setup.md).

### Percona XtraDB Cluster 8.4 is now fully supported

Percona XtraDB Cluster 8.4 is now fully supported and recommended for production deployments. Starting with this release, it becomes the default version for all new database cluster deployments using the Operator. This support enables you to benefit from its latest features, performance improvements, and enhanced security.

### Use your own CA certificates for TLS verification

You can now use your organization’s custom Certificate Authority (CA) to securely verify TLS communication with S3 storage during backups and restores.

The configuration is straightforward: create the Secret that stores your custom CA and certificates to authorize in the S3 storage. Then reference this Secret and specify the CA certificate in the `caBundle` option in the Operator Custom Resource. The Operator will verify TLS communication against it.

Here's the example configuration:

```yml
storages:
  minio-s3:
    type: s3
    verifyTLS: true
    s3:
      caBundle:
         name: minio-ca-bundle
         key: tls.crt
```

With this improvement you ensure the following:

* Security without compromise – no more bypassing identity checks.
* Alignment with your internal standards – use the CA your company already trusts.
* Confidence in backup and restore flows – every S3 interaction is properly verified.

Read more about the use of own CA certificates in our [documentation](../backups-storage.md#configure-tls-verification-with-custom-certificates-for-s3-storage)

### Configure duration for certificates issued by cert-manager

By default, the `cert-manager` generates certificates valid for 90 days. You have now more control over certificate lifetimes and can configure their custom duration when you create a new cluster. This way you can align with your organization's security and compliance policies.

Use the following Custom Resource options to configure certificate duration:

* `.spec.tls.certValidityDuration` – validity period for generated certificates
* `.spec.tls.caValidityDuration` – validity period for the Certificate Authority (CA)

```yaml
  tls:
    enabled: true
    certValidityDuration: 2160h
    caValidityDuration: 26280h
```

Note that the Operator enforces minimum durations to certificates:

* For TLS certificates – 1 hour
* For CA certificate – 730 hours.

Also, we don't recommend setting duration to exactly 1 hour to prevent certificate generation issues. Read more about rules and limitations about certificate duration configuration in our [documentation](../tls-cert-manager.md#customize-certificate-duration-for-cert-manager).

This improvement empowers you to fine-tune certificate lifetimes while keeping your cluster secure and stable.

### Security context for ProxySQL sidecar containers

You can now define the security context for ProxySQL sidecar containers in the Operator, reducing the risk of unsecured sidecars bypassing Pod restrictions. This improvement lets you set user IDs, privileges, and filesystem access directly, ensuring compliance and strengthening Pod security. 

Configure the security context in your custom resource. For example:

```yaml
spec:
  proxysql:
       sidecars:
          securityContext:
              privileged: false
``` 

With this change, you enforce safer defaults across your deployments and close security gaps at the Pod level.

### Improved load balancing with ProxySQL scheduler (tech preview)

The Operator now integrates with the external `pxc_scheduler_handler` tool to improve query routing. This feature is currently in tech preview, so we recommend experimenting with it in test or staging environments before using it in production.

With this scheduler you get finer control over how your SQL queries are routed within your PXC cluster:

- SELECT queries (that don't use FOR UPDATE) are intelligently distributed across all PXC nodes—or all nodes except the writer, depending on your settings.
- Non-SELECT queries and SELECT FOR UPDATE statements are routed to the writer node.
- You don't have to micromanage the writer role: the scheduler automatically ensures only one writer is active at any time.

This means you could see:

- better performance and higher throughput from distributing query loads
- greater reliability with no single point of failure
* Improved cluster health through early detection of replication lag and node issues
- more efficient use of your resources and hardware
- a smoother, more predictable experience for everyone using the database

See our [documentation](../proxysql-conf.md#proxysql-scheduler) for full information about the scheduler behavior and setup.

The previous internal scheduler remains enabled by default to maintain backward compatibility. You can switch to the new one when you're ready to benefit from smarter query handling.

### Customize HAProxy backend health check intervals and failover behavior

You can now control how quickly HAProxy detects and reacts to node failures. Instead of waiting the default 20 seconds while HAProxy performs the failover, you can tune health checks to cut that down to just a few seconds. That means your applications recover faster, and users don't get stuck with hanging sessions when a node goes down.

You no longer need to override the entire HAProxy configuration to achieve this — the operator now gives you simple, direct options in the Custom Resource specification:

```yaml
haproxy:  
   healthCheck:
       interval: 10000
       rise: 1
       fall: 2
```

By adjusting how often checks run and how many failures or successes mark a node as “down” or “up,” you get faster failover, cleaner client handling, and easier configuration that is safe to upgrade and tailored to your environment.

### Switch from HAProxy to ProxySQL at runtime

You can now switch from HAProxy to ProxySQL without redeploying your Percona XtraDB Cluster. Previously, you had to choose ProxySQL only at startup. Now ProxySQL has the `caching_sha2_password` as the default authentication plugin, which gives you the flexibility to start with HAProxy and migrate to ProxySQL later as your needs evolve.

With this release, ProxySQL also includes a new [scheduler](#improved-load-balancing-with-proxysql-scheduler-tech-preview) that enhances SQL awareness, automates read/write splitting, and handles failovers more intelligently. This leads to faster queries, increased reliability, and more efficient cluster resource usage.

**Which proxy should you choose?**

- **HAProxy:** Choose HAProxy if you need a lightweight, TCP-level load balancer with minimal configuration. Note that for read/write splitting, your clients must connect to different HAProxy ports based on the query type.
- **ProxySQL:** Opt for ProxySQL if you want built-in read/write splitting, advanced query-level control, and automated failover logic right out of the box.

Each proxy brings its own resource requirements and advantages. We offer [additional guidance](../load-balancing.md#what-load-balancer-to-use) on selecting the right proxy for your environment, plus [detailed recommendations](../proxy-switching.md) on resource planning and best practices. Review these carefully to ensure your choice fits your operational and performance needs.

To switch between proxies, update your Custom Resource to set `haproxy.enabled` to `false` and `proxysql.enabled` to `true`. Apply the changes, and the Operator will handle the transition for you by restarting the relevant proxy Pods.

With this improvement you now control your proxy choice at runtime, and ProxySQL brings smarter routing and resilience right into the Operator.

### ProxySQL 3 support

You can now deploy ProxySQL 3 with Percona Operator for MySQL. This gives you more flexibility and control over how your applications connect to MySQL inside Kubernetes. Here’s what you get:

- Dual‑password support enables you to introduce a new password while the old one is still valid. As a result, you can rotate passwords without downtime
- Enhanced event and query logging gives you real‑time visibility into query behavior and application traffic.
- ProxySQL now logs the actual values bound to prepared statements. This helps you debug queries more effectively, since you see what data was passed instead of just placeholders
- Event logs now include metadata about ProxySQL version and format. This makes it easier to track and audit logs across upgrades in your Operator‑managed deployments.


### Direct-access backups: Improved performance and reliability with sidecars (tech preview)

By default, the Operator makes backups using the SST method. This creates a separate backup Pod with Percona XtraBackup, while the database node enters Donor state and stops serving client requests. SST backups can also fail with cryptic network errors, making root cause analysis and recovery difficult.

Starting with version 1.19.0, you can make backups via the XtraBackup sidecar container. The Operator deploys a sidecar with XtraBackup inside each Percona XtraDB Cluster Pod. This sidecar makes a backup and uploads it to the remote backup storage. The database Pod doesn’t change its state to Donor and keeps accepting client requests.

Using the sidecar method provides a direct access to data thus boosting backup performance. The sidecar container constantly runs in the database Pod, so you have constant access to logs and status, which simplifies troubleshooting.

To enable the XtraBackup sidecar container backup method, set `PXCO_FEATURE_GATES=XtrabackupSidecar=true` environment variable in the Operator Deployment.
This functionality is in the tech preview stage and currently supports only cloud storages. We encourage you to try it out in your testing or staging environments and leave your feedback.

Future enhancements such as support of PVC volumes, backup encryption and incremental backups are planned for future releases.

To learn more about XtraBackup sidecar container backup method, see our [documentation](../backups.md#xtrabackup-sidecar-method-tech-preview).

### Ensure only up to date data is served during backups  

When a node donates data during backups or SST, it enters into the DONOR state. At this point, the node should no longer handle client connections. HAProxy's external check correctly blocked new connections to the Donor node but allowed existing sessions to remain active. Those lingering sessions could return slow or outdated results.

The HAProxy default configuration now includes the `on-marked-down shutdown-sessions` directive. As soon as HAProxy marks a node as down, all active connections are immediately closed and clients reconnect to remaining active nodes. This ensures that only fresh, up to date data is served during backups.

### Automatic cleanup of backup and restore Jobs and associated Pods

The Operator creates a dedicated Job and Pod for every backup and restore operation. Previously, these Jobs and Pods remained in the cluster even after the operation was finished, and you had to manually delete them to free up resources.

Now, you can offload this task to the Operator. Specify a time-to-live (TTL) for backup and restore Jobs once the operation is finished. When the TTL expires, the Operator automatically deletes the Job and its associated Pod.

Modify your Custom Resource as follows:

```yaml
backup:
  image: perconalab/percona-xtradb-cluster-operator:main-pxc8.0-backup
  ttlSecondsAfterFinished: 3600
```

This setting is global. It applies to all on-demand and scheduled backups, and all restores.

The Operator also ensures reliability: if a backup or restore takes longer than the configured TTL, it applies the `internal.percona.com/keep-job` finalizer to allow the operation to finish. After the operation completes either with the `Succeeded` or the `Failed` status, the finalizer is removed and the Job is cleaned up.

This improvement reduces manual maintenance overhead, gives you control over the processes lifetime for debugging or auditing purposes and helps keep your cluster healthy and efficient. By reducing unnecessary resource buildup, you gain smoother operations, lower maintenance overhead and improved reliability in production environments.

### Improved backup identification for point-in-time recovery readiness

When a backup contains binlog gaps, the Operator now creates a `<backup-name>.pitr-not-ready` file in the backup storage. This file makes it easy to identify which backups are appropriate for point in time recovery both in the storage and when listing backup objects. 

Before starting a restore, the Operator checks for this marker file and blocks unsafe restores, protecting you from incomplete recovery attempts. If needed, you can override this safeguard by adding the `percona.com/unsafe-pitr` annotation to the Restore object. Use this override with caution, as this is an unsafe configuration.

### Attach external PVCs for shared data access across applications and the database cluster

Sometimes your database needs more than its own internal storage. For example, it needs access to reference files, shared configuration files or lookup tables generated outside the database but still essential for queries and procedures.

You can now attach auxiliary pre-existing PVCs and mount that external data directly into your database, ProxySQL or HAProxy pods in a clean, declarative way using the Custom Resource. 

This example configuration shows how to attach external PVC to the XtraDB Cluster Pods:

```yaml
pxc:
  extraPVCs:
    - name: extra-data-volume
      claimName: my-extra-storage
      mountPath: /var/lib/mysql-extra
      readOnly: false
```

This improvement gives you a reliable way to separate internal database storage from external domain data, update shared datasets independently, and still benefit from the Operator’s automation and resilience.

### Customize password generation by the Operator

By default, the Operator generates user passwords using alphanumeric characters plus a set of special symbols. Some tools such as MySQL Prometheus Exporter or mysqlsh don't support certain symbols, which can make those passwords invalid.

To improve compatibility and user experience, you can now customize password generation parameters in the Custom Resource:

```yaml
spec:
 passwordGenerationOptions:
   symbols: "!#$%&()*+,-.<=>?@[]^_{}~"
   maxLength: 20
   minLength: 16
```

This enhancement lets you keep the convenience of automated password generation and at the same time ensure compliance with the tools and environments you integrate with the Operator.

### Configure memory allocator in the Operator  

By default, Percona Operator for XtraDB Cluster uses the system allocator (`libc`) to manage memory. While this works for most cases, alternative allocators such as `jemalloc` and `tcmalloc` can improve performance and reduce fragmentation in high-traffic workloads.  

To have more flexibility, you can now configure the memory allocator directly in the Custom Resource:  

```yaml
spec:
   pxc:
     mysqlAllocator: jemalloc
```  

Supported values are:  

* `jemalloc`  
* `tcmalloc`  
* `libc` (default, used when no value is set)  

If you have already configured the memory allocator via the environment variable, the Operator will respect that setting and use it instead of the Custom Resource value.  

This enhancement lets you fine-tune memory management for your cluster while keeping compatibility with existing configurations.  

### Deprecation, rename, removal

**Removed in 1.19.0:**

- `proxysql.readinessDelaySec` and `proxysql.livenessDelaySec` fields are removed as redundant

**Deprecated (will be removed in 1.22.0):**

- `pxc.livenessDelaySec`. Use [`pxc.livenessProbes.initialDelaySeconds`](../operator.md#pxclivenessprobesinitialdelayseconds)
- `pxc.readinessDelaySec`. Use [`pxc.readinessProbes.initialDelaySeconds`](../operator.md#pxcreadinessprobesinitialdelayseconds)
- `haproxy.livenessDelaySec`. Use [`haproxy.livenessProbes.initialDelaySeconds`](../operator.md#haproxylivenessprobesinitialdelayseconds)
- `haproxy.readinessDelaySec`. Use [`haproxy.readinessProbes.initialDelaySeconds`](../operator.md#haproxyreadinessprobesinitialdelayseconds)

## Changelog

### New Features

* [K8SPXC-1332](https://perconadev.atlassian.net/browse/K8SPXC-1332) - Added the ability to load custom SSL certificates for backup operations to S3 storage. This enables secure communication with S3-compatible storage using the certificates approved and trusted by your company (Thank you Azam Abdoelbasier for submitting this request).
* [K8SPXC-1494](https://perconadev.atlassian.net/browse/K8SPXC-1494) - Added the ability to configure the duration of TLS certificates created by `cert-manager`. This allows users to customize certificate lifecycles to meet their specific security requirements.
* [K8SPXC-1576](https://perconadev.atlassian.net/browse/K8SPXC-1576) - Added the ability to use the XtraBackup sidecar container instead of SST for creating backups. This provides an alternative, potentially more efficient backup method.
* [K8SPXC-1688](https://perconadev.atlassian.net/browse/K8SPXC-1688) - Added ability to mount pre-existing auxiliary PVCs as volumes to database and proxy pods. This facilitates easier integration with external data and storage resources (Thank you Emin AKTAS for submitting the request and contributing to it).
* [K8SPXC-1733](https://perconadev.atlassian.net/browse/K8SPXC-1733) - Added the ability to customize password generation parameters, such as length and character sets via the Custom Resource. This ensures smooth operation of the tools with specific requirements towards password and leverages the automatic password generation of the Operator (Thank you user fydrah for submitting the request and contributing to it).
* [K8SPXC-1734](https://perconadev.atlassian.net/browse/K8SPXC-1734) - Introduced configurable HAProxy backend health check parameters that can be tuned without overriding the entire configuration. This simplifies performance tuning for high-availability setups (Thank you Tim Stoop for submitting the request and contributing to it).

### Improvements

* [K8SPXC-735](https://perconadev.atlassian.net/browse/K8SPXC-735) - Added the support of the `pxc_scheduler_handler` ProxySQL scheduler for SQL-aware routing and effective read/write splitting. This allows for better utilization of resources by distributing read-only traffic across the entire cluster while routing write requests only to the writer node.
* [K8SPXC-992](https://perconadev.atlassian.net/browse/K8SPXC-992) - Improved binlog naming to prevent potential collisions between different collectors. The updated naming convention ensures unique and consistent identification of binary log files in storage.
* [K8SPXC-1144](https://perconadev.atlassian.net/browse/K8SPXC-1144) - Introduced a mechanism to mark S3 backups as PITR-unready if binlog gaps are detected. This prevents users from attempting invalid point-in-time recoveries using inconsistent backups.
* [K8SPXC-1214](https://perconadev.atlassian.net/browse/K8SPXC-1214) - Added an option to automatically clean up completed backup and restore jobs and their associated pods. This improvement helps reduce pressure on the Kubernetes API by removing stale resources (Thank you Alexandre Barth for reporting this issue).
* [K8SPXC-1319](https://perconadev.atlassian.net/browse/K8SPXC-1319) - Enhanced the operator to support running multiple backup restores for different clusters in parallel. This removes a previous limitation that blocked concurrent restore operations across the environment.
* [K8SPXC-1327](https://perconadev.atlassian.net/browse/K8SPXC-1327) - Added the ability to change the memory allocator for MySQL to improve memory management efficiency. This change helps optimize the overall memory footprint of PXC pods.
* [K8SPXC-1373](https://perconadev.atlassian.net/browse/K8SPXC-1373) - Improved core dump handling to ensure that crashed instances can recover more reliably after an SST. This enhancement aids in diagnosing and recovering from unexpected server failures.
* [K8SPXC-1431](https://perconadev.atlassian.net/browse/K8SPXC-1431) - Improved the delete-backup finalizer logic to correctly handle the deletion of on-demand backup PVCs. 
* [K8SPXC-1470](https://perconadev.atlassian.net/browse/K8SPXC-1470) - Added the ability to switch between HAProxy and ProxySQL within an existing cluster. This provides users with more flexibility to change their load-balancing solution as their needs evolve.
* [K8SPXC-1511](https://perconadev.atlassian.net/browse/K8SPXC-1511) - Added the support of data at rest encryption for Percona XtraDB Cluster 8.4 via the `keyring vault` component. This change ensures compatibility with the latest security architecture of MySQL 8.4.
* [K8SPXC-1525](https://perconadev.atlassian.net/browse/K8SPXC-1525) - Deprecated `pxc.livenessDelaySec` option in favor of more consistent liveness probe parameters. The Operator now prioritizes standard probe configurations to manage Pod lifecycle.
* [K8SPXC-1568](https://perconadev.atlassian.net/browse/K8SPXC-1568) - Updated the Operator's password generation logic to prevent the '*' character from being used as the first character. This avoids potential issues with certain authentication plugins and command-line tools.
* [K8SPXC-1594](https://perconadev.atlassian.net/browse/K8SPXC-1594) - Improved the database upgrade logic to prevent the controller from being blocked during the operation. This ensures that the Operator remains responsive to other cluster changes while an upgrade is in progress.
* [K8SPXC-1628](https://perconadev.atlassian.net/browse/K8SPXC-1628) - Added support for `tcmalloc` as an alternative memory allocator in PXC images. This gives users additional options to tune and reduce the memory footprint of their database workloads.
* [K8SPXC-1647](https://perconadev.atlassian.net/browse/K8SPXC-1647) - Implemented extended exit codes for garbd to provide better diagnostic information for different failure scenarios. This helps users identify the root cause of SST and joining issues faster.
* [K8SPXC-1668](https://perconadev.atlassian.net/browse/K8SPXC-1668) - Added support for ProxySQL 3, providing users with access to the latest features and performance improvements of the load balancer.
* [K8SPXC-1683](https://perconadev.atlassian.net/browse/K8SPXC-1683) - Expanded smart update tests to include PXC 8.4 and PMM 3, ensuring stable upgrade paths for the latest versions.
* [K8SPXC-1703](https://perconadev.atlassian.net/browse/K8SPXC-1703) - Added the support of the `generateEmbeddedObjectMeta` option, improving the template handling for sidecars and extra PVCs (Thank you Emin AKTAS for reporting and contributing to this issue).
* [K8SPXC-1748](https://perconadev.atlassian.net/browse/K8SPXC-1748) - Eliminated runtime CREATE FUNCTION statements in the PITR collector to avoid unnecessary Galera TOI (Total Order Isolation) events. This reduces the performance impact on the cluster when the PITR sidecar starts or restarts.

### Bugs Fixed

* [K8SPXC-926](https://perconadev.atlassian.net/browse/K8SPXC-926) - Fixed an issue where a failed smart update on one cluster could block the Operator from managing other clusters in multi-cluster environments. The controller now handles update failures more gracefully without impacting independent resources.
* [K8SPXC-1379](https://perconadev.atlassian.net/browse/K8SPXC-1379) - Fixed an issue where monit container resource values in ProxySQL pods did not correctly reflect the values specified in the PXC cluster definition. The operator now ensures that ProxySQL resource attributes are properly applied to the monitoring sidecar containers.
* [K8SPXC-1424](https://perconadev.atlassian.net/browse/K8SPXC-1424) - Resolved a certificate renewal issue where CA certificates in TLS secrets could expire before server certificates were renewed. The Operator logic was updated to align renewal intervals for CA and server certificates when using cert-manager.
* [K8SPXC-1581](https://perconadev.atlassian.net/browse/K8SPXC-1581) - Corrected the order of options in the restore prepare job to ensure that `--defaults-file` is passed as the first option to xtrabackup. This fix ensures that custom configuration files are correctly prioritized during the restore process.
* [K8SPXC-1617](https://perconadev.atlassian.net/browse/K8SPXC-1617) - Fixed a binlog gap issue in Point-in-Time Recovery (PITR) that caused repeated test failures. Users are now advised to perform a full backup after each PITR restore to ensure data consistency and prevent gaps.
* [K8SPXC-1632](https://perconadev.atlassian.net/browse/K8SPXC-1632) - Added missing SecurityContext configurations for ProxySQL sidecar containers to enhance pod security. This change ensures that all sidecars follow the defined security standards of the cluster.
* [K8SPXC-1655](https://perconadev.atlassian.net/browse/K8SPXC-1655) - Fixed a failure in xtrabackup when using LZ4 compression on RHEL9-based Percona XtraDB Cluster images. The fix addresses compatibility issues with the latest compression libraries in the operating system environment.
* [K8SPXC-1686](https://perconadev.atlassian.net/browse/K8SPXC-1686) - Improved backup error handling to ensure that providing an invalid Percona XtraBackup image results in a failed status. A new timeout field was introduced to prevent backup objects from hanging indefinitely in a starting state.
* [K8SPXC-1687](https://perconadev.atlassian.net/browse/K8SPXC-1687) - Fixed the `copy-backup.sh` script to correctly handle and copy cloud-based backups stored in S3 or Azure. This ensures that the utility script works consistently across all supported storage types.
* [K8SPXC-1701](https://perconadev.atlassian.net/browse/K8SPXC-1701) - Ensured that MySQL configurations are correctly mounted to the restore prepare job. This fix allows the restore process to use custom MySQL settings defined in the cluster (Thank you Emin AKTAS for reporting and contributing to this issue).
* [K8SPXC-1702](https://perconadev.atlassian.net/browse/K8SPXC-1702) - Added the ability to override time zones for backup jobs. This resolves issues where time-dependent operations could fail due to missing timezone definitions (Thank you Emin AKTAS for reporting and contributing to this issue).
* [K8SPXC-1721](https://perconadev.atlassian.net/browse/K8SPXC-1721) - Added a sleep interval to the recovery loop to prevent high CPU usage spikes when containers restart. 
* [K8SPXC-1725](https://perconadev.atlassian.net/browse/K8SPXC-1725) - Fixed a condition where a cluster could return stalled data during a backup or SST operation by adding the on-marked-down shutdown-sessions directive to HAProxy default configuration. This ensures that only fresh, up to date data is served during backups.
* [K8SPXC-1726](https://perconadev.atlassian.net/browse/K8SPXC-1726) - Resolved a deployment breakage in the Operator version 1.18.0 via Helm caused by PMM 3 client incompatibilities. The fix ensures a smoother upgrade path for users migrating to newer versions of PMM (Thank you Antonio Falzarano for reporting and contributing to this issue).
* [K8SPXC-1760](https://perconadev.atlassian.net/browse/K8SPXC-1760) - Fixed the handling of the crVersion field in the Helm chart templates. The Operator now correctly considers the version defined in `values.yaml` when generating the cluster configuration.
* [K8SPXC-1771](https://perconadev.atlassian.net/browse/K8SPXC-1771) - Fixed the issue with excessive logging by the backup controller when backups are suspended or resumed due to an unready cluster. This improves log readability and reduces unnecessary diagnostic noise.
* [K8SPXC-1772](https://perconadev.atlassian.net/browse/K8SPXC-1772) - Fixed a state transition bug where unsuspended backups could move directly from 'Starting' to 'Succeeded' without entering the 'Running' state. This ensures accurate tracking and visibility of the backup process status.

### Documentation Improvements

* [K8SPXC-1747](https://perconadev.atlassian.net/browse/K8SPXC-1747) - Improved the documentation with the information about available environment variables for cluster components and the Operator. Documented the `S3_WORKERS_LIMIT` environment variable to allow throttling of backup deletions. 
* [K8SPXC-1661](https://perconadev.atlassian.net/browse/K8SPXC-1661) - Updated the operator documentation to reflect that PMM 3 uses service accounts instead of API keys. This ensures that users can correctly configure monitoring integration with the latest versions of PMM.
* [K8SPXC-1663](https://perconadev.atlassian.net/browse/K8SPXC-1663) - Improved documentation for Point-in-Time Recovery steps. The updated documentation properly separates and sequences the recovery instructions for improved readability.

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
| percona/percona-xtradb-cluster-operator:1.19.0         | 4f3e0823af80488ff2f5d1e8fc034f5638a78bdcbd431610daccd4dc3c2a7a03 |
| percona/percona-xtradb-cluster-operator:1.19.0 (ARM64) | b747573292d44cf1d93e4e3cb289ed764a7914fdab98ef4824bb1517c28e4760 |
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
