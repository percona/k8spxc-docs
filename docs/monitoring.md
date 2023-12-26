--8<-- "monitor-db.md"

## Specify additional PMM parameters

You can use Custom Resource `pmm.pxcParams` and `pmm.proxysqlParams` keys to
specify additional parameters for [pmm-admin add mysql](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mysql.html#adding-mysql-service-monitoring) and
[pmm-admin add proxysql](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/proxysql.html)
commands respectively, if needed.

Please take into account that Operator automatically manages common Percona
XtraDB Cluster Service Monitoring parameters mentioned in the officiall PMM
documentation, such like username, password, service-name, host, etc. Assigning
values to these parameters is not recommended and can negatively affect the
functionality of the PMM setup carried out by the Operator.

## Update the secrets file

The `deploy/secrets.yaml` file contains all values for each key/value pair in a
convenient plain text format. But the resulting Secrets Objects contains
passwords stored as base64-encoded strings. If you want to *update* the password
field, you need to encode the new password into the base64 format and pass it to
the Secrets Object.

To encode a password or any other parameter, run the following command:

=== "on Linux" 

    ```{.bash data-prompt="$"} 
    $ echo -n "password" | base64 --wrap=0
    ``` 

=== "on macOS" 

    ```{.bash data-prompt="$"} 
    $ echo -n "password" | base64
    ```

For example, to set the new PMM API key to `new_key` in the `cluster1-secrets`
object, do the following:

=== "in Linux"

    ```{.bash data-prompt="$"}
    $ kubectl patch secret/cluster1-secrets -p '{"data":{"pmmserverkey": "'$(echo -n new_key | base64 --wrap=0)'"}}'
    ```

=== "on macOS"

    ```{.bash data-prompt="$"}
    $ kubectl patch secret/cluster1-secrets -p '{"data":{"pmmserverkey": "'$(echo -n new_key | base64)'"}}'
    ```


