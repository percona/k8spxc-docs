# Horizontal and vertical scaling

This page covers scaling compute resources, Percona XtraDB Cluster (PXC) node count, and
proxy Pod count. For scaling storage, see [Resize storage](scaling-storage-resize.md). For
an overview of all available ways to scale, see [About scaling and storage](scaling-about.md).

## Scale compute resources

The Operator deploys and manages multiple components, such as Percona XtraDB Cluster,
HAProxy, and ProxySQL. Manage CPU or memory for each component separately by editing its
section in the Custom Resource, following the `requests`/`limits` structure
[Kubernetes provides :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

To add more resources to your PXC nodes, edit the following section in the Custom Resource:

```yaml
spec:
  pxc:
    resources:
      requests:
        memory: 4G
        cpu: 2
      limits:
        memory: 4G
        cpu: 2
```

See the [Custom Resource options](operator.md) reference for the equivalent fields on
other components.

**Verify that the change took effect:**

```bash
kubectl get pxc <cluster-name> -n <namespace> -o yaml
```

Check the following fields in the output:

* `.status.state` is `ready` (not `error` or stuck in `initializing`) 
* the `.ready` value under `.status.pxc`, `.status.haproxy`, or `.status.proxysql` matches the expected count for the corresponding component.

A resource change triggers a
rolling restart of the affected component's Pods. During the restart, `.status.state`
shows `initializing` until every Pod comes back up.

If you set `requests`/`limits` too low for what the database actually needs, Pods can be
OOMKilled or fail to schedule. Check `kubectl get pods -n <namespace>` for `OOMKilled` or
`Pending` status, and `kubectl describe pod <pod-name> -n <namespace>` for scheduling
failures.

## Horizontal scaling

The size of the cluster is controlled by the [`pxc.size`](operator.md#pxcsize) key in the
Custom Resource. Changing this option and applying it adds or removes PXC nodes.

```yaml
spec:
  pxc:
    size: 5
```

Apply the change:

```bash
kubectl apply -f deploy/cr.yaml
```

Alternatively, scale on the fly using the `kubectl scale` command. This works because the
`PerconaXtraDBCluster` Custom Resource defines a `scale` subresource tied to `pxc.size`:

```bash
kubectl scale --replicas=5 pxc/<cluster-name> -n <namespace>
```

### Choose a safe node count

By default, the Operator accepts only odd numbers for `pxc.size`. The recommended range is **3 or 5**. This restriction is by
design: Galera quorum voting needs an odd count so that if the network splits, one side
always has a majority. An even count can tie the vote and leave the cluster without a
clear primary. See [Design overview](architecture.md) for how quorum voting works. If you
set the `pxc.size` to an even number or outside the 3–5 range via `kubectl apply` or
`kubectl scale`, the change gets accepted. But the Operator refuses
to reconcile the cluster:

```bash
kubectl get pxc <cluster-name> -n <namespace> -o jsonpath='{.status.state}'
# error
kubectl get pxc <cluster-name> -n <namespace> -o jsonpath='{.status.message}'
# Error: check safe defaults: PXC size must be an odd number. Set spec.unsafeFlags.pxcSize to true to disable this check
```

!!! warning

    `kubectl describe pxc <cluster-name>` does **not** show this as a Kubernetes Event —
    the `Events:` section stays empty. Check `.status.state` and `.status.message`
    directly (as above), not the Events list, to see why a scaling change didn't take
    effect.

If you need a cluster with an even number of members or outside
the 3–5 node range, set the
[`unsafeFlags.pxcSize`](operator.md#unsafeflagspxcsize) flag to
`true`. Read the following section before you apply this unsafe configuration.

**Do:**

* Keep `pxc.size` at 3 or 5 unless you've read [`unsafeFlags.
pxcSize`](operator.md#unsafeflagspxcsize) and accept the
tradeoffs.
* Confirm the `.status.state` returns `ready` after every size change.
* Always change `pxc.size` in the Custom Resource, never the generated StatefulSet.

**Don't:**

* Don't scale the StatefulSet directly. The Operator does not
automatically reconcile a manually-scaled StatefulSet back to
match the Custom Resource. This can leave the running cluster out
  of sync with the Custom Resource with no error until the Operator reconciles `pxc.size`
  again.
* Don't use an even node count in production. The risk surfaces during a network
  partition, not under normal load.

## Scale proxy Pods

HAProxy and ProxySQL Pods scale independently of the PXC database nodes. You can change the number of proxy Pods only via the Custom Resource directly. There's no `kubectl scale` shortcut for proxy size — the Custom Resource's scale
subresource only covers `pxc.size` (see [Horizontal scaling](#horizontal-scaling)).

Use the
[`haproxy.size`](operator.md#haproxysize) or [`proxysql.size`](operator.md#proxysqlsize) options
depending on which proxy your cluster uses (check `spec.haproxy.enabled` /
`spec.proxysql.enabled` — only one is active at a time).

```yaml
spec:
  haproxy:
    size: 3
```

Apply the change:

```bash
kubectl apply -f deploy/cr.yaml
```

Check `.status.state` is `ready` and, under `.status.haproxy` (or `.status.proxysql`),
that `.ready` matches your new `size`.

### Considerations

* **Choose a safe proxy count:** by default, HAProxy and ProxySQL must each have **at least
2** Pods. Setting a lower value is accepted by `kubectl apply` but the Operator refuses to
reconcile it, the same way an unsafe `pxc.size` does:

    ```bash
    kubectl get pxc <cluster-name> -n <namespace> -o jsonpath='{.status.message}'
    # Error: check safe defaults: HAProxy size must be at least 2. Set spec.unsafeFlags.proxySize to true to disable this check
    ```

    To go below 2, set [`unsafeFlags.proxySize`](operator.md#unsafeflagsproxysize) to `true`.


* **Don't** scale the proxy StatefulSet directly. The Operator doesn't automatically reconcile manual changes to match the Custom Resource. This leaves the cluster out of sync with the Custom Resource until the `haproxy.size` or `proxysql.size` are changed and the Operator reconciles.

## Automated scaling

To automate horizontal scaling of PXC nodes, use
[Horizontal Pod Autoscaler (HPA) :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
or
[Kubernetes Event-driven Autoscaling (KEDA) :octicons-link-external-16:](https://keda.sh/)
targeting the `PerconaXtraDBCluster` Custom Resource. HPA and KEDA both scale through the
Custom Resource's `scale` subresource, and the `PerconaXtraDBCluster` CRD defines that
subresource against `pxc.size` only. Scaling the Custom Resource this way changes
`pxc.size`, and the Operator handles the rest. The same [safe node count](#choose-a-safe-node-count)
rules apply to an autoscaler-driven change as to a manual one.

**This doesn't extend to proxy Pods.** The CRD defines only one `scale` subresource for
the whole `PerconaXtraDBCluster` resource. There's no
equivalent target for `haproxy.size`/`proxysql.size`, so an HPA or KEDA `ScaledObject`
can't point at the Custom Resource to scale proxy Pods. Pointing an autoscaler directly at
the generated proxy StatefulSet instead works technically, but carries the same drift risk
as [scaling that StatefulSet manually](#scale-proxy-pods): the Custom Resource's own
`haproxy.size`/`proxysql.size` won't reflect the autoscaler's changes, and the Operator
overwrites the StatefulSet back to the CR-declared value the next time that field changes.

Vertical Pod Autoscaler (VPA) isn't currently supported with the Operator, due to the
limitations it introduces for objects with owner references.
