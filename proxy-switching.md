## Switching from one proxy to another

You can switch from one proxy to another. Find the points to consider below:

### Switching from HAProxy to ProxySQL

For example, your application is growing and read traffic increases significantly. Switching from HAProxy to ProxySQL enables you to:

* Unlock read scaling by distributing SELECT queries across replicas
* Implement intelligent SQL-aware routing and caching
* Reduce overhead on the primary node by reserving it only for writes. 

### Switching from ProxySQL to HAProxy

You may want to switch from ProxySQL to HAProxy if:

* You run smaller deployments where ProxySQL's advanced features are not needed. Another use case is when you prioritize simplicity and stability over fine-grained query routing.
* Your workload is predominantly write-oriented, and read/write splitting provides little benefit.
* You prefer a lightweight, efficient proxy with minimal configuration and fewer features to manage.

Switching to HAProxy enables you to simplify your deployment and reduce operational overhead.

### How to switch

!!! warning

    Switching from ProxySQL to HAProxy will cause Percona XtraDB Cluster Pods to restart.

You can switch from proxy to another on an existing cluster:

=== "From ProxySQL to HAProxy"

    You must be running the Operator version 1.19.0 and higher.

    ``` {.bash data-prompt="$" }
    $ kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
         "haproxy": {
            "enabled": true,
            "size": 3,
            "image": "percona/percona-xtradb-cluster-operator:{{ release }}-haproxy" },
         "proxysql": { "enabled": false }
      }}'
    ```

=== "From HAProxy to ProxySQL"

    ``` {.bash data-prompt="$" }
    $ kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
         "haproxy": { "enabled": false },
         "proxysql": {
            "enabled": true,
            "size": 3,
            "image": "percona/percona-xtradb-cluster-operator:{{ release }}-proxysql"
         }
      }}'
    ```