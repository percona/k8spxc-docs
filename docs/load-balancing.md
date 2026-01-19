# Configure load balancing

Load balancing is distributing database connections and queries across multiple cluster nodes. This is crucial for ensuring high availability, optimal performance, and seamless scaling by preventing any single node from becoming a bottleneck or point of failure. Load balancing guarantees continued access to the database during node failures and maximizes the use of the cluster's combined resources.

You can use either [HAProxy :octicons-link-external-16:](https://haproxy.org) or [ProxySQL :octicons-link-external-16:](https://proxysql.com/) for load balancing and proxy services in Percona Operator for MySQL. This guide helps you understand the differences between these proxies and choose the right one for your deployment.

You can control which proxy to use by enabling or disabling the `haproxy.enabled` and `proxysql.enabled` options in the `deploy/cr.yaml` configuration file.

## HAProxy

HAProxy serves as a TCP-level load balancer in Percona Operator for MySQL. 
It sits in front of your Percona XtraDB Cluster, accepts incoming MySQL connections and distributes them evenly across available cluster nodes.

HAProxy is lightweight and efficient and introduces very little overhead. It has a minimal and straightforwatd configuration which makes it fast and stable.

HAProxy is not SQL-aware. This means it does not inspect or interpret SQL queries, so it cannot differentiate between reads (SELECT) and writes (INSERT, UPDATE, etc.). 
All traffic is routed based only on network and health status.

You can configure HAProxy to route write requests to the primary node and read requests - to the replica nodes. But you must also adjust your client applications to send read and read/write requests to different HAProxy ports.

The failover of cluster nodes is handled by the Operator. When a node fails, the Operator detects it and removes it from the HAProxy backend rotation.

## ProxySQL

ProxySQL is an advanced, SQL-aware proxy included in Percona Operator for MySQL. It sits between applications and the database, providing more intelligent routing and management of queries.

ProxySQL examines each incoming SQL query and determines whether it is a read (e.g., SELECT) or a write (INSERT, UPDATE, DELETE, or SELECT FOR UPDATE). Then it routes queries as follows, achieving effective read/write splitting:

* read requests are routed either to all cluster nodes or only to replica nodes, depending on your configuration.
* write queries are routed only to the writer node.

Health and cluster topology awareness are built in, so ProxySQL can adapt to failover situations.

ProxySQL also offers features such as query rules, result caching, connection pooling, and multiplexing—helping to optimize database performance and reliability for complex workloads.

## What load balancer to use?

| Load balancer | Use cases | 
| ------------- | --------- |
| **HAProxy**       | - You need simple, reliable load balancing without query-level logic <br> - Your workload is write-heavy or doesn't benefit much from read scaling <br> - You want minimal overhead and maximum throughput <br> - You prefer straightforward deployments, smaller clusters, or environments where simplicity is key | 
| **ProxySQL**      | - You need read/write splitting to scale reads across replicas <br> - Your workload is mixed (lots of SELECT queries alongside writes) <br> - You want advanced features like query caching, multiplexing, or routing based on query rules <br> - You're deploying larger clusters or complex workloads that need fine-grained traffic control | 

In a nutshell, HAProxy is ideal for scenarios where you need a lightweight, stable proxy that efficiently routes connections without analyzing SQL queries. According to [benchmark comparisons](https://www.percona.com/blog/comparisons-of-proxies-for-mysql/), HAProxy excels in resource efficiency and connection throughput, making it the preferred choice for Kubernetes environments where resource optimization is crucial.

ProxySQL is ideal when you cannot modify your application code to separate read and write connections, but still want to benefit from read scaling. ProxySQL requires no changes to application code — you send all queries to ProxySQL and configure regex rules to route SELECT queries appropriately.

## Next steps

* [Configure HAProxy](haproxy-conf.md) — Learn how to configure and customize HAProxy for your cluster
* [Configure ProxySQL](proxysql-conf.md) — Learn how to configure and customize ProxySQL

