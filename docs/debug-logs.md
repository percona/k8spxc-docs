# Check the Logs

## Cluster-level logging

Cluster-level logging involves collecting logs from all Percona XtraDB Cluster
Pods in the cluster to some persistent storage. This feature gives the logs a
lifecycle independent of nodes, Pods and containers in which they were
collected. Particularly, it ensures that Pod logs from previous failures are
available for later review.

Log collector is turned on by the `logcollector.enabled` key in the
`deploy/cr.yaml` configuration file (`true` by default).

The Operator collects logs using [Fluent Bit Log Processor](https://fluentbit.io/),
which supports many output plugins and has broad forwarding capabilities.
If necessary, Fluent Bit filtering and advanced features can be configured via
the `logcollector.configuration` key in the `deploy/cr.yaml` configuration
file.

Logs are stored for 7 days and then rotated.

Collected logs can be examined using the following command:

``` {.bash data-prompt="$" }
$ kubectl logs cluster1-pxc-1 -c logs
```

!!! note

    Technically, logs are stored on the same Persistent Volume, which is
    used with the corresponding Percona XtraDB Cluster Pod. Therefore collected
    logs can be found in `DATADIR` (`var/lib/mysql/`).

!!! note

    You can parse output of the logs with [jq JSON processor](https://stedolan.github.io/jq/) as follows:  `kubectl logs cluster1-pxc-1 -c logs -f | jq -R 'fromjson?'`.

