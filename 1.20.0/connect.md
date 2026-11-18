> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# 2. Connect to Percona XtraDB Cluster

In this tutorial, you will connect to the Percona XtraDB Cluster you deployed previously.

To connect to Percona XtraDB Cluster you will need the password for the `root` user. Passwords are stored in the Secrets object.

Here’s how to get it:

1. List the Secrets objects

   ```
   kubectl get secrets -n <namespace>
   ```

   The Secrets object we target is named as `<cluster_name>-secrets`. The `<cluster_name>` value is the [name of your Percona XtraDB Cluster](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#metadata-name). The default variant for the Secrets object is:

   **via kubectl**

   `cluster1-secrets`

   **via Helm**

   `cluster1-pxc-db-secrets`

1. Retrieve the password for the root user. Replace the `secret-name` and `namespace` with your values in the following commands:

```
kubectl get secret <secret-name> -n <namespace> --template='{{.data.root | base64decode}}{{"\n"}}'
```

1. Run a container with `mysql` tool and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

   ```
   kubectl run -n <namespace> -i --rm --tty percona-client --image=percona/percona-xtradb-cluster:8.4.8-8.1 --restart=Never -- bash -il
   ```

   Executing it may require some time to deploy the correspondent Pod.

1. Connect to Percona XtraDB Cluster. To do this, run `mysql` tool in the percona-client command shell using your cluster name and the password obtained from the secret. The command will look different depending on whether your cluster provides load balancing with [HAProxy](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/haproxy-conf.html) (the default choice) or [ProxySQL](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/proxysql-conf.html). If your password contains special characters, they may be interpreted by the shell, and you may get “Permission denied” messages,so put the password in single quotes (single quotes also avoid variable expansion in scripts):

   **with HAProxy (default)**

   ```
   mysql -h <cluster_name>-haproxy -uroot -p'<root_password>'
   ```

   **with ProxySQL**

   ```
   mysql -h <cluster_name>-proxysql -uroot -p'<root_password>'
   ```

Congratulations! You have connected to Percona XtraDB Cluster.

Which Service your application connects to

`<cluster_name>-haproxy` sends reads and writes to one database node and switches to another node if that node fails. For read-only traffic, use `<cluster_name>-haproxy-replicas`. Never send writes to it. With ProxySQL, `<cluster_name>-proxysql` handles both reads and writes. See [Which Service to connect to](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/services.html#which-service-to-connect-to).

Don’t use `root` in your application

`root` is a system user that the Operator itself uses, so a password change affects everything that connects with it. Create a separate user for your application. See [Create users in the Custom Resource](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/users.html#create-users-in-the-custom-resource).

## Next steps

[Insert sample data](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/data-insert.html)
