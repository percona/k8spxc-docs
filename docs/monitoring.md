--8<-- "monitor-db.md"

## Specify additional PMM parameters

You can use Custom Resource `pmm.pxcParams` and `pmm.proxysqlParams` keys to
specify additional parameters for [pmm-admin add mysql :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mysql.html#adding-mysql-service-monitoring) and
[pmm-admin add proxysql :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/proxysql.html)
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

## Add custom PMM prefix to the cluster name

When user has several clusters with the same namespace, cluster and Pod names,
and a single PMM Server, it is possible to add only one of them to the PMM
Server instance because of this names coincidence.

For such cases it is possible to specify a custom prefix to the cluster name,
which will be visible within PMM, and so names will become unique.

You can do it by setting the `PMM_PREFIX` environment variable via the Secret,
specified in the `pxc.envVarsSecret` Custom Resource option.

Here is an example of the YAML file used to create the Secret with the
`my-unique-prefix-` prefix encoded in base64 format:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-env-var-secrets
type: Opaque
data:
  PMM_PREFIX: bXktdW5pcXVlLXByZWZpeC0=
```

Follow the [instruction](containers-conf.md) on all details needed to create a
Secret for environment variables and adding them to the Custom Resource.

## Implement custom monitoring solution without PMM

You can deploy your own monitoring solution instead of PMM, but since the Operator will know nothing about it, it will not gain the same level of deployment automation from the Operator side, and there will be no configuration via the Custom Resource.
The apporach to this is to deploy your monitoring agent as a sidecar container in Percona XtraDB Cluster Pods. See [sidecar containers documentation](sidecar.md) for details.

!!! note

    You can use the [`monitor` system user](users.md#system-users) for monitoring purposes as PMM Client does. The Operator tracks the `monitor` user password update in the  Secrets object (technical secrets used by the Operator,  and restarts Percona XtraDB Cluster Pods in cases when PMM is enabled or when the sidecar container references the internal Secrets object `internal-<clustername>` (technical users secrets used by Operator, `internal-cluster1` by default) as follows:
    
    ```yaml
    pxc:
    sidecars:
    - name: metrics
      image: my_repo/my_custom_monitoring_solution:1.0
      env:
        - name: MYSQLD_EXPORTER_PASSWORD
          valueFrom:
            secretKeyRef:
              name: internal-cluster1
              key: monitor
      ...
    ```
