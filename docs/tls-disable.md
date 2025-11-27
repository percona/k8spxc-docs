# Deploy Percona XtraDB Cluster without TLS

You can deploy your Percona XtraDB Cluster without TLS, although we strongly recommend that you enable TLS for any production environment.

## Disable TLS during initial deployment

To disable TLS at deployment (for example, for demonstration or testing), edit your `deploy/cr.yaml` file. Set the `unsafeFlags.tls` key to `true` and the `tls.enabled` key to `false`:

```yaml
...
spec:
  ...
  unsafeFlags:
    tls: true
    ...
  tls:
    enabled: false
```

## Enable or disable TLS on a running cluster

You can enable or disable TLS at any time by changing the `tls.enabled` Custom Resource option to `true` to enable TLS, or to `false` to disable TLS. Be aware that changing this setting on a running cluster causes downtime and can introduce disruptions.

- If you set `tls.enabled` to `false`, the Operator will [pause the cluster](pause.md), wait for all Pods to be deleted, set the `unsafeFlags.tls` option to `true`, delete the TLS secrets, and then [unpause the cluster](pause.md).

- If you set `tls.enabled` to `true`, the Operator will [pause the cluster](pause.md), wait for all Pods to be deleted, set the `unsafeFlags.tls` option to `false`, and then [unpause the cluster](pause.md).

!!! warning

    Do not change the `tls.enabled` option while the cluster is in the process of enabling or disabling TLS. Changing this value mid-process will immediately unpause the cluster, even if the operation is not complete.
