# Transport Layer Security (TLS)

The Percona Operator for MySQL uses Transport Layer
Security (TLS) cryptographic protocol for the following types of communication:

* External - communication between the client application and ProxySQL.

* Internal - communication between Percona XtraDB Cluster instances. 
The internal certificate is also used as an authorization method.

## TLS Certificates 

You can configure TLS security in several ways.

* By default, the Operator **generates long-term certificates** automatically during the cluster creation if there are no certificate secrets available. If you need new certificates, you must renew them manually.

* The Operator can use a *cert-manager*, which will automatically **generate and renew short-term TLS certificates**. You must explicitly install cert-manager for this scenario.

    The *cert-manager* acts as a self-signed issuer and generates certificates allowing you to deploy and use the
    Percona Operator without a separate certificate issuer.

* You can generate TLS certificates manually or obtain them from some other issuer and provide to the Operator.

**For testing purposes**, you can use pre-generated certificates available in the `deploy/ssl-secrets.yaml` file. But we strongly recommend
**to not use them on any production system**!

## TLS configuration

The following sections provide guidelines how to:

* [Configure TLS security with the Operator using cert-manager](tls-cert-manager.md)
* [Generate certificates manually](tls-manual.md)
* [Update certificates](tls-update.md)
* [Disable TLS temporarily](tls-disable.md)


