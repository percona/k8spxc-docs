# Failover and high availability

Percona XtraDB Cluster handles two different kinds of failure, and the Operator responds to each one differently.

* Losing one or more nodes inside a running cluster, while a majority of nodes stay up. The Operator and the proxy in front of the cluster (HAProxy or ProxySQL) recover from this automatically.
* Losing an entire site. It can be a whole Kubernetes cluster, an availability zone, or a cloud region. To recover, you must promote a replica site and switch over the workload to it manually.

Use the following table to find the right page for your situation.

## Which situation are you in?

| Situation | What recovers it | Go to |
| --- | --- | --- |
| One or more nodes go down inside a running cluster, but a majority of nodes stay up. This includes the primary Pod, `<cluster-name>-pxc-0`, going down. | The Operator recreates the failed Pod, and HAProxy or ProxySQL reroutes traffic to a surviving node automatically. | [In-cluster failover](failover-in-cluster.md) |
| An entire site goes down — the whole Kubernetes cluster, availability zone, or cloud region. | No automatic recovery. You promote the replica site yourself. | [Set up disaster recovery](dr.md) |

These two scenarios are not mutually exclusive. A site-wide outage also takes down every node in that site at once. We recommend you to read both pages: in-cluster failover explains what happens automatically inside each site, and disaster recovery explains how to fail over between sites when that isn't enough.

## Next steps

* [In-cluster failover](failover-in-cluster.md){.md-button}
* [Set up disaster recovery](dr.md){.md-button}
