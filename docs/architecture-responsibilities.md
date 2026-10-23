# Who owns what

When something happens in the cluster, the question is which layer reacts: the Operator, Percona XtraDB Cluster ([Galera](glossary.md#galera)), Kubernetes, or you. This page answers it at a glance. For the detail of what you do and what the Operator does in each area, and for what never to change by hand, see [Responsibilities by area](operator-boundaries.md). For an overview of the layers, see [Design and architecture](architecture.md#the-four-layers).

Two rules explain most of the behavior:

* **You change the cluster only through the [Custom Resource](glossary.md#custom-resource) and the user Secrets.** The Operator turns them into Kubernetes objects, and reverts manual changes to the fields it manages.
* **Each layer keeps its own part alive.** Kubernetes keeps Pods running, Galera keeps the data consistent, and the Operator keeps the objects and the day-2 tasks matching the Custom Resource.

## Who reacts when something happens

| Event | Who reacts | Where it is explained |
| --- | --- | --- |
| A container crashes or fails its liveness probe | The kubelet restarts the container | [Health checks and probes](architecture-probes.md) |
| A Pod is deleted or evicted | The StatefulSet controller recreates it. The Operator isn't involved | [In-cluster failover](failover-in-cluster.md) |
| A Kubernetes node fails | Kubernetes. A StatefulSet Pod is recreated elsewhere only after the Node object is removed or the stuck Pod is force-deleted, which is up to you or your platform | [Kubernetes](#kubernetes) |
| A database node falls behind or rejoins | Galera, with IST or SST | [Rejoining the cluster](failover-in-cluster.md#rejoining-the-cluster) |
| A proxy loses a database node | The proxy health check. The `pxc-monit` container updates the proxy configuration | [Key workflows](architecture-workflows.md#client-traffic-and-proxy-failover) |
| The survivor of a 2-of-3 loss is outside the primary component | Liveness restarts it. When no node is in a primary component, the Operator starts the node with the highest `seqno` as a new one | [Full cluster crash recovery](architecture-workflows.md#full-cluster-crash-recovery) |
| You edit the Custom Resource | The Operator reconciles the change | [How the Operator reacts to changes](architecture-reconciliation.md) |
| Someone edits an object the Operator manages | The Operator reverts the fields it manages | [Change the cluster through the Custom Resource](#change-the-cluster-through-the-custom-resource) |
| A scheduled backup is due | The Operator creates the backup object, and a Job runs it | [Scheduled backups](architecture-workflows.md#scheduled-backups) |
| A certificate expires and cert-manager isn't used | You | [Update certificates](tls-update.md) |
| A disk fills up | You. With storage autoscaling on, the Operator grows the volume | [Automatic storage resizing](scaling-storage-resize.md#automatic-storage-resizing) |

## Change the cluster through the Custom Resource

A [Custom Resource :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) (CR) is the Kubernetes object that describes the cluster you want. It is a blueprint that the Operator uses to deploy and manage your cluster.

**The Custom Resource is the source of truth. Change the cluster by editing the CR.**

The Operator compares the CR against what is running about every five seconds and corrects any difference it finds. A change you make directly to a [StatefulSet](glossary.md#statefulset), a Service, a Pod, or a managed Secret is drift. The Operator overwrites it, usually within seconds. If a change survives, this means the Operator does not manage that field yet. This doesn't mean the change was accepted.

* **Edits to the fields the Operator manages do not persist.** The Operator reverts them and doesn't raise an event.
* **Edits outside the CR can still cause damage before they are reverted.**

## Review responsibilities at a glance

The following table shows what the Operator handles and what stays with you. Select an area for the details and the list of manual actions to avoid.

| Area | Operator  | You | Don't do manually |
| --- | --- | --- | --- |
| [Cluster lifecycle](operator-boundaries.md#cluster-lifecycle) | - Creates and heals StatefulSets, Services, and PodDisruptionBudgets.<br>- Rolls out changes with ordered restarts. Kubernetes restarts failed Pods.<br>- Recovers from a full cluster crash. | - Choose the cluster size.<br>- Decide when to pause.<br>- Plan maintenance windows. | - Scale or edit the StatefulSet.<br>- Delete Pods to restart a node.<br>- Remove finalizers. |
| [Backups](operator-boundaries.md#back-up-the-database) | - Runs scheduled and on-demand backups.<br>- Enforces deadlines.<br>- Suspends backups on an unhealthy cluster. | - Verify that backups restore.<br>- Set retention.<br>- Keep off-cluster copies. | - Delete a running backup Job.<br>- Run `xtrabackup` by hand against a node. |
| [Restore and point-in-time recovery (PITR)](operator-boundaries.md#restore-and-point-in-time-recovery) | - Pauses the cluster, restores, and restarts it.<br>- Detects binary log gaps. | - Take a new full backup after a gap.<br>- Pick the restore target. | - Edit the cluster CR during a restore.<br>- Run two restores at once. |
| [TLS](operator-boundaries.md#manage-certificates) | - Issues certificates.<br>- Renews them **only via cert-manager**.<br>- Applies rotations without downtime. | - Rotate certificates yourself if cert-manager is not installed.<br>- Manage any certificate you supplied. | - Edit the `ssl` or `ssl-internal` Secrets in place.<br>- Delete them to re-issue certificates. |
| [Users and secrets](operator-boundaries.md#users-and-secrets) | - Creates the system users with the cluster.<br>- Applies the passwords you change in the Secret to MySQL and the proxies. | - Set passwords in the user Secret.<br>- Manage your own application users. | - Run `ALTER USER` on a system user in MySQL.<br>- Edit the `internal-` Secret.<br>- Drop a system user. |
| [Storage](operator-boundaries.md#storage) | - Grows Persistent Volume Claims (PVCs) when the CR asks, and automatically when autoscaling is on. | - Pick a StorageClass that supports expansion.<br>- Watch capacity. | - Resize or delete PVCs by hand.<br>- Shrink storage. |
| [Cross-site replication](operator-boundaries.md#cross-site-replication) | - Sets up the replication channels from the CR.<br>- Removes channels that are not in the CR.<br>- Logs when a channel isn't running. | - Provide routable endpoints and matching replication passwords.<br>- Monitor replication and repair it. | - Create replication channels in MySQL by hand. |
| [Upgrades](operator-boundaries.md#database-upgrades) | - Coordinates version upgrades node by node and keeps quorum. | - Decide when to upgrade.<br>- Run major version upgrades as a planned change. | - Bypass SmartUpdate.<br>- Edit image tags to jump a major version. |

## The Operator

The Operator reads the Custom Resource, compares it with what exists in Kubernetes about every five seconds, and creates, updates or deletes objects to close the gap. It also runs the day-2 tasks: ordered restarts ([Smart Update](architecture-reconciliation.md#update-strategies)), password changes, certificates, storage resizing, backups, restores, point-in-time recovery, cross-site replication channels, and [recovery after a full cluster crash](architecture-workflows.md#full-cluster-crash-recovery).

**The Operator does not:**

* Control Galera at runtime. It writes the Galera configuration, but [quorum](glossary.md#quorum), [SST](glossary.md#sst) and [IST](glossary.md#ist), and [donor](glossary.md#donor) selection are handled by Galera itself.
* Handle Kubernetes node failures. It does not force-delete Pods stuck on a failed node or react to node taints. Kubernetes recreates a Pod from an unreachable node elsewhere only after the Node object is removed or the stuck Pod is force-deleted.
* Validate MySQL options. The contents of `spec.pxc.configuration` go into a ConfigMap as is.
* Install or upgrade CRDs and RBAC.
* Drop database users that you remove from `spec.users`.
* Repair broken cross-site replication. It only logs that the replication channel is not running.
* Renew self-signed certificates it generated without cert-manager.
* Report most problems as Kubernetes events. It emits events only for full cluster crash recovery, CA certificate rotation, and volume resize. Everything else is in the Operator logs and the Custom Resource status.

For each area in detail, see [Responsibilities by area](operator-boundaries.md). For the objects the Operator creates, see [Objects the Operator creates](objects-created.md) and [Services and ports](services.md).

## Percona XtraDB Cluster and Galera

**Galera does:**

* Replicate every transaction to all nodes and certify it, resolving write conflicts.
* Maintain quorum and decide which nodes form the [primary component](glossary.md#primary-component) that serves queries.
* Slow down writes with flow control when a node falls behind.
* Bring a joining node up to date: with IST from another node's write-set cache ([gcache](glossary.md#gcache)) if possible, or with a full SST through Percona XtraBackup otherwise. Galera also chooses the donor node.

**What the Operator sets up for Galera:**

* The list of peers to connect to, from the cluster DNS.
* A preferred list of SST donors that excludes `cluster1-pxc-0` (the HAProxy writer) and the node with the highest number.
* `pc.weight=10`, unless you set it yourself.
* Encryption of replication traffic when internal TLS certificates exist.
* `innodb_buffer_pool_size` and `max_connections` calculated from the Pod resources, unless you set them yourself. This requires a memory limit (`pxc.resources.limits.memory`). See [Auto-tuning MySQL options](options.md#auto-tuning-mysql-options).

**Health as the Pod probes see it:**

* A database Pod is *ready* only when its node belongs to the primary component and is `Synced`. A node that is a donor counts as ready by default. Set the `AVAILABLE_WHEN_DONOR` environment variable of the `pxc` container to a value other than `1` to make a donor not ready. HAProxy's own health check has a separate switch, `OK_IF_DONOR`, which is off by default. See [In-cluster failover](failover-in-cluster.md#traffic-rerouting).
* The liveness probe tolerates long startups, SST and recovery, so a node that is busy catching up is not killed. A node that stays outside the primary component for about 30 seconds is restarted.
* See [Health checks and probes](architecture-probes.md) for what the probes check and who acts on their result.

**What this means in practice:**

* A Pod that is `Running` but not `Ready` usually means Galera hasn't finished bringing the node in: the node is still receiving an SST or IST, or it cannot reach the other nodes.
* An SST that keeps failing stops after `pxc.sstRetryCount` attempts, and the Pod stays not ready until you intervene. See [Limit SST retries](sst-retry-limit.md).
* A bad option in `spec.pxc.configuration` shows up as `mysqld` failing to start, in the `pxc` container logs.

## Kubernetes

**Kubernetes does:**

* **Schedule Pods.** The Operator only writes the affinity rules, node selectors, tolerations, priority class and topology spread constraints you specify. The default anti-affinity is *required* on `kubernetes.io/hostname`: three database Pods need three schedulable nodes. Otherwise a Pod stays `Pending`, and after about a minute the Custom Resource status shows the scheduler's message.
* **Provide storage.** The CSI driver and StorageClass provision volumes, bind them to zones, and expand file systems. A ReadWriteOnce volume ties the Pod to the node or zone where the volume can attach.
* **Run the network and DNS.** The database nodes find each other, and the proxies find the database nodes, by looking up the [headless Services](glossary.md#headless-service) in cluster DNS. If DNS is broken, nodes cannot form or join the cluster, proxies lose their backends, and crash detection stops working.
* **Provision load balancers.** For `LoadBalancer` Services, the cloud provider creates the load balancer. Firewalls and source ranges are yours and the provider's to manage.
* **Manage the Pod lifecycle.** Run probes, restart failed containers, enforce [PodDisruptionBudgets](glossary.md#pdb) during node drains, and retry failed Jobs.
* **Collect garbage.** Delete objects owned by the Custom Resource when you delete it.

**Kubernetes does not:**

* Know anything about Galera beyond the [probes](architecture-probes.md). A native StatefulSet rolling update waits for each Pod to become ready, but it doesn't pause for a running backup, doesn't wait for ProxySQL to bring the node back online, and doesn't stop early when a Pod can't start.
* Expand a volume whose StorageClass doesn't allow it, or beyond your storage quota.

## You, the user

The Operator keeps the cluster matching the Custom Resource. Everything it cannot create or decide for you stays with you:

* Install and upgrade the CRDs and RBAC, which the Operator never applies. See [Upgrade CRD and the Operator](update-operator.md).
* Provide capacity: enough schedulable nodes for the anti-affinity rules, and a StorageClass that allows volume expansion. See [Cluster lifecycle](operator-boundaries.md#cluster-lifecycle) and [Storage](operator-boundaries.md#storage).
* Provide credentials: the passwords in the user Secret, the backup storage credentials, and the PMM token. See [Users and Secrets](operator-boundaries.md#users-and-secrets).
* Renew certificates when cert-manager isn't installed, or when you supplied them. See [Manage certificates](operator-boundaries.md#manage-certificates).
* Verify that backups restore, set retention, and keep copies outside the cluster storage. See [Back up the database](operator-boundaries.md#back-up-the-database).
* Monitor cross-site replication, and repair it when it breaks. See [Cross-site replication](operator-boundaries.md#cross-site-replication).
* Decide when to pause, upgrade, and restore. See [Database upgrades](operator-boundaries.md#database-upgrades) and [Restore and point-in-time recovery](operator-boundaries.md#restore-and-point-in-time-recovery).

## Unsafe configurations

The Operator refuses configurations that put availability or data at risk, such as fewer than three database nodes or running without TLS. See [Stay inside safe operating limits](operator-boundaries.md#stay-inside-safe-operating-limits). To use one anyway, you opt in with a flag in the `spec.unsafeFlags` subsection. See [Override a safety check](operator-boundaries.md#override-a-safety-check).

## Who owns this failure?

Find the symptom, check the place named in the second column, and follow the link for the fix.

--8<-- "symptoms-table.md"

## How to tell which layer it is

--8<-- "triage-steps.md"

## See also

* [Responsibilities by area](operator-boundaries.md)
* [Objects the Operator creates](objects-created.md)
* [Services and ports](services.md)
