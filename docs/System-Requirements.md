# System requirements

The Operator was developed and tested with Percona XtraDB Cluster versions {{pxc84recommended}} (Tech preview), {{pxc80recommended}}, and {{pxc57recommended}}.

Other options may also work but have not been tested.

## Supported platforms

The following platforms were tested and are officially supported by the Operator
{{ release }}:

--8<-- "Kubernetes-Operator-for-PXC-RN{{release}}.md:platforms"


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

