# Transport Layer Security (TLS)

The Percona Operator for MySQL uses Transport Layer
Security (TLS) cryptographic protocol for the following types of communication:

| Certificate | Secures | Used by |
| --- | --- | --- |
| External (`sslSecretName`) | Client-to-proxy connections | ProxySQL only |
| Internal (`sslInternalSecretName`) | Node-to-node Galera traffic. This certificate also serves as an authorization method | Every Percona XtraDB Cluster node and HAProxy. HAProxy passes the TLS handshake through to the PXC node instead of terminating it, so client connections through HAProxy are secured by the internal certificate, not the external one. |

## TLS certificates

Choose one of three ways to provision TLS certificates, depending on how much control you need over certificate generation and renewal:

| Method | Renewal | Best for |
| --- | --- | --- |
| Operator-generated (default) | Manual. Generate and apply new certificates yourself | Getting started without installing extra components |
| [cert-manager](tls-cert-manager.md) | Automatic. Short-term certificates renewed on schedule | Clusters that need automated certificate lifecycle management |
| [Custom certificates](tls-manual.md) | Manual. You control the validity period and renewal | Environments with an existing PKI or specific security and compliance requirements |

**For testing purposes**, you can use pre-generated certificates available in the `deploy/ssl-secrets.yaml` file. But we strongly recommend
**to not use them on any production system**!

## Connect your application using TLS

To verify server identity when connecting with TLS, use `--ssl-mode=VERIFY_CA` or `--ssl-mode=VERIFY_IDENTITY` (or your driver's equivalent) with the CA certificate that matches the proxy you connect through:

* **HAProxy** (the default): use the CA from the *internal* certificate Secret. It is referenced in the `sslInternalSecretName` Custom Resource option (`cluster1-ssl-internal` by default).
* **ProxySQL**: use the CA from the *external* certificate Secret. It is referenced in the `sslSecretName` Custom Resource option (`cluster1-ssl` by default).

Get the CA certificate for your proxy. This example is for HAProxy:

```bash
kubectl get secret cluster1-ssl-internal -n <namespace> -o jsonpath='{.data.ca\.crt}' | base64 -d > ca.pem
```

Then connect with it, using the same host as [Connect to Percona XtraDB Cluster](connect.md):

=== "with HAProxy (default)"

    ```bash
    mysql -h cluster1-haproxy -uroot -p'<root_password>' --ssl-mode=VERIFY_IDENTITY --ssl-ca=path/to/ca.pem
    ```

=== "with ProxySQL"

    ```bash
    mysql -h cluster1-proxysql -uroot -p'<root_password>' --ssl-mode=VERIFY_IDENTITY --ssl-ca=path/to/ca.pem
    ```

`--ssl-mode=VERIFY_IDENTITY` also checks the hostname you connect with against the certificate's Subject Alternative Names (SANs). If the connection fails, confirm which certificate is actually being served. See [Verify the certificate is in use](tls-manual.md#verify-the-certificate-is-in-use).

## See also

Related tasks:

* [Update certificates](tls-update.md)
* [Disable TLS temporarily](tls-disable.md)
