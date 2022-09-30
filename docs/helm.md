# Install Percona XtraDB Cluster using Helm

[Helm](https://github.com/helm/helm) is the package manager for Kubernetes. Percona Helm charts can be found in [percona/percona-helm-charts](https://github.com/percona/percona-helm-charts) repository on Github.

## Pre-requisites

Install Helm following its [official installation instructions](https://docs.helm.sh/using_helm/#installing-helm).

!!! note

    Helm v3 is needed to run the following steps.

## Installation

1. Add the Percona’s Helm charts repository and make your Helm client up to
    date with it:

    ```bash
    $ helm repo add percona https://percona.github.io/percona-helm-charts/
    $ helm repo update
    ```

2. Install the Percona Operator for MySQL based on Percona XtraDB Cluster:

    ```bash
    $ helm install my-op percona/pxc-operator --version {{ release }}
    ```

    The `my-op` parameter in the above example is the name of [a new release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts)
    which is created for the Operator when you install its Helm chart (use any
    name you like).

    !!! note

        If nothing explicitly specified, `helm install` command will work
        with `default` namespace. To use different namespace, provide it with
        the following additional parameter: `--namespace my-namespace`.

3. Install Percona XtraDB Cluster:

    ```bash
    $ helm install my-db percona/pxc-db --version {{ release }}
    ```

    The `my-db` parameter in the above example is the name of [a new release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts)
    which is created for the Percona XtraDB Cluster when you install its Helm
    chart (use any name you like).

## Installing Percona XtraDB Cluster with customized parameters

The command above installs Percona XtraDB Cluster with [default parameters](operator.md#operator-custom-resource-options).
Custom options can be passed to a `helm install` command as a
`--set key=value[,key=value]` argument. The options passed with a chart can be
any of the Operator’s [Custom Resource options](https://github.com/percona/percona-helm-charts/tree/main/charts/pxc-db#installing-the-chart).

The following example will deploy a Percona XtraDB Cluster Cluster in the
`pxc` namespace, with disabled backups and 20 Gi storage:

```bash
$ helm install my-db percona/pxc-db --version {{ release }} \
  --set pxc.volumeSpec.resources.requests.storage=20Gi \
  --set backup.enabled=false
```
