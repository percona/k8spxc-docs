# Promote the replica site to a new primary

Let's say the primary site with `cluster1` is down. The client applications have automatically switched to the replica site. Now you need to reconfigure your setup to make `cluster2` on the replica site a new primary and have it handle the load.

Here's how to do it:

1. Modify the replication channel for `cluster2` within the `deploy/cr.yaml` file:

    * Set the `isSource` value to `true` to make the replica site the source of the data.
    * Remove the `sourcesList` configuration.

    Run the following command to apply a patch configuration to `cluster2`. 

    ```bash
    kubectl patch pxc cluster2 -n <namespace> --type=merge --patch '{
      "spec": {
        "pxc": {
          "replicationChannels": [
            {
              "name": "pxc1_to_pxc2",
              "isSource": true
            }
          ]
        }
      }}'
	```

	Now `cluster2` acts as the primary site.

3. While the old primary site is unavailable, `cluster1` no longer has up-to-date data. So you can delete it. Refer to the [Delete the database cluster](delete.md#delete-the-database-cluster) tutorial for the steps how to do it.
