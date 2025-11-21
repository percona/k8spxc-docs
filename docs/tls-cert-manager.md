
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

4. Verify the *cert-manager* by running the following command:

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

Once you create the database with the Operator, it will automatically trigger the cert-manager to create certificates. Whenever you check certificates for expiration, you will find that they are valid and short-term.
