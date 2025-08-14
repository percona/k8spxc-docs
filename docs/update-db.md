# Upgrade Percona XtraDB cluster

You can decide how to run the database upgrades:

* [Automatically](update-automatic.md) - the Operator periodically checks for new versions of the database images and for valid image paths and automatically updates your deployment with the latest, recommended or a specific version of the database and other components included. To do so, the Operator queries a special
*Version Service* server at scheduled times. If the current version should be upgraded, the Operator updates the Custom
Resource to reflect the new image paths and sequentially deletes Pods,
allowing StatefulSet to redeploy the cluster Pods with the new image.

* [Manually](update_manually.md) - you manually update the Custom Resource and specify the desired version of the database. Then, depending on the configured [update strategy](update.md#update-strategies), either the Operator automatically updates the deployment to this version. Or you manually trigger the upgrade by deleting Pods.

The way to instruct the Operator how it should run the database upgrades is to set the `upgradeOptions.apply` Custom Resource option to one of the following:

* `Never` - the Operator never makes automatic upgrades. You must upgrade the Custom Resource and images manually.
* `Disabled` - the Operator doesn't not carry on upgrades automatically. You must upgrade the Custom Resource and images manually.
* `Recommended` - the Operator automatically updates the database and components to the version flagged as Recommended. 
* `Latest` - the Operator automatically updates the database and components to the most recent available version 
* `version` - specify the specific database version that you want to update to in the format `{{ pxc80recommended }}`, `{{ pxc57recommended }}`, etc.. The Operator updates the database to it automatically. Find available versions [in the list of certified images](images.md). 

For previous versions, refer to the [old releases documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/)).
