# Percona Operator for MySQL based on Percona XtraDB Cluster

[Percona XtraDB Cluster :octicons-link-external-16:](https://www.percona.com/software/mysql-database/percona-xtradb-cluster)
is an open-source enterprise MySQL solution that helps you to ensure data
availability for your applications while improving security and simplifying the
development of new applications in the most demanding public, private, and
hybrid cloud environments.

[Percona Operator for MySQL based on Percona XtraDB Cluster :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator)
is a Kubernetes-native operator designed to simplify the deployment and management of Percona XtraDB Cluster instances in containerized environments.
By leveraging the capabilities of Kubernetes, the Operator brings a suite of features that enhance the operational efficiency, resilience, and scalability of MySQL deployments:

* the Operator automates the deployment of the database cluster, reducing the manual effort required to set up a MySQL instance, managing tasks such as installation, configuration, and upgrades.

* the Operator supports high availability configurations using Percona XtraDB Cluster capabilities, and facilitates automatic failover, ensuring that the database remains available even during node failures.

* Built-in support for automated backups through Percona XtraBackup, allowing users to perform consistent backups without locking the database while also enabling point-in-time recovery.

* Using Kubernetes Custom Resource Definitions (CRDs) allows controling the cluster in a declarative way - defining the desired state of MySQL clusters and allowing the Operator apply them dinamically to running instances, enabling more responsive adjustments to performance needs.

These automation and management features substantially reduce the complexity and time associated with deploying and managing MySQL databases, allowing teams to get more focus on application development. High availability and automated failover minimize downtime and data loss, leading to more robust applications and improved user experiences. Also, users can efficiently scale their database infrastructure up or down based on demand, providing flexibility and cost savings. Finally, the Operator provides a wide range of mechanisms for securing data, including role-based access controls (RBAC) the ability to enable SSL/TLS for secure connections, and data-at-rest encryption.

Use Cases for the Operator include rapid MySQL deployment for microservices and cloud-native applications, scaling the database infrastructure of e-commerce platforms to adapt it for peak loads, providing management and high availability features for data-driven applications, quick deployment of isolated environments for development and testing purposes, and providing disaster recovery solutions.

Being part of the open-source ecosystem, the Percona Operator benefits from community contributions and support, ensuring that it remains stable and robust over time.
