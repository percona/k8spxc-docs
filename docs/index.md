# Percona Operator for MySQL based on Percona XtraDB Cluster

Kubernetes and the OpenShift platform, based on Kubernetes, have added a way to
manage containerized systems, including database clusters. This management is
achieved by controllers, declared in configuration files. These controllers
provide automation with the ability to create objects, such as a container or a
group of containers called pods, to listen for an specific event and then
perform a task.

This automation adds a level of complexity to the container-based architecture
and stateful applications, such as a database. A Kubernetes Operator is a
special type of controller introduced to simplify complex deployments. The
Operator extends the Kubernetes API with custom resources.

[Percona XtraDB Cluster](https://www.percona.com/software/mysql-database/percona-xtradb-cluster)
is an open-source enterprise MySQL solution that helps you to ensure data
availability for your applications while improving security and simplifying the
development of new applications in the most demanding public, private, and
hybrid cloud environments.

Following our best practices for deployment and configuration, [Percona Operator for MySQL based on Percona XtraDB Cluster](https://github.com/percona/percona-xtradb-cluster-operator)
contains everything you need to quickly and consistently deploy and scale
Percona XtraDB Cluster instances in a Kubernetes-based environment on-premises
or in the cloud.

# Requirements

* [System Requirements](System-Requirements.md)

* [Design and architecture](architecture.md)

* [Comparison with other solutions](compare.md)

# Quickstart guides

* [Install with Helm](helm.md)

* [Install with kubectl](kubectl.md)

# Advanced Installation Guides

* [Install on Minikube](minikube.md)

* [Install on Google Kubernetes Engine (GKE)](gke.md)

* [Install on Amazon Elastic Kubernetes Service (AWS EKS)](eks.md)

* [Install on Microsoft Azure Kubernetes Service (AKS)](aks.md)

* [Install on OpenShift](openshift.md)

* [Generic Kubernetes installation](kubernetes.md)

* [Multi-cluster and multi-region deployment](replication.md)

# Configuration

* [Application and system users](users.md)

* [Changing MySQL Options](options.md)

* [Anti-affinity and tolerations](constraints.md)

* [Labels and annotations](annotations.md)

* [Local Storage support](storage.md)

* [Defining environment variables](containers-conf.md)

* [Load Balancing with HAProxy](haproxy-conf.md)

* [Load Balancing with ProxySQL](proxysql-conf.md)

* [Transport Encryption (TLS/SSL)](TLS.md)

* [Data at rest encryption](encryption.md)

* [Telemetry](telemetry.md)

# Management

* Backup and restore

    * [About backups](backups.md)
    
    * [Configure storage for backups](backups-storage.md)
    
    * [Make scheduled backups](backups-scheduled.md)
    
    * [Make on-demand backup](backups-ondemand.md)
    
    * [Store operations logs for point-in-time recovery](backups-pitr.md)
    
    * [Enable compression for backups](backups-compress.md)
    
    * [Restore from a previously saved backup](backups-restore.md)
    
    * [Copy backup to a local machine](backups-copy.md)
    
    * [Delete the unneeded backup](backups-delete.md)

* [Upgrade Database and Operator](update.md)

* [Horizontal and vertical scaling](scaling.md)


* [Monitor with Percona Monitoring and Management (PMM)](monitoring.md)

* [Add sidecar containers](sidecar.md)

* [Restart or pause the cluster](pause.md)

* [Crash recovery](recovery.md)

# Troubleshooting

* [Initial troubleshooting](debug.md)

* [Exec into the container](debug-shell.md)

* [Check the logs](debug-logs.md)

* [Special debug images](debug-images.md)

# HOWTOs

* [How to install Percona XtraDB Cluster in multi-namespace (cluster-wide) mode](cluster-wide.md)

* [How to upgrade Percona XtraDB Cluster manually](update_manually.md)

* [How to use private registry](custom-registry.md)

* [How to restore backup to a new Kubernetes-based environment](backups-restore-to-new-cluster.md)

# Reference

* [Custom Resource options](operator.md)

* [Percona certified images](images.md)

* [Operator API](api.md)

* [Frequently Asked Questions](faq.md)

* [Old releases (documentation archive)](https://docs.percona.com/legacy-documentation/)

* [Release Notes](ReleaseNotes/index.md)
