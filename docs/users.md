# Users

MySQL user accounts within the Cluster can be divided into two different groups:

* *application-level users*: the unprivileged user accounts,
* *system-level users*: the accounts needed to automate the cluster deployment
    and management tasks, such as Percona XtraDB Cluster Health checks or ProxySQL
    integration.

As these two groups of user accounts serve different purposes, they are
considered separately in the following sections.

## Unprivileged users

The Operator does not create unprivileged (general purpose) user accounts by default.
There are two ways to create general purpose users:

* manual creation of custom MySQL users,
* automated users creation via Custom Resource (Operator versions 1.16.0 and newer).

### Create users in the Custom Resource

Starting from the Operator version 1.16.0 declarative creation of custom MySQL users is supported via the `users` subsection in the Custom Resource.

!!! warning

    Declarative user management has technical preview status and is not yet recommended for production environments.

You can change `users` section in the `deploy/cr.yaml` configuration file at the cluster creation time, and adjust it over time.
You can specify a new user in `deploy/cr.yaml` configuration file, setting the user's login name, hosts this user is allowed to connect from, accessible databases, a reference to a key in some Secret resource that contains user's password, as well as MySQL privilege grants for this user. You can find detailed description of the corresponding options in the [Custom Resource reference](operator.md#operator-users-section), and here is a self-explanatory example:

``` {.bash data-prompt="$"}
...
users:
- name: my-user
  dbs:
  - db1
  - db2
  hosts:
  - localhost
  grants:
  - SELECT
  - DELETE
  - INSERT
  withGrantOption: true
  passwordSecretRef:
    name: my-user-pwd
    key: my-user-pwd-key
...
```

The Secret mentioned in the `users.passwordSecretRef.name` option should look as follows:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-user-pwd
type: Opaque
stringData:
  password: my-user-pwd-key
```

The Operator tracks password changes in the Secret object, and updates the user password in the database, when needed. The following specifics should be taken into account:

* When a user sets an invalid grant or sets an administrative (global) grant with some value present in `spec.user.dbs`, the Operator logs error and creates the user with the default grants (`GRANT USAGE`).
* The Operator doesn't delete users if they are removed from Custom Resource, to avoid affecting any pre-existing users.
* Not deleting users can bring a number of consequences. For example, when the host is updated in the `users.hosts` array (for example, `host1` changed to `host2`), a new user `user@host2` is created in addition to already existing `user@host1`. Moreover, if the password was updated in the secret for `user@host2`, and later the host in the Custom Resource was changed back to `host1`, the `user@host1` user will continue using the old password different from what the Custom Resource contains.
* The Operator updates grants specified for the user in additive manner: it adds new grants but doesn't revoke existing ones.
* It is not possible to add two entries for the same user (e.g. with different grants for different databases), but sequential updates of the Custom Resource can achieve the same effect.

The only necessary field to create new user is `users.name`, everything else can be generated by the Operator. For example, if the Secret object was not specified, user password will be generated and stored in a generated secret named `<cluster-name>-<custom-user-name>-secret`. Similarly, omitting `grants` and/or `dbs` will result in default grants provided by MySQL.

### Create users manually

You can create unprivileged users manually. Supposing your cluster name is `cluster1`, the command should look as follows (don't forget to substitute `root_password` with the real root password):

``` {.bash data-prompt="$" data-prompt-second="mysql>"}
$ kubectl run -it --rm percona-client --image=percona:8.0 --restart=Never -- mysql -hcluster1-pxc -uroot -proot_password
mysql> GRANT ALL PRIVILEGES ON database1.* TO 'user1'@'%' IDENTIFIED BY 'password1';
```

!!! note

    MySQL password for the user you create should not exceed 32 characters due to the [replication-specific limit introduced in MySQL 5.7.5 :octicons-link-external-16:](https://dev.mysql.com/doc/relnotes/mysql/5.7/en/news-5-7-5.html).

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

!!! note

    In addition to `cluster1-secrets`, the Operator will also create an internal Secrets object named `internal-cluster1`, which exists for technical purposes and should not be edited by end users.

The following table shows system users’ names and purposes.

!!! warning

    These users should not be used to run an application.

| User Purpose   | Username     | Password Secret Key | Description |
| -------------- | ------------ | ------------------- | ----------- |
| Admin          | root         | root                | Database administrative user, can be used by the application if needed |
| ProxySQLAdmin  | proxyadmin   | proxyadmin          | ProxySQL administrative user, can be used to [add general-purpose ProxySQL users :octicons-link-external-16:](https://github.com/sysown/proxysql/wiki/Users-configuration) |
| Backup         | xtrabackup   | xtrabackup          | The [user to run backups :octicons-link-external-16:](https://www.percona.com/doc/percona-xtrabackup/2.4/using_xtrabackup/privileges.html), granted `all` privileges for the [point-in-time recovery](backups-pitr.md) needs |
| Monitoring     | monitor      | monitor             | User for internal monitoring purposes like liveness/readiness checks and [PMM agent :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/2/setting-up/server/index.html) |
| PMM Server Password  | should be set through the [operator options](operator.md) | pmmserver | [Password used to access PMM Server :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/2/setting-up/server/index.html). **Password-based authorization method is deprecated since the Operator 1.11.0**. [Use token-based authorization instead](monitoring.md#operator-monitoring-client-token) |
| Operator Admin | operator     | operator            | Database administrative user, should be used only by the Operator |
| Replication    | replication  | replication         | Administrative user needed for [cross-site Percona XtraDB Cluster](replication.md) |

!!! note

    The administrative database user `operator` is created in MySQL as `operator@'%`. Configurations with `operator@'something'` user having the host part different from `%` are not supported, and such users should not exist in the database.

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
