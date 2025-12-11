# Switching from one proxy to another

You can switch from one proxy to another. Find the points to consider below:

## Switching from HAProxy to ProxySQL

For example, your application is growing and read traffic increases significantly. Switching from HAProxy to ProxySQL enables you to:

* Unlock read scaling by distributing SELECT queries across replicas
* Implement intelligent SQL-aware routing and caching
* Reduce overhead on the primary node by reserving it only for writes.

## Switching from ProxySQL to HAProxy

You may want to switch from ProxySQL to HAProxy if:

* You run smaller deployments where ProxySQL's advanced features are not needed. Another use case is when you prioritize simplicity and stability over fine-grained query routing.
* Your workload is predominantly write-oriented, and read/write splitting provides little benefit.
* You prefer a lightweight, efficient proxy with minimal configuration and fewer features to manage.

Switching to HAProxy enables you to simplify your deployment and reduce operational overhead.

## Resource usage considerations

HAProxy and ProxySQL have different resource requirements and characteristics. You must use different resource specifications when switching from one proxy to another. Here's why:

* **Memory usage**: ProxySQL typically requires more memory than HAProxy due to its query caching, connection pooling, and SQL-aware features. HAProxy is more memory-efficient and focuses on connection-level load balancing.
* **CPU usage**: ProxySQL performs SQL parsing and routing and often needs at least 2–4x more CPU than HAProxy for the same workload.

### Recommendations for adjusting resources

When switching proxies, adjust your resource requests and limits accordingly:

* **Switching from HAProxy to ProxySQL**: Increase memory and CPU allocations. Start with at least 1G memory and 600m CPU per ProxySQL pod, then monitor and adjust based on your workload. ProxySQL benefits from more memory for query caching and connection pooling.

* **Switching from ProxySQL to HAProxy**: You can reduce resource allocations since HAProxy is more lightweight. Start with 256Mi memory and 100m CPU per HAProxy pod, then adjust based on your connection load.

* **Monitor and adjust**: After switching, monitor resource usage using `kubectl top pods` and adjust requests and limits based on actual consumption patterns. Consider setting resource requests to match your typical usage and limits to handle peak loads.

* **Use separate resource configurations**: Define different resource specifications for each proxy type in your cluster configuration to avoid conflicts and ensure optimal performance.

### How to switch

!!! warning

    Switching from ProxySQL to HAProxy will cause the downtime because the Operator needs to reconfigure the proxy Pods.

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

