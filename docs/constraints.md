# Control Pod scheduling on specific Kubernetes nodes with affinity, anti‑affinity and tolerations

The Operator automatically assigns Pods to nodes with sufficient resources for balanced distribution across the cluster. You can configure Pods to be scheduled on specific nodes. For example, for improved performance on the SSD
equipped machine or for cost optimization by choosing the nodes in the same availability zone.

Using the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml) Custom Resource manifest, you can configure the following:

* Node selection rules to ensure that Pods are scheduled only on Kubernetes nodes that have specific labels.
* Affinity and anti-affinity rules to bind Pods to specific Kubernetes nodes
* Taints and tolerations to ensure that Pods are not scheduled onto inappropriate nodes

## Node selector

The `nodeSelector` field lets you specify a list of key-value labels that a node must have in order for a Pod to be scheduled on it. For example, to ensure Pods land on nodes with SSD storage or in specific availability zones.

If a node doesn't have all the labels you specify in `nodeSelector`, your Pod won't run on that node. In other words, `nodeSelector` acts like a filter so that only nodes with the right labels are eligible to host your Pod.

The following example binds the Pod to any node having a `disktype: ssd` label:

```yaml
nodeSelector:
  disktype: ssd
```

## Affinity and Anti-affinity

Affinity controls Pod placement based on nodes which already have Pods with specific labels. Use affinity to:

* Reduce costs by placing Pods in the same availability zone
* Improve high availability by distributing Pods across different nodes or zones

The Operator provides two approaches:

* Simple - set anti-affinity for Pods using built-in options. You can set anti-affinity for `pxc`, `haproxy`, and `proxysql` Pods, and for the backup storage of the S3 and PVC
* Advanced - using Kubernetes constraints

### Simple Anti-affinity

This approach does not require the knowledge of how Kubernetes assigns Pods to specific nodes.

Use the `antiAffinityTopologyKey` option with these values:

* `kubernetes.io/hostname` - Pods avoid the same host
* `topology.kubernetes.io/zone` - Pods avoid the same zone  
* `topology.kubernetes.io/region` - Pods avoid the same region
* `none` - No constraints applied

**Example**

This configuration ensures that Percona XtraDB Cluster Pods are not placed on the same node:

```yaml
affinity:
  antiAffinityTopologyKey: "kubernetes.io/hostname"
```

### Advanced anti-affinity via Kubernetes constraints

For complex scheduling requirements, use the `advanced` option. This disables the `antiAffinityTopologyKey` effect and allows the use of standard Kubernetes affinity constraints:

```yaml
affinity:
   advanced:
     podAffinity:
       requiredDuringSchedulingIgnoredDuringExecution:
       - labelSelector:
           matchExpressions:
           - key: security
             operator: In
             values:
             - S1
         topologyKey: topology.kubernetes.io/zone
     podAntiAffinity:
       preferredDuringSchedulingIgnoredDuringExecution:
       - weight: 100
         podAffinityTerm:
           labelSelector:
             matchExpressions:
             - key: security
               operator: In
               values:
               - S2
           topologyKey: kubernetes.io/hostname
     nodeAffinity:
       requiredDuringSchedulingIgnoredDuringExecution:
         nodeSelectorTerms:
         - matchExpressions:
           - key: kubernetes.io/e2e-az-name
             operator: In
             values:
             - e2e-az1
             - e2e-az2
       preferredDuringSchedulingIgnoredDuringExecution:
       - weight: 1
         preference:
           matchExpressions:
           - key: another-node-label-key
             operator: In
             values:
             - another-node-label-value
```

See [Kubernetes affinity documentation :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) for detailed explanations of these options.

## Tolerations

Tolerations allow Pods to run on nodes with matching taints. A taint is a key-value pair associated with a node that marks the node to repel certain Pods.

Taints and tolerations work together to ensure Pods are not scheduled onto inappropriate nodes.

A toleration includes these fields:

* `key` - The taint key to match
* `operator` - Either `exists` (matches any value) or `equal` (requires exact value match)
* `value` - Required when `operator` is `equal`
* `effect` - The taint effect to tolerate:

  * `NoSchedule` - Pods cannot be scheduled on the node
  * `PreferNoSchedule` - Pods are discouraged from scheduling on the node
  * `NoExecute` - Pods are evicted from the node (with optional `tolerationSeconds`)

This is the example configuration of a toleration:

```yaml
tolerations:
- key: "node.alpha.kubernetes.io/unreachable"
  operator: "Exists"
  effect: "NoExecute"
  tolerationSeconds: 6000
```

### Common use cases

* **Dedicated nodes**: Reserve nodes for specific workloads by tainting them and adding corresponding tolerations to authorized Pods.

* **Special hardware**: Keep Pods that don't need specialized hardware (like GPUs) off dedicated nodes by tainting those nodes.

* **Node problems**: Handle node failures gracefully with automatic taints and tolerations.

See [Kubernetes Taints and Tolerations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) for detailed examples and use cases.

## Priority classes

Pods may belong to some *priority classes*. Priority classes help the scheduler distinguish important Pods when eviction is needed. To use priority classes:

1. Create PriorityClasses in your Kubernetes cluster
2. Specify `PriorityClassName` in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml) file:

```yaml
priorityClassName: high-priority
```

See [Kubernetes Pod Priority documentation :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption) for more information on how to define and use priority classes in your cluster.

## Pod Disruption Budgets

A Pod Disruption Budget (PDB) in Kubernetes helps keep your applications available during voluntary disruptions, such as deleting a deployment or draining a node for maintenance by a cluster administrator. A Pod Disruption Budget sets a limit on how many Pods can be unavailable at the same time due to these voluntary actions. 

You can configure Pod disruption budget for Percona XtraDB Cluster, ProxySQL and HAProxy nodes using the `podDisruptionBudget` option in the Custom Resource.

This is the example configuration for Percona XtraDB Cluster Pods:

```yaml
pxc:
  podDisruptionBudget:
      maxUnavailable: 1
      minAvailable: 0
```

Refer to [the official
Kubernetes
documentation :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
for more information about Pod disruption budgets and [considerations how to protect your application :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/configure-pdb/#protecting-an-application-with-a-poddisruptionbudget).
