# Percona Operator for MySQL based on Percona XtraDB Cluster 1.18.0 ({{date.1_18_0}})

[Installation](../System-Requirements.md#installation-guidelines){.md-button}

## Release Highlights

This release of Percona Operator for MySQL based on Percona XtraDB Cluster includes the following new features and improvements:

### PMM3 support

The Operator is natively integrated with [PMM 3 :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/3/index.html), enabling you to monitor the health and performance of your Percona Distribution for MySQL deployment and at the same time enjoy enhanced performance, new features, and improved security that PMM 3 provides.

Note that the Operator supports both PMM2 and PMM3. The decision on what PMM version is used depends on the authentication method you provide in the Operator configuration: PMM2 uses API keys while PMM3 uses service account token. If the Operator configuration contains both authentication methods with non-empty values, PMM3 takes the priority.

To use PMM, ensure that the PMM client image is compatible with the PMM Server version. Check [Percona certified images](../images.md) for the correct client image.

For how to configure monitoring with PMM, see the [documentation](../monitoring.md).

### Improved monitoring for clusters in multi-region or multi-namespace deployments in PMM

Now you can define a custom name for your clusters deployed in different data centers. This name helps Percona Management and Monitoring (PMM) Server to correctly recognize clusters as connected and monitor them as one deployment. Similarly, PMM Server identifies clusters deployed with the same names in different namespaces as separate ones and correctly displays performance metrics for you on dashboards.

To assign a custom name, define this configuration in the Custom Resource manifest for your cluster:

```yaml
spec:
  pmm:
    customClusterName: testClusterName
```

### More resilient database restores without matching user Secrets

You no longer need matching user Secrets between your backup and your target cluster to perform a restore. The Operator now has a post-restore step that changes user passwords in the restored database to the ones from the local Secret. Also, it creates missing system users and adds missing grants.

This flow is the same regardless of whether you restore to the same cluster or to a completely new one.

The removal of this major roadblock to have a Secret for restores makes your disaster recovery process smoother and more reliable. This enhancement makes managing databases on Kubernetes more robust and operator-friendly.

### Improved backup retention for streamlined management of scheduled backups in cloud storage

A new backup retention configuration gives you more control over how backups are managed in storage and retained in Kubernetes.

With the `deleteFromStorage` flag , you can disable automatic deletion from AWS S3 or Azure Blob storage and instead rely on native cloud lifecycle policies. This makes backup cleanup more efficient and better aligned with flexible storage strategies. 

The legacy `keep` option is now deprecated and mapped to the new `retention` block for compatibility. We encourage you to start using the `backup.schedule.retention` configuration:

```yaml
schedule:
  - name: "sat-night-backup"
    schedule: "0 0 * * 6"
    retention:
      count: 3
      type: count
      deleteFromStorage: true
    storageName: s3-us-west
```

Note that if you have both `backup.schedule.keep`  and `backup.schedule.retention`  defined, the `backup.schedule.retention` takes precedence.

### Added labels to identify the version of the Operator

Custom Resource Definition (CRD) is compatible with the last three Operator versions. To know which Operator version is attached to it, we've added labels to all Custom Resource Definitions. The labels help you identify the current Operator version and decide if you need to update the CRD. To view the labels, run: `kubectl get crd perconaxtradbclusters.pxc.percona.com --show-labels`.

### Cross-site replication is now supported for Percona XtraDB Cluster 8.4

Cross-site replication is now available with Percona XtraDB Cluster 8.4.x, lifting one of the  limitations in the Operator for this database version. This enhancement marks a significant step toward general availability of Percona XtraDB Cluster 8.4 in the Operator by enabling multi-site deployments and improving resilience across distributed environments.

## Deprecation, Rename and Removal

* The `pxc.expose.loadBalancerIP`, `haproxy.exposePrimary.loadBalancerIP`, `haproxy.exposeReplicas.loadBalancerIP` and `proxysql.expose.loadBalancerIP` keys are deprecated. The `loadBalancerIP` field is also deprecated upstream in Kubernetes
due to its inconsistent behavior across cloud providers and lack of dual-stack support. As a result, its usage is strongly discouraged.

   We recommend using cloud provider-specific annotations instead, as they offer more predictable and portable behavior for managing load balancer IP assignments.

   The `pxc.expose.loadBalancerIP`, `haproxy.exposePrimary.loadBalancerIP`, `haproxy.exposeReplicas.loadBalancerIP` and `proxysql.expose.loadBalancerIP` keys are scheduled for removal in future releases.

* The `backup.schedule.keep` field is deprecated and will be removed after release 1.21.0. We recommend using the `backup.schedule.retention` instead as follows:

    ```yaml
    schedule:
      - name: "sat-night-backup"
        schedule: "0 0 ** 6"
        retention:
          count: 3
          type: count
          deleteFromStorage: true
        storageName: s3-us-west
    ```

* New repositories for Percona XtraBackup and Logcollector

   Now the Operator uses the official Percona Docker images for the `percona-xtrabackup` and `logcollector` components. Pay attention to the new image repositories when you upgrade the Operator and the database. Check the [Percona certified images](../images.md) for exact image names.
  
* Changes for Helm charts:

  * PMM3 is now the default. To keep using PMM2, set the `pmm.tag: 2.44.1`
  * If you install or upgrade the Operator with default manifests using Helm charts on Openshift 4.19, you must use the `docker.io` registry prefix to guarantee successful download from the DockerHub `percona-xtradb-cluster` repository. Read the [Considerations for using OpenShift 4.19](#considerations-for-using-openshift-419) section for more information.


## Known limitations

### Considerations for using OpenShift 4.19

Starting with OpenShift 4.19, the way images with not fully qualified names are pulled has changed for repositories that share the same repository name on DockerHub and Red Hat Marketplace. By default the tags are pulled from Red Hat Marketplace. Specifying not fully qualified image names may result in the `ImagePullBackOff` error.

* **OLM installation:** Images are provided with the fully qualified names and are pulled from the Red Hat Marketplace/DockerHub registry.
* **Manual install/update with default manifests:** Images must use the `docker.io` registry prefix to guarantee successful download from the Dockerhub `percona-xtradb-cluster` repository.

For manual installation or update, follow the instructions below:

=== "Install on OpenShift 4.19"

    1. Clone the Operator repository:

       ```{.bash data-prompt="$"}
       $ git clone -b v1.18.0 https://github.com/percona/percona-xtradb-cluster-operator
       $ cd percona-xtradb-cluster-operator
       ```
    
    2. Edit the `deploy/bundle.yaml` file. 
    
        - Locate the Deployment custom resource for the Operator.
        - Update the `spec.image` field to 
           
           ```
           docker.io/percona/percona-xtradb-cluster-operator:{{release}}
           ```

    3. Apply the updated `deploy/bundle.yaml` file

        ```{.bash data-prompt="$"}
        $ oc apply --server-side -f deploy/crd.yaml
        ```

    4. Install Percona XtraDB Cluster:

        ``` {.bash data-prompt="$" }
        $ oc create -f deploy/secrets.yaml
        ```

=== "Update the Operator to {{release}}"

    1. Check all clusters managed by the Operator to see if `initContainer.image` is set.

        * If defined: skip the next step.
        * If undefined: proceed to step 2.
    
    2. Apply a patch to the clusters with undefined `initContainer.image` to define this image with the `docker.io` registry in the image path:

        ```{.bash data-prompt="$" }
        $ kubectl patch pxc cluster1 --type=merge --patch '{
          "spec": {
            "initcontainer": {
              "image": "docker.io/percona/percona-xtradb-cluster-operator:1.17.0"
            }
          }
        }'
        ```

       **Important!** This command triggers the restart of your clusters. Wait till they restart and report the Ready status

    3. Update the Operator deployment and specify the `docker.io` registry name in the image path:

        ```{.bash data-prompt="$" }
        $ kubectl patch deployment percona-xtradb-cluster-operator \
        -p'{"spec":{"template":{"spec":{"containers":[{"name":"percona-xtradb-cluster-operator","image":"docker.io/percona/percona-xtradb-cluster-operator:{{release}}"}]}}}}'
        ```
    
    4. Update the Custom Resource version and the database cluster. Specify the `initContainer` image with the `docker.io` registry name in the path. Pay attention to the changed repositories for PXB and logcollector:

        ```{.bash data-prompt="$" }
        $ kubectl patch pxc cluster1 --type=merge --patch '{
          "spec": {
            "crVersion": "{{release}}",
            "initContainer": "docker.io/percona/percona-xtradb-cluster-operator:{{release}}",
            "pxc":{ "image": "docker.io/percona/percona-xtradb-cluster:{{ pxc80recommended }}" },
            "proxysql": { "image": "docker.io/percona/proxysql2:{{ proxysqlrecommended }}" },
            "haproxy":  { "image": "docker.io/percona/haproxy:{{ haproxyrecommended }}" },
            "backup":   { "image": "docker.io/percona/percona-xtrabackup:{{ pxb80recommended }}" },
            "logcollector": { "image": "docker.io/percona/fluentbit:{{ fluentbitrecommended }}" },
            "pmm":      { "image": "docker.io/percona/pmm-client:{{ pmm2recommended }}" }
               }}'
          }
        }'
        ```

## Changleog

### New Features 

* [K8SPXC-1284](https://perconadev.atlassian.net/browse/K8SPXC-1284) - Add the ability to configure protocol for peer-list DNS SRV lookups

* [K8SPXC-1599](https://perconadev.atlassian.net/browse/K8SPXC-1599) - Allowed setting `loadBalancerClass` service type and using a custom implementation of a load balancer rather than the cloud provider default one

### Improvements

* [K8SPXC-1375](https://perconadev.atlassian.net/browse/K8SPXC-1375) - Added a new retention configuration to allow users to delegate backup cleanup to cloud lifecycle policies (Thank you user Tristan for reporting this issue)

* [K8SPXC-1376](https://perconadev.atlassian.net/browse/K8SPXC-1376) - Added the ability to restore from backup without a matching Secret resource

* [K8SPXC-1399](https://perconadev.atlassian.net/browse/K8SPXC-1399) - Added a documentation how to set up a disaster recovery system and transfer workloads between sites 

* [K8SPXC-1415](https://perconadev.atlassian.net/browse/K8SPXC-1415) - Updated the `percona-xtrabackup` image to use the official `percona-xtrabackup` Docker image

* [K8SPXC-1430](https://perconadev.atlassian.net/browse/K8SPXC-1430) - Improved handling of autogenerated certificates depending on the `delete-ssl` finalizer configuration

* [K8SPXC-1448](https://perconadev.atlassian.net/browse/K8SPXC-1448), [K8SPXC-1449](https://perconadev.atlassian.net/browse/K8SPXC-1449) - Improved the `pvc-resize` test by using a custom storage class for EKS, reducing errors and improving the quota handling during resize

* [K8SPXC-1450](https://perconadev.atlassian.net/browse/K8SPXC-1450) - Improved PVC resizing behavior when reducing the storage size by reverting the values when the quota is reached

* [K8SPXC-1472](https://perconadev.atlassian.net/browse/K8SPXC-1472) - Deprecated the `loadBalancerIP` field due to its deprecation upstream

* [K8SPXC-1513](https://perconadev.atlassian.net/browse/K8SPXC-1513) - Added PXC 8.4 support for version service

* [K8SPXC-1529](https://perconadev.atlassian.net/browse/K8SPXC-1529) - Added support for cross-site replication with MySQL 8.4.0 by adding the use of `authentication_policy` instead of `default_authentication_plugin`

* [K8SPXC-1553](https://perconadev.atlassian.net/browse/K8SPXC-1553) - Added support for PMM v3

* [K8SPXC-1560](https://perconadev.atlassian.net/browse/K8SPXC-1560) - Added the warning about CRDs not being upgraded automatically after helm upgrade to the output

* [K8SPXC-1566](https://perconadev.atlassian.net/browse/K8SPXC-1566) - Improved reconciliation of replicationChannels without proxy Pods by starting the database Pod bypassing the proxy (Thank you Justin Reasoner for contributing to this issue)

* [K8SPXC-1569](https://perconadev.atlassian.net/browse/K8SPXC-1569) - Added Labels for Custom Resource Definitions (CRD) to identify the Operator version attached to them

* [K8SPXC-1597](https://perconadev.atlassian.net/browse/K8SPXC-1597) - Improve the scheduled backups behavior for a cluster in an unhealthy state by postponing the job until the cluster reports the healthy status

* [K8SPXC-1605](https://perconadev.atlassian.net/browse/K8SPXC-1605) - Introduced Azure CLI for checking if backup objects/folders exist in Azure storage

* [K8SPXC-1612](https://perconadev.atlassian.net/browse/K8SPXC-1612) - Added the `imagePullSecrets` for PMM image

* [K8SPXC-1615](https://perconadev.atlassian.net/browse/K8SPXC-1615) - Added the ability to define a custom cluster name for `pmm-admin` component

* [K8SPXC-1624](https://perconadev.atlassian.net/browse/K8SPXC-1624) - Deleted deprecated finalizers code

* [K8SPXC-1669](https://perconadev.atlassian.net/browse/K8SPXC-1669) - Improve the backup flow by generating a default endpoint URL for a storage from a region if it is not provided (Thank you Bernard Grymonpon for reporting this issue)

### Bugs Fixed

* [K8SPXC-1312](https://perconadev.atlassian.net/browse/K8SPXC-1312) - Fixed the issue with labels not being updated automatically for point-in-time recovery deployment upon Custom Resource changes 

* [K8SPXC-1347](https://perconadev.atlassian.net/browse/K8SPXC-1347) - Fixed the issue with point-in-time recovery failing due to TLS configuration mismatch between the server and the point-in-time recovery job by configuring it to use TLS if is required by the server. 

* [K8SPXC-1382](https://perconadev.atlassian.net/browse/K8SPXC-1382) - Fixed the issue with backup failing on AWS if using IAM profile without credentialsSecret by using credentialsSecret only when explicitly specified and relying on IAM roles instead (Thank you Itiel Olenick for reporting this issue)

* [K8SPXC-1541](https://perconadev.atlassian.net/browse/K8SPXC-1541) - Fixed Telemetry module to to consider both empty string "" and comma separated namespaces in cluster-wide mode

* [K8SPXC-1548](https://perconadev.atlassian.net/browse/K8SPXC-1548) Fixed the issue with deleting old backups on Google Cloud Storage by url-decoding the object path before deleting it (Thank you Mateusz Gruszkiewicz for reporting this issue)

* [K8SPXC-1631](https://perconadev.atlassian.net/browse/K8SPXC-1631) - Fixed the issue with the Operator restarting pod-0 after the cluster is ready. The issue is caused by ConfigMap and StatefulSet being created too close to each other and Kubernetes API can't return the newly created ConfigMap before creating the StatefulSet. The issue is fixed by reconciling the StatefulSet after the reconciliation of ConfigMap is completed.

* [K8SPXC-1664](https://perconadev.atlassian.net/browse/K8SPXC-1664) - Fixed the use of the proper script to check PXC nodes when adding them by HAProxy


## Supported Software

The Operator was developed and tested with the following software:

* Percona XtraDB Cluster versions 8.4.5-5.1 (Tech preview), 8.0.42-33.1, and 5.7.44-31.65  
* Percona XtraBackup versions 8.4.0-3, 8.0.35-34.1, and 2.4.29  
* HAProxy 2.8.15-1  
* ProxySQL 2.7.3  
* LogCollector based on fluent-bit 4.0.1  
* PMM Client 2.44.1 and 3.3.1  

Other options may also work but have not been tested.

## Supported Platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below for Operator version 1.16.0:

--8<-- [start:platforms]

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.30 - 1.33  
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.30 - 1.33  
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.30 - 1.33  
* [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.15 - 4.19  
* [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.36.0 based on Kubernetes 1.33.1  

--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.


## Percona certified images

Find Percona's certified Docker images that you can use with the
Percona Operator for MySQL based on Percona XtraDB Cluster in the following table.

**Images released with the Operator version {{ release }}:** 

--8<-- [start:images]

| Image                                                  | Digest                                                           |
|:-------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-xtradb-cluster-operator:1.18.0 (x86_64)| 0eca0b096482c7d09792c15fee00dbdcd0fbf3cd487dab60eb2774b025681e85 |
| percona/percona-xtradb-cluster-operator:1.18.0 (ARM64) | bdb7a0ff6b78e98b16f8b521e91682202b6d404202283b34b8168013d5c06356 |
| percona/haproxy:2.8.15                                 | 49e6987a1c8b27e9111ae1f1168dd51f2840eb6d939ffc157358f0f259819006 |
| percona/proxysql2:2.7.3                                | 51fedf9de05e4f130d5b08388511536fb1e1050a24ffc21bedb0f0b61a236567 |
| percona/percona-xtrabackup:8.4.0-3.1                   | 01071522753ad94e11a897859bba4713316d08e493e23555c0094d68da223730 |
| percona/percona-xtrabackup:8.0.35-34.1                 | 2dc127b08971051296d421b22aa861bb0330cf702b4b0246ae31053b0f01911e |
| percona/percona-xtrabackup:2.4.29                      | 11b92a7f7362379fc6b0de92382706153f2ac007ebf0d7ca25bac2c7303fdf10 |
| percona/fluentbit:4.0.1                                | a4ab7dd10379ccf74607f6b05225c4996eeff53b628bda94e615781a1f58b779 |
| percona/pmm-client:3.3.1                               | 29a9bb1c69fef8bedc4d4a9ed0ae8224a8623fd3eb8676ef40b13fd044188cb4 |
| percona/pmm-client:2.44.1-1                            | 52a8fb5e8f912eef1ff8a117ea323c401e278908ce29928dafc23fac1db4f1e3 |
| percona/percona-xtradb-cluster:8.4.5-5.1               | 918c54c11c96bf61bb3f32315ef6b344b7b1d68a0457a47a3804eca3932b2b17 |
| percona/percona-xtradb-cluster:8.0.42-33.1             | 476851339090e44bb72760ae718fc36beb73a6028a29459e849271649018d546 |
| percona/percona-xtradb-cluster:8.0.41-32.1             | d9c84884a12631306d5a33a079e30bf7b65d3d380b07b397d7b1b6a642cc6bff |
| percona/percona-xtradb-cluster:8.0.39-30.1             | 6a53a6ad4e7d2c2fb404d274d993414a22cb67beecf7228df9d5d994e7a09966 |
| percona/percona-xtradb-cluster:8.0.36-28.1             | b5cc4034ccfb0186d6a734cb749ae17f013b027e9e64746b2c876e8beef379b3 |
| percona/percona-xtradb-cluster:8.0.35-27.1             | 1ef24953591ef1c1ce39576843d5615d4060fd09458c7a39ebc3e2eda7ef486b |
| percona/percona-xtradb-cluster:5.7.44-31.65            | 36fafdef46485839d4ff7c6dc73b4542b07031644c0152e911acb9734ff2be85 |
| percona/percona-xtradb-cluster:5.7.42-31.65            | 9dab86780f86ec9caf8e1032a563c131904b75a37edeaec159a93f7d0c16c603 |
| percona/percona-xtradb-cluster:5.7.39-31.61            | 9013170a71559bbac92ba9c2e986db9bda3a8a9e39ee1ee350e0ee94488bb6d7 |
| percona/percona-xtradb-cluster:5.7.36-31.55            | c7bad990fc7ca0fde89240e921052f49da08b67c7c6dc54239593d61710be504 |
| percona/percona-xtradb-cluster:5.7.34-31.51            | f8d51d7932b9bb1a5a896c7ae440256230eb69b55798ff37397aabfd58b80ccb |


--8<-- [end:images]


