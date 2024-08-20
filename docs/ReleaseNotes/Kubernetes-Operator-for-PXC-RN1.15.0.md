# *Percona Operator for MySQL based on Percona XtraDB Cluster* 1.15.0

* **Date**

   August 20, 2024

* **Installation**

   [Installing Percona Operator for MySQL based on Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)

## Release Highlights

### General availability of the automated volume resizing

The possibility to resize Persistent Volumes [by just changing the value](../scaling.md#scale-storage) of the `resources.requests.storage` option in the PerconaXtraDBCluster custom resource, introduced in the previous release as a technical preview, graduates to general availability.

### Allowing `haproxy-replica` Service to cycle through the reader instances only

By default [haproxy-replica Service](../expose.md#__tabbed_1_1) directs connections to all Pods of the database cluster in a round-robin manner. The new `haproxy.exposeReplicas.onlyReaders` Custom Resource option allows to modify this behavior: setting it to `true` excludes current MySQL primary instance (writer) from the list, leaving only the reader instances. By default the option is set to false, which means that `haproxy-replicas` sends traffic to all Pods, including the active writer. The feature can be useful to simplify the application logic by splitting read and write MySQL traffic on the Kubernetes level.

Also, it should be noted that changing `haproxy.exposeReplicas.onlyReaders` value will cause HAProxy Pods to restart.

### Fixing the overloaded `allowUnsafeConfigurations` flag

In the previous Operator versions `allowUnsafeConfigurations` Custom Resource option was used to allow configuring a cluster with unsafe parameters, such as starting it with less than 3 Percona XtraDB Cluster instances. In fact, setting this option to `true` resulted in a wide range of reduced safety features without the user's explicit intent: disabling TLS, allowing backups in unhealthy clusters, etc.

With this release, a separate `unsafeFlags` Custom Resource section is introduced for the fine-grained control of the safety loosening features:

```yaml
unsafeFlags:
  tls: false
  pxcSize: false
  proxySize: false
  backupIfUnhealthy: false
```

If the appropriate option is set to `false` and the Operator detects unsafe parameters, it sets cluster status to `error`, and prints an error message in the log.

Also, TLS configuration is now [enabled or disabled](../TLS.md#run-percona-xtradb-cluster-without-tls) by setting `unsafeFlags.tls` and  `tls.enabled` Custom Resource options to `true` or `false`.

## New Features 

* {{ k8spxcjira(1330) }}: A new `haproxy.exposeReplicas.onlyReaders` Custom Resource option makes `haproxy-replicas` Service to [forward requests](../expose.md#__tabbed_1_1) to reader instances of the MySQL cluster, avoiding the primary (writer) instance.
* {{ k8spxcjira(1355) }}: Finalizers were renamed to contain fully qualified domain names (FQDNs), avoiding potential conflicts with other finalizer names in the same Kubernetes environment

## Improvements

* {{ k8spxcjira(1357) }}: HAProxy Pod no longer restarts when the `operator` user's password changes, which is useful or the applications with persistent connection to  MySQL
* {{ k8spxcjira(1358) }}: Removing `allowUnsafeConfigurations` Custom Resource option in favor of fine-grained safety control in the `unsafeFlags` subsection
* {{ k8spxcjira(1368) }}: [Kubernetes PVC DataSources](https://kubernetes-csi.github.io/docs/volume-datasources.html) for Percona XtraDB Cluster Volumes are now officially supported via the [pxc.volumeSpec.persistentVolumeClaim.dataSource](../operator.md#pxcvolumespecpersistentvolumeclaimdataSourcename) subsection in the Custom Resource
* {{ k8spxcjira(1385) }}: Dynamic Volume resize now checks resource quotas and the PVC storage limits
* {{ k8spxcjira(1423) }}: The `percona.com/delete-pxc-pvc` finalizer is now able to delete also temporary secrets created by the Operator

## Bugs Fixed

* {{ k8spxcjira(1067) }}: Fix a bug where changing `gracePeriod`, `nodeSelector`, `priorityClassName`, `runtimeClassName`, and `schedulerName` fields in the `haproxy` Custom Resource subsection didn't propagate changes to the haproxy StatefulSet
* {{ k8spxcjira(1338) }}: Fix a bug where binary log collector Pod had unnecessary restart during the Percona XtraDB Cluster rolling restart
* {{ k8spxcjira(1364) }}: Fix a bug where log rotation functionality didn't work when the `proxy_protocol_networks` option was enabled in the [Percona XtraDB Cluster custom configuration](../operator.md#pxcconfiguration)
* {{ k8spxcjira(1365) }}: Fix `pxc-operator` Helm chart bug where it wasn't able to create namespaces if multiple namespaces were specified in the watchNamespace option
* {{ k8spxcjira(1371) }}: Fix a bug in `pxc-db` Helm chart which had wrong Percona XtraDB Cluster version for the 1.14.0 release and tried to downgrade the database in case of the helm chart upgrade
* {{ k8spxcjira(1380) }}: Fix a bug due to which values in the resources requests for the restore job Pod were overwritten by the resources limits ones
* {{ k8spxcjira(1381) }}: Fix a bug where HAProxy check script was not correctly identifying all the possible ”offline” state of a PXC instance, causing applications connects to an instance NOT able to serve the query
* {{ k8spxcjira(1382) }}: Fix a bug where creating a backup on S3 storage failed automatically if `s3.credentialsSecret` Custom Resource option was not present
* {{ k8spxcjira(1396) }}: The `xtrabackup` user didn't have rights to grant privileges available in its own privilege level to other users, which caused the point-in-time recovery fail due to access denied
* {{ k8spxcjira(1408) }}: Fix a bug where the Operator blocked all restores (including ones without PiTR) in case of a binlog gap detected, instead of only blocking PiTR restores
* {{ k8spxcjira(1418) }}: Fix a bug where CA Certificate generated by cert-manager had expiration period of 1 year instead of the 3 years period used by the Operator for other generated certificates, including ones used for internal and external communications

## Deprecation, Rename and Removal


* Starting from now, `allowUnsafeConfigurations` Custom Resource option is deprecated in favor of a number of options under the `unsafeFlags` subsection. Also, starting from now the Operator will not set safe defaults automatically. Upgrading existing clusters with `allowUnsafeConfiguration=false` and a configuration considered unsafe (i.e. `pxc.size<3` or  `tls.enabled=false`) will print errors in the log and the cluster will have `error` status until the values are fixed.

* Finalizers were renamed to contain fully qualified domain names:

    * `delete-pxc-pods-in-order` renamed to `percona.com/delete-pxc-pods-in-order`
    * `delete-ssl` renamed to `percona.com/delete-ssl`
    * `delete-proxysql-pvc` renamed to `percona.com/delete-proxysql-pvc`
    * `delete-pxc-pvc` renamed to `percona.com/delete-pxc-pvc`

* The `pxc-operator` Helm chart now has `createNamespace` option now is set to `false` by default, resulting in not creating any namespaces unless explicitly allowed to do so by the user

## Supported Platforms

The Operator was developed and tested with Percona XtraDB Cluster versions 8.0.36-28.1 and 5.7.44-31.65. Other options may also work but have not been tested. Other software components include:

* Percona XtraBackup versions 8.0.35-30.1 and 2.4.29-1
* HAProxy 2.8.5
* ProxySQL 2.5.5
* LogCollector based on fluent-bit 3.1.4
* PMM Client 2.42.0

The following platforms were tested and are officially supported by the Operator
1.15.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.27 - 1.30
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.28 - 1.30
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28 - 1.30
* [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.13.46 - 4.16.7
* [Minikube :octicons-link-external-16:](https://minikube.sigs.k8s.io/docs/) 1.33.1 based on Kubernetes 1.30.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
