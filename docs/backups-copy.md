# Copy backup to a local machine

Make a local copy of a previously saved backup requires not more than
the backup name. This name can be taken from the list of available
backups returned by the following command:

``` {.bash data-prompt="$" }
$ kubectl get pxc-backup
```

When the name is known, backup can be downloaded to the local machine as
follows:

``` {.bash data-prompt="$" }
$ ./deploy/backup/copy-backup.sh <backup-name> path/to/dir
```

For example, this downloaded backup can be restored to the local
installation of Percona Server:

``` {.bash data-prompt="$" }
$ service mysqld stop
$ rm -rf /var/lib/mysql/*
$ cat xtrabackup.stream | xbstream -x -C /var/lib/mysql
$ xtrabackup --prepare --target-dir=/var/lib/mysql
$ chown -R mysql:mysql /var/lib/mysql
$ service mysqld start
```
