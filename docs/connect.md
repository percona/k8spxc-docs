# 2. Connect to Percona XtraDB Cluster

In this tutorial, you will connect to the Percona XtraDB Cluster you deployed previously.

To connect to Percona XtraDB Cluster you will need the password for the `root`
user. Passwords are stored in the Secrets object. 

Here's how to get it:
{.power-number}

1. List the Secrets objects

    ```{.bash data-prompt="$"}
    $ kubectl get secrets -n <namespace>
    ```

    The Secrets object we target is named as
    `<cluster_name>-secrets`. The `<cluster_name>` value is
    the [name of your Percona XtraDB Cluster](operator.md#metadata-name). The default variant for the Secrets object is:

    === "via kubectl" 

        `cluster1-secrets`

    === "via Helm"

        `cluster1-pxc-db-secrets`

2. Retrieve the password for the root user. Replace the `secret-name` and `namespace` with your values in the following commands:

   ```{.bash data-prompt="$"}
   $ kubectl get secret <secret-name> -n <namespace> --template='{{"{{"}}.data.root | base64decode{{"}}"}}{{"{{"}}"\n"{{"}}"}}'
   ```

3. Run a container with `mysql` tool and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

    ```{.bash data-prompt="$"}
    $ kubectl run -n <namespace> -i --rm --tty percona-client --image=percona:8.0 --restart=Never -- bash -il
    ```
    Executing it may require some time to deploy the correspondent Pod.

4. Connect to Percona XtraDB Cluster. To do this, run `mysql` tool in the
    percona-client command shell using your cluster name and the password
    obtained from the secret. The command will look different depending on
    whether your cluster provides load balancing with [HAProxy](haproxy-conf.md)
    (the default choice) or [ProxySQL](proxysql-conf.md).
    If your password contains special characters, they may be interpreted
    by the shell, and you may get "Permission denied" messages,so put the
    password in single quotes (single quotes also avoid variable expansion in
    scripts):

    === "with HAProxy (default)"
        ```{.bash data-prompt="$"}
        $ mysql -h <cluster_name>-haproxy -uroot -p'<root_password>'
        ```

    === "with ProxySQL"
        ```{.bash data-prompt="$"}
        $ mysql -h <cluster_name>-proxysql -uroot -p'<root_password>'
        ```

Congratulations! You have connected to Percona XtraDB Cluster. 

## Next steps

[Insert sample data :material-arrow-right:](data-insert.md){.md-button}
