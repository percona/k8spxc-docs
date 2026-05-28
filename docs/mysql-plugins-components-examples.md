# Configuration examples for plugins and components

This page provides examples for enabling a **plugin** and a **component** in a Percona XtraDB Cluster managed by the Operator. It covers the `validate_password` and `audit_log_filter`, which is a component in Percona XtraDB Cluster 8.4 and a plugin in Percona XtraDB Cluster 8.0.

Examples below show the configuration for both Percona XtraDB Cluster 8.0 and 8.4. For details on the difference between plugins and components, how to enable them and how to use the `loose-` prefix for their setup, see [MySQL plugins and components](mysql-plugins-components.md).

Examples use a three-node cluster named `cluster1`. Replace the cluster name, the namespace and root password with your own values.

## `audit_log_filter`

The `audit_log_filter` records database events to an audit log for security monitoring, compliance, and activity tracking.

### Percona XtraDB Cluster 8.4

The `component_audit_log_filter` is installed in Percona XtraDB Cluster 8.4 by default so you only need to configure it.

1. Edit the `deploy/cr.yaml` and set the component variables in the `spec.pxc.configuration` using dot notation and the `loose-` prefix. Pay attention that the variables use the **dot notation**:

    ```yaml
    spec:
      pxc:
        configuration: |
          [mysqld]
          loose-audit_log_filter.strategy=SYNCHRONOUS
          loose-audit_log_filter.format=JSON
          loose-audit_log_filter.rotate_on_size=104857600
    ```

2. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

    This command updates the cluster Custom Resource and triggers a rolling restart for the configuration changes to take effect.
  
3. Verify the changes on all nodes after the rolling restart:

    ```bash
    for i in 0 1 2; do
      kubectl -n <namespace> exec cluster1-pxc-$i -c pxc -- mysql -uroot -p'<root-password>' \
        -e "SELECT component_urn FROM mysql.component WHERE component_urn LIKE '%audit%';
              SHOW VARIABLES LIKE 'audit_log_filter.%';"
    done
    ```

    ??? example "Expected output on each node"

        ```{.text .no-copy}
        file://component_audit_log_filter
        audit_log_filter.format             JSON
        audit_log_filter.rotate_on_size     104857600
        audit_log_filter.strategy           SYNCHRONOUS
        ...
        ```
     

### Percona XtraDB Cluster 8.0

In Percona XtraDB Cluster 8.0, the `audit_log_filter` is a plugin and is not installed by default. You can load it in two ways:

* Add the plugin to the `spec.pxc.configuration` section in the Custom Resource and have it loaded automatically at startup
* Install it manually at runtime using the `INSTALL PLUGIN` command

=== "At startup via Custom Resource" 

    1. The plugin ships with an installation SQL script that creates the required filter tables. Run it once on one of the Pods: 

        ```bash
        kubectl -n <namespace> exec cluster1-pxc-0 -c pxc -- bash -c \
          "mysql -uroot -p'<root-password>' -D mysql < \
          /usr/share/percona-xtradb-cluster/audit_log_filter_linux_install.sql"
        ```
    
    2. Edit the `deploy/cr.yaml` configuration file and set the following for the `spec.pxc.configuration` section:
   
        * Specify the `plugin-load-add` to load the plugin on every startup
        * Specify the configuration variables with the `loose-` prefix. Pay attention that the variables use the **underscore notation**:

          ```yaml
          spec:
            pxc:
              configuration: |
                [mysqld]
                plugin-load-add=audit_log_filter.so
                loose-audit_log_filter_strategy=SYNCHRONOUS
                loose-audit_log_filter_format=JSON
                loose-audit_log_filter_rotate_on_size=104857600
          ```

    3. Apply the configuration:

        ```bash
        kubectl apply -f deploy/cr.yaml -n <namespace>
        ```

        This command updates the cluster Custom Resource and triggers a rolling restart for the configuration changes to take effect.
        
        The plugin loads on every startup while `plugin-load-add` is present. Removing it from the config unloads the plugin on the next restart.

    4. Verify after the rolling restart on every node:

        ```bash
        for i in 0 1 2; do
          kubectl exec -n <namespace> cluster1-pxc-$i -c pxc -- mysql -uroot -p'<root-password>' \
            -e "SELECT PLUGIN_NAME, PLUGIN_STATUS FROM information_schema.PLUGINS WHERE PLUGIN_NAME='audit_log_filter';
                SHOW VARIABLES LIKE 'audit_log_filter_strategy';
                SHOW VARIABLES LIKE 'audit_log_filter_format';
                SHOW VARIABLES LIKE 'audit_log_filter_rotate_on_size';"
        done
        ```

        ??? example "Expected output on each node"

            ```
            audit_log_filter   ACTIVE
            audit_log_filter_strategy     SYNCHRONOUS
            audit_log_filter_format       JSON
            audit_log_filter_rotate_on_size  104857600
            ``` 

=== "At runtime via `INSTALL PLUGIN`"
    
    1. Run the installation script in one of the Pods:

        ```bash
        kubectl -n <namespace> exec cluster1-pxc-0 -c pxc -- bash -c \
          "mysql -uroot -p'<root-password>' -D mysql < \
          /usr/share/percona-xtradb-cluster/audit_log_filter_linux_install.sql"
        ```

        The script runs `INSTALL PLUGIN` internally and registers the plugin in `mysql.plugin`. Galera
        replicates the `mysql.plugin` and `mysql.audit_log_filter` entries to all nodes and they all activate the plugin automatically. The plugin reloads on every restart without needing the `plugin-load-add` entry. 

    2. Edit the `deploy/cr.yaml` configuration file and specify the plugin configuration variables for the `spec.pxc.configuration` using the `loose-` prefix. Pay attention that the variables use the **underscore notation**:

        ```yaml
        spec:
          pxc:
            configuration: |
              [mysqld]
              loose-audit_log_filter_strategy=SYNCHRONOUS
              loose-audit_log_filter_format=JSON
              loose-audit_log_filter_rotate_on_size=104857600
        ```

    3. Apply the configuration:

        ```bash
        kubectl apply -f deploy/cr.yaml -n <namespace>
        ```

        This command updates the cluster Custom Resource and triggers a rolling restart for the configuration changes to take effect.
  
    4. Verify after the rolling restart on every node:

        ```bash
        for i in 0 1 2; do
          kubectl exec -n <namespace> cluster1-pxc-$i -c pxc -- mysql -uroot -p'<root-password>' \
            -e "SELECT PLUGIN_NAME, PLUGIN_STATUS FROM information_schema.PLUGINS WHERE PLUGIN_NAME='audit_log_filter';
                SHOW VARIABLES LIKE 'audit_log_filter_strategy';
                SHOW VARIABLES LIKE 'audit_log_filter_format';
                SHOW VARIABLES LIKE 'audit_log_filter_rotate_on_size';"
        done
        ```

        ??? example "Expected output on each node"

            ```
            audit_log_filter   ACTIVE
            audit_log_filter_strategy     SYNCHRONOUS
            audit_log_filter_format       JSON
            audit_log_filter_rotate_on_size  104857600
            ``` 

##  `validate_password`

`validate_password` enforces password length. It is a component in both Percona XtraDB Cluster 8.0 and 8.4 and is not installed by default in
either version.

To enable and configure this component, do the following:

1. Edit the `deploy/cr.yaml` and add the configuration variables to the `spec.pxc.configuration` section before or after installing the component. Use the
`loose-` prefix to ensure the pod will not crash if the component is not yet installed:

    ```yaml
    spec:
      pxc:
        configuration: |
          [mysqld]
          loose-validate_password.length=14
          loose-validate_password.mixed_case_count=1
          loose-validate_password.number_count=1
          loose-validate_password.special_char_count=1
          loose-validate_password.policy=MEDIUM
    ```

1. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

    This triggers the rolling restart of the database Pods.

2. Install the component. Connect to any of the `pxc` Pods and run:

    ```bash
    kubectl exec -n <namespace> cluster1-pxc-0 -c pxc -- mysql -uroot -p'<root-password>' \
      -e "INSTALL COMPONENT 'file://component_validate_password';"
    ```

    The `INSTALL COMPONENT` command writes a row to the `mysql.component` system table. Galera replicates this to all cluster
    nodes, so the component becomes available everywhere after a single command. The configured
    `loose-validate_password.*` values take effect immediately on the node where the component is
    loaded, and on all other nodes after their next restart (or after they pick up the component
    state via IST/SST).

3. Verify the changes on all nodes:

    ```bash
    for i in 0 1 2; do
      kubectl -n <namespace> exec cluster1-pxc-$i -c pxc -- mysql -uroot -p'<root-password>' \
        -e "SELECT component_urn FROM mysql.component WHERE component_urn LIKE '%validate%';
            SHOW VARIABLES LIKE 'validate_password.%';"
    done
    ```

    ??? example "Expected output on each node"

        ```
        file://component_validate_password
        validate_password.check_user_name   ON
        validate_password.length            14
        validate_password.mixed_case_count  1
        validate_password.number_count      1
        validate_password.policy            MEDIUM
        validate_password.special_char_count 1
        ```


## Example of `validate_password` and `audit_log_filter` together

This configuration example is for Percona XtraDB Cluster 8.4:

```yaml
spec:
  pxc:
    configuration: |
      [mysqld]
      # audit_log_filter -- component installed by default in PXC 8.4
      loose-audit_log_filter.strategy=SYNCHRONOUS
      loose-audit_log_filter.format=JSON
      loose-audit_log_filter.rotate_on_size=104857600

      # validate_password -- component, install via INSTALL COMPONENT before or after this config
      loose-validate_password.length=14
      loose-validate_password.mixed_case_count=1
      loose-validate_password.number_count=1
      loose-validate_password.special_char_count=1
      loose-validate_password.policy=MEDIUM
```

Both sections use `loose-`. Apply this configuration at any time — it will never cause a crash
regardless of the installation state of either component.

