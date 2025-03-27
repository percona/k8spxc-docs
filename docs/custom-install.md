# Install Percona XtraDB Cluster with customized parameters

You can customize the configuration of Percona XtraDB Cluster and install it with customized parameters.

To check available configuration options, see [`deploy/cr.yaml` :octicons-link-external-16:](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v{{ release }}/deploy/cr.yaml) and [Custom Resource Options](operator.md).

=== "`kubectl`"

    To customize the configuration, do the following:

    1. Clone the repository with all manifests and source code by executing the following command:

        ```{.bash data-prompt="$" }
        $ git clone -b v{{ release }} https://github.com/percona/percona-xtradb-cluster-operator
        ```

    2. Edit the required options and apply the modified `deploy/cr.yaml` file as follows:

        ```{.bash data-prompt="$" }
        $ kubectl apply -f deploy/cr.yaml
        ```


=== "Helm"

    To install Percona XtraDB Cluster with custom parameters, use the following command:
    
    ```{.bash data-prompt="$" }
    $ helm install --set key=value
    ```

    You can pass any of the Operator’s [Custom Resource options :octicons-link-external-16:](https://github.com/percona/percona-helm-charts/tree/main/charts/pxc-db#installing-the-chart) as a
    `--set key=value[,key=value]` argument.

    The following example deploys a Percona XtraDB Cluster in the
    `pxc` namespace, with disabled backups and 20 Gi storage:

    === "Command line"

        ``` {.bash data-prompt="$" }
        $ helm install my-db percona/pxc-db --version {{ release }} --namespace pxc \
          --set pxc.volumeSpec.resources.requests.storage=20Gi \
          --set backup.enabled=false
        ``` 

    === "YAML file"

        You can specify customized options in a YAML file instead of using separate command line parameters. The resulting
        file similar to the following example looks as follows:        

        ``` yaml title="values.yaml"
        allowUnsafeConfigurations: true
        sharding:
          enabled: false
        pxc:
          size: 3
          volumeSpec:
            pvc:
              resources:
                requests:
                  storage: 2Gi
        backup:
          enabled: false
        ```        

        Apply the resulting YAML file as follows:        

        ``` {.bash data-prompt="$" }
        $ helm install my-db percona/pxc-db --namespace pxc -f values.yaml
        ```


 
