
# Install and use the cert-manager

## About the cert-manager

A [cert-manager :octicons-link-external-16:](https://cert-manager.io/docs/) is a Kubernetes certificate
management controller which is widely used to automate the management and
issuance of TLS certificates. It is community-driven, and open source.

When you have already installed cert-manager, nothing else is needed: just deploy the Operator, and the Operator will request a certificate from the cert-manager.

The *cert-manager* acts
as a self-signed issuer and generates certificates. Certificates are valid for 3 months.

![image](assets/images/certificates.svg)

The Percona Operator
self-signed issuer is local to the operator namespace. This self-signed issuer
is created because Percona XtraDB Cluster requires all certificates issued
by the same CA (Certificate authority).

Self-signed issuer allows you to deploy and use the Percona
Operator without creating a cluster issuer separately.



## Install the *cert-manager*

The cert-manager requires its own namespace

The steps to install the *cert-manager* are the following:

1. Create the `cert-manager` namespace:
   
    ```bash
    kubectl create namespace cert-manager
    ```

2. Disable resource validations on the `cert-manager` namespace:
   
    ```bash
    kubectl label namespace cert-manager certmanager.k8s.io/disable-validation=true
    ```

3. Install the cert-manager:
   
    ```bash
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v{{ certmanagerversion }}/cert-manager.yaml
    ```

4. For cert-manager v1.18.0 and above, update the default rotation policy to not rotate the private key Secret associated with a Certificate object automatically upon the certificate reissue:
    
    ```bash
    kubectl patch certificate cluster1-ca-cert --type=merge -p '{"spec":{"privateKey":{"rotationPolicy":"Never"}}}'
    ```

    This workaround ensures the correct start of the database cluster upon the certificate renewal. 

5. Verify the *cert-manager* by running the following command:

    ```bash
    kubectl get pods -n cert-manager
    ```

    The result should display the *cert-manager* and webhook active and running.

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME                                       READY   STATUS    RESTARTS   AGE
        cert-manager-69f748766f-6chvt              1/1     Running   0          65s
        cert-manager-cainjector-7cf6557c49-l2cwt   1/1     Running   0          66s
        cert-manager-webhook-58f4cff74d-th4pp      1/1     Running   0          65s
        ```

At this point, you can move on to [deploying the Operator and your database cluster](kubectl.md).

## Customize certificate duration for cert-manager

When you deploy the cluster using the default configuration, the Operator triggers the cert-manager to create certificates
with default duration of 90 days. 

You can also customize the certificate duration. For example, to align certificate lifetimes with your organization’s security and compliance policies.

### Rules and limitations

Check the following rules and limitations for setting up the certificate duration:

1. You can set the duration **only when you create a new cluster**. Updating it in a running cluster is not supported.
2. The TLS certificate duration is subject to the following requirements:

    - The minimum accepted value is 1 hour. Durations below 1 hour are rejected.
    - Do **not** set the duration to exactly 1 hour; the Operator will fail to generate the correct certificate object if you do.
    - By default, cert-manager starts the renewal process when a certificate has one-third of its lifetime remaining, ensuring renewal before expiration. For example, if a certificate is valid for 1 hour, renewal will begin after approximately 40 minutes.

3. Minimum CA certificate duration is 730 hours (approximately 30 days). Do not set the duration to exactly 730 hours; the Operator will fail to generate the correct certificate object if you do.

### Configuration

To set the custom duration, specify the following options in the Custom Resource:

* `.spec.tls.certValidityDuration` – validity period for TLS certificates
* `.spec.tls.caValidityDuration` – validity period for the Certificate Authority (CA)

Here's the example configuration:

```yaml
  tls:
    enabled: true
    certValidityDuration: 2160h
    caValidityDuration: 26280h
```

Create a new cluster with this configuration:

```bash
kubectl -f deploy/cr.yaml -n <namespace>
```

To verify the durations, you can [check certificates for expiration](tls-update.md#check-your-certificates-for-expiration) at any time. This ensures your certificates are valid and helps you plan for renewals before they expire.
