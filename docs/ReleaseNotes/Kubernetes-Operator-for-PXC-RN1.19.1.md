# Percona Operator for MySQL based on Percona XtraDB Cluster 1.19.1 ({{date.1_19_1}})

[Installation](../System-Requirements.md#installation-guidelines){.md-button}

This release fixes an issue with ProxySQL scheduler behavior for the replica read-only cluster when cross-site replication is configured.

## Changelog

### Fixed Bugs

* [K8SPXC-1029](https://perconadev.atlassian.net/browse/K8SPXC-1029) - Fixed a bug where ProxySQL pods entered a crash loop in replica clusters because the writer node was identified as read-only. The ProxySQL entrypoint now correctly identifies the primary node in replica environments by bypassing strict write-node validation, ensuring pods reach a ready state.
  
## Supported Software

The Operator was developed and tested with the following software:

- Percona XtraDB Cluster versions 8.4.7-7.1, 8.0.44-35.1, and 5.7.44-31.65 
- Percona XtraBackup versions 8.4.0-5.1, 8.0.35-34.1, and 2.4.29  
- HAProxy 2.8.17  
- ProxySQL 2.7.3-1.2, 3.0.1-1.2
- LogCollector based on fluent-bit 4.0.1-1 
- PMM Client 2.44.1-1 and 3.5.0  

Other options may also work but have not been tested.


## Supported Platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below:

--8<-- [start:platforms]

- [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.32 - 1.34  
- [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.33 - 1.34  
- [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.33 - 1.34
- [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.18 - 4.21  
- [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.38.10 based on Kubernetes 1.35.1  

--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.

## Percona certified images

Find Percona's certified Docker images that you can use with the
Percona Operator for MySQL based on Percona XtraDB Cluster in the following table.

--8<-- [start:images]

| Image                                                  | Digest                                                           |
|:-------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-xtradb-cluster-operator:1.19.1         | 937a583f0031f45175aee2e5c7a380bbaa9a35046f0e7cae8cd900c44732c4f8 |
| percona/percona-xtradb-cluster-operator:1.19.1 (ARM64) | d1939659a5d331db9fae970dee42fd25f083d1955330e9043fe4cb862ff19326 |
| percona/percona-xtradb-cluster:8.4.7-7.1               | 5b18775ad62a1c5f8d8bffc63a1518360d2e7a82c1bed7cbd8a15011f6cdff9f |
| percona/percona-xtradb-cluster:8.4.7-7.1 (ARM64)       | 4c3785f5befd001ca3ae035f42c9b586447b874158b0d9b26afb8ff87658829f |
| percona/percona-xtrabackup:8.4.0-5.1                   | 0f80a542a51af8733b5b5f1d836e72cfe9363250faa031ddec145f85206d6aac |
| percona/percona-xtrabackup:8.4.0-5.1 (ARM64)           | 22420a229d0b876331d0a2dd251a9e5060acaec2edc2eefc7384bd16516b6320 |
| percona/percona-xtrabackup:8.0.35-34.1                 | 967bafa0823c90aa8fa9c25a9012be36b0deef64e255294a09148d77ce6aea68 |
| percona/percona-xtrabackup:8.0.35-34.1 (ARM64)         | 83f814dca9ed398b585938baa86508bda796ba301e34c948a5106095d27bf86e |
| percona/percona-xtrabackup:2.4.29                      | 11b92a7f7362379fc6b0de92382706153f2ac007ebf0d7ca25bac2c7303fdf10 |
| percona/fluentbit:4.0.1-1                              | 65bdf7d38cbceed6b6aa6412aea3fb4a196000ac6c66185f114a0a62c4a442ad |
| percona/fluentbit:4.0.1-1 (ARM64)                      | dabda77b298b67d30d7f53b5cdb7215ad19dabb22b9543e3fd8aedb74ab24733 |
| percona/pmm-client:3.5.0                               | 352aee74f25b3c1c4cd9dff1f378a0c3940b315e551d170c09953bf168531e4a |
| percona/pmm-client:3.5.0 (ARM64)                       | cbbb074d51d90a5f2d6f1d98a05024f6de2ffdcb5acab632324cea4349a820bd |
| percona/pmm-client:2.44.1-1                            | 52a8fb5e8f912eef1ff8a117ea323c401e278908ce29928dafc23fac1db4f1e3 |
| percona/pmm-client:2.44.1-1 (ARM64)                    | 390bfd12f981e8b3890550c4927a3ece071377065e001894458047602c744e3b |
| percona/haproxy:2.8.17                                 | ef8486b39a1e8dca97b5cdf1135e6282be1757ad188517b889d12c5a3470eeda |
| percona/haproxy:2.8.17 (ARM64)                         | bbc5b3b66ac985d1a4500195539e7dff5196245a5a842a6858ea0848ec089967 |
| percona/proxysql2:2.7.3-1.2                            | 719d0ab363c65c7f75431bbed7ec0d9f2af7e691765c489da954813c552359a2 |
| percona/proxysql2:2.7.3-1.2 (ARM64)                    | 4c4d094652c9f2eb097be5d92dcc05da61c9e8699ac7321def959d5a205a89f7 |
| percona/percona-xtrabackup:2.4.29                      | 11b92a7f7362379fc6b0de92382706153f2ac007ebf0d7ca25bac2c7303fdf10 |