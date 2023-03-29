## Avoid the restart-on-fail loop for Percona XtraDB Cluster containers

The restart-on-fail loop takes place when the container entry point fails
(e.g. `mysqld` crashes). In such a situation, Pod is continuously restarting.
Continuous restarts prevent to get console access to the container, and so a
special approach is needed to make fixes.

You can prevent such infinite boot loop by putting the Percona XtraDB Cluster
containers into the infinity loop *without* starting mysqld. This behavior
of the container entry point is triggered by the presence of the
`/var/lib/mysql/sleep-forever` file.

For example, you can do it for the `pxc` container of an appropriate Percona
XtraDB Cluster instance as follows:

``` {.bash data-prompt="$" }
$ kubectl exec -it cluster1-pxc-0 -c pxc -- sh -c 'touch /var/lib/mysql/sleep-forever'
```

If `pxc` container can’t start, you can use `logs` container instead:

``` {.bash data-prompt="$" }
$ kubectl exec -it cluster1-pxc-0 -c logs -- sh -c 'touch /var/lib/mysql/sleep-forever'
```

The instance will restart automatically and run in its usual way as soon as you
remove this file (you can do it with a command similar to the one you have used
to create the file, just substitute `touch` to `rm` in it).

