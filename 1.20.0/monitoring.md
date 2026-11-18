> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Monitor database with Percona Monitoring and Management (PMM)

The Operator integrates natively with [Percona Monitoring and Management (PMM)](https://docs.percona.com/percona-monitoring-and-management/3/index.html) for comprehensive database monitoring. While [custom monitoring solutions](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/monitoring.html#implement-custom-monitoring-solution-without-pmm) solutions are also supported, they require manual setup and are not automated by the Operator.

The Operator is compatible with both PMM versions 2 and 3. We recommend using the latest PMM version 3 for optimal monitoring capabilities.

In this section, you’ll learn how to monitor Percona XtraDB Cluster using PMM.

PMM is a client/server application. It includes the [PMM Server](https://docs.percona.com/percona-monitoring-and-management/3/reference/index.html#pmm-server) and the number of [PMM Clients](https://docs.percona.com/percona-monitoring-and-management/3/reference/index.html#pmm-client) running on each node with the database you wish to monitor.

A PMM Client collects needed metrics and sends gathered data to the PMM Server. As a user, you connect to the PMM Server to see database metrics on a number of dashboards. PMM Server and PMM Client are installed separately.

## Considerations

1. If you are using PMM server version 2, use a PMM client image compatible with PMM 2. If you are using PMM server version 3, use a PMM client image compatible with PMM 3. Check [Percona certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html) for the right one.
1. If you specified both authentication methods for PMM server configuration and they have non-empty values, priority goes to PMM 3.
1. For migration from PMM2 to PMM3, see [PMM upgrade documentation](https://docs.percona.com/percona-monitoring-and-management/3/pmm-upgrade/migrating_from_pmm_2.html) . Also check the [Automatic migration of API keys](https://docs.percona.com/percona-monitoring-and-management/3/api/authentication.html#automatic-migration-of-api-keys) page.
1. Query Analytics (QAN) reads MySQL queries from Performance Schema, which the Operator configures on each cluster node. If your applications use server-side prepared statements (common with drivers such as JDBC), expect QAN to show query examples as placeholders (`?`) rather than literal values, and EXPLAIN to be unavailable for them. This is how upstream MySQL exposes prepared statements to Performance Schema — expected behavior, not a limitation of PMM or the Operator.

## Install PMM Server

You must have PMM server up and running. You can run PMM Server as a *Docker image*, a *virtual appliance*, or in Kubernetes. Please refer to the [official PMM documentation](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-server/index.html) for the installation instructions.

## Install PMM Client

PMM Client is installed as a side-car container in the database, HAProxy and ProxySQL Pods in your Kubernetes-based environment. To install PMM Client, do the following:

### Configure authentication

**PMM3**

PMM3 uses Grafana service accounts to control access to PMM server components and resources. To authenticate in PMM server, you need a service account token. [Generate a service account and token](https://docs.percona.com/percona-monitoring-and-management/3/api/authentication.html?h=authe#generate-a-service-account-and-token) . Specify the Admin role for the service account.

Warning

When you create a service account token, you can select its lifetime: it can be either a permanent token that never expires or the one with the expiration date. PMM server cannot rotate service account tokens after they expire. So you must take care of reconfiguring PMM Client in this case.

**PMM2**

\[Get the PMM API key from PMM Server\](https://docs.percona.com/percona-monitoring-and-management/2/details/api. html#api-keys-and-authentication) . The API key must have the role “Admin”. You need this key to authorize PMM Client within PMM Server.

**From PMM UI**

[Generate the PMM API key](https://docs.percona.com/percona-monitoring-and-management/2/details/api.html#api-keys-and-authentication)

**From command line**

You can query your PMM Server installation for the API Key using `curl` and `jq` utilities. Replace `<login>:<password>@<server_host>` placeholders with your real PMM Server login, password, and hostname in the following command:

```
API_KEY=$(curl --insecure -X POST -H "Content-Type: application/json" -d '{"name":"operator", "role": "Admin"}' "https://<login>:<password>@<server_host>/graph/api/auth/keys" | jq .key)
```

Warning

The API key is not rotated.

### Create a secret

Now you must pass the credentials to the Operator. To do so, create a Secret object.

Warning

PMM3 Client only works with PMM Server tokens. Make sure to use the `pmmservertoken` option for PMM3 Client. Otherwise you may face issues with the setup.

1. Create a Secret configuration file. You can use the [deploy/secrets.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/secrets.yaml) secrets file.

   **PMM 3**

   Specify the service account token as the `pmmservertoken` value in the secrets file:

   ```
   apiVersion: v1
   kind: Secret
   metadata:
     name: cluster1-secrets
   type: Opaque
   stringData:
     pmmservertoken: ""
   ```

   **PMM 2**

   Specify the API key as the `pmmserverkey` value in the secrets file:

   ```
   apiVersion: v1
   kind: Secret
   metadata:
     name: cluster1-secrets
   type: Opaque
   stringData:
     pmmserverkey: ""
   ```

1. Create the Secrets object using the `deploy/secrets.yaml` file. Replace the `<namespace>` placeholder with your value.

   ```
   kubectl apply -f deploy/secrets.yaml -n <namespace>
   ```

   Expected output

   ```
   secret/cluster1-secrets created
   ```

### Deploy a PMM Client

1. Update the `pmm` section in the [deploy/cr.yaml](https://raw.githubusercontent.com/percona/percona-xtradb-cluster-operator/v1.20.0/deploy/cr.yaml) file.

   - Set `pmm.enabled`=`true`.
   - Specify the PMM Client image path. Check [Percona certified images](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html) for the required one.
   - Specify your PMM Server hostname / an IP address for the `pmm.serverHost` option. The PMM Server IP address should be resolvable and reachable from within your cluster.

   ```
     pmm:
       enabled: true
       image: percona/pmm-client:2.44.1-1
       serverHost: monitoring-service
   ```

1. Update the cluster. Replace the `<namespace>` placeholder with your value.

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

1. Check that corresponding Pods are not in a cycle of stopping and restarting. This cycle occurs if there are errors on the previous steps:

   ```
   kubectl get pods -n <namespace>
   kubectl logs <pod_name> -c pmm-client
   ```

## Update the secrets file

The `deploy/secrets.yaml` file contains all values for each key/value pair in a convenient plain text format. But the resulting Secrets Object contains passwords stored as base64-encoded strings. If you want to *update* the password field, you need to encode the new password into the base64 format and pass it to the Secrets Object.

To encode a password or any other parameter, run the following command:

**Linux**

```
echo -n "password" | base64 --wrap=0
```

**macOS**

```
echo -n "password" | base64
```

For example, to set the new service account token in the `cluster1-secrets` object, use the following command replacing the placeholders in `<>` with your values:

**Linux**

```
kubectl patch secret/cluster1-secrets -p '{"data":{"pmmservertoken": '$(echo -n <new-token> | base64 --wrap=0)'}}'
```

**macOS**

```
kubectl patch secret/cluster1-secrets -p '{"data":{"pmmservertoken": '$(echo -n <new-token> | base64)'}}'
```

## Check the metrics

Let’s see how the collected data is visualized in PMM.

Now you can access PMM via *https* in a web browser, with the login/password authentication, and the browser is configured to show Percona XtraDB Cluster metrics.

## Specify additional PMM parameters

You can specify additional parameters for [pmm-admin add mysql](https://docs.percona.com/percona-monitoring-and-management/3/details/commands/pmm-admin.html#mysql) and [pmm-admin add proxysql](https://docs.percona.com/percona-monitoring-and-management/3/details/commands/pmm-admin.html#proxysql) commands, if needed. Use the `pmm.pxcParams` and `pmm.proxysqlParams` Custom Resource options for that.

The Operator automatically manages common Percona XtraDB Cluster Service Monitoring parameters mentioned in the official PMM documentation, such as username, password, service-name, host, etc. Assigning values to these parameters is not recommended and can negatively affect the functionality of the PMM setup carried out by the Operator.

## Update the secrets file

The `deploy/secrets.yaml` file contains all values for each key/value pair in a convenient plain text format. But the resulting Secrets Objects contains passwords stored as base64-encoded strings. If you want to *update* the password field, you need to encode the new password into the base64 format and pass it to the Secrets Object.

To encode a password or any other parameter, run the following command:

**on Linux**

```
echo -n "password" | base64 --wrap=0
```

**on macOS**

```
echo -n "password" | base64
```

For example, to set the new PMM API key to `new_key` in the `cluster1-secrets` object, do the following:

**in Linux**

```
kubectl patch secret/cluster1-secrets -p '{"data":{"pmmserverkey": "'$(echo -n new_key | base64 --wrap=0)'"}}'
```

**on macOS**

```
kubectl patch secret/cluster1-secrets -p '{"data":{"pmmserverkey": "'$(echo -n new_key | base64)'"}}'
```

## Check PMM Client health and status

A probe is a diagnostic mechanism in Kubernetes which helps determine whether a container is functioning correctly and whether it should continue to run, accept traffic, or be restarted.

PMM Client has the following probes:

- **Readiness probe** determines when a PMM Client is available and ready to accept traffic
- **Liveness probe** determines when to restart a PMM Client

To configure probes, use the `spec.pmm.readinessProbes` and `spec.pmm.livenessProbes` Custom Resource options.

## Add custom PMM prefix to the cluster name

When user has several clusters with the same namespace, cluster and Pod names, and a single PMM Server, it is possible to add only one of them to the PMM Server instance because of this names coincidence.

For such cases it is possible to specify a custom prefix to the cluster name, which will be visible within PMM, and so names will become unique.

You can do it by setting the `PMM_PREFIX` environment variable via the Secret, specified in the `pxc.envVarsSecret` Custom Resource option.

Here is an example of the YAML file used to create the Secret with the `my-unique-prefix-` prefix encoded in base64 format:

```
apiVersion: v1
kind: Secret
metadata:
  name: my-env-var-secrets
type: Opaque
data:
  PMM_PREFIX: bXktdW5pcXVlLXByZWZpeC0=
```

Follow the [instruction](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/containers-conf.html) on all details needed to create a Secret for environment variables and adding them to the Custom Resource.

## Implement custom monitoring solution without PMM

You can deploy your own monitoring solution instead of PMM, but since the Operator will know nothing about it, it will not gain the same level of deployment automation from the Operator side, and there will be no configuration via the Custom Resource. The approach to this is to deploy your monitoring agent as a sidecar container in Percona XtraDB Cluster Pods. See [sidecar containers documentation](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/sidecar.html) for details.

Note

You can use the [`monitor` system user](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/users.html#system-users) for monitoring purposes as PMM Client does. The Operator tracks the `monitor` user password update in the Secrets object (technical secrets used by the Operator, and restarts Percona XtraDB Cluster Pods in cases when PMM is enabled or when the sidecar container references the internal Secrets object `internal-<clustername>` (technical users secrets used by Operator, `internal-cluster1` by default) as follows:

```
pxc:
sidecars:
- name: metrics
  image: my_repo/my_custom_monitoring_solution:1.0
  env:
    - name: MYSQLD_EXPORTER_PASSWORD
      valueFrom:
        secretKeyRef:
          name: internal-cluster1
          key: monitor
  ...
```
