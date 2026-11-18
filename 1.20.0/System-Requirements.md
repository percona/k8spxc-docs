> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# System requirements

The Operator was developed and tested with Percona XtraDB Cluster versions 8.4.8-8.1, 8.0.45-36.1, and 5.7.44-31.65.

Other options may also work but have not been tested.

## Supported platforms

The following platforms were tested and are officially supported by the Operator 1.20.0:

- [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.33 - 1.35
- [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.33 - 1.35
- [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.33 - 1.36
- [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.18 - 4.21
- [Minikube](https://minikube.sigs.k8s.io/docs/) 1.38.1 based on Kubernetes 1.35.1

Other Kubernetes platforms may also work but have not been tested.

## Resource limits

A cluster running an officially supported platform contains at least three Nodes, with the following resources:

- 2GB of RAM,
- 2 CPU threads per Node for Pods provisioning,
- at least 60GB of available storage for Persistent Volumes provisioning.

## Installation guidelines

Choose how you wish to install the Operator:

- [with Helm](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/helm.html)
- [with `kubectl`](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/kubectl.html)
- [on Minikube](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/minikube.html)
- [on Google Kubernetes Engine (GKE)](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/gke.html)
- [on Amazon Elastic Kubernetes Service (AWS EKS)](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/eks.html)
- [on Microsoft Azure Kubernetes Service (AKS)](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/aks.html)
- [on Openshift](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/openshift.html)
- [in a Kubernetes-based environment](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/kubernetes.html)
