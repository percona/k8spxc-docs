# Users

MySQL user accounts within the Cluster can be divided into two different groups:

* *application-level users*: the unprivileged user accounts for applications,
* *system-level users*: the accounts needed to automate the cluster deployment and management tasks, such as Percona XtraDB Cluster Health checks or ProxySQL integration.

These two groups serve different purposes. Read the following sections to learn more.

## Unprivileged users

The Operator doesn’t create application-level (unprivileged) user accounts by default.

You can create these unprivileged users in the following ways:

* [Automatically via Custom Resource](#create-users-in-the-custom-resource). This ability is available with Operator versions 1.16.0 and newer
* Manually in MySQL

### Create users in the Custom Resource

Starting from the Operator version 1.16.0, you can create users in Percona XtraDB Cluster via the `users` subsection in the Custom Resource. This is called declarative user management.

You can change the `users` section in the `deploy/cr.yaml` configuration file either at the cluster creation time or adjust it over time.

You can define users in the `users` section of your Custom Resource. For each user, you can specify:

* The user's login name
* Hosts the user is allowed to connect from
* Databases the user can access
* MySQL privilege grants
* A reference to a Secret resource containing the user's password

Here is an example configuration of the Custom Resource:

```yaml
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

For detailed information about all available options, see the [Custom Resource reference](operator.md#operator-users-section).

#### Generate user passwords manually

You can create the Secret containing the user password manually. The Secret referenced in `users.passwordSecretRef.name` should follow this format:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-user-pwd
type: Opaque
stringData:
  password: my-user-pwd-key
```

The Operator tracks password changes in the Secret object and automatically updates the user password in the database when the Secret is modified.

#### Customize password generation by the Operator

By default, the Operator generates user passwords using alphanumeric characters plus a set of special symbols. The password length is randomly chosen in the range of 16 to 20 characters.

To ensure compatibility with tools that may not support certain special symbols or require a different password length, you can customize password generation using the `passwordGenerationOptions` subsection in the Custom Resource:

```yaml
passwordGenerationOptions:
  symbols: "!#$%&()*+,-.<=>?@[]^_{}~"
  maxLength: 20
  minLength: 16
```

#### Important considerations

When creating users via Custom Resource, keep the following behavior in mind:

* **Minimal configuration**: The only required field is `users.name`. If you omit other fields:

  * If no Secret is specified, the Operator generates a password and stores it in a Secret named `<cluster-name>-custom-user-secret`
  * If `grants` or `dbs` are omitted, MySQL provides default grants

* **User deletion**: The Operator does not delete users when they are removed from the Custom Resource. This prevents accidental removal of pre-existing users.
* **Host changes**: When you update the `hosts` array (for example, changing `host1` to `host2`), the Operator creates a new user `user@host2` in addition to the existing `user@host1`. If you later change the host back to `host1`, the `user@host1` account will continue using its original password, which may differ from the password in the Secret.
* **Grant updates**: The Operator updates grants in an additive manner. It adds new grants but does not revoke existing ones that are not specified in the Custom Resource.
* **Duplicate users**: You cannot define two entries for the same user (for example, with different grants for different databases) in a single Custom Resource. However, you can achieve this by making sequential updates to the Custom Resource.
* **Invalid grants**: If you specify an invalid grant or set an administrative (global) grant while also specifying `dbs`, the Operator logs an error and creates the user with default grants (`GRANT USAGE`).

### Create users manually

Instead of using the Custom Resource, you can create unprivileged users directly in MySQL using standard SQL commands. This approach gives you full control over user creation and is useful when you need to create users with specific configurations that may not be easily expressed in the Custom Resource format.

#### Create a user

To create a user manually, connect to your cluster and run the `GRANT` statement. Replace `cluster1` with your actual cluster name and `root_password` with your root password:

```bash
kubectl run -it --rm percona-client --image=percona:8.0 --restart=Never -- mysql -hcluster1-pxc -uroot -proot_password
mysql> GRANT ALL PRIVILEGES ON database1.* TO 'user1'@'%' IDENTIFIED BY 'password1';
```

!!! note

    MySQL password for the user you create should not exceed 32 characters due to the [replication-specific limit introduced in MySQL 5.7.5 :octicons-link-external-16:](https://dev.mysql.com/doc/relnotes/mysql/5.7/en/news-5-7-5.html).

#### Verify user creation

After creating the user, verify that it was created successfully and can connect to the database. The following example connects to the cluster via ProxySQL and executes a simple query:

```bash
kubectl run -it --rm percona-client --image=percona:8.0 --restart=Never -- bash -il
percona-client:/$ mysql -h cluster1-proxysql -uuser1 -ppassword1
mysql> SELECT * FROM database1.table1 LIMIT 1;
```

If the connection succeeds and you can execute queries, the user has been created correctly with the appropriate permissions.

## System Users

To automate the deployment and management of the cluster components,
the Operator requires system-level Percona XtraDB Cluster users.

Credentials for these users are stored as a [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) object.
The Operator requires Kubernetes Secrets before Percona XtraDB Cluster is
started. It uses an existing Secret, if it already exists. Otherwise, the Operator creates a new Secret with randomly generated passwords. The default Secret name is `cluster1-secrets`.

The name of the required Secret should be set in the `spec.secretsName` option of the `deploy/cr.yaml`
configuration file.

In addition to `cluster1-secrets`, the Operator will also create an internal Secrets object named `internal-cluster1`, which exists for technical purposes and should not be edited by end users. Read more about internal Secret usage in [Internal Secret and its usage](#internal-secret-and-its-usage) section.

The following table shows system user names and purposes.

!!! warning

    Don't use system users to run applications.

| User Purpose   | Username     | Password Secret Key | Description |
| -------------- | ------------ | ------------------- | ----------- |
| Admin          | root         | root                | Database administrative user, can be used by the application if needed |
| ProxySQLAdmin  | proxyadmin   | proxyadmin          | ProxySQL administrative user, can be used to [add general-purpose ProxySQL users :octicons-link-external-16:](https://github.com/sysown/proxysql/wiki/Users-configuration) |
| Backup         | xtrabackup   | xtrabackup          | The [user to run backups :octicons-link-external-16:](https://www.percona.com/doc/percona-xtrabackup/2.4/using_xtrabackup/privileges.html), granted `all` privileges for the [point-in-time recovery](backups-pitr.md) needs |
| Monitoring     | monitor      | monitor             | User for internal monitoring purposes like liveness/readiness checks and [PMM agent :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-server/index.html) |
| PMM Server token  | Should be set through the [operator options](operator.md) | pmmservertoken | [The service token used to access PMM server version 3](monitoring.md#configure-authentication). For PMM 2, use API key. |
| Operator Admin | operator     | operator            | Database administrative user, should be used only by the Operator |
| Replication    | replication  | replication         | Administrative user needed for [cross-site Percona XtraDB Cluster](replication.md) |

!!! note

    The administrative database user `operator` is always created in MySQL as `operator@'%'`. Using an `operator` user with a different host value (for example, `operator@'hostname'`) is not supported and such users should not exist in the database.

### YAML object format

The default name of the Secrets object for the system users is `cluster1-secrets`. You can create your own Secret and reference it in the Custom Resource for your cluster in the `spec.secretsName` key.

When you create the Secrets object yourself, your YAML file should match the following simple format:

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
  pmmservertoken: my_pmm_server_token
```

The example above matches the default `deploy/secrets.yaml` file, which includes sample passwords. These are intended only for development or automated testing. **Don't use them in production**.

### Update the Secret

When you create the Secrets object, you use the `stringData` type and specify all values for each key/value pair in plain text format. However, the resulting Secrets object contains passwords stored as base64-encoded strings in the `data` type.

To update any field, you'll need to encode the value into the base64 format.

Here's how to do it:

1. Run the following command in your local shell to encode the new value. Replace `new_password` with your value:

    === "in Linux"

        ```bash
        echo -n "new_password" | base64 --wrap=0
        ```

    === "in macOS"

        ```bash
        echo -n "new_password" | base64
        ```

2. Update the Secrets object. For example, the following command updates the Admin user's password to `new_password` in the `cluster1-secrets` object:

    === "in Linux"

        ```bash
        kubectl patch secret/cluster1-secrets -p '{"data":{"root": "'$(echo -n new_password | base64 --wrap=0)'"}}'
        ```

    === "in macOS"

        ```bash
        kubectl patch secret/cluster1-secrets -p '{"data":{"root": "'$(echo -n new_password | base64)'"}}'
        ```

### Internal Secret and its usage

The Operator creates and updates an additional Secrets object which is named based on the cluster name, like `internal-cluster1`. This Secrets object is used only by the Operator. Users must not change it.

This object contains secrets with the same passwords as the one specified in `spec.secretsName` (e.g., `cluster1-secrets`). When you update the `cluster1-secrets` Secret, the Operator propagates these changes to the internal `internal-cluster1` Secrets object.

### Password rotation policies and timing

When there is a change in user secrets, the Operator creates the necessary transaction to change passwords. This rotation happens almost instantly (the delay can be up to a few seconds), and you don't need to take any action beyond changing the password.

!!! note

    Please don't change the `secretsName` option in the CR. Make changes inside the secrets object itself.

Starting from the Operator version 1.13.0, system users are created with the `PASSWORD EXPIRE NEVER` policy. This policy is automatically applied to system users on existing clusters when the Operator is upgraded to version 1.13.0.

### Marking system users in MySQL

Starting with MySQL 8.0.16, a new feature called Account Categories has been implemented, which allows you to mark system users as such. See [the official documentation on this feature :octicons-link-external-16:](https://dev.mysql.com/doc/refman/8.0/en/account-categories.html) for more details.

## Development mode

To make development and testing easier, the `deploy/secrets.yaml` secrets file contains default passwords for Percona XtraDB Cluster system users.

These development-mode credentials from `deploy/secrets.yaml` are:

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
