> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Point-in-time recovery (PITR)

Point-in-time recovery allows you to roll back the cluster to a specific transaction or time. You can also skip a specific transaction instead of replaying it.

For point-in-time recovery, the Operator needs two things:

- at least one successful full backup
- binary logs (binlogs) of the server.

A binary log records all changes made to the database, such as updates, inserts, and deletes. The Operator already uses binlogs to synchronize data across cluster nodes. Point-in-time recovery reuses the same mechanism and extends it to a separate storage location so the log survives independently of the cluster.

Point-in-time recovery is off by default and is supported starting with Percona XtraDB Cluster 8.0.21-12.1.

After you [enable point-in-time recovery](#enable-point-in-time-recovery), the Operator spins up a separate point-in-time recovery Pod, which starts saving binary log updates [to the backup storage](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage.html).

## Considerations

1. Use either S3-compatible or Azure-compatible storage for both the binlog and the full backup. Point-in-time recovery doesn’t work with other storage types.

1. The Operator saves binlogs without any cluster-based filtering. Use a separate folder per cluster on the same bucket, or use a different bucket per cluster.

   Also, we recommend to use an empty bucket or a folder on a bucket for binlogs when you enable point-in-time recovery. This bucket/folder should not contain binlogs or files from previous attempts or other clusters.

1. Don’t [purge binlogs](https://dev.mysql.com/doc/refman/8.0/en/purge-binary-logs.html) before they are transferred to the backup storage. Doing so breaks point-in-time recovery.

1. Disable the [retention policy](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupschedulekeep) as it is incompatible with the point-in-time recovery. To clean up the storage, configure the [Bucket lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/how-to-set-lifecycle-configuration-intro.html) on the storage.

1. Optionally set [`s3.checksumAlgorithm`](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#backupstoragesstorage-names3checksumalgorithm) on the binlog storage to verify data integrity during uploads. This option also applies if you make backups with the [XtraBackup sidecar method](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-methods.html); the default SST backup method doesn’t use it.

## Enable point-in-time recovery

Before you start, make sure you [have configured the storage for binlogs](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-storage.html).

To use point-in-time recovery, set the following keys in the `pitr` subsection under the `backup` section of the [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/v1.20.0/deploy/cr.yaml) manifest:

- `backup.pitr.enabled` - set it to `true`
- `backup.pitr.storageName` - specify the same storage name that you have defined in the `storages` subsection
- `timeBetweenUploads`- specify the number of seconds between running the binlog uploader

The following example shows how the `pitr` subsection looks like if you use the S3 storage:

```
backup:
  ...
  pitr:
    enabled: true
    storageName: s3-us-west
    timeBetweenUploads: 60
```

For how to restore a database to a specific point in time, see [Restore with point-in-time recovery](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backups-pitr-restore.html).

## Binary logs statistics

The point-in-time recovery Pod has statistics metrics for binlogs. They provide insights into the success and failure rates of binlog operations, timeliness of processing and uploads and potential gaps or inconsistencies in binlog data.

The available metrics are:

- `pxc_binlog_collector_success_total` - The total number of successful binlog collection cycles. It helps monitor how often the binlog collector successfully processes and uploads binary logs.
- `pxc_binlog_collector_gap_detected_total` - Tracks the total number of gaps detected in the binlog sequence during collection. Highlights potential issues with missing or skipped binlogs, which could impact replication or recovery.
- `pxc_binlog_collector_last_processing_timestamp` - Records the timestamp of the last successful binlog collection operation.
- `pxc_binlog_collector_last_upload_timestamp` - Records the timestamp of the last successful binlog upload to the storage
- `pxc_binlog_collector_uploaded_total` - The total number of successfully uploaded binlogs

### Gather metrics data

You can connect to the point-in-time recovery Pod using the `<pitr-pod-service>:8080/metrics` endpoint to gather these metrics and further analyze them.

List services to get the point-in-time-recovery service name:

```
kubectl get services | grep 'pitr'
```

Expected output

```
cluster1-pitr                         ClusterIP   34.118.225.138   <none>        8080/TCP
```

#### Access locally via port forwarding

Use this method to access the metrics from your local machine.

1. Forward the Kubernetes service’s port:

   ```
   kubectl port-forward svc/cluster1-pitr 8080:8080
   ```

1. Open your browser and visit `<http://localhost:8080/metrics>`

   Expected output

   ```
   # HELP go_gc_duration_seconds A summary of the wall-time pause (stop-the-world) duration in garbage collection cycles.
   # TYPE go_gc_duration_seconds summary
   go_gc_duration_seconds{quantile="0"} 0.000109735
   go_gc_duration_seconds{quantile="0.25"} 0.000147529
   go_gc_duration_seconds{quantile="0.5"} 0.000176199
   go_gc_duration_seconds{quantile="0.75"} 0.000196962
   go_gc_duration_seconds{quantile="1"} 0.000570426
   go_gc_duration_seconds_sum 0.002970858
   go_gc_duration_seconds_count 14
   # HELP go_gc_gogc_percent Heap size target percentage configured by the user, otherwise 100. This value is set by the GOGC environment variable, and the runtime/debug.SetGCPercent function. Sourced from /gc/gogc:percent.
   # TYPE go_gc_gogc_percent gauge
   go_gc_gogc_percent 100
   # HELP go_gc_gomemlimit_bytes Go runtime memory limit configured by the user, otherwise math.MaxInt64. This value is set by the GOMEMLIMIT environment variable, and the runtime/debug.SetMemoryLimit function. Sourced from /gc/gomemlimit:bytes.
   # TYPE go_gc_gomemlimit_bytes gauge
   go_gc_gomemlimit_bytes 9.223372036854776e+18
   # HELP go_goroutines Number of goroutines that currently exist.
   # TYPE go_goroutines gauge
   go_goroutines 31
   # HELP go_info Information about the Go environment.
   # TYPE go_info gauge
   go_info{version="go1.24.3"} 1
   # HELP go_memstats_alloc_bytes Number of bytes allocated in heap and currently in use. Equals to /memory/classes/heap/objects:bytes.
   # TYPE go_memstats_alloc_bytes gauge
   go_memstats_alloc_bytes 2.83268e+06
   # HELP go_memstats_alloc_bytes_total Total number of bytes allocated in heap until now, even if released already. Equals to /gc/heap/allocs:bytes.
   # TYPE go_memstats_alloc_bytes_total counter
   go_memstats_alloc_bytes_total 5.80031448e+08
   # HELP go_memstats_buck_hash_sys_bytes Number of bytes used by the profiling bucket hash table. Equals to /memory/classes/profiling/buckets:bytes.
   # TYPE go_memstats_buck_hash_sys_bytes gauge
   go_memstats_buck_hash_sys_bytes 5696
   # HELP go_memstats_frees_total Total number of heap objects frees. Equals to /gc/heap/frees:objects + /gc/heap/tiny/allocs:objects.
   # TYPE go_memstats_frees_total counter
   go_memstats_frees_total 112652
   # HELP go_memstats_gc_sys_bytes Number of bytes used for garbage collection system metadata. Equals to /memory/classes/metadata/other:bytes.
   # TYPE go_memstats_gc_sys_bytes gauge
   go_memstats_gc_sys_bytes 3.83684e+06
   # HELP go_memstats_heap_alloc_bytes Number of heap bytes allocated and currently in use, same as go_memstats_alloc_bytes. Equals to /memory/classes/heap/objects:bytes.
   # TYPE go_memstats_heap_alloc_bytes gauge
   go_memstats_heap_alloc_bytes 2.83268e+06
   # HELP go_memstats_heap_idle_bytes Number of heap bytes waiting to be used. Equals to /memory/classes/heap/released:bytes + /memory/classes/heap/free:bytes.
   # TYPE go_memstats_heap_idle_bytes gauge
   go_memstats_heap_idle_bytes 5.681152e+08
   # HELP go_memstats_heap_inuse_bytes Number of heap bytes that are in use.  Equals to /memory/classes/heap/objects:bytes + /memory/classes/heap/unused:bytes
   # TYPE go_memstats_heap_inuse_bytes gauge
   go_memstats_heap_inuse_bytes 5.423104e+06
   # HELP go_memstats_heap_objects Number of currently allocated objects. Equals to /gc/heap/objects:objects.
   # TYPE go_memstats_heap_objects gauge
   go_memstats_heap_objects 11876
   # HELP go_memstats_heap_released_bytes Number of heap bytes released to OS. Equals to /memory/classes/heap/released:bytes.
   # TYPE go_memstats_heap_released_bytes gauge
   go_memstats_heap_released_bytes 5.66616064e+08
   # HELP go_memstats_heap_sys_bytes Number of heap bytes obtained from system. Equals to /memory/classes/heap/objects:bytes + /memory/classes/heap/unused:bytes + /memory/classes/heap/released:bytes + /memory/classes/heap/free:bytes.
   # TYPE go_memstats_heap_sys_bytes gauge
   go_memstats_heap_sys_bytes 5.73538304e+08
   # HELP go_memstats_last_gc_time_seconds Number of seconds since 1970 of last garbage collection.
   # TYPE go_memstats_last_gc_time_seconds gauge
   go_memstats_last_gc_time_seconds 1.7492150571437228e+09
   # HELP go_memstats_mallocs_total Total number of heap objects allocated, both live and gc-ed. Semantically a counter version for go_memstats_heap_objects     gauge. Equals to /gc/heap/allocs:objects + /gc/heap/tiny/allocs:objects.
   # TYPE go_memstats_mallocs_total counter
   go_memstats_mallocs_total 124528
   # HELP go_memstats_mcache_inuse_bytes Number of bytes in use by mcache     structures. Equals to /memory/classes/metadata/mcache/inuse:bytes.
   # TYPE go_memstats_mcache_inuse_bytes gauge
   go_memstats_mcache_inuse_bytes 4832
   # HELP go_memstats_mcache_sys_bytes Number of bytes used for mcache structures obtained from system. Equals to /memory/classes/metadata/mcache/inuse:bytes + /memory/classes/metadata/mcache/free:bytes.
   # TYPE go_memstats_mcache_sys_bytes gauge
   go_memstats_mcache_sys_bytes 15704
   # HELP go_memstats_mspan_inuse_bytes Number of bytes in use by mspan     structures. Equals to /memory/classes/metadata/mspan/inuse:bytes.
   # TYPE go_memstats_mspan_inuse_bytes gauge
   go_memstats_mspan_inuse_bytes 125920
   # HELP go_memstats_mspan_sys_bytes Number of bytes used for mspan structures obtained from system. Equals to /memory/classes/metadata/mspan/inuse:bytes + /memory/classes/metadata/mspan/free:bytes.
   # TYPE go_memstats_mspan_sys_bytes gauge
   go_memstats_mspan_sys_bytes 146880
   # HELP go_memstats_next_gc_bytes Number of heap bytes when next garbage     collection will take place. Equals to /gc/heap/goal:bytes.
   # TYPE go_memstats_next_gc_bytes gauge
   go_memstats_next_gc_bytes 6.04629e+06
   # HELP go_memstats_other_sys_bytes Number of bytes used for other system  allocations. Equals to /memory/classes/other:bytes.
   # TYPE go_memstats_other_sys_bytes gauge
   go_memstats_other_sys_bytes 764832
   # HELP go_memstats_stack_inuse_bytes Number of bytes obtained from system for stack allocator in non-CGO environments. Equals to /memory/classes/heap/stacks:bytes.
   # TYPE go_memstats_stack_inuse_bytes gauge
   go_memstats_stack_inuse_bytes 1.081344e+06
   # HELP go_memstats_stack_sys_bytes Number of bytes obtained from system for stack allocator. Equals to /memory/classes/heap/stacks:bytes + /memory/classes/os-stacks:bytes.
   # TYPE go_memstats_stack_sys_bytes gauge
   go_memstats_stack_sys_bytes 1.081344e+06
   # HELP go_memstats_sys_bytes Number of bytes obtained from system. Equals to /memory/classes/total:byte.
   # TYPE go_memstats_sys_bytes gauge
   go_memstats_sys_bytes 5.793896e+08
   # HELP go_sched_gomaxprocs_threads The current runtime.GOMAXPROCS setting, or the number of operating system threads that can execute user-level Go code simultaneously. Sourced from /sched/gomaxprocs:threads.
   # TYPE go_sched_gomaxprocs_threads gauge
   go_sched_gomaxprocs_threads 4
   # HELP go_threads Number of OS threads created.
   # TYPE go_threads gauge
   go_threads 10
   # HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
   # TYPE process_cpu_seconds_total counter
   process_cpu_seconds_total 0.55
   # HELP process_max_fds Maximum number of open file descriptors.
   # TYPE process_max_fds gauge
   process_max_fds 1.048576e+06
   # HELP process_network_receive_bytes_total Number of bytes received by the     process over the network.
   # TYPE process_network_receive_bytes_total counter
   process_network_receive_bytes_total 1.172862e+06
   # HELP process_network_transmit_bytes_total Number of bytes sent by the process  over the network.
   # TYPE process_network_transmit_bytes_total counter
   process_network_transmit_bytes_total 632432
   # HELP process_open_fds Number of open file descriptors.
   # TYPE process_open_fds gauge
   process_open_fds 9
   # HELP process_resident_memory_bytes Resident memory size in bytes.
   # TYPE process_resident_memory_bytes gauge
   process_resident_memory_bytes 3.9350272e+07
   # HELP process_start_time_seconds Start time of the process since unix epoch in seconds.
   # TYPE process_start_time_seconds gauge
   process_start_time_seconds 1.74921402754e+09
   # HELP process_virtual_memory_bytes Virtual memory size in bytes.
   # TYPE process_virtual_memory_bytes gauge
   process_virtual_memory_bytes 1.901723648e+09
   # HELP process_virtual_memory_max_bytes Maximum amount of virtual memory   available in bytes.
   # TYPE process_virtual_memory_max_bytes gauge
   process_virtual_memory_max_bytes 1.8446744073709552e+19
   # HELP promhttp_metric_handler_requests_in_flight Current number of scrapes being served.
   # TYPE promhttp_metric_handler_requests_in_flight gauge
   promhttp_metric_handler_requests_in_flight 1
   # HELP promhttp_metric_handler_requests_total Total number of scrapes by HTTP status code.
   # TYPE promhttp_metric_handler_requests_total counter
   promhttp_metric_handler_requests_total{code="200"} 3
   promhttp_metric_handler_requests_total{code="500"} 0
   promhttp_metric_handler_requests_total{code="503"} 0
   # HELP pxc_binlog_collector_failure_total Total number of failed binlog     collection cycles
   # TYPE pxc_binlog_collector_failure_total counter
   pxc_binlog_collector_failure_total 0
   # HELP pxc_binlog_collector_gap_detected_total Total number of times the gap was detected in binlog
   # TYPE pxc_binlog_collector_gap_detected_total counter
   pxc_binlog_collector_gap_detected_total 0
   # HELP pxc_binlog_collector_last_processing_timestamp Timestamp of the last     successful binlog processing
   # TYPE pxc_binlog_collector_last_processing_timestamp gauge
   pxc_binlog_collector_last_processing_timestamp 1.7492150471803956e+09
   # HELP pxc_binlog_collector_last_upload_timestamp Timestamp of the last     successful binlog upload
   # TYPE pxc_binlog_collector_last_upload_timestamp gauge
   pxc_binlog_collector_last_upload_timestamp 1.749214031447092e+09
   # HELP pxc_binlog_collector_success_total Total number of successful binlog     collection cycles
   # TYPE pxc_binlog_collector_success_total counter
   pxc_binlog_collector_success_total 19
   # HELP pxc_binlog_collector_uploaded_total Total number of successfully     uploaded binlogs
   # TYPE pxc_binlog_collector_uploaded_total counter
   pxc_binlog_collector_uploaded_total 1
   ```

#### Access directly from a Pod

You can gather the metrics from inside a database cluster.

1. Connect to the cluster as follows, replacing the `<namespace>` placeholder with your value:

   ```
   kubectl run -n <namespace> -i --rm --tty percona-client --image=percona/percona-xtradb-cluster:8.4.8-8.1 --restart=Never -- bash -il
   ```

1. Connect to the point-in-time recovery port using `curl`:

   ```
   curl cluster1-pitr:8080/metrics
   ```

   Expected output

   ```
   # HELP go_gc_duration_seconds A summary of the wall-time pause (stop-the-world) duration in garbage collection cycles.
   # TYPE go_gc_duration_seconds summary
   go_gc_duration_seconds{quantile="0"} 0.000109735
   go_gc_duration_seconds{quantile="0.25"} 0.000147529
   go_gc_duration_seconds{quantile="0.5"} 0.000176199
   go_gc_duration_seconds{quantile="0.75"} 0.000196962
   go_gc_duration_seconds{quantile="1"} 0.000570426
   go_gc_duration_seconds_sum 0.002970858
   go_gc_duration_seconds_count 14
   # HELP go_gc_gogc_percent Heap size target percentage configured by the user, otherwise 100. This value is set by the GOGC environment variable, and the runtime/debug.SetGCPercent function. Sourced from /gc/gogc:percent.
   # TYPE go_gc_gogc_percent gauge
   go_gc_gogc_percent 100
   # HELP go_gc_gomemlimit_bytes Go runtime memory limit configured by the user, otherwise math.MaxInt64. This value is set by the GOMEMLIMIT environment variable, and the runtime/debug.SetMemoryLimit function. Sourced from /gc/gomemlimit:bytes.
   # TYPE go_gc_gomemlimit_bytes gauge
   go_gc_gomemlimit_bytes 9.223372036854776e+18
   # HELP go_goroutines Number of goroutines that currently exist.
   # TYPE go_goroutines gauge
   go_goroutines 31
   # HELP go_info Information about the Go environment.
   # TYPE go_info gauge
   go_info{version="go1.24.3"} 1
   # HELP go_memstats_alloc_bytes Number of bytes allocated in heap and currently in use. Equals to /memory/classes/heap/objects:bytes.
   # TYPE go_memstats_alloc_bytes gauge
   go_memstats_alloc_bytes 2.83268e+06
   # HELP go_memstats_alloc_bytes_total Total number of bytes allocated in heap until now, even if released already. Equals to /gc/heap/allocs:bytes.
   # TYPE go_memstats_alloc_bytes_total counter
   go_memstats_alloc_bytes_total 5.80031448e+08
   # HELP go_memstats_buck_hash_sys_bytes Number of bytes used by the profiling bucket hash table. Equals to /memory/classes/profiling/buckets:bytes.
   # TYPE go_memstats_buck_hash_sys_bytes gauge
   go_memstats_buck_hash_sys_bytes 5696
   # HELP go_memstats_frees_total Total number of heap objects frees. Equals to /gc/heap/frees:objects + /gc/heap/tiny/allocs:objects.
   # TYPE go_memstats_frees_total counter
   go_memstats_frees_total 112652
   # HELP go_memstats_gc_sys_bytes Number of bytes used for garbage collection system metadata. Equals to /memory/classes/metadata/other:bytes.
   # TYPE go_memstats_gc_sys_bytes gauge
   go_memstats_gc_sys_bytes 3.83684e+06
   # HELP go_memstats_heap_alloc_bytes Number of heap bytes allocated and currently in use, same as go_memstats_alloc_bytes. Equals to /memory/classes/heap/objects:bytes.
   # TYPE go_memstats_heap_alloc_bytes gauge
   go_memstats_heap_alloc_bytes 2.83268e+06
   # HELP go_memstats_heap_idle_bytes Number of heap bytes waiting to be used. Equals to /memory/classes/heap/released:bytes + /memory/classes/heap/free:bytes.
   # TYPE go_memstats_heap_idle_bytes gauge
   go_memstats_heap_idle_bytes 5.681152e+08
   # HELP go_memstats_heap_inuse_bytes Number of heap bytes that are in use.  Equals to /memory/classes/heap/objects:bytes + /memory/classes/heap/unused:bytes
   # TYPE go_memstats_heap_inuse_bytes gauge
   go_memstats_heap_inuse_bytes 5.423104e+06
   # HELP go_memstats_heap_objects Number of currently allocated objects. Equals to /gc/heap/objects:objects.
   # TYPE go_memstats_heap_objects gauge
   go_memstats_heap_objects 11876
   # HELP go_memstats_heap_released_bytes Number of heap bytes released to OS. Equals to /memory/classes/heap/released:bytes.
   # TYPE go_memstats_heap_released_bytes gauge
   go_memstats_heap_released_bytes 5.66616064e+08
   # HELP go_memstats_heap_sys_bytes Number of heap bytes obtained from system. Equals to /memory/classes/heap/objects:bytes + /memory/classes/heap/unused:bytes + /memory/classes/heap/released:bytes + /memory/classes/heap/free:bytes.
   # TYPE go_memstats_heap_sys_bytes gauge
   go_memstats_heap_sys_bytes 5.73538304e+08
   # HELP go_memstats_last_gc_time_seconds Number of seconds since 1970 of last garbage collection.
   # TYPE go_memstats_last_gc_time_seconds gauge
   go_memstats_last_gc_time_seconds 1.7492150571437228e+09
   # HELP go_memstats_mallocs_total Total number of heap objects allocated, both live and gc-ed. Semantically a counter version for go_memstats_heap_objects     gauge. Equals to /gc/heap/allocs:objects + /gc/heap/tiny/allocs:objects.
   # TYPE go_memstats_mallocs_total counter
   go_memstats_mallocs_total 124528
   # HELP go_memstats_mcache_inuse_bytes Number of bytes in use by mcache     structures. Equals to /memory/classes/metadata/mcache/inuse:bytes.
   # TYPE go_memstats_mcache_inuse_bytes gauge
   go_memstats_mcache_inuse_bytes 4832
   # HELP go_memstats_mcache_sys_bytes Number of bytes used for mcache structures obtained from system. Equals to /memory/classes/metadata/mcache/inuse:bytes + /memory/classes/metadata/mcache/free:bytes.
   # TYPE go_memstats_mcache_sys_bytes gauge
   go_memstats_mcache_sys_bytes 15704
   # HELP go_memstats_mspan_inuse_bytes Number of bytes in use by mspan     structures. Equals to /memory/classes/metadata/mspan/inuse:bytes.
   # TYPE go_memstats_mspan_inuse_bytes gauge
   go_memstats_mspan_inuse_bytes 125920
   # HELP go_memstats_mspan_sys_bytes Number of bytes used for mspan structures obtained from system. Equals to /memory/classes/metadata/mspan/inuse:bytes + /memory/classes/metadata/mspan/free:bytes.
   # TYPE go_memstats_mspan_sys_bytes gauge
   go_memstats_mspan_sys_bytes 146880
   # HELP go_memstats_next_gc_bytes Number of heap bytes when next garbage     collection will take place. Equals to /gc/heap/goal:bytes.
   # TYPE go_memstats_next_gc_bytes gauge
   go_memstats_next_gc_bytes 6.04629e+06
   # HELP go_memstats_other_sys_bytes Number of bytes used for other system  allocations. Equals to /memory/classes/other:bytes.
   # TYPE go_memstats_other_sys_bytes gauge
   go_memstats_other_sys_bytes 764832
   # HELP go_memstats_stack_inuse_bytes Number of bytes obtained from system for stack allocator in non-CGO environments. Equals to /memory/classes/heap/stacks:bytes.
   # TYPE go_memstats_stack_inuse_bytes gauge
   go_memstats_stack_inuse_bytes 1.081344e+06
   # HELP go_memstats_stack_sys_bytes Number of bytes obtained from system for stack allocator. Equals to /memory/classes/heap/stacks:bytes + /memory/classes/os-stacks:bytes.
   # TYPE go_memstats_stack_sys_bytes gauge
   go_memstats_stack_sys_bytes 1.081344e+06
   # HELP go_memstats_sys_bytes Number of bytes obtained from system. Equals to /memory/classes/total:byte.
   # TYPE go_memstats_sys_bytes gauge
   go_memstats_sys_bytes 5.793896e+08
   # HELP go_sched_gomaxprocs_threads The current runtime.GOMAXPROCS setting, or the number of operating system threads that can execute user-level Go code simultaneously. Sourced from /sched/gomaxprocs:threads.
   # TYPE go_sched_gomaxprocs_threads gauge
   go_sched_gomaxprocs_threads 4
   # HELP go_threads Number of OS threads created.
   # TYPE go_threads gauge
   go_threads 10
   # HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
   # TYPE process_cpu_seconds_total counter
   process_cpu_seconds_total 0.55
   # HELP process_max_fds Maximum number of open file descriptors.
   # TYPE process_max_fds gauge
   process_max_fds 1.048576e+06
   # HELP process_network_receive_bytes_total Number of bytes received by the     process over the network.
   # TYPE process_network_receive_bytes_total counter
   process_network_receive_bytes_total 1.172862e+06
   # HELP process_network_transmit_bytes_total Number of bytes sent by the process  over the network.
   # TYPE process_network_transmit_bytes_total counter
   process_network_transmit_bytes_total 632432
   # HELP process_open_fds Number of open file descriptors.
   # TYPE process_open_fds gauge
   process_open_fds 9
   # HELP process_resident_memory_bytes Resident memory size in bytes.
   # TYPE process_resident_memory_bytes gauge
   process_resident_memory_bytes 3.9350272e+07
   # HELP process_start_time_seconds Start time of the process since unix epoch in seconds.
   # TYPE process_start_time_seconds gauge
   process_start_time_seconds 1.74921402754e+09
   # HELP process_virtual_memory_bytes Virtual memory size in bytes.
   # TYPE process_virtual_memory_bytes gauge
   process_virtual_memory_bytes 1.901723648e+09
   # HELP process_virtual_memory_max_bytes Maximum amount of virtual memory   available in bytes.
   # TYPE process_virtual_memory_max_bytes gauge
   process_virtual_memory_max_bytes 1.8446744073709552e+19
   # HELP promhttp_metric_handler_requests_in_flight Current number of scrapes being served.
   # TYPE promhttp_metric_handler_requests_in_flight gauge
   promhttp_metric_handler_requests_in_flight 1
   # HELP promhttp_metric_handler_requests_total Total number of scrapes by HTTP status code.
   # TYPE promhttp_metric_handler_requests_total counter
   promhttp_metric_handler_requests_total{code="200"} 3
   promhttp_metric_handler_requests_total{code="500"} 0
   promhttp_metric_handler_requests_total{code="503"} 0
   # HELP pxc_binlog_collector_failure_total Total number of failed binlog     collection cycles
   # TYPE pxc_binlog_collector_failure_total counter
   pxc_binlog_collector_failure_total 0
   # HELP pxc_binlog_collector_gap_detected_total Total number of times the gap was detected in binlog
   # TYPE pxc_binlog_collector_gap_detected_total counter
   pxc_binlog_collector_gap_detected_total 0
   # HELP pxc_binlog_collector_last_processing_timestamp Timestamp of the last     successful binlog processing
   # TYPE pxc_binlog_collector_last_processing_timestamp gauge
   pxc_binlog_collector_last_processing_timestamp 1.7492150471803956e+09
   # HELP pxc_binlog_collector_last_upload_timestamp Timestamp of the last     successful binlog upload
   # TYPE pxc_binlog_collector_last_upload_timestamp gauge
   pxc_binlog_collector_last_upload_timestamp 1.749214031447092e+09
   # HELP pxc_binlog_collector_success_total Total number of successful binlog     collection cycles
   # TYPE pxc_binlog_collector_success_total counter
   pxc_binlog_collector_success_total 19
   # HELP pxc_binlog_collector_uploaded_total Total number of successfully     uploaded binlogs
   # TYPE pxc_binlog_collector_uploaded_total counter
   pxc_binlog_collector_uploaded_total 1
   ```

Note that the statistics data is not kept when the point-in-time recovery Pod restarts. This means that the counters like `pxc_binlog_collector_success_total` are reset.
