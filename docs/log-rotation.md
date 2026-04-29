# Log rotation

`logrotate` controls log file growth in Percona XtraDB Cluster Pods. Without rotation, MySQL and related logs can grow until they consume the Persistent Volume and affect database stability.

In Percona Operator for MySQL, `logrotate` runs inside the `logcollector` sidecar container in every PXC Pod. Starting from Operator `1.20.0`, logrotate scripts and default configuration are shipped with the Operator image and copied into the Pod by an init container.

On each scheduled run, `logrotate` applies the configured rules to MySQL log files and executes the post-rotate script:

- It rotates matching log files according to size and retention rules.
- It can compress old files if configured.
- It runs postrotate script (`/opt/percona/logcollector/logrotate/postrotate-mysql.sh` by default) to make MySQL continue writing to the active log files after rotation.

## Configure log rotation

You can customize log rotation in PXC to match your workload, for example by changing retention and size thresholds for MySQL error/slow logs, enabling compression, or adding rules for extra files such as `GRA_*.log` and `audit.log`. This gives you predictable disk usage and keeps troubleshooting or compliance logs for the required period.

You can configure log rotation in three ways:

1. Set a custom log rotation schedule inline in the Custom Resource.
2. Override the default logrotate configuration inline in the Custom Resource.
3. Extend the default configuration with additional `.conf` files from a ConfigMap.

When you change logrotate configuration, the Operator detects config changes and performs a rolling restart of PXC Pods.

### Set a custom log rotation schedule

1. Edit the `deploy/cr.yaml` Custom Resource manifest. Set the log rotation schedule in [cron format](https://en.wikipedia.org/wiki/Cron) using the `spec.logcollector.logRotate.schedule` option.

    This example runs log rotation every 6 hours:

    ```yaml
    spec:
      logcollector:
        logRotate:
          schedule: "0 */6 * * *"
    ```

2. Apply the Custom Resource:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

### Override the default logrotate configuration

Use the `spec.logcollector.logRotate.configuration` section in the Custom Resource to completely override the default logrotate settings. For example, you want to rotate logs when their size is between 5M (minimum) and 50M (maximum) and keep 5 rotated files. Also, compress rotated logs.

!!! important

    You must provide the full `logrotate` configuration because the Operator replaces the default configuration with the one you provide. Refer to the [default configuration](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/build/logcollector/logrotate/logrotate-mysql.conf) to see the built-in logrotate rules and use it as a guide for your custom settings.

Here's the example configuration:

```yaml
spec:
  logcollector:
    logRotate:
      schedule: "0 0 * * *"
      configuration: |
        /var/lib/mysql/[!G]*.log {
          daily
          minsize 5M
          maxsize 50M
          rotate 5
          missingok
          compress
          delaycompress
          notifempty
          sharedscripts
          postrotate
            /opt/percona/logcollector/logrotate/postrotate-mysql.sh
          endscript
        }
```

Apply the Custom Resource:

```bash
kubectl apply -f deploy/cr.yaml -n <namespace>
```

### Extend the default logrotate configuration via ConfigMap

You can pass additional configuration options for the default logrotate configuration via a ConfigMap. Use the `spec.logcollector.logRotate.extraConfig.name` option to load additional `.conf` files from a ConfigMap.

For example, the following ConfigMap adds separate rotation rules for Galera-related logs (`GRA_*.log`) and for audit logs (`audit.log`) with different rotation and compression settings.

1. Create a ConfigMap configuration file. For example, `custom-logrotate.yaml` . Specify additional rules:

    ```yaml title="custom-logrotate.yaml"
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: my-logrotate-config
    data:
      gra-logs.conf: |
        /var/lib/mysql/GRA_*.log {
          daily
          rotate 7
          missingok
          notifempty
          compress
          delaycompress
        }
      audit-log.conf: |
        /var/lib/mysql/audit.log {
          daily
          rotate 14
          minsize 10M
          maxsize 200M
          missingok
          compress
          delaycompress
          notifempty
        }
    ```

2. Create the ConfigMap:

    ```bash
    kubectl apply -f custom-logrotate.yaml -n <namespace>
    ```

3. Reference the ConfigMap in your Custom Resource:

    ```yaml
    spec:
      logcollector:
        logRotate:
          extraConfig:
            name: my-logrotate-config
    ```
    
4. Update the configuration:
    
    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```
