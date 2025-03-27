# *Percona Kubernetes Operator for Percona XtraDB Cluster* 1.5.0


* **Date**

    July 21, 2020



* **Installation**

    [Installing Percona Kubernetes Operator for Percona XtraDB Cluster](../System-Requirements.md#installation-guidelines)


## New Features


* [K8SPXC-298](https://jira.percona.com/browse/K8SPXC-298): Automatic synchronization of MySQL users with ProxySQL


* [K8SPXC-294](https://jira.percona.com/browse/K8SPXC-294): HAProxy Support


* [K8SPXC-284](https://jira.percona.com/browse/K8SPXC-284): Fully automated minor version updates (Smart Update)


* [K8SPXC-257](https://jira.percona.com/browse/K8SPXC-257): Update Reader members before Writer member at cluster upgrades


* [K8SPXC-256](https://jira.percona.com/browse/K8SPXC-256): Support multiple PXC minor versions by the Operator

## Improvements


* [K8SPXC-290](https://jira.percona.com/browse/K8SPXC-290): Extend usable backup schedule syntax to include lists of values


* [K8SPXC-309](https://jira.percona.com/browse/K8SPXC-309): Quickstart Guide on Google Kubernetes Engine (GKE) - [link](../gke.md)


* [K8SPXC-288](https://jira.percona.com/browse/K8SPXC-288): Quickstart Guide on Amazon Elastic Kubernetes Service (EKS) - [link](../eks.md)


* [K8SPXC-280](https://jira.percona.com/browse/K8SPXC-280): Support XtraBackup compression


* [K8SPXC-279](https://jira.percona.com/browse/K8SPXC-279): Use SYSTEM_USER privilege for system users on PXC 8.0


* [K8SPXC-277](https://jira.percona.com/browse/K8SPXC-277): Install GDB in PXC images


* [K8SPXC-276](https://jira.percona.com/browse/K8SPXC-276): Pod-0 should be selected as Writer if possible


* [K8SPXC-252](https://jira.percona.com/browse/K8SPXC-252): Automatically manage system users for MySQL and ProxySQL on password rotation via Secret


* [K8SPXC-242](https://jira.percona.com/browse/K8SPXC-242): Improve internal backup implementation for better stability with PXC 8.0


* [CLOUD-404](https://jira.percona.com/browse/CLOUD-404): Support of loadBalancerSourceRanges for LoadBalancer Services


* [CLOUD-556](https://jira.percona.com/browse/CLOUD-556): Kubernetes 1.17 added to the list of supported platforms

## Bugs Fixed


* [K8SPXC-327](https://jira.percona.com/browse/K8SPXC-327): CrashloopBackOff if PXC 8.0 Pod restarts in the middle of SST


* [K8SPXC-291](https://jira.percona.com/browse/K8SPXC-291): PXC Restore failure with “The node was low on resource: ephemeral-storage” error (Thanks to user rjeka for reporting this issue)


* [K8SPXC-270](https://jira.percona.com/browse/K8SPXC-270): Restore job wiping data from the original backup’s cluster when restoring to another cluster in the same namespace


* [K8SPXC-352](https://jira.percona.com/browse/K8SPXC-352): Backup cronjob not scheduled in some Kubernetes environments (Thanks to user msavchenko for reporting this issue)


* [K8SPXC-275](https://jira.percona.com/browse/K8SPXC-275): Outdated documentation on the Operator updates (Thanks to user martin.atroo for reporting this issue)


* [K8SPXC-347](https://jira.percona.com/browse/K8SPXC-347): XtraBackup failure after uploading a backup, causing the backup process restart in some cases (Thanks to user connde for reporting this issue)


* [K8SPXC-373](https://jira.percona.com/browse/K8SPXC-373): Pod not cleaning up the SST tmp dir on start


* [K8SPXC-326](https://jira.percona.com/browse/K8SPXC-326): Changes in TLS Secrets not triggering PXC restart if AllowUnsafeConfig enabled


* [K8SPXC-323](https://jira.percona.com/browse/K8SPXC-323): Missing `tar` utility in the PXC node docker image


* [CLOUD-531](https://jira.percona.com/browse/CLOUD-531): Wrong usage of `strings.TrimLeft` when processing apiVersion


* [CLOUD-474](https://jira.percona.com/browse/CLOUD-474): Cluster creation not failing if wrong resources are set
