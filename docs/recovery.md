# Crash Recovery

## What does the full cluster crash mean?

A full cluster crash is a situation when all database instances where
shut down in random order. Being rebooted after such situation, Pod is
continuously restarting, and generates the following errors in the log:

```default
It may not be safe to bootstrap the cluster from this node. It was not the last one to leave the cluster and may not contain all the updates.
To force cluster bootstrap with this node, edit the grastate.dat file manually and set safe_to_bootstrap to 1
```

!!! note

    To avoid this, shutdown your cluster correctly
    as it is written in [Pause/resume Percona XtraDB Cluster](pause.md).

The Percona Operator for MySQL based on Percona XtraDB Cluster provides two ways of recovery
after a full cluster crash.

The Operator is providing automatic crash recovery (by default) and semi-automatic
recovery starting from the version `1.7`. For the previous Operator versions,
crash recovery can be done
manually.

## Automatic Crash Recovery

Crash recovery can be done automatically. This behavior is controlled by the
`pxc.autoRecovery` option in the `deploy/cr.yaml` configuration file.

The default value for this option is `true`, which means that automatic
recovery is turned on.

If this option is set to `false`, automatic crash recovery is not done,
but semi-automatic recovery is still possible.

In this case you need to get the log from pxc container from all Pods
using the following command:

``` {.bash data-prompt="$" }
$ for i in $(seq 0 $(($(kubectl get pxc cluster1 -o jsonpath='{.spec.pxc.size}')-1))); do echo "###############cluster1-pxc-$i##############"; kubectl logs cluster1-pxc-$i -c pxc | grep '(seqno):' ; done
```

The output of this command should be similar to the following one:

```default
###############cluster1-pxc-0##############
It is cluster1-pxc-0.cluster1-pxc.default.svc.cluster.local node with sequence number (seqno): 18
###############cluster1-pxc-1##############
It is cluster1-pxc-1.cluster1-pxc.default.svc.cluster.local node with sequence number (seqno): 18
###############cluster1-pxc-2##############
It is cluster1-pxc-2.cluster1-pxc.default.svc.cluster.local node with sequence number (seqno): 19
```

Now find the Pod with the largest `seqno` (it is `cluster1-pxc-2` in the
above example).

Now execute the following commands to start this instance:

``` {.bash data-prompt="$" }
$ kubectl exec cluster1-pxc-2 -c pxc -- sh -c 'kill -s USR1 1'
```

## Manual Crash Recovery

!!! warning

    This method includes a lot of operations, and therefore, it is
    intended for advanced users only!

This method involves the following steps:

* swap the original Percona XtraDB Cluster image with the
    [debug image](debug-images.md), which does not reboot after the crash, and
    force all Pods to run it,

* find the Pod with the most recent Percona XtraDB Cluster data, run recovery
    on it, start `mysqld`, and allow the cluster to be restarted,

* revert all temporary substitutions.

Let’s assume that a full crash did occur for the cluster named `cluster1`,
which is based on three Percona XtraDB Cluster Pods.

!!! note

    The following commands are written for Percona XtraDB Cluster 8.0.
    The same steps are also for Percona XtraDB Cluster 5.7 unless specifically
    indicated otherwise.

1. Check the current Update Strategy with the following command to make sure
    [Smart Updates](update.md#update-strategies) are turned off during the
    recovery:

    ``` {.bash data-prompt="$" }
    $ kubectl get pxc cluster1 -o jsonpath='{.spec.updateStrategy}'
    ```

    If the returned value is `SmartUpdate`, please change it to `onDelete`
    with the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl patch pxc cluster1 --type=merge --patch '{"spec": {"updateStrategy": "OnDelete" }}'
    ```

2. Change the normal PXC image inside the cluster object to the debug image:

    !!! note

        Please make sure the Percona XtraDB Cluster version for the debug image matches the version currently in use in the cluster.
        You can run the following command to find out which Percona XtraDB Cluster image is in use:

        ``` {.bash data-prompt="$" }
        $ kubectl get pxc cluster1 -o jsonpath='{.spec.pxc.image}'
        ```

    ``` {.bash data-prompt="$" }
    $ kubectl patch pxc cluster1 --type="merge" -p '{"spec":{"pxc":{"image":"percona/percona-xtradb-cluster:{{ pxc80recommended }}-debug"}}}'
    ```

!!! note

    For Percona XtraDB Cluster 5.7 this command should be as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl patch pxc cluster1 --type="merge" -p '{"spec":{"pxc":{"image":"percona/percona-xtradb-cluster:{{ pxc57recommended }}-debug"}}}'
    ```

3. Restart all Pods:

    ``` {.bash data-prompt="$" }
    $ for i in $(seq 0 $(($(kubectl get pxc cluster1 -o jsonpath='{.spec.pxc.size}')-1))); do kubectl delete pod cluster1-pxc-$i --force --grace-period=0; done
    ```

4. Wait until the Pod `0` is ready, and execute the following code (it is
    required for the Pod liveness check):

    ``` {.bash data-prompt="$" }
    $ for i in $(seq 0 $(($(kubectl get pxc cluster1 -o jsonpath='{.spec.pxc.size}')-1))); do until [[ $(kubectl get pod cluster1-pxc-$i -o jsonpath='{.status.phase}') == 'Running' ]]; do sleep 10; done; kubectl exec cluster1-pxc-$i -- touch /var/lib/mysql/sst_in_progress; done
    ```

5. Wait for all Percona XtraDB Cluster Pods to start, and execute the following
    code to make sure no mysqld processes are running:

    ``` {.bash data-prompt="$" }
    $ for i in $(seq $(($(kubectl get pxc cluster1 -o jsonpath='{.spec.pxc.size}')-1))); do pid=$(kubectl exec cluster1-pxc-$i -- ps -C mysqld-ps -o pid=); if [[ -n "$pid" ]]; then kubectl exec cluster1-pxc-$i -- kill -9 $pid; fi;  done
    ```

6. Wait for all Percona XtraDB Cluster Pods to start, then find the Percona
    XtraDB Cluster instance with the most recent data - i.e. the one with the
    highest [sequence number (seqno) :octicons-link-external-16:](https://www.percona.com/blog/2017/12/14/sequence-numbers-seqno-percona-xtradb-cluster/):

    ``` {.bash data-prompt="$" }
    $ for i in $(seq 0 $(($(kubectl get pxc cluster1 -o jsonpath='{.spec.pxc.size}')-1))); do echo "###############cluster1-pxc-$i##############"; kubectl exec cluster1-pxc-$i -- cat /var/lib/mysql/grastate.dat; done
    ```

    The output of this command should be similar to the following one:

    ```default
    ###############cluster1-pxc-0##############
    # GALERA saved state
    version: 2.1
    uuid:    7e037079-6517-11ea-a558-8e77af893c93
    seqno:   18
    safe_to_bootstrap: 0
    ###############cluster1-pxc-1##############
    # GALERA saved state
    version: 2.1
    uuid:    7e037079-6517-11ea-a558-8e77af893c93
    seqno:   18
    safe_to_bootstrap: 0
    ###############cluster1-pxc-2##############
    # GALERA saved state
    version: 2.1
    uuid:    7e037079-6517-11ea-a558-8e77af893c93
    seqno:   19
    safe_to_bootstrap: 0
    ```

    Now find the Pod with the largest `seqno` (it is `cluster1-pxc-2` in the
    above example).

7. Now execute the following commands *in a separate shell* to start this
    instance:

    ``` {.bash data-prompt="$" }
    $ kubectl exec cluster1-pxc-2 -- mysqld --wsrep_recover
    $ kubectl exec cluster1-pxc-2 -- sed -i 's/safe_to_bootstrap: 0/safe_to_bootstrap: 1/g' /var/lib/mysql/grastate.dat
    $ kubectl exec cluster1-pxc-2 -- sed -i 's/wsrep_cluster_address=.*/wsrep_cluster_address=gcomm:\/\//g' /etc/mysql/node.cnf
    $ kubectl exec cluster1-pxc-2 -- mysqld
    ```

    The `mysqld` process will initialize the database once again, and it will
    be available for the incoming connections.

8. Go back *to the previous shell* and return the original Percona XtraDB
    Cluster image because the debug image is no longer needed:

!!! note

    Please make sure the Percona XtraDB Cluster version for the debug image matches the version currently in use in the cluster.

    ``` {.bash data-prompt="$" }
    $ kubectl patch pxc cluster1 --type="merge" -p '{"spec":{"pxc":{"image":"percona/percona-xtradb-cluster:{{ pxc80recommended }}"}}}'
    ```

!!! note

    For Percona XtraDB Cluster 5.7 this command should be as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl patch pxc cluster1 --type="merge" -p '{"spec":{"pxc":{"image":"percona/percona-xtradb-cluster:{{ pxc57recommended }}"}}}'
    ```

9. Restart all Pods besides the `cluster1-pxc-2` Pod (the recovery donor).

    ``` {.bash data-prompt="$" }
    $ for i in $(seq 0 $(($(kubectl get pxc cluster1 -o jsonpath='{.spec.pxc.size}')-1))); do until [[ $(kubectl get pod cluster1-pxc-$i -o jsonpath='{.status.phase}') == 'Running' ]]; do sleep 10; done; kubectl exec cluster1-pxc-$i -- rm /var/lib/mysql/sst_in_progress; done
    $ kubectl delete pods --force --grace-period=0 cluster1-pxc-0 cluster1-pxc-1
    ```

10. Wait for the successful startup of the Pods which were deleted during the
    previous step, and finally remove the `cluster1-pxc-2` Pod:

    ``` {.bash data-prompt="$" }
    $ kubectl delete pods --force --grace-period=0 cluster1-pxc-2
    ```

11. After the Pod startup, the cluster is fully recovered.

!!! note

    If you have changed the update strategy on the 1st step, don’t
    forget to revert it back to `SmartUpdate` with the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl patch pxc cluster1 --type=merge --patch '{"spec": {"updateStrategy": "SmartUpdate" }}'
    ```
