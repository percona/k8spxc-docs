# MySQL plugins and components

**Plugins** and **components** are MySQL extension mechanisms. Using plugins and components, you can add features to MySQL without modifying its core or how your application works. For example, you can add security, audit logging, data-protection and other features to boost performance or comply with your growing requirements.

This page explains how plugins and components work, which ones ship with Percona XtraDB Cluster, and the rules to follow when you enable them. For step-by-step configuration, see [Configuration examples for plugins and components](mysql-plugins-components-examples.md).

## Plugins vs components

MySQL supports both extension mechanisms. The difference between them is in how you load a plugin or a component and how you name its configuration variables.

- **Plugins** can be loaded in two ways: automatically at MySQL startup and manually during runtime. To load a plugin at startup, add the `plugin-load-add` line with the name of the plugin to the Custom Resource. The Operator writes it to the `my.cnf` configuration file and loads the plugin every time it starts the database pods. To load a plugin while the database is running, run the `INSTALL PLUGIN` SQL command against the cluster. In this case, MySQL remembers your choice in the `mysql.plugin` table and will load the plugin again every time it restarts even if the `plugin-load-add` is removed from the configuration file. Use this when the plugin must survive configuration changes.
   
    Plugin configuration options use underscores: `plugin_name_option`.

- **Components** are only installed at runtime using the `INSTALL COMPONENT` SQL command run against the cluster. MySQL records this in the `mysql.component` table and loads the component automatically on every restart. There is no way to preload components with a configuration file like `my.cnf`. 
  
    Component settings use dots in their names, like `component_name.option`.


## What comes with Percona XtraDB Cluster 8.0 and 8.4

The following extensions are available in Percona XtraDB Cluster 8.0 and 8.4 container images (binaries under `/usr/lib64/mysql/plugin/`). None of them require a separate download.

| Extension | Type | Pre-installed | Purpose |
| --- | --- | --- | --- |
| `audit_log_filter` | Plugin (8.0) / Component (8.4) | Yes in 8.4 only | Audit logging |
| `validate_password` | Component | No | Password strength enforcement |
| `connection_control` | Plugin | No | Brute-force login throttling |
| `component_masking_functions` | Component | No | Data masking functions |
| `component_log_sink_json` | Component | No | JSON error log output |
| `component_log_filter_dragnet` | Component | No | Rule-based error log filtering |
| `component_log_sink_syseventlog` | Component | No | Syslog / Event Log output |
| `rewriter` | Plugin | No | Query rewrite rules |
| `component_percona_telemetry` | Component | Varies | Percona telemetry |
| `component_binlog_utils_udf` | Component | Varies | Binlog utility functions |

Some extensions changed type between Percona XtraDB Cluster versions. Always match variable naming and installation steps to your cluster version.

| Feature | Percona XtraDB Cluster 8.0 | Percona XtraDB Cluster 8.4 |
| --- | --- | --- |
| `audit_log_filter` | **Plugin** — not installed by default | **Component** — installed by default |
| `audit_log_filter` variables | `audit_log_filter_format` (underscores) | `audit_log_filter.format` (dots) |
| `validate_password` | **Component** — not installed by default | **Component** — not installed by default |
| `validate_password` variables | `validate_password.length` (dots) | `validate_password.length` (dots) |

## Enable plugins and components

You enable and configure plugins and components in Percona XtraDB Cluster managed by Percona Operator for MySQL through a combination of:

- [MySQL options in the Custom Resource](options.md) in the `spec.pxc.configuration` subsection
- SQL commands run against the cluster such as `INSTALL PLUGIN` or `INSTALL COMPONENT`.

The Operator turns the contents of the `spec.pxc.configuration` subsection in the Custom Resource into a ConfigMap mounted at `/etc/percona-xtradb-cluster.conf.d/init.cnf` inside each Percona XtraDB Cluster Pod. MySQL reads this file on every startup, including the first `--initialize` run when the data directory is created. 

### Plugins

You can load a plugin in two ways:

=== "At startup via `spec.pxc.configuration`"

    1. Edit the `deploy/cr.yaml` Custom Resource manifest. Add `plugin-load-add` with the name of the plugin to the `spec.pxc.configuration` subsection to load the plugin on every startup while the option is present. 

        ```yaml
        spec:
          pxc:
            configuration: |
              [mysqld]
              plugin-load-add=connection_control.so
              loose-connection_control_failed_connections_threshold=5
        ```
    
    2. Apply the configuration:

        ```bash
        kubectl apply -f deploy/cr.yaml
        ```

    The plugin is not registered in `mysql.plugin`. If you remove the option from the Custom Resource, this removes the plugin from the `my.cnf` configuration file and unloads it on the next restart.

=== "At runtime via `INSTALL PLUGIN`"

    1. Run `INSTALL PLUGIN` once on one of the database Pods:
        
        ```bash
        kubectl exec cluster1-pxc-0 -c pxc -- mysql -uroot -p'<root-password>' -e "
        INSTALL PLUGIN CONNECTION_CONTROL SONAME 'connection_control.so';
        INSTALL PLUGIN CONNECTION_CONTROL_FAILED_LOGIN_ATTEMPTS SONAME 'connection_control.so';"
        ```

        The entry is stored in `mysql.plugin` and Galera replicates it to all cluster nodes - all nodes activate the plugin automatically. 
        
        The plugin reloads on every restart even if you remove `plugin-load-add` from the configuration.

Some plugins also require a bundled SQL install script to create required tables or schemas before the plugin becomes active. For example, `audit_log_filter` on Percona XtraDB Cluster 8.0 and the `rewriter` plugin. The [Configuration examples for plugins and components](mysql-plugins-components-examples.md#audit_log_filter) section provides exact steps to enable and set up `audit_log_filter`.

### Components

MySQL includes both non-keyring and keyring components. Non-keyring components such as `validate_password` or `audit_log_filter` for Percona XtraDB Cluster 8.4 add extra features to your database. Keyring components provide secure storage for sensitive information such as master keys for tablespace encryption. 

There is no MySQL configuration file for components. As such, you install all **non-keyring components** directly using the `INSTALL COMPONENT` SQL command: 

```sql
INSTALL COMPONENT 'file://component_validate_password';
```

Run this command on one node only. The command writes to `mysql.component`. Galera replicates the entry to all nodes, which automatically load the component. This setting persists across configuration changes.

**Keyring components** must be loaded through a manifest file, not via `INSTALL COMPONENT`. See the [Get started with keyring component documentation :octicons-link-external-16:](https://docs.percona.com/percona-server/8.4/quickstart-component-keyring.html).

## Configure plugins and components with the `loose-` prefix

Each plugin or component has a set of configuration variables. To configure a plugin or component, specify its variables in the `spec.pxc.configuration` section of the Custom Resource.

MySQL supports a `loose-` prefix for any option in `my.cnf`. By adding `loose-` to the beginning of a configuration option, you're telling MySQL not to treat it as an error if the extension isn't available yet. Instead, MySQL will simply ignore the variable until the related plugin or component is installed and active.

Why use this? If you specify a variable without the `loose-` prefix for a plugin or component that hasn't been loaded, MySQL will hit an "unknown variable" error and fail to start, causing the Pod to crash repeatedly. 

If a variable is prefixed with `loose-`, it is silently skipped until it becomes relevant. This lets you predefine configuration ahead of time or leave settings in place without worrying about startup failures. As soon as the extension is installed, your configuration is applied immediately with no extra steps or restarts required.

You can use the `loose-` prefix with configuration variables for both plugins and components. Plugin variables use underscore notation - for example, `loose-audit_log_format`. Component variables use dot notation - for example, `loose-validate_password.length`. This allows you to safely set options for either type, using the correct notation.

!!! warning

    `loose-` does **not** protect against wrong variable names. Using dot notation on Percona XtraDB Cluster 8.0 (`audit_log_filter.format`) or underscore notation on Percona XtraDB Cluster 8.4 (`audit_log_filter_format`) still causes MySQL to abort, even with the `loose-` prefix.


This example configuration illustrates how it works:

```yaml
spec:
  pxc:
    configuration: |
      [mysqld]
      # Percona XtraDB Cluster 8.4: audit_log_filter is pre-installed — takes effect immediately
      loose-audit_log_filter.strategy=SYNCHRONOUS
      loose-audit_log_filter.format=JSON

      # validate_password — ignored until you run INSTALL COMPONENT
      loose-validate_password.length=14
      loose-validate_password.policy=MEDIUM
```

After you apply this configuration, the Operator triggers a rolling restart of all Percona XtraDB Cluster Pods. The restart completes successfully because:

- `audit_log_filter` is already installed, so its `loose-` variables are applied automatically.
- `validate_password` is not installed, so its `loose-` variables are silently ignored. MySQL does not error or log a warning.

You can install the `validate_password` component later by running the `INSTALL COMPONENT` in one of the Pods:

```bash
kubectl exec cluster1-pxc-0 -c pxc -- mysql -uroot -p'<root-password>' \
  -e "INSTALL COMPONENT 'file://component_validate_password';"
```

The `loose-validate_password.*` values from `/etc/percona-xtradb-cluster.conf.d/init.cnf` will take effect immediately for the newly loaded component with no further changes or restarts required.

### Rules and recommendations for enabling and configuring plugins and components

1. Specify configuration variables with the `loose-` prefix
2. Connect to any one Percona XtraDB Cluster Pod and run the install command once. Galera replicates `mysql.plugin` and `mysql.component` entries to all cluster nodes.
3. Confirm the extension is active on every node. After you apply the updated `deploy/cr.yaml` or run the install command, database Pods are restarted. Exec into the Pods to check that the changes are applied:

    ```bash
    for i in 0 1 2; do
      kubectl exec cluster1-pxc-$i -c pxc -- mysql -uroot -p'<root-password>' \
        -e "SELECT PLUGIN_NAME, PLUGIN_STATUS FROM information_schema.PLUGINS WHERE PLUGIN_STATUS='ACTIVE';
            SELECT component_urn FROM mysql.component;"
    done
    ```

    Replace `cluster1` with your cluster name and use the root password from your cluster Secrets.

## Uninstalling extensions

Remove a component:

```bash
kubectl exec cluster1-pxc-0 -c pxc -- mysql -uroot -p'<root-password>' \
  -e "UNINSTALL COMPONENT 'file://component_validate_password';"
```

Remove the corresponding variables from `spec.pxc.configuration`, or keep them with `loose-` — they are silently ignored after uninstall.

To remove the `audit_log_filter` plugin on Percona XtraDB Cluster 8.0:

```sql
UNINSTALL PLUGIN audit_log_filter;
DROP TABLE IF EXISTS mysql.audit_log_filter;
DROP TABLE IF EXISTS mysql.audit_log_user;
```
