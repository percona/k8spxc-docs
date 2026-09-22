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

## Check that the promotion is successful

Confirm that `cluster2` is genuinely serving as the primary before you do anything irreversible to `cluster1`.

Check the Galera status on every node of `cluster2`, not just one:

```{sql data-prompt="mysql> "}
mysql> SHOW STATUS LIKE 'wsrep_cluster_status';
mysql> SHOW STATUS LIKE 'wsrep_local_state_comment';
mysql> SHOW STATUS LIKE 'wsrep_ready';
mysql> SHOW VARIABLES LIKE 'read_only';
```

Look for the following on every node:
    
* `wsrep_cluster_status = Primary`
* `wsrep_local_state_comment = Synced`
* `wsrep_ready = ON`
*  `read_only = OFF` 

Then confirm that a write succeeds through the client-facing endpoint your application uses, not a direct connection to a single Pod:

```{sql data-prompt="mysql> "}
mysql> INSERT INTO <your_table> VALUES (...);
```

## Delete the previous primary

!!! important 

    Do this step only after you confirmed that the new primary is successfully promoted and correctly serves the write requests.

While the old primary site is unavailable, `cluster1` no longer has up-to-date data. Once you've confirmed `cluster2` is serving writes correctly, you can delete it. Refer to the [Delete the database cluster](delete.md#delete-the-database-cluster) tutorial for the steps how to do it.
