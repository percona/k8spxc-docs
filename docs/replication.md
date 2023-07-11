# Set up Percona XtraDB Cluster cross-site replication

The cross-site replication involves configuring one Percona XtraDB Cluster as *Source*, and another Percona XtraDB Cluster as *Replica* to allow an asynchronous replication between them:

![image](assets/images/pxc-replication.svg)

The Operator automates configuration of *Source* and *Replica* Percona XtraDB Clusters, but the feature itself is not bound to Kubernetes. Either *Source* or *Replica* can run outside of Kubernetes, be regular MySQL and be out of the Operators’ control.

This feature can be useful in several cases: for example, it can simplify migration from on-premises to the cloud with replication, and it can be really helpful in case of the disaster recovery too.

!!! note

    Cross-site replication is based on [Automatic Asynchronous Replication Connection Failover](https://dev.mysql.com/doc/refman/8.0/en/replication-asynchronous-connection-failover.html). Therefore it requires  MySQL 8.0.22+ (Percona XtraDB Cluster 8.0.22+) to work.

Setting up MySQL for asynchronous replication without the Operator is out of the scope for this document, but it is described [here](https://www.percona.com/blog/2021/04/14/what-you-can-do-with-auto-failover-and-percona-distribution-for-mysql-8-0-x/) and is also covered by [this HowTo](backups-move-from-external-db.md).

Configuring the cross-site replication for the cluster controlled by the Operator is explained in the following subsections.

## Configuring cross-site replication on Source instances

You can configure *Source* instances for cross-site replication with `spec.pxc.replicationChannels` subsection in the `deploy/cr.yaml` configuration file. It is an array of channels, and you should provide the following keys for the channel in your *Source* Percona XtraDB Cluster:

* `pxc.replicationChannels.[].name` key is the name of the channel,
* `pxc.replicationChannels.[].isSource` key should be set to `true`.

Here is an example:

```yaml
spec:
  pxc:
    replicationChannels:
    - name: pxc1_to_pxc2
      isSource: true
```

The cluster will be ready for asynchronous replication when you apply changes as usual:

``` {.bash data-prompt="$" }
$ kubectl apply -f deploy/cr.yaml
```

## Exposing instances of Percona XtraDB Cluster

You need to expose every Percona XtraDB Cluster Pod of the *Source* cluster to
make it possible for the *Replica* cluster to connect. This is done through the
`pxc.expose` section in the `deploy/cr.yaml` configuration file as follows.

```yaml
spec:
  pxc:
    expose:
      enabled: true
      type: LoadBalancer
```

!!! note

    This will create a LoadBalancer per each Percona XtraDB Cluster Pod.
    In most cases, for cross-region replication to work this Load Balancer should
    be internet-facing.

To list the endpoints assigned to PXC Pods list the Kubernetes Service objects by
executing `kubectl get services -l "app.kubernetes.io/instance=CLUSTER_NAME"` command.

## Configuring cross-site replication on Replica instances

You can configure *Replica* instances for cross-site replication with `spec.pxc.replicationChannels` subsection in the `deploy/cr.yaml` configuration file. It is an array of channels, and you should provide the following keys for the channel in your *Replica* Percona XtraDB Cluster:

* `pxc.replicationChannels.[].name` key is the name of the channel,
* `pxc.replicationChannels.[].isSource` key should be set to `false`,
* `pxc.replicationChannels.[].sourcesList` is the list of *Source* cluster names from which Replica should get the data,
* `pxc.replicationChannels.[].sourcesList.[].host` is the host name or IP address of the Source,
* `pxc.replicationChannels.[].sourcesList.[].port` is the port of the source (`3306` port will be used if nothing specified),
* `pxc.replicationChannels.[].sourcesList.[].weight` is the *weight* of the source (in the event of a connection failure, a new source is selected from the list based on a weighted priority).

Here is the example:

```yaml
spec:
  pxc:
    replicationChannels:
    - name: uspxc1_to_pxc2
      isSource: false
      sourcesList:
      - host: pxc1.source.percona.com
        port: 3306
        weight: 100
      - host: pxc2.source.percona.com
        weight: 100
      - host: pxc3.source.percona.com
        weight: 100
    - name: eu_to_pxc2
      isSource: false
      sourcesList:
      - host: pxc1.source.percona.com
        port: 3306
        weight: 100
      - host: pxc2.source.percona.com
        weight: 100
      - host: pxc3.source.percona.com
        weight: 100
```

The cluster will be ready for asynchronous replication when you apply changes as usual:

``` {.bash data-prompt="$" }
$ kubectl apply -f deploy/cr.yaml
```
<a name="replication-ssl">

!!! note

    You can also [configure SSL channel for replication](https://dev.mysql.com/doc/refman/8.0/en/replication-encrypted-connections.html). Following 
    options allow you using replication over an encrypted channel.
    Set the `replicationChannels.configuration.ssl` key to true, optionally
    enable host name identity verification with the
    `replicationChannels.configuration.sslSkipVerify` key, and set
    `replicationChannels.configuration.ca` key to the path name of the
    Certificate Authority (CA) certificate file:
    
    ```yaml
    replicationChannels:
    - isSource: false
      name: uspxc1_to_pxc2
      configuration:
        ssl: true
        sslSkipVerify: true
        ca: '/etc/mysql/ssl/ca.crt'
        ...
    ```

## System user for replication

Replication channel demands a special [system user](users.md#users-system-users) with same credentials on both *Source* and *Replica*.

The Operator creates a system-level Percona XtraDB Cluster user named `replication` for this purpose, with
credentials stored in a Secret object [along with other system users](users.md#users-system-users).

!!! note

    If the cluster is outside of Kubernetes and is not under the Operator’s control, [the appropriate user with necessary permissions](https://dev.mysql.com/doc/refman/8.0/en/replication-asynchronous-connection-failover.html) should be created manually.

You can change a password for this user as follows:

=== "in Linux"

    ``` {.bash data-prompt="$" }
    $ kubectl patch secret/cluster1-secrets -p '{"data":{"replication": "'$(echo -n new_password | base64 --wrap=0)'"}}'
    ```

=== "in macOS"

    ``` {.bash data-prompt="$" }
    $ kubectl patch secret/cluster1-secrets -p '{"data":{"replication": "'$(echo -n new_password | base64)'"}}'
    ```

If you have changed the `replication` user’s password on the Source cluster, and you use the Operator version 1.9.0, you can have a *replication is not running* error message in log, similar to the following one:

``` {.text .no-copy}
{"level":"info","ts":1629715578.2569592,"caller":"zapr/zapr.go 69","msg":"Replication for channel is not running. Please, check the replication status","channel":"pxc2_to_pxc1"}
```

Fixing this involves the following steps.

1. Find the Replica Pod which was chosen by the Operator for replication, using the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl get pods --selector percona.com/replicationPod=true
    ```

2. Get the shell access to this Pod and login to the MySQL monitor as a [root user](users.md#users-system-users):

    ``` {.bash data-prompt="$" }
    $ kubectl exec -c pxc --stdin --tty <pod_name> -- /bin/bash
    bash-4.4$ mysql -uroot -proot_password
    ```

3. Execute the following three SQL commands to propagate the `replication` user password from the Source cluster to Replica:

    ```sql
    STOP REPLICA IO_THREAD FOR CHANNEL '$REPLICATION_CHANNEL_NAME';
    CHANGE MASTER TO MASTER_PASSWORD='$NEW_REPLICATION_PASSWORD' FOR CHANNEL '$REPLICATION_CHANNEL_NAME';
    START REPLICA IO_THREAD FOR CHANNEL '$REPLICATION_CHANNEL_NAME';
    ```
