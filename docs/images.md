# Percona certified images

Find Percona's certified Docker images that you can use with the
Percona Operator for MySQL based on Percona XtraDB Cluster in the following table.

**Images released with the Operator version {{ release }}:** 

--8<-- "Kubernetes-Operator-for-PXC-RN{{release}}.md:images"


## Image tag format

Image tags have the format:

   `operator_version-[pxc_version]-[component_name]-[component_version]`

Image tags start with the Operator's version and include a number of
optional fields: 

* the Percona XtraDB Cluster version (`pxc8.0.36`), 
* the component name in the image (`haproxy`, `backup`, etc.), and
* the version of this component (`pxb8.0.35`). 

An example looks as follows: `1.16.0-pxc8.0-backup-pxb8.0.35`

Percona XtraDB Cluster versions may have different
detalization ("pxc" prefix with major and minor numbers, like "pxc8.0", or
with minor, major, and patch numbers, like "pxc8.0.36", or the full XtraDB
Cluster version without prefix: major, minor, and patch numbers followed by
a dash and the version of Percona Server this XtraDB Cluster version is based
on, like "8.0.36-28.1").

Note, that PMM Client images have their own tags. They contain the version
of PMM.

[Find images for previous versions :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/){.md-button}
