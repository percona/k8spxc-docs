
1. Confirm the Restore object reports `Succeeded`:

    ```bash
    kubectl get pxc-restore -n $NAMESPACE
    ```

2. Confirm the cluster reports the `ready` status:

    ```bash
    kubectl get pxc -n $NAMESPACE
    ```
