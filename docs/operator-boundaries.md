# What the Operator manages

This page describes what the Operator does for you, what you must still do yourself and which manual actions can damage a running cluster. 

## Change the cluster through the Custom Resource

A [Custom Resource :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) (CR) is the Kubernetes object that describes the cluster you want. It is a blueprint that the Operator uses to deploy and manage your cluster.

**The Custom Resource is the source of truth. Change the cluster by editing the CR.**

The Operator compares the CR against what is running about every five seconds and corrects any difference it finds. A change you make directly to a StatefulSet, a Service, a Pod, or a managed Secret is drift. The Operator overwrites it, usually within seconds. If a change survives, this means the Operator does not manage that field yet. This doesn't mean the change was accepted.

* **Edits outside the CR do not persist.** The Operator reverts them silently.
* **Edits outside the CR can still cause damage before they are reverted.**

## Review responsibilities at a glance

The following table shows what the Operator handles and what stays with you:

| Area | Operator  | You | Don't do manually |
| --- | --- | --- | --- |
| [Cluster lifecycle](#cluster-lifecycle) | - Creates and heals StatefulSets, Services, and PodDisruptionBudgets.<br>- Restarts failed nodes.<br>- Recovers from a full cluster crash. | - Choose the cluster size.<br>- Decide when to pause.<br>- Plan maintenance windows. | - Scale or edit the StatefulSet.<br>- Delete Pods to restart a node.<br>- Remove finalizers. |
| [Backups](#back-up-the-database) | - Runs scheduled and on-demand backups.<br>- Enforces deadlines.<br>- Suspends backups on an unhealthy cluster. | - Verify that backups restore.<br>- Set retention.<br>- Keep off-cluster copies. | - Delete a running backup Job.<br>- Run `xtrabackup` by hand against a node. |
| [Restore and point-in-time recovery (PITR)](#restore-the-database) | - Pauses the cluster, restores, and restarts it.<br>- Detects binary log gaps. | - Take a new full backup after a gap.<br>- Pick the restore target. | - Edit the cluster CR during a restore.<br>- Run two restores at once. |
| [TLS](#manage-certificates) | - Issues certificates.<br>- Renews them **only via cert-manager**.<br>- Applies rotations without downtime. | - Rotate certificates yourself if cert-manager is not installed.<br>- Manage any certificate you supplied. | - Edit the `ssl` or `ssl-internal` Secrets in place.<br>- Delete them to re-issue certificates. |
| [Users and secrets](#manage-users-and-passwords) | - Creates and rotates the system users.<br>- Propagates password changes to MySQL and the proxies. | - Set passwords in the user Secret.<br>- Manage your own application users. | - Run `ALTER USER` on a system user in MySQL.<br>- Edit the `internal-` Secret.<br>- Drop a system user. |
| [Storage](#resize-storage) | - Grows Persistent Volume Claims (PVCs) when the CR asks, and automatically when autoscaling is on. | - Pick a StorageClass that supports expansion.<br>- Watch capacity. | - Resize or delete PVCs by hand.<br>- Shrink storage. |
| [Upgrades](#upgrade-the-database) | - Coordinates version upgrades node by node and keeps quorum. | - Decide when to upgrade.<br>- Run major version upgrades as a planned change. | - Bypass SmartUpdate.<br>- Edit image tags to jump a major version. |

## Cluster lifecycle

Change cluster size, pause state, and deletion through the CR. Direct edits to the StatefulSet fight the next reconcile.

**What the Operator does:**

* Creates and reconciles the Percona XtraDB Cluster StatefulSet, the HAProxy or ProxySQL StatefulSet, their Services, and a PodDisruptionBudget for Percona XtraDB Cluster.
* Restarts failed nodes and lets Galera resynchronize them.
* Shuts the cluster down in order when you set `spec.pause: true`, and brings it back when you set it to `false`. Data is retained. See [Pause/resume Percona XtraDB Cluster](pause.md).
* Deletes resources in a safe order on cluster deletion, using finalizers. See [Delete the database cluster](delete.md#delete-the-database-cluster).
* Handles **full cluster crash recovery.** When every node is down and waiting, the Operator finds the node with the highest transaction sequence number and bootstraps from it. This behavior is on by default (`spec.pxc.autoRecovery`). See [Crash recovery](recovery.md).

**What you still do:**

* Choose the cluster size. Stay inside the limits in [Stay inside safe operating limits](#stay-inside-safe-operating-limits).
* Decide when to pause a cluster, and for how long.
* Plan capacity, node size, and maintenance windows for any change that restarts Pods.
* **Manual recovery when the Operator refuses to recover automatically.** The Operator does not bootstrap from a node when the cluster UUID or sequence number has regressed since the last recovery, because that bootstrap can lose data. It emits an `AutomaticRecoveryRefused` event and stops. That handover is deliberate. Follow [Manual crash recovery](recovery.md#manual-crash-recovery) instead of forcing a bootstrap.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Run `kubectl scale` or `kubectl edit` on the Percona XtraDB Cluster StatefulSet | The next reconcile reverts the change. If the change takes effect first, nodes can leave the cluster in the wrong order | Change `spec.pxc.size` in the CR |
| Remove a finalizer to finish a stuck delete | Finalizers shut nodes down in order and clean up PVCs and certificates. Removing one abandons that cleanup and can orphan data | Find out why the finalizer is blocked. The four finalizers are: `percona.com/delete-pxc-pods-in-order`, `percona.com/delete-pxc-pvc`, `percona.com/delete-proxysql-pvc`, and `percona.com/delete-ssl` |
| Run `kubectl delete pxc` to reset a misbehaving cluster | Depending on the finalizers set, this deletes the PVCs and the data on them | Pause the cluster and investigate |
| Bootstrap Galera by hand while the Operator is running | The Operator is also trying to recover. Two bootstraps mean two clusters and a split brain | Let auto-recovery run. Recover manually only after the Operator has refused and reported that refusal |

## Back up the database

Create backups through a schedule on the cluster CR or through a `PerconaXtraDBClusterBackup` resource. See [About backups](backups.md).

**What the Operator does:**

* Runs scheduled backups from `spec.backup.schedule`, and on-demand backups from a `PerconaXtraDBClusterBackup` resource.
* Enforces deadlines so a backup cannot hang forever: `startingDeadlineSeconds`, `runningDeadlineSeconds`, and `suspendedDeadlineSeconds`. A backup that exceeds one is marked failed.
* Collects binary logs continuously for point-in-time recovery when `spec.backup.pitr` is enabled. See [Store binary logs for point-in-time recovery](backups-pitr.md).
* **Refuses to back up an unhealthy cluster.** If the cluster is not Ready, the backup does not start. A backup that is already running is suspended until the cluster recovers.

**What you still do:**

* **Verify that your backups restore.** The Operator confirms that a backup completed. It does not confirm that the backup is usable. Restore-test on a schedule. See [Restore the cluster from a previously saved backup](backups-restore.md).
* Set retention, and keep any copies outside the cluster storage target.
* Manage credentials and lifecycle policies on the S3 or Azure bucket.
* Decide whether a backup during a degraded window is worth the risk.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Delete the backup Job to clear a stuck backup | The backup resource still reports that it is running, and storage may hold a partial backup that looks complete | Let the deadline fail it, or delete the `PerconaXtraDBClusterBackup` resource. See [Delete the unneeded backup](backups-delete.md) |
| Raise or remove the deadlines so backups stop failing | Deadlines are what stop a wedged backup from blocking upgrades indefinitely. SmartUpdate does not start while a backup is running | Find out why the backup is slow or stuck |
| Set `unsafeFlags.backupIfUnhealthy` to get a backup from a broken cluster | A backup from a cluster that is not in sync may be inconsistent and may not restore | Repair the cluster, then back up. If you must take the backup, treat the result as best-effort only |
| Run `xtrabackup` by hand against a Pod | The manual backup competes with the Operator backup lock and can stall writes | Create a `PerconaXtraDBClusterBackup` resource |
| Delete objects from the backup storage bucket by hand | The PITR chain between a full backup and its binary logs breaks | Delete the `PerconaXtraDBClusterBackup` resource and let the finalizer clean up |

## Restore and point-in-time recovery

**What the Operator does:**

* Runs the whole restore sequence: pauses the cluster, runs the restore, starts the cluster, verifies that it is Ready, and marks the restore succeeded.
* Restores to a point in time by GTID, transaction, or timestamp.
* **Refuses concurrent restores.** A second restore against the same cluster fails immediately, so it does not corrupt the first.
* **Detects binary log gaps.** If the binlog collector finds that binary logs it needs are missing, it marks the most recent successful backup with the condition `PITRReady: False` and the reason `BinlogGapDetected`.

**What you still do:**

* Choose the restore target, and accept the data loss between that target and now.
* Plan the maintenance window. A restore stops the cluster.
* **Take a new full backup after a binlog gap is reported.** The gap means PITR from that backup is no longer possible, and the window it covers is unrecoverable. Nothing restores that window. Take a fresh full backup to start a new PITR chain.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Edit the cluster CR while a restore is running | **The restore controller writes to your CR.** It sets `spec.pause`, sets the Percona XtraDB Cluster and proxy sizes to zero, and restores your original values from the restore resource status afterwards. An edit in that window is overwritten, or it is merged into a cluster that does not match the restore recorded state | Wait until the restore reaches `Succeeded` or `Failed` |
| Unpause the cluster during a restore | The restore is operating on the data directory of stopped nodes. Starting them mid-restore can leave inconsistent data | Wait |
| Start a second restore because the first looks stuck | The Operator rejects the second restore and marks it failed | Wait for the previous restore |
| Delete the restore resource mid-flight | The cluster stays paused and sized to zero, with nothing left to restore it | Let the restore finish, then delete the resource |
| Ignore `PITRReady: False` | You believe you have point-in-time coverage that does not exist. You find out during an incident | Take a new full backup, then confirm that the condition clears |

## Manage certificates

How certificates are renewed depends on who created them. See [Transport Layer Security (TLS)](TLS.md).

**What the Operator does:**

* Issues certificates when the cluster is created: through cert-manager when it is available, and self-signed when it is not.
* **Renews certificates automatically — but only when cert-manager manages them.**
* Re-issues leaf certificates when the CA changes, for cert-manager-managed certificates.
* Applies a certificate rotation to a running cluster without downtime. You place the new material in a Secret named `<secret-name>-new`. The Operator moves through the rotation in steps: 
    * combines the old and new certificate authority (CA), 
    * swaps the leaf certificate and key, 
    * drops the old CA.
      
    See [Update certificates](tls-update.md#update-valid-certificates-without-downtime).

**What you still do:**

**If cert-manager is not installed, Operator-generated certificates are not renewed automatically.** These certificates are long-term; check their actual [expiration dates](tls-update.md#check-your-certificates-for-expiration) and provide replacements before they expire. Expired certificates can prevent nodes from trusting each other and stop replication.

**If you supplied the TLS Secret yourself, renewal is your responsibility.** The Operator does not renew those certificates automatically, but it can apply replacements you provide through the `<secret-name>-new` rotation procedure. See [Generate certificates manually](tls-manual.md) and [Update certificates](tls-update.md#update-valid-certificates-without-downtime).

Watch expiry dates in both of these cases, and rotate before they are reached.

!!! note ""

    **Recommendation:** install [cert-manager](tls-cert-manager.md) for automatic certificate renewal. Otherwise, schedule a reminder based on your certificates' actual expiration dates and rotate well before expiry with the `-new` Secret procedure in [Update certificates](tls-update.md).

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Edit `tls.crt` or `tls.key` in the `ssl` or `ssl-internal` Secret directly | Nodes pick up a new certificate at different times. The nodes that have not restarted cannot talk to the nodes that have | Create the `<secret-name>-new` Secret and let the Operator roll it out |
| Delete the TLS Secrets to force a re-issue | The cluster loses the ability to communicate between nodes until new certificates exist and every node has restarted. On a running cluster, this is an outage | Use the `-new` Secret rotation procedure |
| Set `unsafeFlags.tls: true` to work around an expired certificate | This only permits TLS to be disabled; it does not renew certificates or change `spec.tls.enabled`. Disabling TLS removes encryption and causes downtime on a running cluster | Rotate the certificate |
| Change the CA without rotating the leaf certificates | Nodes reject each other's certificates | Rotate both. The Operator does this for you when cert-manager issued them |

## Users and Secrets

**What the Operator does:**

* Creates and manages the system users `root`, `operator`, `monitor`, `xtrabackup`, and `replication`. It also manages `proxyadmin` and the PMM users. See [System users](users.md#system-users).
* Propagates a password change. You edit the Secret named in `spec.secretsName`, and the Operator applies it in MySQL, updates the proxies, and restarts what needs restarting. It tracks what it has already applied in a separate Secret named `internal-<cluster-name>`.
* Manages application users declared in `spec.users`, including their grants and the databases they can reach.
* Rejects a user in `spec.users` whose name collides with a system user.

**What you still do:**

* Generate and store strong passwords, and decide when to rotate them.
* **Schedule password rotations.** Changing a system user's password causes a rolling restart of the affected components. Treat it as a maintenance operation, not a routine edit.
* Change system-user passwords in the Secret named by `spec.secretsName`. See [Users](users.md).
* Declare application users in `spec.users`.
* Manage application users you create directly in MySQL, outside `spec.users`. The Operator does not know about them and does not recreate them after a restore.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Run `ALTER USER` on a system user inside MySQL | The Operator still holds the old password, loses access to the cluster, and reconciliation starts failing. Monitoring and backups fail with it | Edit the Secret named in `spec.secretsName` |
| Edit the `internal-<cluster-name>` Secret | That Secret is the Operator record of what it has already applied. Editing it makes the Operator believe a password is in place that MySQL does not have | Leave it unchanged. Edit the user Secret instead |
| Run `DROP USER` or rename a system user | Backups, monitoring, the proxies, and the Operator itself authenticate as these users | Leave the system users in place. They are not optional |
| Delete the user Secret to regenerate passwords | The Operator cannot authenticate to apply new passwords | Edit the password values in place |
| Grant application privileges to `root` or `operator` and use them from your application | Password rotation then takes your application down with the cluster | Declare an application user in `spec.users` |

## Storage

Request a larger volume in the CR. The Operator grows the PVCs when volume expansion is enabled and the StorageClass supports it. See [Scale storage](scaling.md#scale-storage).

**What the Operator does:**

* Grows PVCs when you increase the size in the CR, when `storageScaling.enableVolumeScaling` is on and the StorageClass supports expansion.
* Grows storage automatically when `spec.storageScaling.autoscaling` is enabled. When disk usage crosses the trigger threshold (80% by default), storage grows by the configured step, up to the configured maximum.
* Detects a failed resize and reverts the volume template so the CR matches reality again.

**What you still do:**

* Choose a StorageClass with `allowVolumeExpansion: true`. Without it, the size in the CR and the size on disk never agree.
* Watch disk usage, and set a maximum that your quota can satisfy.
* Take over PVC sizes yourself if you set `enableExternalAutoscaling`. The Operator then stops managing PVC sizes and leaves them to your external controller.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Edit or patch a PVC directly | The Operator reconciles PVC sizes against the CR. Your change is reverted, or it conflicts with a resize in progress | Change the storage size in the CR |
| Try to shrink storage | The Operator rejects the shrink. It reverts the volume template and reports that the requested size is below the actual size | Shrinking is not supported. Back up, recreate the cluster with smaller volumes, and restore |
| Delete a PVC to reclaim space or reset a node | The data is gone. The replacement node needs a full state transfer from a healthy donor, which loads that donor. If the cluster was already degraded, this can remove the last good copy | Grow the volume, or remove data from inside the database |

## Database upgrades

Let the Operator move nodes one at a time. See [About upgrades](update.md) and [Upgrade Percona XtraDB Cluster](update-db.md).

**What the Operator does:**

* **SmartUpdate.** The Operator upgrades Percona XtraDB Cluster nodes one at a time, keeps quorum, and restarts the primary last to minimize connection disruption.
* Waits for the proxies to be Ready before it begins.
* Checks the Percona Version Service for available versions when `spec.upgradeOptions.apply` enables that check.
* **Refuses to start an upgrade while a backup is running.**

**What you still do:**

* Decide when to upgrade, and test the target version first.
* Review release notes for changes that affect your configuration.
* Choose whether automatic version updates are appropriate. For production clusters, pin a version and upgrade deliberately.
* **Major version upgrades.** Treat a major version upgrade as a planned operation with its own procedure. Follow [Upgrade Percona XtraDB Cluster](update-db.md).

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Change `spec.updateStrategy` to `RollingUpdate` to make an upgrade go faster | Kubernetes restarts nodes without waiting for Galera to resynchronize each one. You can lose quorum mid-upgrade | Leave the strategy on `SmartUpdate` and find out what the upgrade is waiting for |
| Edit the image tag to jump a major version | Skipping the documented upgrade path can leave the data dictionary in a state the new version cannot read | Follow the database upgrade procedure |
| Delete Pods during an upgrade to unstick it | SmartUpdate tracks which node it has reached. Restarting nodes underneath it breaks that sequence | Check the Operator logs. An upgrade that waits on a running backup, or on a proxy that is not Ready, is working as intended. See [Check the logs](debug-logs.md) |
| Run different Percona XtraDB Cluster versions across nodes for an extended period | Mixed-version clusters are safe only for the duration of an upgrade | Complete the upgrade |

## Stay inside safe operating limits

The Operator rejects a CR that breaks the Percona XtraDB Cluster size limits or runs without TLS. 

| Setting | Safe limit | Why |
| --- | --- | --- |
| `spec.pxc.size` | At least 3 | Galera needs three nodes to hold quorum when one is lost |
| `spec.pxc.size` | At most 5 | Write latency grows with every node that must certify a transaction |
| `spec.pxc.size` | An odd number | An even-sized cluster can split into two halves with no majority |
| `spec.haproxy.size` / `spec.proxysql.size` | At least 2 | A single proxy is a single point of failure in front of a highly available cluster |
| `spec.tls.enabled` | `true` | Replication traffic between nodes is otherwise unencrypted |

Read more about node count in [Design and architecture](architecture.md).

You can turn each check off individually under `spec.unsafeFlags`. See [Override a safety check](#override-a-safety-check). Do not turn a check off to clear an error message.

## Override a safety check

`spec.unsafeFlags` turns off individual safety checks. Each check exists because turning it off can lose data or availability. Field details are in the [Unsafe flags section](operator.md#operator-unsafeflags-section).

| Flag | Enables | What you give up |
| --- | --- | --- |
| `unsafeFlags.pxcSize` | Fewer than three, more than five, or an even number of Percona XtraDB Cluster nodes | Quorum guarantees. A cluster with one or two nodes is not highly available |
| `unsafeFlags.proxySize` | A single HAProxy or ProxySQL Pod | Proxy redundancy. A proxy restart is an outage |
| `unsafeFlags.tls` | Running without TLS | Encryption of replication and client traffic |
| `unsafeFlags.backupIfUnhealthy` | Backups from a cluster that is not Ready | Confidence that the backup is consistent and restorable |

Use these flags for a development cluster, a local test, or a deliberate single-node setup for continuous integration. On a production cluster, an Operator rejection describes a real risk in the configuration you asked for.

## Check before you intervene

When a manual change looks necessary, do the following:

1. Check whether the CR already exposes what you want. Most requests for manual changes are covered by a field.
2. Reproduce the change on a non-production cluster first.
3. Capture the Operator logs and the resource status before you change anything. See [Check the logs](debug-logs.md).
4. Contact [Percona Support](get-help.md) before you act on a production cluster.

Manual intervention on a running database cluster is recoverable far less often than it looks from the outside.
