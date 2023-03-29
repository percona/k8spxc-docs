# Troubleshooting intro

Percona Operator for MySQL uses [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) to manage options for the various components of the cluster.

* `PerconaXtraDBCluster` Custom Resource with Percona XtraDB Cluster options (it has handy `pxc` shortname also),

* `PerconaXtraDBClusterBackup` and `PerconaXtraDBClusterRestore` Custom Resources contain options for Percona XtraBackup used to backup Percona XtraDB Cluster and to restore it from backups (`pxc-backup` and `pxc-restore` shortnames are available for them).

The first thing you can check for the Custom Resource is to query it with `kubectl get` command:


``` {.bash data-prompt="$" }
$ kubectl get pxc
```

??? example "Expected output"

    ```text
    NAME    ENDPOINT                STATUS   PXC   PROXYSQL   HAPROXY   AGE
    pxc-1   pxc-1-haproxy.default   ready    3                3         33d
    ```

The Custom Resource should have `Ready` status.

!!! note

    You can check which Percona’s Custom Resources are present and get some information about them as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl exec -ti pxc-pxc-0 -c pxc -- date
    ```

    ??? example "Expected output"

        ```text
        $ kubectl api-resources | grep -i percona
        perconaxtradbclusterbackups       pxc-backup,pxc-backups     pxc.percona.com/v1                     true         PerconaXtraDBClusterBackup
        perconaxtradbclusterrestores      pxc-restore,pxc-restores   pxc.percona.com/v1                     true         PerconaXtraDBClusterRestore
        perconaxtradbclusters             pxc,pxcs                   pxc.percona.com/v1                     true         PerconaXtraDBCluster
        ```

There might be a rare case when you need to check the CRD in detail to see versions, open API schema, etc.

Specific CRD can be checked with the following

``` {.bash data-prompt="$" }
$ kubectl get crd perconaxtradbclusters.pxc.percona.com  -oyaml 
```

??? example "Expected output"

    ```text
    ...
    apiVersion: apiextensions.k8s.io/v1
    kind: CustomResourceDefinition
    metadata:
     annotations:
    ...
    ```

