# System requirements

The Operator was developed and tested with Percona XtraDB Cluster versions
8.0.35-27.1 and 5.7.44-31.65. Other options may also work but have not been
tested.

## Supported platforms

The following platforms were tested and are officially supported by the Operator
{{ release }}:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.25 - 1.29
* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.24 - 1.29
* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.26 - 1.28
* [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.12.50 - 4.14.13
* [Minikube](https://minikube.sigs.k8s.io/docs/) 1.32.0

Other Kubernetes platforms may also work but have not been tested.

## Resource limits

A cluster running an officially supported platform contains at least three
Nodes, with the following resources:

* 2GB of RAM,

* 2 CPU threads per Node for Pods provisioning,

* at least 60GB of available storage for Persistent Volumes provisioning.

## Installation guidelines

Choose how you wish to install the Operator:

* [with Helm](helm.md)
* [with `kubectl`](kubectl.md)
* [on Minikube](minikube.md)
* [on Google Kubernetes Engine (GKE)](gke.md)
* [on Amazon Elastic Kubernetes Service (AWS EKS)](eks.md)
* [on Microsoft Azure Kubernetes Service (AKS)](aks.md)
* [on Openshift](openshift.md)
* [in a Kubernetes-based environment](kubernetes.md)

