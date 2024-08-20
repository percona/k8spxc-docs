# Transport Layer Security (TLS)

The Percona Operator for MySQL uses Transport Layer
Security (TLS) cryptographic protocol for the following types of communication:


* Internal - communication between Percona XtraDB Cluster instances,

* External - communication between the client application and ProxySQL.

The internal certificate is also used as an authorization method.

TLS security can be configured in several ways. By default, the Operator
generates long-term certificates automatically if there are no certificate
secrets available. Other options are the following ones:

* The Operator can use a specifically installed *cert-manager*, which will
automatically generate and renew short-term TLS certificates,

* Certificates can be generated manually.

You can also use pre-generated certificates available in the
`deploy/ssl-secrets.yaml` file for test purposes, but we strongly recommend
avoiding their usage on any production system!

The following subsections explain how to configure TLS security with the
Operator yourself, as well as how to temporarily disable it if needed.

## Install and use the *cert-manager*

### <a name="tls-certs-certmanager"></a>About the *cert-manager*

A [cert-manager :octicons-link-external-16:](https://cert-manager.io/docs/) is a Kubernetes certificate
management controller which is widely used to automate the management and
issuance of TLS certificates. It is community-driven, and open source.

When you have already installed *cert-manager* and deploy the operator, the
operator requests a certificate from the *cert-manager*. The *cert-manager* acts
as a self-signed issuer and generates certificates. The Percona Operator
self-signed issuer is local to the operator namespace. This self-signed issuer
is created because Percona XtraDB Cluster requires all certificates issued
by the same .

Self-signed issuer allows you to deploy and use the Percona
Operator without creating a clusterissuer separately.

### Installation of the *cert-manager*

The steps to install the *cert-manager* are the following:

* Create a namespace,

* Disable resource validations on the cert-manager namespace,

* Install the cert-manager.

The following commands perform all the needed actions:

``` {.bash data-prompt="$" }
$ kubectl create namespace cert-manager
$ kubectl label namespace cert-manager certmanager.k8s.io/disable-validation=true
$ kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v{{ certmanagerversion }}/cert-manager.yaml
```

After the installation, you can verify the *cert-manager* by running the following command:

``` {.bash data-prompt="$" }
$ kubectl get pods -n cert-manager
```

The result should display the *cert-manager* and webhook active and running.

## Generate certificates manually

To generate certificates manually, follow these steps:


1. Provision a Certificate Authority (CA) to generate TLS certificates

2. Generate a CA key and certificate file with the server details

3. Create the server TLS certificates using the CA keys, certs, and server
details

The set of commands generate certificates with the following attributes:

* `Server-pem` - Certificate

* `Server-key.pem` - the private key

* `ca.pem` - Certificate Authority

You should generate certificates twice: one set is for external communications,
and another set is for internal ones. A secret created for the external use must
be added to `cr.yaml/spec/secretsName`. A certificate generated for internal
communications must be added to the `cr.yaml/spec/sslInternalSecretName`.

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

$ cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem - | cfssljson -bare server
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

$ kubectl create secret generic cluster1-ssl --from-file=tls.crt=server.pem --
from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem --
type=kubernetes.io/tls
```

## Update certificates

If a cert-manager is used, it should take care of
updating the certificates. If you generate certificates manually,
you should take care of updating them in proper time.

TLS certificates issued by cert-manager are short-term ones. Starting from the
Operator version 1.9.0 cert-manager issues TLS certificates for 3 months, while
root certificate is valid for 3 years. This allows to reissue TLS certificates
automatically on schedule and without downtime.

![image](assets/images/certificates.svg)

Versions of the Operator prior 1.9.0 have used 3 month root certificate, which
caused issues with the automatic TLS certificates update. If that’s your case,
you can make the Operator update along with the [official instruction](update.md).

!!! note

    If you use the cert-manager version earlier than 1.9.0, and you would
    like to avoid downtime while updating the certificates after the Operator
    update to 1.9.0 or newer version,
    force the certificates regeneration by a cert-manager.

### Check your certificates for expiration


1. First, check the necessary secrets names (`cluster1-ssl` and
    `cluster1-ssl-internal` by default):

    ``` {.bash data-prompt="$" }
    $ kubectl get certificate
    ```

    You will have the following response:

    ``` {.text .no-copy}
    NAME                    READY   SECRET                  AGE
    cluster1-ca-cert        True    cluster1-ca-cert        49m
    cluster1-ssl            True    cluster1-ssl            49m
    cluster1-ssl-internal   True    cluster1-ssl-internal   49m
    ```

2. Optionally you can also check that the certificates issuer is up and running:

    ``` {.bash data-prompt="$" }
    $ kubectl get issuer
    ```

    The response should be as follows:

    ``` {.text .no-copy}
    NAME                     READY   AGE
    cluster1-pxc-ca-issuer   True    49m
    cluster1-pxc-issuer      True    49m
    ```

3. Now use the following command to find out the certificates validity dates,
    substituting Secrets names if necessary:

    ``` {.bash data-prompt="$" }
    $ {
      kubectl get secret/cluster1-ssl-internal -o jsonpath='{.data.tls\.crt}' | base64 --decode | openssl x509 -inform pem -noout -text | grep "Not After"
      kubectl get secret/cluster1-ssl -o jsonpath='{.data.ca\.crt}' | base64 --decode | openssl x509 -inform pem -noout -text | grep "Not After"
      }
    ```

    The resulting output will be self-explanatory:

    ``` {.text .no-copy}
    Not After : Sep 15 11:04:53 2021 GMT
    Not After : Sep 15 11:04:53 2021 GMT
    ```

### Update certificates without downtime

If you don’t use cert-manager and have *created certificates manually*,
you can follow the next steps to perform a no-downtime update of these
certificates *if they are still valid*.

!!! note

    For already expired certificates, follow the alternative way.

Having non-expired certificates, you can roll out new certificates (both CA and TLS) with the Operator
as follows.

1. Generate a new CA certificate (`ca.pem`). Optionally you can also generate
    a new TLS certificate and a key for it, but those can be generated later on
    step 6.

2. Get the current CA (`ca.pem.old`) and TLS (`tls.pem.old`) certificates
    and the TLS certificate key (`tls.key.old`):

    ``` {.bash data-prompt="$" }
    $ kubectl get secret/cluster1-ssl-internal -o jsonpath='{.data.ca\.crt}' | base64 --decode > ca.pem.old
    $ kubectl get secret/cluster1-ssl-internal -o jsonpath='{.data.tls\.crt}' | base64 --decode > tls.pem.old
    $ kubectl get secret/cluster1-ssl-internal -o jsonpath='{.data.tls\.key}' | base64 --decode > tls.key.old
    ```

3. Combine new and current `ca.pem` into a `ca.pem.combined` file:

    ``` {.bash data-prompt="$" }
    $ cat ca.pem ca.pem.old >> ca.pem.combined
    ```

4. Create a new Secrets object with *old* TLS certificate (`tls.pem.old`)
    and key (`tls.key.old`), but a *new combined* `ca.pem`
    (`ca.pem.combined`):

    ``` {.bash data-prompt="$" }
    $ kubectl delete secret/cluster1-ssl-internal
    $ kubectl create secret generic cluster1-ssl-internal --from-file=tls.crt=tls.pem.old --from-file=tls.key=tls.key.old --from-file=ca.crt=ca.pem.combined --type=kubernetes.io/tls
    ```

5. The cluster will go through a rolling reconciliation, but it will do it
    without problems, as every node has old TLS certificate/key, and both new
    and old CA certificates.

6. If new TLS certificate and key weren’t generated on step 1,
    do that now.

7. Create a new Secrets object for the second time: use new TLS certificate
    (`server.pem` in the example) and its key (`server-key.pem`), and again
    the combined CA certificate (`ca.pem.combined`):

    ``` {.bash data-prompt="$" }
    $ kubectl delete secret/cluster1-ssl-internal
    $ kubectl create secret generic cluster1-ssl-internal --from-file=tls.crt=server.pem --from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem.combined --type=kubernetes.io/tls
    ```

8. The cluster will go through a rolling reconciliation, but it will do it
    without problems, as every node already has a new CA certificate (as a part
    of the combined CA certificate), and can successfully allow joiners with new
    TLS certificate to join. Joiner node also has a combined CA certificate, so
    it can authenticate against older TLS certificate.

9. Create a final Secrets object: use new TLS certificate (`server.pmm`) and
    its key (`server-key.pem`), and just the new CA certificate (`ca.pem`):

    ``` {.bash data-prompt="$" }
    $ kubectl delete secret/cluster1-ssl-internal
    $ kubectl create secret generic cluster1-ssl-internal --from-file=tls.crt=server.pem --from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls
    ```

10. The cluster will go through a rolling reconciliation, but it will do it
    without problems: the old CA certificate is removed, and every node is
    already using new TLS certificate and no nodes rely on the old CA
    certificate any more.

### Update certificates with downtime

If your certificates have been already expired (or if you continue to use the
Operator version prior to 1.9.0), you should move through the
*pause - update Secrets - unpause* route as follows.

1. Pause the cluster [in a standard way](pause.md), and make
    sure it has reached its paused state.

2. If cert-manager is used, delete issuer
    and TLS certificates:

    ``` {.bash data-prompt="$" }
    $ {
      kubectl delete issuer/cluster1-pxc-ca
      kubectl delete certificate/cluster1-ssl certificate/cluster1-ssl-internal
      }
    ```

3. Delete Secrets to force the SSL reconciliation:

    ``` {.bash data-prompt="$" }
    $ kubectl delete secret/cluster1-ssl secret/cluster1-ssl-internal
    ```

4. Check certificates to make sure reconciliation have succeeded.

5. Unpause the cluster [in a standard way](pause.md), and make
    sure it has reached its running state.

### Keep certificates after deleting the cluster

In case of cluster deletion, objects, created for SSL (Secret, certificate, and
issuer) are not deleted by default.

If the user wants the cleanup of objects created for SSL, there is a [finalizers.delete-ssl](operator.md#finalizers-delete-ssl)
option in `deploy/cr.yaml`: if this finalizer is set, the Operator will delete
Secret, certificate and issuer after the cluster deletion event.

## Run Percona XtraDB Cluster without TLS

Omitting TLS is also possible, but we recommend that you run your cluster with
the TLS protocol enabled.

To have TLS protocol disabled (e.g. for demonstration purposes) set the
`unsafeFlags.tls` key to `true` and set the `tls.enabled` key to `false` 
in the `deploy/cr.yaml` file: 

```yaml
...
spec:
  ...
  unsafeFlags
    tls: true
    ...
  tls:
    enabled: false
```

Enabling/disabling TLS is not supported on a running cluster.

To disable TLS for a running cluster you need to do the following actions manually:

* [pause the cluster](pause.md)

* set `unsafeFlags.tls=true` and `tls.enabled=false` Custom Resource options

* delete SSL secrets;

* [unpause the cluster](pause.md)

To enable TLS for a running cluster:

* [pause the cluster](pause.md)

* set `unsafeFlags.tls=false` and `tls.enabled=true` Custom Resource options

* [unpause the cluster](pause.md)
