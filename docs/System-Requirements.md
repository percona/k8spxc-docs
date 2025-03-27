# System requirements

The Operator was developed and tested with Percona XtraDB Cluster versions 8.4.2-2.1 (Tech preview), 8.0.39-30.1, and 5.7.44-31.65 Other options may also work but have not been tested.

## Supported platforms

The following platforms were tested and are officially supported by the Operator
{{ release }}:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.28 - 1.30
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.28 - 1.31
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28 - 1.31
* [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14.42 - 4.17.8
* [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.34.0 based on Kubernetes 1.31.0

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

