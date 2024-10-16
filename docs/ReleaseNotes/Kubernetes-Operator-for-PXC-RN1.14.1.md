# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.14.1

* **Date**

   October 16, 2024

* **Installation**

   [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)

## Bugs Fixed

* {{ k8spxcjira(1476) }}: Fix a bug where upgrade could put the cluster into a non-operational state if using Storage Classes without the Volume expansion capabilities, by introducing a new `enableVolumeExpansion` Custom Resource option toggling this functionality

## Deprecation, Change, Rename and Removal

* The new `enableVolumeExpansion` Custom Resource option allows to disable the [automated storage scaling with Volume Expansion capability](../scaling.md#automated-scaling-with-volume-expansion-capability). The default value of this option is `false`, which means that the automated scaling is turned off by default.

## Supported Platforms

The Operator was developed and tested with Percona XtraDB Cluster versions 8.0.35-27.1 and 5.7.44-31.65. Other options may also work but have not been tested. Other software components include:

* Percona XtraBackup versions 2.4.29-1 and 8.0.35-30.1
* HAProxy 2.8.5-1
* ProxySQL 2.5.5-1.1
* LogCollector based on fluent-bit 2.1.10-1
* PMM Client 2.41.1

The following platforms were tested and are officially supported by the Operator
1.14.1:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.25 - 1.29
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.24 - 1.29
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.26 - 1.28
* [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.12.50 - 4.14.13
* [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.32.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
