# Percona Operator for MySQL API Documentation

Percona Operator for MySQL based on Percona XtraDB Cluster provides an [aggregation-layer extension for the Kubernetes API :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/). Please refer to the
[official Kubernetes API documentation :octicons-link-external-16:](https://kubernetes.io/docs/reference/) on the API access and usage details.
The following subsections describe the Percona XtraDB Cluster API provided by the Operator.

## Prerequisites

1. Create the namespace name you will use, if not exist:

    ```yaml
    $ kubectl create namespace my-namespace-name
    ```

    Trying to create an already-existing namespace will show you a
    self-explanatory error message. Also, you can use the `defalut` namespace.

    !!! note

        In this document `default` namespace is used in all examples.
        Substitute `default` with your namespace name if you use a different
        one.

2. Prepare

    ```yaml
    # set correct API address
    KUBE_CLUSTER=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')
    API_SERVER=$(kubectl config view -o jsonpath="{.clusters[?(@.name==\"$KUBE_CLUSTER\")].cluster.server}" | sed -e 's#https://##')

    # create service account and get token
    kubectl apply --server-side -f deploy/crd.yaml -f deploy/rbac.yaml -n default
    KUBE_TOKEN=$(kubectl get secret $(kubectl get serviceaccount percona-xtradb-cluster-operator -o jsonpath='{.secrets[0].name}' -n default) -o jsonpath='{.data.token}' -n default | base64 --decode )
    ```

## Create new Percona XtraDB Cluster

**Description:**

```bash
The command to create a new Percona XtraDB Cluster with all its resources
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl apply -f percona-xtradb-cluster-operator/deploy/cr.yaml
```

**URL:**

```bash
https://$API_SERVER/apis/pxc.percona.com/v{{ apiversion }}/namespaces/default/perconaxtradbclusters
```

**Authentication:**

```bash
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPOST "https://$API_SERVER/apis/pxc.percona.com/v{{ apiversion }}/namespaces/default/perconaxtradbclusters" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -d "@cluster.json"
```

**Request Body (cluster.json):**

??? example

    --8<-- "cli/api-create-cluster-request-json.md"

**Inputs:**

> **Metadata**:


> 1. Name (String, min-length: 1) : `contains name of cluster`


> 2. Finalizers (list of string, Default: [ “delete-pxc-pods-in-order” ]) `contains steps to do when deleting the cluster`

> **Spec**:


> 1. secretsName (String, min-length: 1) : `contains name of secret to create for the cluster`


> 2. vaultSecretName (String, min-length: 1) : `contains name of vault secret to create for the cluster`


> 3. sslInternalSecretName (String, min-length: 1) : `contains name of ssl secret to create for the cluster`


> 4. allowUnsafeConfigurations (Boolean, Default: false) : `allow unsafe configurations to run`

> pxc:


> 1. Size (Int , min-value: 1, default, 3) : `number of Percona XtraDB Cluster nodes to create`


> 2. Image (String, min-length: 1) : `contains image name to use for Percona XtraDB Cluster nodes`


> 3. volumeSpec : storage (SizeString, default: “6Gi”) : `contains the size for the storage volume of Percona XtraDB Cluster nodes`


> 4. gracePeriod (Int, default: 600, min-value: 0 ) : `contains the time to wait for Percona XtraDB Cluster node to shutdown in milliseconds`

> proxysql:


> 1. Enabled (Boolean, default: true) : `enabled or disables proxysql`

> pmm:


> 1. serverHost (String, min-length: 1) : `serivce name for monitoring`


> 2. serverUser (String, min-length: 1) : `name of pmm user`


> 3. image (String, min-length: 1) : `name of pmm image`

> backup:


> 1. Storages (Object) : `contains the storage destinations to save the backups in`


> 2. schedule:


>     1. name (String, min-length: 1) : `name of backup job`


>     2. schedule (String, Cron format: `"\* \* \* \* \*"`) : `contains cron schedule format for when to run cron jobs`


>     3. keep (Int, min-value = 1) : `number of backups to keep`


>     4. storageName (String, min-length: 1) : `name of storage object to use`

**Response:**

??? example

    --8<-- "cli/api-create-cluster-response-json.md"

## List Percona XtraDB Clusters

**Description:**

```bash
Lists all Percona XtraDB Clusters that exist in your kubernetes cluster
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl get pxc
```

**URL:**

```bash
https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters?limit=500
```

**Authentication:**

```bash
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XGET "https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters?limit=500" \
            -H "Accept: application/json;as=Table;v=v1;g=meta.k8s.io,application/json;as=Table;v=v1beta1;g=meta.k8s.io,application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body:**

```bash
None
```

**Response:**

??? example

    --8<-- "cli/api-list-cluster-response-json.md"

## Get status of Percona XtraDB Cluster

**Description:**

```bash
Gets all information about the specified Percona XtraDB Cluster
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl get pxc/cluster1 -o json
```

**URL:**

```bash
https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1
```

**Authentication:**

```bash
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XGET "https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body:**

```bash
None
```

**Response:**

??? example

    --8<-- "cli/api-get-status-of-cluster-response-json.md"

## Scale up/down Percona XtraDB Cluster

**Description:**

```bash
Increase or decrease the size of the Percona XtraDB Cluster nodes to fit the
current high availability needs
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl patch pxc cluster1 --type=merge --patch '{
"spec": {"pxc":{ "size": "5" }
}}'
```

**URL:**

```bash
https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1
```

**Authentication:**

```bash
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPATCH "https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -H "Content-Type: application/merge-patch+json"
            -H "Accept: application/json" \
            -d '{
                  "spec": {"pxc":{ "size": "5" }
                  }}'
```

**Request Body:**

??? example

    --8<-- "cli/api-scale-cluster-request-json.md"

**Input:**

> **spec**:

> pxc


> 1. size (Int or String, Defaults: 3): `Specifiy the size of the Percona XtraDB Cluster to scale up or down to`

**Response:**

??? example

    --8<-- "cli/api-scale-cluster-response-json.md"

## Update Percona XtraDB Cluster image

**Description:**

```bash
Change the image of Percona XtraDB Cluster containers inside the cluster
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl patch pxc cluster1 --type=merge --patch '{
"spec": {"pxc":{ "image": "percona/percona-xtradb-cluster:5.7.30-31.43" }
}}'
```

**URL:**

```bash
https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1
```

**Authentication:**

```bash
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPATCH "https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -H "Accept: application/json" \
            -H "Content-Type: application/merge-patch+json"
            -d '{
              "spec": {"pxc":{ "image": "percona/percona-xtradb-cluster:5.7.30-31.43" }
              }}'
```

**Request Body:**

??? example

    --8<-- "cli/api-update-cluster-image-request-json.md"

**Input:**

> **spec**:

> pxc:


> 1. image (String, min-length: 1) : `name of the image to update for Percona XtraDB Cluster`

**Response:**

??? example

    --8<-- "cli/api-update-cluster-image-response-json.md"

## Pass custom my.cnf during the creation of Percona XtraDB Cluster

**Description:**

```bash
Create a custom config map containing the contents of the file my.cnf to be
passed on to the Percona XtraDB Cluster containers when they are created
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl create configmap cluster1-pxc3 --from-file=my.cnf
```

**my.cnf (Contains mysql configuration):**

```text
[mysqld]
max_connections=250
```

**URL:**

```bash
https://$API_SERVER/api/v1/namespaces/default/configmaps
```

**Authentication:**

```bash
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPOST "https://$API_SERVER/api/v1/namespaces/default/configmaps" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -d '{"apiVersion":"v1","data":{"my.cnf":"[mysqld]\nmax_connections=250\n"},"kind":"ConfigMap","metadata":{"creationTimestamp":null,"name":"cluster1-pxc3"}}' \
            -H "Content-Type: application/json"
```

**Request Body:**

??? example

    --8<-- "cli/api-pass-config-to-cluster-request-json.md"

**Input:**

> 
> 1. data (Object {filename : contents(String, min-length:0)}): `contains filenames to create in config map and its contents`


> 2. metadata: name(String, min-length: 1) : `contains name of the configmap`


> 3. kind (String): `type of object to create`

**Response:**

??? example

    --8<-- "cli/api-pass-config-to-cluster-response-json.md"

## Backup Percona XtraDB Cluster

**Description:**

```bash
Takes a backup of the Percona XtraDB Cluster containers data to be able to
recover from disasters or make a roll-back later
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl apply -f percona-xtradb-cluster-operator/deploy/backup/backup.yaml
```

**URL:**

```bash
https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusterbackups
```

**Authentication:**

```bash
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPOST "https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusterbackups" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -d "@backup.json" -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body (backup.json):**

??? example

    --8<-- "cli/api-backup-cluster-request-json.md"

**Input:**


1. **metadata**:

> name(String, min-length:1) : `name of backup to create`


2. **spec**:

> 
>     1. pxcCluster(String, min-length:1) : `name of Percona XtraDB Cluster`


>     2. storageName(String, min-length:1) : `name of storage claim to use`

**Response:**

??? example

    --8<-- "cli/api-backup-cluster-response-json.md"

## Restore Percona XtraDB Cluster

**Description:**

```bash
Restores Percona XtraDB Cluster data to an earlier version to recover from a
problem or to make a roll-back
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl apply -f percona-xtradb-cluster-operator/deploy/backup/restore.yaml
```

**URL:**

```bash
https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusterrestores
```

**Authentication:**

```bash
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPOST "https://$API_SERVER/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusterrestores" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -d "@restore.json" \
            -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body (restore.json):**

??? example

    --8<-- "cli/api-restore-cluster-request-json.md"

**Input:**


1. **metadata**:

> name(String, min-length:1): `name of restore to create`


2. **spec**:

> 
>     1. pxcCluster(String, min-length:1) : `name of Percona XtraDB Cluster`


>     2. backupName(String, min-length:1) : `name of backup to restore from`

**Response:**

??? example

    --8<-- "cli/api-restore-cluster-response-json.md"
