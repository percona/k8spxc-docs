# Users

MySQL user accounts within the Cluster can be divided into two different groups:

* *application-level users*: the unprivileged user accounts,
* *system-level users*: the accounts needed to automate the cluster deployment
    and management tasks, such as Percona XtraDB Cluster Health checks or ProxySQL
    integration.

As these two groups of user accounts serve different purposes, they are
considered separately in the following sections.

## Unprivileged users

There are no unprivileged (general purpose) user accounts created by
default. If you need general purpose users, please run commands below:

``` {.bash data-prompt="$" data-prompt-second="mysql>"}
$ kubectl run -it --rm percona-client --image=percona:8.0 --restart=Never -- mysql -hcluster1-pxc -uroot -proot_password
mysql> GRANT ALL PRIVILEGES ON database1.* TO 'user1'@'%' IDENTIFIED BY 'password1';
```

!!! note

    MySQL password here should not exceed 32 characters due to the [replication-specific limit introduced in MySQL 5.7.5 :octicons-link-external-16:](https://dev.mysql.com/doc/relnotes/mysql/5.7/en/news-5-7-5.html).

Verify that the user was created successfully. If successful, the
following command will let you successfully login to MySQL shell via
ProxySQL:

``` {.bash data-prompt="$" data-prompt-second="percona-client:/$"}
$ kubectl run -it --rm percona-client --image=percona:8.0 --restart=Never -- bash -il
percona-client:/$ mysql -h cluster1-proxysql -uuser1 -ppassword1
mysql> SELECT * FROM database1.table1 LIMIT 1;
```

You may also try executing any simple SQL statement to ensure the
permissions have been successfully granted.

## System Users

To automate the deployment and management of the cluster components,
the Operator requires system-level Percona XtraDB Cluster users.

Credentials for these users are stored as a [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) object.
The Operator requires Kubernetes Secrets before Percona XtraDB Cluster is
started. It will either use existing Secrets or create a new Secrets object with
randomly generated passwords if it didn’t exist.
The name of the required Secret (`cluster1-secrets` by default)
should be set in the `spec.secretsName` option of the `deploy/cr.yaml`
configuration file.

The following table shows system users’ names and purposes.

!!! warning

    These users should not be used to run an application.

| User Purpose   | Username     | Password Secret Key | Description |
| -------------- | ------------ | ------------------- | ----------- |
| Admin          | root         | root                | Database administrative user, can be used by the application if needed |
| ProxySQLAdmin  | proxyadmin   | proxyadmin          | ProxySQL administrative user, can be used to [add general-purpose ProxySQL users :octicons-link-external-16:](https://github.com/sysown/proxysql/wiki/Users-configuration) |
| Backup         | xtrabackup   | xtrabackup          | The [user to run backups :octicons-link-external-16:](https://www.percona.com/doc/percona-xtrabackup/2.4/using_xtrabackup/privileges.html), granted `all` privileges for the [point-in-time recovery](backups-pitr.md) needs |
| Monitoring     | monitor      | monitor             | User for internal monitoring purposes like liveness/readiness checks and [PMM agent :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/security.html#pmm-security-password-protection-enabling) |
| PMM Server Password  | should be set through the [operator options](operator.md) | pmmserver | [Password used to access PMM Server :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/security.html#pmm-security-password-protection-enabling). **Password-based authorization method is deprecated since the Operator 1.11.0**. [Use token-based authorization instead](monitoring.md#operator-monitoring-client-token) |
| Operator Admin | operator     | operator            | Database administrative user, should be used only by the Operator |
| Replication    | replication  | replication         | Administrative user needed for [cross-site Percona XtraDB Cluster](replication.md) |

!!! note

    The operator does not attempt to create a user if such a login exists, 
    regardless of the host part. For example, it creates the administrative
    database user `operator` as `operator@'%` in MySQL, but if the MySQL user
    `operator@'something'` already exists for some reason, the operator will act
    as if the user `operator@'%` already exists.

### YAML Object Format

The default name of the Secrets object for these users is
`cluster1-secrets` and can be set in the CR for your cluster in
`spec.secretName` to something different. When you create the object yourself,
it should match the following simple format:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cluster1-secrets
type: Opaque
stringData:
  root: root_password
  xtrabackup: backup_password
  monitor: monitory
  proxyadmin: admin_password
  operator: operatoradmin
  replication: repl_password
```

The example above matches
what is shipped in deploy/secrets.yaml which
contains default passwords. You should NOT use these in production, but they are
present to assist in automated testing or simple use in a development
environment.

As you can see, because we use the `stringData` type when creating the Secrets
object, all values for each key/value pair are stated in plain text format
convenient from the user’s point of view. But the resulting Secrets
object contains passwords stored as `data` - i.e., base64-encoded strings.
If you want to update any field, you’ll need to encode the value into base64
format. To do this, you can run `echo -n "password" | base64 --wrap=0` (or just
`echo -n "password" | base64` in case of Apple macOS) in your local shell to
get valid values. For example, setting the Admin user’s password to
`new_password` in the `cluster1-secrets` object can be done with the
following command:

=== "in Linux"

    ``` {.bash data-prompt="$" }
    $ kubectl patch secret/cluster1-secrets -p '{"data":{"root": "'$(echo -n new_password | base64 --wrap=0)'"}}'
    ```

=== "in macOS"

    ``` {.bash data-prompt="$" }
    $ kubectl patch secret/cluster1-secrets -p '{"data":{"root": "'$(echo -n new_password | base64)'"}}'
    ```

### Password Rotation Policies and Timing

When there is a change in user secrets, the Operator
creates the necessary transaction to change passwords. This rotation happens
almost instantly (the delay can be up to a few seconds), and it’s not needed to
take any action beyond changing the password.

!!! note

    Please don’t change `secretName` option in CR, make changes inside
    the secrets object itself.

Starting from the Operator version 1.13.0 system users are created with the `PASSWORD EXPIRE NEVER` policy.
Also, same policy is automatically applied to system users on existing clusters when the Operator is upgraded to
1.13.0.

### Marking System Users In MySQL

Starting with MySQL 8.0.16, a new feature called Account Categories has been
implemented, which allows us to mark our system users as such.
See [the official documentation on this feature :octicons-link-external-16:](https://dev.mysql.com/doc/refman/8.0/en/account-categories.html)
for more details.

## Development Mode

To make development and testing easier, `deploy/secrets.yaml` secrets
file contains default passwords for Percona XtraDB Cluster system users.

These development mode credentials from `deploy/secrets.yaml` are:

| Secret Key   | Secret Value           |
| ------------ | ---------------------- |
| root         | `root_password`        |
| xtrabackup   | `backup_password`      |
| monitor      | `monitory`             |
| proxyadmin   | `admin_password`       |
| operator     | `operatoradmin`        |
| replication  | `repl_password`        |

!!! warning

    Do not use the default Percona XtraDB Cluster user passwords in production!
