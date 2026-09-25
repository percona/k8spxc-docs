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

    ```bash
    CLUSTER_NAME=my-cluster-name
    NAMESPACE=my-namespace
    ```

2. Create the Certificate Authority (CA)

    This command creates a root Certificate Authority that will sign all your certificates:
        
    ```bash
    cat <<EOF | cfssl gencert -initca - | cfssljson -bare ca
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

    ```bash
    cat <<EOF | cfssl gencert -ca=ca.pem -ca-key=ca-key.pem - | cfssljson -bare server
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

    ```bash
    kubectl create secret generic cluster1-ssl \
      --from-file=tls.crt=server.pem \
      --from-file=tls.key=server-key.pem \
      --from-file=ca.crt=ca.pem \
      --type=kubernetes.io/tls -n $NAMESPACE
    ```

5. Generate the server certificate for internal communication

    To secure communication between Percona XtraDB Cluster instances, you need a separate internal server certificate. Generate the internal TLS certificate and key with appropriate SANs:

    ```bash
    cat <<EOF | cfssl gencert -ca=ca.pem -ca-key=ca-key.pem - | cfssljson -bare server-internal
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

    ```bash
    kubectl create secret generic cluster1-ssl-internal \
      --from-file=tls.crt=server-internal.pem \
      --from-file=tls.key=server-internal-key.pem \
      --from-file=ca.crt=ca.pem \
      --type=kubernetes.io/tls -n $NAMESPACE
    ```

### Configure your cluster

After creating the Secrets, add them to your cluster configuration in the `deploy/cr.yaml` file:


Add the secret for external use to the `spec.sslSecretName` option. Add the certificate for internal communications to the `spec.sslInternalSecretName` option.

```yaml
spec:
  sslSecretName: cluster1-ssl
  sslInternalSecretName: cluster1-ssl-internal
```

Once your cluster is running with these certificates, see [Update certificates](tls-update.md) for how to check their expiration and renew or rotate them, since manually generated certificates are not renewed automatically.

## Verify the certificate is in use

The Operator applies whatever Secret `sslSecretName` and `sslInternalSecretName` point to without validating it, and without logging or reporting whether the certificate is well-formed or correctly paired with its CA. A malformed certificate, or one that doesn't match its CA or private key, can be accepted silently — the cluster can report `Ready` with nothing in the logs or Kubernetes Events to indicate a problem.

Always confirm the certificate actually served matches what you provided. Check what the proxy presents during a live handshake. The cluster's hostnames only resolve from inside the cluster's network, so run the check from a temporary pod:

```bash
kubectl run -n <namespace> -i --rm --tty tls-debug --image=percona/percona-xtradb-cluster:{{pxc84recommended}} --restart=Never -- bash -il
```

Inside that pod, run:

```bash
openssl s_client -starttls mysql -connect cluster1-haproxy.<namespace>:3306 -showcerts < /dev/null 2>/dev/null \
  | openssl x509 -noout -subject -serial -fingerprint -sha256
```

Compare the output against the certificate in your Secret. Which Secret to check depends on the proxy deployed in your cluster:

=== "HAProxy"

    With HAProxy, client connections are served the internal certificate, not the external one. HAProxy passes the TLS handshake through to the PXC node itself instead of terminating it, so the node's own (internal) certificate is what the client sees. Compare against the Secret you set in `sslInternalSecretName`:

    ```bash
    kubectl get secret cluster1-ssl-internal -n <namespace> -o jsonpath='{.data.tls\.crt}' \
      | base64 -d | openssl x509 -noout -subject -serial -fingerprint -sha256
    ```

=== "ProxySQL"

    With ProxySQL, client connections are served the external certificate. Compare against the Secret you set in `sslSecretName`:

    ```bash
    kubectl get secret cluster1-ssl -n <namespace> -o jsonpath='{.data.tls\.crt}' \
      | base64 -d | openssl x509 -noout -subject -serial -fingerprint -sha256
    ```

The subject, serial, and fingerprint must match. If they don't, check your Secret for a mismatched CA, certificate, or key before assuming the configuration is broken elsewhere.

## Additional resources

Check the sample certificates in `deploy/ssl-secrets.yaml` for reference
