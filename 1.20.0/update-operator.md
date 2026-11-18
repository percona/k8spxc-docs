> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Upgrade the Operator and CRD

To update the Operator, you need to update the Custom Resource Definition (CRD) and the Operator deployment. Also we recommend to update the Kubernetes database cluster configuration by updating the Custom Resource and the database components to the latest version. This step ensures that all new features that come with the Operator release work in your environment.

The database cluster upgrade process is similar for all installation methods, including Helm and OLM.

## Considerations for Kubernetes Cluster versions and upgrades

1. Before upgrading the Kubernetes cluster, have a disaster recovery plan in place. Ensure that a backup is taken prior to the upgrade, and that point-in-time recovery is enabled to meet your Recovery Point Objective (RPO).

1. Plan your Kubernetes cluster or Operator upgrades with version compatibility in mind.

   The Operator is supported and tested on specific Kubernetes versions. Always refer to the Operator’s [release notes](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/ReleaseNotes/index.html) to verify the supported Kubernetes platforms.

   Note that while the Operator might run on unsupported or untested Kubernetes versions, this is not recommended. Doing so can cause various issues, and in some cases, the Operator may fail if deprecated API versions have been removed.

1. During a Kubernetes cluster upgrade, you must also upgrade the `kubelet`. It is advisable to drain the nodes hosting the database Pods during the upgrade process.

1. During the `kubelet` upgrade, nodes transition between `Ready` and `NotReady` states. Also in some scenarios, older nodes may be replaced entirely with new nodes. Ensure that nodes hosting database or proxy pods are functioning correctly and remain in a stable state after the upgrade.

1. Regardless of the upgrade approach, pods will be rescheduled or recycled. Plan your Kubernetes cluster upgrade accordingly to minimize downtime and service disruption.

## Considerations for Operator upgrades

1. The Operator version has three digits separated by a dot (`.`) in the format `major.minor.patch`. Here’s how you can understand the version `1.16.1`:

   - `1` is the major version
   - `16` is the minor version
   - `1` is the patch version.

   You can only upgrade the Operator to the nearest `major.minor` version (for example, from `1.15.1` to `1.16.1`).

   If the your current Operator version and the version you want to upgrade to differ by more than one minor version, you need to upgrade step by step. For example, if your current version is `1.14.x` and you want to move to `1.16.x`, first upgrade to `1.15.x`, then to `1.16.x`.

   Patch versions don’t influence the upgrade, so you can safely move from `1.15.1` to `1.16.1`.

   Check the [Release notes index](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/ReleaseNotes/index.html) for the list of the Operator versions.

1. CRD supports the **last 3 minor versions of the Operator**. This means it is compatible with the newest Operator version and the two older minor versions. If the Operator is older than the CRD *by no more than two versions*, you should be able to continue using the old Operator version. But updating the CRD *and* Operator is the **recommended path**.

1. Starting with version 1.12.0, the Operator no longer has a separate API version for each release in CRD. Instead, the CRD has the API version `v1`. Therefore, if you installed the CRD when the Operator version was **older than 1.12.0**, you must update the API version in the CRD manually to run the upgrade. To check your CRD version, use the following command:

   ```
   kubectl get crd perconaxtradbclusters.pxc.percona.com -o yaml | yq .status.storedVersions
   ```

   Sample output

   ```
   - v1-11-0
   - v1
   ```

   If the CRD version is other than `v1` or has multiple entries, run the manual update.

1. The Operator versions 1.14.0 and 1.15.0 **should be excluded** from the incremental upgrades sequence in favor of [1.14.1](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.14.1.html) and [1.15.1](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.15.1.html) releases.

   - The upgrade path from the version 1.14.1 should be 1.14.1 -> 1.15.1.
   - Direct upgrades from 1.13.0 to 1.14.1 and from 1.14.0 to 1.15.1 are supported.

1. To upgrade multiple [single-namespace Operator deployments](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/cluster-wide.html#namespace-scope) in one Kubernetes cluster, where each Operator controls a database cluster in its own namespace, do the following:

   - upgrade the CRD (not 3 minor versions far from the oldest Operator installation in the Kubernetes cluster) first
   - upgrade the Operators in each namespace incrementally to the latest minor version (e.g. from 1.15.1 to 1.16.1, then to 1.17.0)

1. Starting with version 1.18.0, the Operator supports PMM2 and PMM3. If you are using PMM server version 2, use a PMM client image compatible with PMM 2. If you are using PMM server version 3, use a PMM client image compatible with PMM 3. See [PMM upgrade documentation](https://docs.percona.com/percona-monitoring-and-management/3/pmm-upgrade/migrating_from_pmm_2.html) for how to migrate from version 2 to version 3.

## Upgrade manually

The upgrade includes the following steps.

1. **For Operators older than v1.12.0**: Update the API version in the [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) :

   **Manually**

   ```
   kubectl proxy &  \
   curl \
          --header "Content-Type: application/json-patch+json" \
          --request PATCH \
          --data '[{"op": "replace", "path": "/status/storedVersions", "value":["v1"]}]' \
          --url "http://localhost:8001/apis/apiextensions.k8s.io/v1/customresourcedefinitions/perconaxtradbclusters.pxc.percona.com/status"
   ```

   Expected output

   ```
   {
    {...},
     "status": {
       "storedVersions": [
         "v1"
       ]
     }
   }
   ```

   **Via kubectl patch**

   ```
   kubectl patch customresourcedefinitions perconaxtradbclusters.pxc.percona.com --subresource='status' --type='merge' -p '{"status":{"storedVersions":["v1"]}}'
   ```

   Expected output

   ```
   customresourcedefinition.apiextensions.k8s.io/perconaxtradbclusters.pxc.percona.com patched
   ```

1. Update the Custom Resource Definition for the Operator and the Role-based access control. Take the latest versions from the official repository on GitHub with the following commands:

   ```
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/crd.yaml
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/rbac.yaml
   ```

1. Next, update the Percona Server for MySQL Operator Deployment in Kubernetes by changing the container image of the Operator Pod to the latest version. Find the image name for the current Operator release [in the list of certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html). Then [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to the Operator Deployment and specify the image name and version. Use the following command to update the Operator to the `1.20.0` version:

   ```
   kubectl patch deployment percona-xtradb-cluster-operator \
     -p'{"spec":{"template":{"spec":{"containers":[{"name":"percona-xtradb-cluster-operator","image":"percona/percona-xtradb-cluster-operator:1.20.0"}]}}}}'
   ```

   For previous releases, please refer to the [old releases documentation archive](https://docs.percona.com/legacy-documentation/)

1. The deployment rollout will be automatically triggered by the applied patch. The update process is successfully finished when all Pods have been restarted.

   Note

   Labels set on the Operator Pod will not be updated during upgrade.

1. Update the Custom Resource, the database, backup, proxy and PMM Client image names with a newer version tag. This step ensures all new features and improvements of the latest release work well within your environment.

   Find the image names [in the list of certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html).

   Check your custom HAProxy configuration **before** the upgrade to be compatible with the one available with the Operator version you’re upgrading to. Find the `haproxy-global.cfg` for the Operator version 1.20.0 [here](https://github.com/percona/percona-docker/blob/pxc-operator-1.20.0/haproxy/dockerdir/etc/haproxy/haproxy-global.cfg) . Adjust your configuration, if needed.

   We recommend to update the PMM Server **before** the upgrade of PMM Client. In order to use PMM3, [upgrade your PMM Server to version 3](https://docs.percona.com/percona-monitoring-and-management/3/pmm-upgrade/migrating_from_pmm_2.html) .

   To keep using PMM2, specify the PMM Client version compatible with PMM Server 2.

   If you haven’t updated your PMM Server yet, exclude PMM Client from the list of images to update.

   Since this is a working cluster, the way to update the Custom Resource is to [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) with the `kubectl patch pxc` command.

   **With PMM Client**

   **For Percona XtraDB Cluster 8.4**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.4.8-8.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.4.0-5.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" },
          "pmm":      { "image": "percona/pmm-client:3.8.0" }
      }}'
   ```

   **For Percona XtraDB Cluster 8.0**

   ```
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:8.0.45-36.1" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:8.0.35-35.1" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" },
          "pmm":      { "image": "percona/pmm-client:3.8.0" }
      }}'
   ```

   **For Percona XtraDB Cluster 5.7**

   ````
   ```bash
   kubectl patch pxc cluster1 --type=merge --patch '{
      "spec": {
          "crVersion":"1.20.0",
          "pxc":{ "image": "percona/percona-xtradb-cluster:5.7.44-31.65" },
          "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" },
          "haproxy":  { "image": "percona/haproxy:2.8.18-1" },
          "backup":   { "image": "percona/percona-xtrabackup:2.4.29" },
          "logcollector": { "image": "percona/fluentbit:5.0.6" },
          "pmm":      { "image": "percona/pmm-client:3.8.0" }
      }}'
   ````

   ```

   **Without PMM Client**

   **For Percona XtraDB Cluster 8.4**

   ```

   kubectl patch pxc cluster1 --type=merge --patch '{ "spec": { "crVersion":"1.20.0", "pxc":{ "image": "percona/percona-xtradb-cluster:8.4.8-8.1" }, "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" }, "haproxy": { "image": "percona/haproxy:2.8.18-1" }, "backup": { "image": "percona/percona-xtrabackup:8.4.0-5.1" }, "logcollector": { "image": "percona/fluentbit:5.0.6" } }}'

   ```

   **For Percona XtraDB Cluster 8.0**

   ```

   kubectl patch pxc cluster1 --type=merge --patch '{ "spec": { "crVersion":"1.20.0", "pxc":{ "image": "percona/percona-xtradb-cluster:8.0.45-36.1" }, "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" }, "haproxy": { "image": "percona/haproxy:2.8.18-1" }, "backup": { "image": "percona/percona-xtrabackup:8.0.35-35.1" }, "logcollector": { "image": "percona/fluentbit:5.0.6" } }}'

   ```

   **For Percona XtraDB Cluster 5.7**

   ```

   kubectl patch pxc cluster1 --type=merge --patch '{ "spec": { "crVersion":"1.20.0", "pxc":{ "image": "percona/percona-xtradb-cluster:5.7.44-31.65" }, "proxysql": { "image": "percona/proxysql2:2.7.3-1.3" }, "haproxy": { "image": "percona/haproxy:2.8.18-1" }, "backup": { "image": "percona/percona-xtrabackup:2.4.29" }, "logcollector": { "image": "percona/fluentbit:5.0.6" } }}'

   ```

   ```

## Upgrade via Helm

If you have [installed the Operator using Helm](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/helm.html), you can upgrade the Operator with the `helm upgrade` command.

1. Update the [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) for the Operator, taking it from the official repository on Github, and do the same for the Role-based access control:

   ```
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/crd.yaml
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/rbac.yaml
   ```

1. Next, update the Operator deployment.

   **With default parameters**

   If you installed the Operator with default parameters, the upgrade can be done as follows:

   ```
   helm upgrade my-op percona/pxc-operator --version 1.20.0
   ```

   **With customized parameters**

   If you installed the Operator with some [customized parameters](https://github.com/percona/percona-helm-charts/tree/main/charts/pxc-operator#installing-the-chart) , you should list these options in the upgrade command.

   You can get the list of the used options in YAML format with the `helm get values my-op -a > my-values.yaml` command. Then pass this file directly to the upgrade command as follows:

   ```
   helm upgrade my-op percona/pxc-operator --version 1.20.0 -f my-values.yaml
   ```

   The `my-op` parameter in the above example is the name of a [release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) which which you have chosen for the Operator when installing its Helm chart.

## Upgrade via Operator Lifecycle Manager (OLM)

If you have [installed the Operator on the OpenShift platform using OLM](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/openshift.html#install-via-the-operator-lifecycle-manager-olm), you can upgrade the Operator within it.

1. List installed Operators for your Namespace to see if there are upgradable items.
1. Click the “Upgrade available” link to see upgrade details, then click “Preview InstallPlan” button, and finally “Approve” to upgrade the Operator.
