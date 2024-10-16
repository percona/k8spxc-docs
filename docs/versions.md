# Versions compatibility

Versions of the cluster components and platforms tested with different Operator releases are shown below. Other version combinations may also work but have not been tested.

Cluster components:

| Operator | [MySQL :octicons-link-external-16:](https://www.percona.com/software/mysql-database/percona-server) | [Percona XtraBackup :octicons-link-external-16:](https://www.percona.com/software/mysql-database/percona-xtrabackup) | [HA Proxy :octicons-link-external-16:](https://www.haproxy.org/) | [ProxySQL :octicons-link-external-16:](https://proxysql.com/) |
|:--------|:--------|:-----|:-------|:-------|
| [1.15.1](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.1510.md) | 8.0, 5.7 | 8.0.35-30.1 for MySQL 8.0, 2.4.29-1 for MySQL 5.7 | 2.8.5 | 2.5.5 |
| [1.14.1](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.14.1.md) | 8.0, 5.7 | 8.0.35-30.1 for MySQL 8.0, 2.4.29-1 for MySQL 5.7 | 2.8.5-1 | 2.5.5-1.1 |
| [1.15.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.15.0.md) | 8.0, 5.7 | 8.0.35-30.1 for MySQL 8.0, 2.4.29-1 for MySQL 5.7 | 2.8.5 | 2.5.5 |
| [1.14.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.14.0.md) | 8.0, 5.7 | 8.0.35-30.1 for MySQL 8.0, 2.4.29-1 for MySQL 5.7 | 2.8.5-1 | 2.5.5-1.1 |
| [1.13.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.13.0.md) | 8.0, 5.7 | 8.0.32-26 for MySQL 8.0, 2.4.28 for MySQL 5.7 | 2.6.12 | 2.5.1-1.1 |
| [1.12.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.12.0.md) | 8.0, 5.7 | 8.0.30-23 for MySQL 8.0, 2.4.26 for MySQL 5.7 | 2.5.6  | 2.4.4     |
| [1.11.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.11.0.md) | 8.0, 5.7 | 8.0.27-19 for MySQL 8.0, 2.4.26 for MySQL 5.7 | 2.4.15 | 2.3.2     |
| [1.10.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.10.0.md) | 8.0, 5.7 | 8.0.23-16 for MySQL 8.0, 2.4.24 for MySQL 5.7 | 2.3.14 | 2.0.18    |
| [1.9.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.9.0.md)   | 8.0, 5.7 | 8.0.23-16 for MySQL 8.0, 2.4.23 for MySQL 5.7 | 2.3.10 | 2.0.18    |
| [1.8.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.8.0.md)   | 8.0, 5.7 | 8.0.23-16 for MySQL 8.0, 2.4.22 for MySQL 5.7 | 2.3.2  | 2.0.17    |
| [1.7.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.7.0.md)   | 8.0, 5.7 | 8.0.22-15 for MySQL 8.0, 2.4.21 for MySQL 5.7 | 2.1.7  | 2.0.15    |
| [1.6.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.6.0.md)   | 8.0, 5.7 | 8.0.14 for MySQL 8.0, 2.4.20 for MySQL 5.7    | 2.1.7  | 2.0.14    |
| [1.5.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.5.0.md)   | 8.0, 5.7 | 8.0.13 for MySQL 8.0, 2.4.20 for MySQL 5.7    | 2.1.7  | 2.0.12    |
| [1.4.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.4.0.md)   | 8.0, 5.7 | 8.0.11 for MySQL 8.0, 2.4.20 for MySQL 5.7    | -      | 2.0.10    |
| [1.3.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.3.0.md)   | 5.7      | 2.4.18                                        | -      | 2.0.6     |
| [1.2.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.2.0.md)   | 5.7      | 2.4.14                                        | -      | 2.0.6     |
| [1.1.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.1.0.md)   | 5.7      | 2.4.14                                        | -      | 2.0.4     |

Platforms:

| Operator | [GKE :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine)         | [EKS :octicons-link-external-16:](https://aws.amazon.com)         | [Openshift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) | [AKS :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) | [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube)                          |
|:--------|:------------|:------------|:------------|:--------------|:--------------------|
| [1.15.1](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.15.1.md) | 1.27 - 1.30 | 1.28 - 1.30 | 4.13.46 - 4.16.7 | 1.28 - 1.30 | 1.33.1 |
| [1.14.1](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.14.1.md) | 1.25 - 1.29 | 1.24 - 1.29 | 4.12.50 - 4.14.13 | 1.26 - 1.28 | 1.32.0 |
| [1.15.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.15.0.md) | 1.27 - 1.30 | 1.28 - 1.30 | 4.13.46 - 4.16.7 | 1.28 - 1.30 | 1.33.1 |
| [1.14.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.14.0.md) | 1.25 - 1.29 | 1.24 - 1.29 | 4.12.50 - 4.14.13 | 1.26 - 1.28 | 1.32.0 |
| [1.13.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.13.0.md) | 1.24 - 1.27 | 1.23 - 1.27 | 4.10 - 4.13 | 1.24 - 1.26 | 1.30 |
| [1.12.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.12.0.md) | 1.21 - 1.24 | 1.21 - 1.24 | 4.10 - 4.11 | 1.22 - 1.24 | 1.28 |
| [1.11.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.11.0.md) | 1.20 - 1.23 | 1.20 - 1.22 | 4.7 - 4.10  | -           | 1.23 |
| [1.10.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.10.0.md) | 1.19 - 1.22 | 1.17 - 1.21 | 4.7 - 4.9   | -           | 1.22 |
| [1.9.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.9.0.md)   | 1.16, 1.20  | 1.19        | 3.11, 4.7   | -           | 1.19 |
| [1.8.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.8.0.md)   | 1.16, 1.20  | 1.19        | 3.11, 4.7   | -           | 1.19 |
| [1.7.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.7.0.md)   | 1.15, 1.17  | 1.15        | 3.11, 4.6   | -           | 1.16 |
| [1.6.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.6.0.md)   | 1.15, 1.17  | 1.15        | 3.11, 4.5   | -           | 1.10 |
| [1.5.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.5.0.md)   | 1.13, 1.15  | 1.15        | 3.11, 4.2   | -           | 1.16 |
| [1.4.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.4.0.md)   | 1.13, 1.15  | 1.15        | 3.11, 4.2   | -           | 1.16 |
| [1.3.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.3.0.md)   | 1.11, 1.14  | -           | 3.11, 4.1   | -           | 1.12 |
| [1.2.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.2.0.md)   | +           | -           | 3.11        | -           | +    |
| [1.1.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.1.0.md)   | +           | -           | 3.11        | -           | +    |

More detailed information about the cluster components for the current version of the Operator can be found [in the system requirements](System-Requirements.md) and [in the list of certified images](images.md). For previous releases of the Operator, you can check the same pages [in the documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/).
