# Check the Events

[Kubernetes Events :octicons-link-external-16:](https://kubernetes.io/docs/reference/kubernetes-api/cluster-resources/event-v1/) always provide a wealth of information and should always be checked while troubleshooting issues.

Events can be checked by the following command

```bash
kubectl get events
```

???+ example "Expected output"

    ``` {.text .no-copy}
    LAST SEEN   TYPE      REASON                   OBJECT                                                                   MESSAGE
    38m         Normal    Provisioning             persistentvolumeclaim/xb-cron-pxc-pxc-backup-stora-202211231300-3qf7g    External provisioner is provisioning volume for claim "default/xb-cron-pxc-pxc-backup-stora-202211231300-3qf7g"
    ...
    ```

Events capture many information happening at Kubernetes level and provide valuable information. By default, the ordering of events cannot be guaranteed.
Use the following command to sort the output in a reverse chronological fashion.

```bash
kubectl get events --sort-by=".lastTimestamp"
```

???+ example "Expected output"

    ``` {.text .no-copy}
    LAST SEEN   TYPE      REASON                   OBJECT                                                                   MESSAGE
    13m         Normal    Created                  pod/xb-cron-pxc-pxc-backup-stora-2022112313300-3qf7g-brxmv               Created container xtrabackup
    13m         Normal    Started                  pod/xb-cron-pxc-pxc-backup-stora-2022112313300-3qf7g-brxmv               Started container xtrabackup
    12m         Normal    Completed                job/xb-cron-pxc-pxc-backup-stora-2022112313300-3qf7g                     Job completed
    ...
    ```

When there are too many events and there is a need of filtering output, tools like [yq :octicons-link-external-16:](https://github.com/mikefarah/yq), [jq :octicons-link-external-16:](https://github.com/jqlang/jq) can be used to filter specific items or know the structure of the events.

Example:

```bash
kubectl get events -oyaml | yq .items[0]
```

??? example "Expected output"

    ``` {.text .no-copy}
    apiVersion: v1
    count: 2
    eventTime: null
    firstTimestamp: "2022-11-24T05:30:00Z"
    involvedObject:
     apiVersion: v1
     kind: Pod
     name: xb-cron-pxc-pxc-backup-stora-202211245300-3qf7g-bpm5s
     namespace: default
     resourceVersion: "41813970"
     uid: c2463e2a-65a0-4fc2-b5c3-86d88bba6b5b
    kind: Event
    lastTimestamp: "2022-11-24T05:30:03Z"
    message: '0/6 nodes are available: 6 pod has unbound immediate PersistentVolumeClaims.'
    metadata:
     creationTimestamp: "2022-11-24T05:30:00Z"
     name: xb-cron-pxc-pxc-backup-stora-202211245300-3qf7g-bpm5s.172a6e3851f6710c
     namespace: default
     resourceVersion: "94245"
     uid: d56ea5b8-3b15-4a22-a6ea-a4f641fcc54e
    reason: FailedScheduling
    reportingComponent: ""
    reportingInstance: ""
    source:
     component: default-scheduler
    type: Warning
    ```

Flag `--field-selector` can be used to filter out the output as well.
For example, the following command provides events of Pod only:

```bash
kubectl get events --field-selector involvedObject.kind=Pod
```

More fields can be added to the field-selector flag for filtering events further. Example: the following command provides events of Pod by name `xb-cron-pxc-pxc-backup-stora-202211245300-3qf7g-bpm5s`.

```bash
kubectl get events --field-selector involvedObject.kind=Pod,involvedObject.name=xb-cron-pxc-pxc-backup-stora-202211245300-3qf7g-bpm5s
```

???+ example "Expected output"

    ``` {.text .no-copy}
    LAST SEEN   TYPE      REASON                   OBJECT                                                      MESSAGE
    53m         Warning   FailedScheduling         pod/xb-cron-pxc-pxc-backup-stora-202211245300-3qf7g-bpm5s   0/6 nodes are available: 6 pod has unbound immediate PersistentVolumeClaims.
    53m         Normal    NotTriggerScaleUp        pod/xb-cron-pxc-pxc-backup-stora-202211245300-3qf7g-bpm5s   pod didn't trigger scale-up: 3 pod has unbound immediate PersistentVolumeClaims
    ```

Same way you can query events for other Kubernetes object (StatefulSet, Custom Resource, etc.) to investigate any problems to them:

```bash
kubectl get events --field-selector involvedObject.kind=PerconaXtraDBCluster,involvedObject.name=cluster1
```

???+ example "Expected output"

    ``` {.text .no-copy}
    LAST SEEN   TYPE      REASON                     OBJECT                        MESSAGE
    10m         Warning   AsyncReplicationNotReady   perconaservermysql/cluster1   cluster1-mysql-1: [not_replicating]
    ...
    ```

Alternatively, you can see events for a specific object in the output of `kubectl describe` command:

```bash
kubectl describe ps cluster1
```

??? example "Expected output"

    ``` {.text .no-copy}
    Name:         cluster1
    ...
    Events:
      Type     Reason                    Age                From           Message
      ----     ------                    ----               ----           -------
      Warning  AsyncReplicationNotReady  10m (x23 over 13m)    ps-controller  cluster1-mysql-1: [not_replicating]
    ...
    ```

Check `kubectl get events --help` to know about more options.

!!! note

    It is important to note that events are stored in the etcd for only 60 minutes. Ensure that events are checked within 60 minutes of the issue. Kubernetes cluster administrators might also use event exporters for storing the events.

