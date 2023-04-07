# Monitoring

Percona Monitoring and Management (PMM) [provides an excellent
solution](https://www.percona.com/doc/percona-xtradb-cluster/LATEST/manual/monitoring.html#using-pmm)
to monitor Percona XtraDB Cluster.

!!! note

    Only PMM 2.x versions are supported by the Operator.

PMM is a client/server application. *PMM Client* runs on each node with the
database you wish to monitor: it collects needed metrics and sends gathered data
to *PMM Server*. As a user, you connect to PMM Server to see database metrics on
a number of dashboards.

That’s why PMM Server and PMM Client need to be installed separately.

## Installing the PMM Server

PMM Server runs as a *Docker image*, a *virtual appliance*, or on an *AWS instance*.
Please refer to the [official PMM documentation](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/server/index.html)
for the installation instructions.

## Installing the PMM Client

The following steps are needed for the PMM client installation in your
Kubernetes-based environment:

1. The PMM client installation is initiated by updating the `pmm` section in the
    [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
    file.

    * set `pmm.enabled=true`

    * set the `pmm.serverHost` key to your PMM Server hostname,

    * authorize PMM Client within PMM Server in one of two ways:

        === "with token-based authorization (recommended)"
            <a name="operator-monitoring-client-token"></a>
            [Acquire the API Key from your PMM Server](https://docs.percona.com/percona-monitoring-and-management/details/api.html#api-keys-and-authentication)
            and set `pmmserverkey` in the
            [deploy/secrets.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/secrets.yaml)
            secrets file to this obtained API Key value.

        === "with password-based authorization"
            Check that  the `serverUser` key in the
            [deploy/cr.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/cr.yaml)
            file contains your PMM Server user name (`admin` by default), and
            make sure the `pmmserver` key in the
            [deploy/secrets.yaml](https://github.com/percona/percona-xtradb-cluster-operator/blob/main/deploy/secrets.yaml)
            secrets file contains the password specified for the PMM Server during
            its installation.

    *Password-based authorization method is deprecated since the Operator 1.11.0.*

    !!! note

        You use `deploy/secrets.yaml` file to *create* Secrets Object.
        The file contains all values for each key/value pair in a convenient
        plain text format. But the resulting Secrets contain passwords stored
        as base64-encoded strings. If you want to *update* password field,
        you’ll need to encode the value into base64 format. To do this, you can
        run `echo -n "password" | base64 --wrap=0` (or just
        `echo -n "password" | base64` in case of Apple macOS) in your local
        shell to get valid values. For example, setting the PMM Server API Key
        to `new_key` in the `cluster1-secrets` object can be done with
        the following command:

        === "in Linux"

            ``` {.bash data-prompt="$" }
            $ kubectl patch secret/cluster1-secrets -p '{"data":{"pmmserverkey": "'$(echo -n new_key | base64 --wrap=0)'"}}'
            ```

        === "in macOS"

            ``` {.bash data-prompt="$" }
            $ kubectl patch secret/cluster1-secrets -p '{"data":{"pmmserverkey": "'$(echo -n new_key | base64)'"}}'
            ```

    * you can also use `pmm.pxcParams` and `pmm.proxysqlParams` keys to
        specify additional parameters for [pmm-admin add mysql](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mysql.html#adding-mysql-service-monitoring) and
        [pmm-admin add mysql](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/proxysql.html)
        commands respectively, if needed.

    !!! note

        Please take into account that Operator automatically manages
        common Percona XtraDB Cluster Service Monitoring parameters mentioned
        in the officiall PMM documentation, such like username, password,
        service-name, host, etc. Assigning values to these parameters is not
        recommended and can negatively affect the functionality of the PMM
        setup carried out by the Operator.

    Apply changes with the `kubectl apply -f deploy/secrets.yaml` command.

    When done, apply the edited `deploy/cr.yaml` file:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml
    ```

2. Check that corresponding Pods are not in a cycle of stopping and restarting.
    This cycle occurs if there are errors on the previous steps. For example,
    you can use the following commands for the cluster named `cluster1`:

    ``` {.bash data-prompt="$" }
    $ kubectl get pods
    $ kubectl logs cluster1-pxc-0 -c pmm-client
    ```

3. Now you can access PMM via *https* in a web browser, with the
    login/password authentication, and the browser is configured to show
    Percona XtraDB Cluster metrics.
