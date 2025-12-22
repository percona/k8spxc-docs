# Configure data at rest encryption without TLS

This guide walks you through deploying and configuring HashiCorp Vault to work with Percona Operator for MySQL based on Percona XtraDB Cluster to enable [data-at-rest encryption](encryption.md) using HTTP protocol.

## Assumptions

1. This guide is provided as a best effort and builds upon procedures described in the official Vault documentation. Since Vault's setup steps may change in future releases, this document may become outdated; we cannot guarantee ongoing accuracy or responsibility for such changes. For the most up-to-date and reliable information, please always refer to [the official Vault documentation](https://developer.hashicorp.com/vault/docs).
2. For this setup we deploy the Vault server in High Availability (HA) mode on Kubernetes via Helm without TLS. The HA setup uses Raft storage backend and consists of 3 replicas for redundancy. Using Helm is not mandatory. Any supported Vault deployment (on-premises, in the cloud, or a managed Vault service) works as long as the Operator can reach it.
3. This guide uses Vault Helm chart version 0.30.0. You may want to change it to the required version by setting the `VAULT_HELM_VERSION` variable.

## Prerequisites

Before you begin, ensure you have the following tools installed:

* `kubectl` - Kubernetes command-line interface
* `helm` - Helm package manager
* `jq` - JSON processor

## Prepare your environment

1. Export the namespace and other variables as environment variables to simplify further configuration:

    ```bash
    export NAMESPACE="vault"
    export VAULT_HELM_VERSION="0.30.0"
    export SERVICE="vault"
    export SECRET_NAME_VAULT="vault-secret"
    export POLICY_NAME="mysql-policy"
    export WORKDIR="/tmp/vault"
    ```

2. Create a working directory for configuration files:

    ```bash
    mkdir -p $WORKDIR
    ```

3. It is a good practice to isolate workloads in Kubernetes using namespaces. Create a namespace with the following command:

    ```bash
    kubectl create namespace vault
    ```

## Install Vault

For this setup, we install Vault in Kubernetes using the [Helm 3 package manager :octicons-link-external-16:](https://helm.sh/) in High Availability (HA) mode with Raft storage backend.

1. Add and update the Vault Helm repository:

    ```bash
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    ```

2. Install Vault in HA mode:

    ```bash
    helm upgrade --install ${SERVICE} hashicorp/vault \
      --disable-openapi-validation \
      --version ${VAULT_HELM_VERSION} \
      --namespace ${NAMESPACE} \
      --set "global.enabled=true" \
      --set "global.tlsDisable=true" \
      --set "global.platform=kubernetes" \
      --set "server.ha.enabled=true" \
      --set "server.ha.replicas=3" \
      --set "server.ha.raft.enabled=true" \
      --set "server.ha.raft.setNodeId=true" \
      --set-string "server.ha.raft.config=cluster_name = \"vault-integrated-storage\"
    ui = true
    listener \"tcp\" {
      address = \"[::]:8200\"
      cluster_address = \"[::]:8201\"
    }
    storage \"raft\" {
      path = \"/vault/data\"
    }
    disable_mlock = true
    service_registration \"kubernetes\" {}"
    ```

    This command does the following:

    * Installs HashiCorp Vault in High Availability (HA) mode without TLS in your Kubernetes cluster
    * Sets up Raft as the backend storage with three replicas for fault tolerance
    * Configures the Vault TCP listener for HTTP communication (port 8200)

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME: vault
        LAST DEPLOYED: Wed Aug 20 12:55:38 2025
        NAMESPACE: vault
        STATUS: deployed
        REVISION: 1
        NOTES:
        Thank you for installing HashiCorp Vault!

        Now that you have deployed Vault, you should look over the docs on using
        Vault with Kubernetes available here:

        https://developer.hashicorp.com/vault/docs
        ```

3. Wait for all Vault pods to be running:

    ```bash
    kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=${SERVICE} -n $NAMESPACE --timeout=300s
    ```

4. Retrieve the Pod names where Vault is running:

    ```bash
    kubectl -n $NAMESPACE get pod -l app.kubernetes.io/name=${SERVICE} -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        vault-0
        vault-1
        vault-2
        ```

## Initialize and unseal Vault

1. After Vault is installed, you need to initialize it. Run the following command to initialize the first pod:

    ```bash
    kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator init -key-shares=1 -key-threshold=1 -format=json > ${WORKDIR}/vault-init
    ```

    The command does the following:

    * Connects to the Vault Pod
    * Initializes Vault server
    * Creates 1 unseal key share which is required to unseal the server
    * Outputs the init response to a local file. The file includes unseal keys and a root token.

2. Vault is started in a sealed state. In this state Vault can access the storage but it cannot decrypt data. In order to use Vault, you need to unseal it.

    Retrieve the unseal key from the file:

    ```bash
    unsealKey=$(jq -r ".unseal_keys_b64[]" < ${WORKDIR}/vault-init)
    ```

    Now, unseal the first Vault pod:

    ```bash
    kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator unseal "$unsealKey"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Key             Value
        ---             -----
        Seal Type       shamir
        Initialized     true
        Sealed          false
        Total Shares    1
        Threshold      1
        Version         1.20.1
        Build Date      2025-07-24T13:33:51Z
        Storage Type    raft
        Cluster Name    vault-cluster-55062a37
        Cluster ID      37d0c2e4-8f47-14f7-ca49-905b66a1804d
        HA Enabled      true
        ```

3. Add the remaining Pods to the Vault cluster. Run the following for loop:

    ```bash
    for POD in vault-1 vault-2; do
      kubectl -n "$NAMESPACE" exec $POD -- sh -c '
        vault operator raft join http://vault-0.vault-internal:8200
      '
    done
    ```

    The command connects to each Vault Pod (`vault-1` and `vault-2`) and issues the `vault operator raft join` command, which:

    * Joins the Pods to the Vault Raft cluster, enabling HA mode
    * Connects to the cluster leader (`vault-0`) over HTTP
    * Ensures all nodes participate in the Raft consensus and share storage responsibilities

    ??? example "Sample output"

        ```{.text .no-copy}
        Key                     Value
        ---                     -----
        Joined Raft cluster     true
        Leader Address          http://vault-0.vault-internal:8200
        ```

4. Unseal the remaining Pods. Use this for loop:

    ```bash
    for POD in vault-1 vault-2; do
        kubectl -n "$NAMESPACE" exec $POD -- sh -c "
            vault operator unseal \"$unsealKey\"
        "
    done
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        Key                Value
        ---                -----
        Seal Type          shamir
        Initialized        true
        Sealed             false
        Total Shares       1
        Threshold          1
        Version            1.20.1
        Build Date         2025-07-24T13:33:51Z
        Storage Type       raft
        HA Enabled         true
        ```

## Configure Vault

At this step you need to configure Vault and enable secrets within it. To do so you must first authenticate in Vault.

When you started Vault, it generates and starts with a [root token :octicons-link-external-16:](https://developer.hashicorp.com/vault/docs/concepts/tokens) that provides full access to Vault. Use this token to authenticate.

Run the following commands on a leader node. The remaining ones will synchronize from the leader.

1. Extract the Vault root token from the file where you saved the init response output:

    ```bash
    cat ${WORKDIR}/vault-init | jq -r ".root_token"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        hvs.*************Jg9r
        ```

2. Connect to Vault Pod:

    ```bash
    kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh
    ```

3. Authenticate in Vault with this token:

    ```bash
    vault login hvs.*************Jg9r
    ```

4. Enable the secrets engine at the mount path. The following command enables KV secrets engine v2 at the `pxc-secret` mount-path:

    ```bash
    vault secrets enable --version=2 -path=pxc-secret kv
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Success! Enabled the kv secrets engine at: pxc-secret/
        ```

5. Optionally, enable audit logs for vault:

    ```bash
    vault audit enable file file_path=/vault/vault-audit.log
    ```

6. Exit the Vault Pod:

    ```bash
    exit
    ```

## Create a non-root token

Using the root token for authentication is not recommended, as it poses significant security risks. Instead, you should create a dedicated, non-root token for the Operator to use when accessing Vault. The permissions for this token are controlled by an access policy. Before you create a token you must first create the access policy.

1. Create a policy for accessing the kv engine path and define the required permissions in the `capabilities` parameter:

    ```bash
    kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "
      vault policy write $POLICY_NAME - <<EOF
    path \"pxc-secret/data/*\" {
      capabilities = [\"create\", \"read\", \"update\", \"delete\", \"list\"]
    }
    path \"pxc-secret/metadata/*\" {
      capabilities = [\"create\", \"read\", \"update\", \"delete\", \"list\"]
    }
    path \"pxc-secret/*\" {
      capabilities = [\"create\", \"read\", \"update\", \"delete\", \"list\"]
    }
    EOF
    "
    ```

2. Now create a token with a policy.

    ```bash
    kubectl -n "${NAMESPACE}" exec pod/vault-0 -- vault token create -policy="${POLICY_NAME}" -format=json > "${WORKDIR}/vault-token.json"
    ```

3. Export the non-root token as an environment variable:

    ```bash
    export NEW_TOKEN=$(jq -r '.auth.client_token' "${WORKDIR}/vault-token.json")
    ```

4. Verify the token:

    ```bash
    echo "New Vault Token: $NEW_TOKEN"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        hvs.CAESINO******************************************T2Y
        ```

## Create a Secret for Vault

To enable Vault for the Operator, create a Secret object for it. To do so, create a YAML configuration file and specify the following information:

* A token to access Vault
* A Vault server URL
* The secrets mount path

Depending on Percona XtraDB Cluster version, you must specify the Vault configuration as follows:

* For Percona XtraDB Cluster 8.0 and 5.7 - as key=value pairs
* For Percona XtraDB Cluster 8.4 - as a JSON object

You can modify the example configuration file:

=== "Percona XtraDB Cluster 8.0"

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: keyring-secret-vault
    type: Opaque
    stringData:
      keyring_vault.conf: |-
        token = hvs.CAESINO******************************************T2Y
        vault_url = http://vault.vault.svc.cluster.local:8200
        secret_mount_point = pxc-secret
    ```

=== "Percona XtraDB Cluster 8.4"

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: keyring-secret-vault-84
    type: Opaque
    stringData:
      keyring_vault.conf: |-
        {
          "token": "hvs.CAESINO******************************************T2Y",
          "vault_url": "http://vault.vault.svc.cluster.local:8200",
          "secret_mount_point": "pxc-secret"
        }
    ```

Now create a Secret object. Replace the `<cluster-namespace>` placeholder with the namespace where your database cluster is deployed:

```bash
kubectl apply -f deploy/vault-secret.yaml -n <cluster-namespace>
```

## Reference the Secret in your Custom Resource manifest

Now, reference the Vault Secret in the Operator Custom Resource manifest. Note that the Secret name is the one you specified in the `metadata.name` field when you created a Secret.

1. Export the namespace where the cluster is deployed and the secret name as environment variables:

    ```bash
    export CLUSTER_NAMESPACE=<cluster-namespace>
    export SECRET_NAME_PXC="keyring-secret-vault-84"
    ```

2. Update the cluster configuration. Since this is a running cluster, we will apply a patch referencing your Secret.

    Make sure to specify the correct Secret name. The default Secret name for MySQL 8.0 and 5.7 is `keyring-secret-vault`. In this setup we use `keyring-secret-vault-84` Secret name for MySQL 8.4. Use the following command as an example and specify the Secret name for the MySQL version you're using:

    ```bash
    kubectl patch pxc cluster1 \
      --namespace $CLUSTER_NAMESPACE \
      --type=merge \
      --patch "{\"spec\":{\"vaultSecretName\":\"${SECRET_NAME_PXC}\"}}"
    ```

This triggers cluster Pods to restart.

## Use data-at-rest encryption

To use encryption, you can:

* turn it on for every table you create with the `ENCRYPTION='Y'` clause in your SQL statement. For example:

   ```sql
   CREATE TABLE t1 (c1 INT, PRIMARY KEY pk(c1)) ENCRYPTION='Y';
   CREATE TABLESPACE foo ADD DATAFILE 'foo.ibd' ENCRYPTION='Y';
   ```
   
   Existing tables will not be encrypted unless you specifically enable it via the `ALTER TABLE .... ENCRYPTION='Y';` statement.

* turn on default encryption of a schema or a general tablespace. Then all tables you create will have encryption enabled. To turn on default encryption, use the following SQL statement:

   ```sql
   SET default_table_encryption=ON;
   ```

See the following chapters of Percona Server for MySQL documentation in how to use encryption:

* [Encrypt File-Per-Table Tablespace](https://docs.percona.com/percona-server/latest/encrypt-file-per-table-tablespace.html)
* [Encrypt schema or general tablespace](https://docs.percona.com/percona-server/latest/encrypt-tablespaces.html)
* [Encrypt system tablespace](https://docs.percona.com/percona-server/latest/encrypt-system-tablespace.html)
* [Encrypt doublewrite file pages](https://docs.percona.com/percona-server/latest/encrypt-doublewrite-file-pages.html)
* [Encrypt temporary files](https://docs.percona.com/percona-server/latest/encrypt-temporary-files.html)

## Verify encryption

Refer to the [Percona Server for MySQL documentation :octicons-link-external-16:](https://docs.percona.com/percona-server/latest/verify-encryption.html) for guidelines how to verify encryption in your database.


