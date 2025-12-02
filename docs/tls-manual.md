
# Generate certificates manually

You can generate TLS certificates manually instead of using the Operator's automatic certificate generation. This approach gives you full control over certificate properties and is useful for production environments with specific security requirements.

## What you'll create

When you follow the steps from this guide, you'll generate these certificate files:

* `server.pem` - Server certificate for Percona XtraDB Cluster nodes
* `server-key.pem` - Private key for the server certificate  
* `client.pem` - Client certificate for external connections
* `client-key.pem` - Private key for the client certificate
* `ca.pem` - Certificate Authority certificate
* `ca-key.pem` - Certificate Authority private key

## Certificate requirements

You need to create **two sets** of certificates:

1. **External certificates** - for client connections from outside the cluster.
2. **Internal certificates** - for internal communication between Percona XtraDB Cluster nodes. 

After creating the certificates, you'll create two Kubernetes Secrets and reference them in your cluster configuration.

## Prerequisites

Before you start, make sure you have:

* `cfssl` and `cfssljson` tools installed on your system
* Your cluster name and namespace ready
* Access to your Kubernetes cluster

## Procedure

### Generate certificates

Replace `cluster1` and `my-namespace` with your actual cluster name and namespace in the commands below.

1. Set your cluster variables

    ``` {.bash data-prompt="$" }
    $ CLUSTER_NAME=my-cluster-name
    $ NAMESPACE=my-namespace
    ```

2. Create the Certificate Authority (CA)

    This command creates a root Certificate Authority that will sign all your certificates:
        
    ``` {.bash data-prompt="$" }
    $ cat <<EOF | cfssl gencert -initca - | cfssljson -bare ca
    {
      "CN": "Root CA",
      "key": {
        "algo": "rsa",
        "size": 2048
      }
    }
    EOF
    ```

3. Generate the server certificate for external communication. The command generates a server TLS certificate and a key for external connections, with SANs (Subject Alternative Names) for ProxySQL and Percona XtraDB Cluster endpoints.

    ```{.bash data-prompt="$"}
    $ cat <<EOF | cfssl gencert -ca=ca.pem -ca-key=ca-key.pem - | cfssljson -bare server
    {
      "hosts": [
        "${CLUSTER_NAME}-proxysql",
        "*.${CLUSTER_NAME}-proxysql-unready",
        "*.${CLUSTER_NAME}-pxc"
      ],
      "CN": "${CLUSTER_NAME}-pxc",
      "key": {
        "algo": "rsa",
        "size": 2048
      }
    }
    EOF
    ```

    The resulting files are `server.pem` (certificate) and `server-key.pem` (private key).

4. Create a Kubernetes Secret for the external certificate. This command creates a Kubernetes TLS secret named `cluster1-ssl`. The secret contains the server certificate (`server.pem`), its private key (`server-key.pem`), and the CA certificate (`ca.pem`). This secret should be referenced in your cluster's configuration for external TLS connections.

    ```{.bash data-prompt="$"}
    $ kubectl create secret generic cluster1-ssl \
      --from-file=tls.crt=server.pem \
      --from-file=tls.key=server-key.pem \
      --from-file=ca.crt=ca.pem \
      --type=Opague -n $NAMESPACE
    ```

5. Generate the server certificate for internal communication

    To secure communication between Percona XtraDB Cluster instances, you need a separate internal server certificate. Generate the internal TLS certificate and key with appropriate SANs:

    ```{.bash data-prompt="$"}
    $ cat <<EOF | cfssl gencert -ca=ca.pem -ca-key=ca-key.pem - | cfssljson -bare server-internal
    {
      "hosts": [
        "*.${CLUSTER_NAME}-pxc"
      ],
      "CN": "${CLUSTER_NAME}-pxc-internal",
      "key": {
        "algo": "rsa",
        "size": 2048
      }
    }
    EOF
    ```

    The resulting files are `server-internal.pem` (certificate) and `server-internal-key.pem` (private key).

6. Create a Kubernetes Secret for the internal certificate

    This command creates a Kubernetes TLS secret named `cluster1-ssl-internal`. The secret contains the internal server certificate (`server-internal.pem`), its private key (`server-internal-key.pem`), and the CA certificate (`ca.pem`). This secret should be referenced in your cluster's configuration for internal TLS communications.

    ```{.bash data-prompt="$"}
    $ kubectl create secret generic cluster1-ssl-internal \
      --from-file=tls.crt=server-internal.pem \
      --from-file=tls.key=server-internal-key.pem \
      --from-file=ca.crt=ca.pem \
      --type=Opague -n $NAMESPACE
    ```

### Configure your cluster

After creating the Secrets, add them to your cluster configuration in the `deploy/cr.yaml` file:


Add the secret for external use to the `spec.sslSecretName` option. Add the certificate for internal communications to the `spec.sslInternalSecretName` option.

```yaml
spec:
  sslSecretName: cluster1-ssl
  sslInternalSecretName: cluster1-ssl-internal
```

## Additional resources

Check the sample certificates in `deploy/ssl-secrets.yaml` for reference
