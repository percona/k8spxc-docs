# Configure data at rest encryption with TLS

This guide walks you through deploying and configuring HashiCorp Vault with TLS enabled to work with Percona Operator for MySQL based on Percona XtraDB Cluster to enable [data-at-rest encryption](encryption.md) using HTTPS protocol.

By default, Percona XtraDB Cluster (PXC) and Vault communicate over an unencrypted HTTP protocol. You can enable encrypted HTTPS protocol with TLS as an additional security layer to protect the data transmitted between Vault and your PXC nodes. HTTPS ensures that sensitive information, such as encryption keys and secrets, cannot be intercepted or tampered with on the network.

## Prerequisites

Before you begin, ensure you have the following tools installed:

* `kubectl` - Kubernetes command-line interface
* `helm` - Helm package manager
* `openssl` - OpenSSL toolkit for generating certificates
* `jq` - JSON processor

## Create a working directory

Create a directory where for certificate files:

```bash
mkdir -p /tmp/vault
```

## Create the namespace

It is a good practice to isolate workloads in Kubernetes using namespaces. Create a namespace with the following command:

```bash
kubectl create namespace vault
```

Export the namespace and other variables as environment variables to simplify further configuration:

```bash
export NAMESPACE="vault"
export SERVICE="vault"
export K8S_CLUSTER_NAME="cluster.local"
export WORKDIR=/tmp/vault
```


## Generate certificates

To use TLS, you'll need the following certificates:

* A private key for the Vault server
* A certificate for the Vault server signed by the Kubernetes CA
* The Kubernetes CA certificate

These files store sensitive information. Make sure to keep them in a secure location.

### Generate the private key

Generate a private key for the Vault server:

```bash
openssl genrsa -out ${WORKDIR}/vault.key 2048
```

### Create the Certificate Signing Request (CSR)

1. Create the CSR configuration file:

    ```bash
    cat > ${WORKDIR}/vault-csr.conf <<EOF
    [req]
    default_bits = 2048
    prompt = no
    encrypt_key = yes
    default_md = sha256
    distinguished_name = kubelet_serving
    req_extensions = v3_req
    [ kubelet_serving ]
    O = system:nodes
    CN = system:node:*.${NAMESPACE}.svc.${K8S_CLUSTER_NAME}
    [ v3_req ]
    basicConstraints = CA:FALSE
    keyUsage = nonRepudiation, digitalSignature, keyEncipherment, dataEncipherment
    extendedKeyUsage = serverAuth, clientAuth
    subjectAltName = @alt_names
    [alt_names]
    DNS.1 = ${SERVICE}
    DNS.2 = ${SERVICE}.${NAMESPACE}
    DNS.3 = ${SERVICE}.${NAMESPACE}.svc
    DNS.4 = ${SERVICE}.${NAMESPACE}.svc.${K8S_CLUSTER_NAME}
    IP.1 = 127.0.0.1
    EOF
    ```

2. Generate the CSR:

    ```bash
    openssl req -new -key ${WORKDIR}/vault.key -out ${WORKDIR}/vault.csr -config ${WORKDIR}/vault-csr.conf
    ```

### Issue the certificate

1. Create the CSR YAML file to send it to Kubernetes:

    ```bash
    cat > ${WORKDIR}/csr.yaml <<EOF
    apiVersion: certificates.k8s.io/v1
    kind: CertificateSigningRequest
    metadata:
       name: vault.svc
    spec:
       signerName: kubernetes.io/kubelet-serving
       expirationSeconds: 8640000
       request: $(cat ${WORKDIR}/vault.csr|base64|tr -d '\n')
       usages:
       - digital signature
       - key encipherment
       - server auth
    EOF
    ```

2. Send the CSR to Kubernetes:

    ```bash
    kubectl create -f ${WORKDIR}/csr.yaml
    ```

3. Approve the CSR in Kubernetes:

    ```bash
    kubectl certificate approve vault.svc
    ```

4. Confirm the certificate was issued:

    ```bash
    kubectl get csr vault.svc
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME        AGE   SIGNERNAME                      REQUESTOR       REQUESTEDDURATION   CONDITION
        vault.svc   16s   kubernetes.io/kubelet-serving   minikube-user   100d                Approved,Issued
        ```

### Retrieve the certificates

1. Retrieve the certificate:

    ```bash
    kubectl get csr vault.svc -o jsonpath='{.status.certificate}' | openssl base64 -d -A -out ${WORKDIR}/vault.crt
    ```

2. Retrieve Kubernetes CA certificate:

    ```bash
    kubectl config view \
      --raw \
      --minify \
      --flatten \
      -o jsonpath='{.clusters[].cluster.certificate-authority-data}' \
      | base64 -d > ${WORKDIR}/vault.ca
    ```

### Store certificates in Kubernetes secrets

Create a TLS secret in Kubernetes to store the certificates and key:

```bash
kubectl create secret generic vault-secret \
   -n $NAMESPACE \
   --from-file=vault.key=${WORKDIR}/vault.key \
   --from-file=vault.crt=${WORKDIR}/vault.crt \
   --from-file=vault.ca=${WORKDIR}/vault.ca
```

## Install Vault with TLS

For this setup, we install Vault in Kubernetes using the [Helm 3 package manager :octicons-link-external-16:](https://helm.sh/) with TLS enabled.

1. Add and update the Vault Helm repository:

    ```bash
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    ```

2. Create the Helm overrides file to configure Vault with TLS:

    ```bash
    cat > ${WORKDIR}/overrides.yaml <<EOF
    global:
       enabled: true
       tlsDisable: false
    injector:
       enabled: true
    server:
       extraEnvironmentVars:
          VAULT_CACERT: /vault/userconfig/vault-secret/vault.ca
          VAULT_TLSCERT: /vault/userconfig/vault-secret/vault.crt
          VAULT_TLSKEY: /vault/userconfig/vault-secret/vault.key
       volumes:
          - name: userconfig-vault-secret
            secret:
             defaultMode: 420
             secretName: vault-secret
       volumeMounts:
          - mountPath: /vault/userconfig/vault-secret
            name: userconfig-vault-secret
            readOnly: true
       standalone:
          enabled: true
          config: |
             ui = true
             listener "tcp" {
                tls_disable = 0
                address = "[::]:8200"
                tls_cert_file = "/vault/userconfig/vault-secret/vault.crt"
                tls_key_file  = "/vault/userconfig/vault-secret/vault.key"
                tls_client_ca_file = "/vault/userconfig/vault-secret/vault.ca"
             }
             storage "file" {
                path = "/vault/data"
             }
             disable_mlock = true
    EOF
    ```

3. Install Vault with TLS enabled:

    ```bash
    helm upgrade --install vault hashicorp/vault --namespace $NAMESPACE -f ${WORKDIR}/overrides.yaml
    ```

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

4. Retrieve the Pod name where Vault is running:

    ```bash
    kubectl -n $NAMESPACE get pod -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}'
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        vault-0
        ```

## Initialize and unseal Vault

1. After Vault is installed, you need to initialize it. Run the following command:

    ```bash
    kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator init -tls-skip-verify -key-shares=1 -key-threshold=1 -format=json > ${WORKDIR}/vault-init
    ```

    The command does the following:

    * Connects to the Vault Pod
    * Initializes Vault server with TLS enabled
    * Creates 1 unseal key share which is required to unseal the server
    * Outputs the init response in JSON format to a local file. It includes unseal keys and root token.

2. Vault is started in a sealed state. In this state Vault can access the storage but it cannot decrypt data. In order to use Vault, you need to unseal it.

    Retrieve the unseal key from the file:

    ```bash
    unsealKey=$(jq -r ".unseal_keys_b64[]" < ${WORKDIR}/vault-init)
    ```

    Now, unseal Vault. Run the following command:

    ```bash
    kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator unseal -tls-skip-verify "$unsealKey"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Key             Value
        ---             -----
        Seal Type       shamir
        Initialized     true
        Sealed          false
        Total Shares    1
        Threshold       1
        Version         1.20.1
        Build Date      2025-07-24T13:33:51Z
        Storage Type    file
        Cluster Name    vault-cluster-55062a37
        Cluster ID      37d0c2e4-8f47-14f7-ca49-905b66a1804d
        HA Enabled      false
        ```

## Configure Vault

At this step you need to configure Vault and enable secrets within it. To do so you must first authenticate in Vault.

When you started Vault, it generates and starts with a [root token :octicons-link-external-16:](https://developer.hashicorp.com/vault/docs/concepts/tokens) that provides full access to Vault. Use this token to authenticate.

!!! note

    For the purposes of this tutorial we use the root token in further sections. For security considerations, the use of root token is not recommended. Refer to the [Create token :octicons-link-external-16:](https://developer.hashicorp.com/vault/docs/commands/token/create) in Vault documentation how to create user tokens.

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

4. Enable the secrets engine at the mount path. The following command enables KV secrets engine v2 at the `secret` mount-path:

    ```bash
    vault secrets enable --version=2 -path=secret kv
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Success! Enabled the kv secrets engine at: secret/
        ```

5. Exit the Vault Pod:

    ```bash
    exit
    ```

## Create a Secret for Vault

To enable Vault for the Operator, create a Secret object for it. To do so, create a YAML configuration file and specify the following information:

* A token to access Vault
* A Vault server URL (using HTTPS)
* The secrets mount path
* Path to TLS certificates
* Contents of the `ca.cert` certificate file

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
      keyring_vault.cnf: |-
        token = hvs.********************Jg9r
        vault_url = https://vault.vault.svc.cluster.local:8200
        secret_mount_point = secret
        vault_ca = /etc/mysql/vault-keyring-secret/ca.cert
      ca.cert: |-
        -----BEGIN CERTIFICATE-----
        MIIEczCCA1ugAwIBAgIBADANBgkqhkiG9w0BAQQFAD..AkGA1UEBhMCR0Ix
        EzARBgNVBAgTClNvbWUtU3RhdGUxFDASBgNVBAoTC0..0EgTHRkMTcwNQYD
        7vQMfXdGsRrXNGRGnX+vWDZ3/zWI0joDtCkNnqEpVn..HoX
        -----END CERTIFICATE-----
    ```

    Replace the certificate content with the actual CA certificate from `${WORKDIR}/vault.ca`.

=== "Percona XtraDB Cluster 8.4"

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: keyring-secret-vault-84
    type: Opaque
    stringData:
      keyring_vault.cnf: |-
        {
          "token": "hvs.********************Jg9r",
          "vault_url": "https://vault.vault.svc.cluster.local:8200",
          "secret_mount_point": "secret",
          "vault_ca": "/etc/mysql/vault-keyring-secret/ca.cert"
        }
      ca.cert: |-
        -----BEGIN CERTIFICATE-----
        MIIEczCCA1ugAwIBAgIBADANBgkqhkiG9w0BAQQFAD..AkGA1UEBhMCR0Ix
        EzARBgNVBAgTClNvbWUtU3RhdGUxFDASBgNVBAoTC0..0EgTHRkMTcwNQYD
        7vQMfXdGsRrXNGRGnX+vWDZ3/zWI0joDtCkNnqEpVn..HoX
        -----END CERTIFICATE-----
    ```

    Replace the certificate content with the actual CA certificate from `${WORKDIR}/vault.ca`.

!!! note

    You must either specify the certificate value or don't declare it at all. Having a commented `#ca.cert` field in the Secret configuration file is not allowed.

Now create a Secret object. Replace the `<cluster-namespace>` placeholder with the namespace where your database cluster is deployed:

```bash
kubectl apply -f deploy/vault-secret.yaml -n <cluster-namespace>
```

## Reference the Secret in your Custom Resource manifest

Now, reference the Vault Secret in the Operator Custom Resource manifest. Note that the Secret name is the one you specified in the `metadata.name` field when you created a Secret.

1. Export the namespace where the cluster is deployed as an environment variable:

    ```bash
    export CLUSTER_NAMESPACE=<cluster-namespace>
    ```

2. Update the cluster configuration. Since this is a running cluster, we will apply a patch referencing your Secret.

    Make sure to specify the correct Secret name. The default Secret name for MySQL 8.0 and 5.7 is `keyring-secret-vault`. In this setup we use `keyring-secret-vault-84` Secret name for MySQL 8.4. Use the following command as an example and specify the Secret name for the MySQL version you're using:

    ```bash
    kubectl patch pxc cluster1 \
      --namespace $CLUSTER_NAMESPACE \
      --type=merge \
      --patch '{"spec":{"vaultSecretName":"keyring-secret-vault"}}'
    ```

## Use data-at-rest encryption

To use encryption, you can:

* turn it on for every table you create with the `ENCRYPTION='Y'` clause in your SQL statement. For example:

   ```sql
   CREATE TABLE t1 (c1 INT, PRIMARY KEY pk(c1)) ENCRYPTION='Y';
   CREATE TABLESPACE foo ADD DATAFILE 'foo.ibd' ENCRYPTION='Y';
   ```

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

Refer to the [Percona Server for MySQL documentation :octicons-link-external-16:](https://docs.percona.com/percona-server/latest/verifying-encryption.html) for guidelines how to verify encryption in your database.

## Clean up

After you finish working with Vault, you can clean up the temporary files:

```bash
rm -rf $WORKDIR
```
