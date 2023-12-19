# Initial troubleshooting

Percona Operator for MySQL uses [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) to manage options for the various components of the cluster.

* `PerconaXtraDBCluster` Custom Resource with Percona XtraDB Cluster options (it has handy `pxc` shortname also),

* `PerconaXtraDBClusterBackup` and `PerconaXtraDBClusterRestore` Custom Resources contain options for Percona XtraBackup used to backup Percona XtraDB Cluster and to restore it from backups (`pxc-backup` and `pxc-restore` shortnames are available for them).

The first thing you can check for the Custom Resource is to query it with `kubectl get` command:


``` {.bash data-prompt="$" }
$ kubectl get pxc
```

??? example "Expected output"

    ``` {.text .no-copy}
    NAME       ENDPOINT                   STATUS   PXC   PROXYSQL   HAPROXY   AGE
    cluster1   cluster1-haproxy.default   ready    3                3         33d
    ```

The Custom Resource should have `Ready` status.

!!! note

    You can check which Percona’s Custom Resources are present and get some information about them as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl api-resources | grep -i percona
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        perconaxtradbclusterbackups       pxc-backup,pxc-backups     pxc.percona.com/v1                     true         PerconaXtraDBClusterBackup
        perconaxtradbclusterrestores      pxc-restore,pxc-restores   pxc.percona.com/v1                     true         PerconaXtraDBClusterRestore
        perconaxtradbclusters             pxc,pxcs                   pxc.percona.com/v1                     true         PerconaXtraDBCluster
        ```

## Check the Pods

If Custom Resource is not getting `Ready` status, it makes sense to check
individual Pods. You can do it as follows:

``` {.bash data-prompt="$" }
$ kubectl get pods
```

???+ example "Expected output"

    --8<-- "./docs/assets/code/kubectl-get-pods-response.txt"

The above command provides the following insights:

* `READY` indicates how many containers in the Pod are ready to serve the
    traffic. In the above example, `cluster1-haproxy-0` Pod has all two
    containers ready (2/2). For an application to work properly, all containers
    of the Pod should be ready.
* `STATUS` indicates the current status of the Pod. The Pod should be in a
    `Running` state to confirm that the application is working as expected. You
    can find out other possible states in the [official Kubernetes documentation](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase).
* `RESTARTS` indicates how many times containers of Pod were restarted. This is
    impacted by the [Container Restart Policy](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#restart-policy).
    In an ideal world, the restart count would be zero, meaning no issues from
    the beginning. If the restart count exceeds zero, it may be reasonable to
    check why it happens.
* `AGE`: Indicates how long the Pod is running. Any abnormality in this value
    needs to be checked.

You can find more details about a specific Pod using the
`kubectl describe pods <pod-name>` command.

``` {.bash data-prompt="$" }
$ kubectl describe pods cluster1-pxc-0
```

??? example "Expected output"

    ``` {.text .no-copy}
    ...
    Name:         cluster1-pxc-0
    Namespace:    default
    ...
    Controlled By:  StatefulSet/cluster1-pxc
    Init Containers:
     pxc-init:
    ...
    Containers:
     pmm-client:
    ...
     pxc:
    ...
       Restart Count:  0
       Limits:
         cpu:     1
         memory:  2G
       Requests:
         cpu:      1
         memory:   2G
       Liveness:   exec [/var/lib/mysql/liveness-check.sh] delay=300s timeout=5s period=10s #success=1 #failure=3
       Readiness:  exec [/var/lib/mysql/readiness-check.sh] delay=15s timeout=15s period=30s #success=1 #failure=5
       Environment Variables from:
         pxc-env-vars-pxc  Secret  Optional: true
       Environment:
    ...
       Mounts:
    ...
    Volumes:
    ...
    Events:                      <none>
    ```

This gives a lot of information about containers, resources, container status
and also events. So, describe output should be checked to see any abnormalities.
