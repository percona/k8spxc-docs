> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Glossary

This page explains the Kubernetes and Galera terms used in the Operator documentation. The examples use a cluster named `cluster1`.

## Arbitrator (garbd)

The Galera Arbitrator daemon, `garbd`. A member of the Galera group that doesn’t run a database server. In the default backup method, the backup Job joins the cluster as an arbitrator to receive a copy of the data through [SST](#sst).

See [Backup methods](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-methods.html).

## Cluster

The word *cluster* has two meanings in these docs. A *Kubernetes cluster* is the set of machines that Kubernetes manages. A *Percona XtraDB Cluster* is the database cluster that one [Custom Resource](#custom-resource) describes: its database nodes and its proxies. One Kubernetes cluster can run several of them. Pages that say “the cluster” mean the database cluster, unless they say “Kubernetes cluster”.

See [Design and architecture](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture.html).

## Custom Resource (CR, cr.yaml)

The Kubernetes object that describes the cluster you want, for example `PerconaXtraDBCluster`. The Operator reads it and makes the cluster match. The CustomResourceDefinition (CRD) tells Kubernetes that this object type exists.

The `deploy/cr.yaml` file in the Operator repository is the example manifest of this object. See [Change the cluster through the Custom Resource](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-responsibilities.html#change-the-cluster-through-the-custom-resource).

For all options, see the [Custom Resource options reference](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html).

## Donor

The database [node](#node) that sends data to a node that joins or rejoins the cluster, through [IST](#ist) or [SST](#sst). Galera chooses the donor.

See [In-cluster failover](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/failover-in-cluster.html#rejoining-the-cluster).

## Finalizer

A key in `metadata.finalizers` that makes Kubernetes wait for a cleanup step before it deletes an object. The Operator uses finalizers such as `percona.com/delete-pxc-pvc` to clean up volumes and certificates.

See [Clean up resources](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/delete.html#clean-up-resources).

## Galera

The replication library in Percona XtraDB Cluster. It replicates transactions to every node, keeps [quorum](#quorum) and brings joining nodes up to date. The Operator doesn’t control it at runtime.

See [Who owns what](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-responsibilities.html#percona-xtradb-cluster-and-galera).

## gcache

The Galera write-set cache on each node. If the missing transactions are still in the [donor’s](#donor) gcache, a joining node catches up with [IST](#ist). If not, it needs [SST](#sst).

See [In-cluster failover](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/failover-in-cluster.html#rejoining-the-cluster).

## Headless Service

A Kubernetes Service without a cluster IP. DNS returns the addresses of the Pods behind it. The database nodes and the proxies use headless Services such as `cluster1-pxc` to find each other.

See [Services and ports](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/services.html).

## Incremental State Transfer (IST)

A transfer of only the transactions a joining node missed, taken from the [donor’s](#donor) [gcache](#gcache). Compare [SST](#sst).

See [In-cluster failover](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/failover-in-cluster.html#rejoining-the-cluster).

## Lease

A small Kubernetes object that works as a lock. The Operator uses a Lease so that only one backup runs at a time when `backup.allowParallel` is `false`.

See [Objects the Operator creates](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/objects-created.html).

## Node

The word *node* has two meanings in these docs. A *Kubernetes node* is a machine, physical or virtual, where Pods run. A *database node* is one member of the Percona XtraDB Cluster: a `cluster1-pxc-N` Pod that runs `mysqld`. By default, the Operator requires each database Pod to run on a different Kubernetes node.

See [Control Pod scheduling](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/constraints.html).

## PersistentVolumeClaim (PVC)

A request for storage. Each database Pod has a PVC that holds its data. The StorageClass and the Container Storage Interface (CSI) driver provide the actual volume.

See [Resize storage](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/scaling-storage-resize.html).

## PodDisruptionBudget (PDB)

A Kubernetes object that limits how many Pods of a component can be unavailable during voluntary disruptions such as a node drain. The Operator creates one for each component.

See [Health checks and probes](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-probes.html).

## Primary component

The group of nodes that has [quorum](#quorum) and serves queries. A node outside it reports `non-Primary` and rejects queries.

See [Health checks and probes](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-probes.html).

## Quorum

A majority of the nodes. A cluster of three nodes keeps quorum when one node is lost. It stops serving when it loses a second one.

See [Design and architecture](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture.html).

## Reconcile

One pass of the Operator loop: it compares the Custom Resource with what exists in Kubernetes and corrects the difference. The Operator repeats it about every five seconds.

See [How the Operator reacts to changes](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-reconciliation.html#what-a-reconcile-is).

## seqno

The sequence number of the last transaction a node committed. After a full cluster crash, the Operator starts recovery from the node with the highest `seqno`.

See [Crash recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/recovery.html).

## Smart Update

The Operator update strategy that restarts the database nodes one at a time and keeps quorum. It doesn’t start while a backup is running.

See [How Smart Update works](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/architecture-reconciliation.html#how-smart-update-works).

## State Snapshot Transfer (SST)

A full copy of the data from a [donor](#donor) to a joining node, made with Percona XtraBackup. Compare [IST](#ist).

See [In-cluster failover](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/failover-in-cluster.html#rejoining-the-cluster).

## StatefulSet

A Kubernetes workload that gives each Pod a stable name and its own volume, for example `cluster1-pxc-0`. The Operator runs the database nodes and the proxies as StatefulSets.

See [Objects the Operator creates](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/objects-created.html).
