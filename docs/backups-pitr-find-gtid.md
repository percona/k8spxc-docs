# Find a GTID for point-in-time recovery

A [`transaction`-type or `skip`-type restore](backups-pitr-restore.md#choose-a-recovery-target) needs an exact GTID: the transaction to stop before, or the transaction to exclude. The Operator doesn't currently filter or search binlogs for you — a Backup object's status only exposes `status.latestRestorableTime`, not a list of GTIDs. To find the GTID you need, use one of the following, both built on functionality the Operator already installs or data it already writes.

!!! note "GTIDs on a Percona XtraDB Cluster node use the cluster state UUID"

    On a Galera cluster, the GTID source UUID you see is the **cluster state UUID** (`SHOW STATUS LIKE 'wsrep_cluster_state_uuid'`), not `@@server_uuid`. GTID sequence numbers are the same on every node, but binlog file names and file boundaries are local to each node — the same GTID can sit in a different file depending on which node you query, and a lookup answer is only valid for the node you ran it on. After a restore, the cluster gets a new state UUID and GTID numbering restarts at `:1`.

=== "The binlogs are still on a live node"

    The Operator preinstalls the [binary log user-defined functions :octicons-link-external-16:](https://docs.percona.com/percona-server/8.4/binlogging-replication-improvements.html) (`binlog_utils_udf`) on every Percona XtraDB Cluster node, so you don't need to install anything before querying for a GTID with SQL instead of reading raw binlog files. How much of it is ready to use depends on your Percona Server version:

    * **Percona Server for MySQL 8.4 and later**: the Operator installs the component, and all six functions are ready to use.
    * **Percona Server for MySQL 8.0**: the Operator loads the plugin but registers only three of the six functions (`get_gtid_set_by_binlog`, `get_first_record_timestamp_by_binlog`, and `get_last_record_timestamp_by_binlog`). Calling one of the other three — including `get_binlog_by_gtid`, the function that maps a GTID to a binlog file — fails with the misleading `ERROR 1046 (3D000): No database selected`, because MySQL falls back to looking for a stored function of that name. Register the missing functions once per node:

        ```sql
        CREATE FUNCTION get_binlog_by_gtid RETURNS STRING SONAME 'binlog_utils_udf.so';
        CREATE FUNCTION get_last_gtid_from_binlog RETURNS STRING SONAME 'binlog_utils_udf.so';
        CREATE FUNCTION get_binlog_by_gtid_set RETURNS STRING SONAME 'binlog_utils_udf.so';
        ```

    Use the functions to map a GTID to a binlog file, or list every GTID in a binlog file:

    ```sql
    -- Which binlog file contains this GTID?
    SELECT CAST(get_binlog_by_gtid('<gtid>') AS CHAR) AS binlog;

    -- Which binlog file contains a GTID from this set?
    SELECT CAST(get_binlog_by_gtid_set('<gtid-set>') AS CHAR) AS binlog;

    -- What GTIDs does this binlog file contain?
    SELECT CAST(get_gtid_set_by_binlog('binlog.000001') AS CHAR) AS gtid_set;

    -- When did this binlog file start and end?
    SELECT FROM_UNIXTIME(CAST(get_first_record_timestamp_by_binlog('binlog.000001') AS UNSIGNED) DIV 1000000) AS first_event;
    SELECT FROM_UNIXTIME(CAST(get_last_record_timestamp_by_binlog('binlog.000001') AS UNSIGNED) DIV 1000000) AS last_event;
    ```

    `get_binlog_by_gtid_set` returns the first binlog file that contains any GTID from the set you pass, not necessarily the file that contains every GTID in it. For example, a set spanning `:21-23` can return a file that only contains `:21`, while `:23` sits in a later file. Query the exact GTID you need with `get_binlog_by_gtid` when the boundary matters.

    See Percona's [binary log user-defined functions documentation :octicons-link-external-16:](https://docs.percona.com/percona-server/8.4/binlogging-replication-improvements.html) for the full function reference and the privileges they require.

=== "The binlogs are only in backup storage"

    If the point you need has already rotated out of local retention — the usual case after a longer outage or a full disaster — you don't need to download and parse a binlog file to find its GTIDs. The point-in-time recovery collector writes a companion `<object>-gtid-set` object next to every binlog it uploads, named after that binlog (the binlog itself follows the pattern `binlog_<unix-timestamp>_<sequence>_<hash>`). Read the companion object directly with your storage provider's CLI, for example:

    ```bash
    # Amazon S3 or S3-compatible storage, including Google Cloud Storage through its S3-compatible endpoint
    aws s3 cp s3://S3-BINLOG-BUCKET-NAME/binlog_1718000000_000012_8c59eb354a09325ab51e4f2bf7798553-gtid-set -
    ```

    If you need more than the GTID set — the statements inside a transaction, for example — download the binlog file itself from your configured [binlog storage](backups-pitr.md) and inspect it with the standalone `mysqlbinlog` client. This works on a downloaded file directly; you don't need a running server.

    ```bash
    mysqlbinlog binlog.000042 | grep -i gtid
    ```

    To see the statements inside a transaction, not just its GTID, add `--base64-output=decode-rows -v`:

    ```bash
    mysqlbinlog --base64-output=decode-rows -v binlog.000042 | less
    ```

    See MySQL's own [`mysqlbinlog` reference :octicons-link-external-16:](https://dev.mysql.com/doc/refman/8.0/en/mysqlbinlog.html) for the full set of options. `mysqlbinlog` accepts a glob of several files, so you can scan a range of binlogs in one pass instead of guessing which single file holds the transaction.

Once you have the GTID, return to [Restore with point-in-time recovery](backups-pitr-restore.md#choose-a-recovery-target) and set it as the restore's `gtid` key.
