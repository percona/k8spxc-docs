> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Automated minor upgrade to the latest / recommended version

## Assumptions

For the procedures in this tutorial, we assume that you have set up the `Smart Update` strategy to update the objects in your database cluster.

Read more about the Smart Update strategy and other available ones in the [Upgrade strategies](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/update.html#update-strategies) section.

## Before you start

1. We recommend to [update PMM Server](https://docs.percona.com/percona-monitoring-and-management/2/how-to/upgrade.html) **before** upgrading PMM Client.

1. If you are using [custom configuration for HAProxy](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/haproxy-conf.html#passing-custom-configuration-options-to-haproxy), check the HAProxy configuration file provided by the Operator **before the upgrade**. Find the `haproxy-global.cfg` for the Operator version {{ release }} \[here\](https://github.com/percona/percona-docker/blob/pxc-operator-{{ release }}/haproxy/dockerdir/etc/haproxy/haproxy-global.cfg) ).

   Make sure that your custom config is still compatible with the new variant, and make necessary additions, if needed.

## Procedure

You can configure the Operator to automatically upgrade Percona Server for MongoDB to the latest available, the recommended or to a specific version of your choice.

[Learn more about automatic upgrades](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/update-db.html)

The steps are the following:

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/update-operator.html).

1. Make sure that `spec.updateStrategy` option is set to `SmartUpdate`.

1. Change the `upgradeOptions.apply` option from `Disabled` to one of the following values:

   - `Recommended` - automatic upgrade will choose the most recent version of software flagged as “Recommended”. For newly created clusters, the Operator will always select Percona XtraDB Cluster 8.0 instead of Percona XtraDB Cluster 5.7, regardless of of the image path. For already existing clusters the Operator respects your choice of Percona XtraDB Cluster version (5.7 vs 8.0) and updates the selected version.
   - `8.0-recommended`, `5.7-recommended` - same as above, but preserves specific major Percona XtraDB Cluster version for newly provisioned clusters (e.g. 8.0 will not be automatically used instead of 5.7),
   - `Latest` - automatic upgrades will choose the most recent version of the software available
   - `8.0-latest`, `5.7-latest` - same as above, but preserves specific major Percona XtraDB Cluster version for newly provisioned clusters (e.g. 8.0 will not be automatically used instead of 5.7),
   - *version number* - specify the desired version explicitly (version numbers are specified as `8.0.45-36.1`, `5.7.44-31.65`, etc.). Actual versions can be found [in the list of certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html). For older releases, please refer to the [old releases documentation archive](https://docs.percona.com/legacy-documentation/) .

1. Make sure to set the valid Version Server URL for the `versionServiceEndpoint` key. The Operator checks the new software versions in the Version Server. If the Operator can’t reach the Version Server, the upgrades won’t happen.

   **Percona’s Version Service (default)**

   You can use the URL of the official Percona’s Version Service (default). Set `upgradeOptions.versionServiceEndpoint` to `https://check.percona.com`.

   **Version Service inside your cluster**

   Alternatively, you can run Version Service inside your cluster. This can be done with the `kubectl` command as follows:

   ```
   kubectl run version-service --image=perconalab/version-service --env="SERVE_HTTP=true" --port 11000 --expose
   ```

1. Specify the schedule to check for the new versions in in CRON format for the `upgradeOptions.schedule` option.

   The following example sets the midnight update checks with the official Percona’s Version Service:

   ```
   spec:
     updateStrategy: SmartUpdate
     upgradeOptions:
       apply: Recommended
       versionServiceEndpoint: https://check.percona.com
       schedule: "0 0 * * *"
   ...
   ```

   Note

   You can force an immediate upgrade by changing the schedule to `* * * * *` (continuously check and upgrade) and changing it back to another more conservative schedule when the upgrade is complete.

1. Apply your changes to the Custom Resource:

   ```
   kubectl apply -f deploy/cr.yaml
   ```
