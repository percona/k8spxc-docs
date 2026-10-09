# Configure Amazon S3 or S3-compatible storage for backups

This document guides you through configuring backups to an Amazon S3 bucket, an S3-compatible service, or Google Cloud Storage.

## Create the S3 credentials Secret

Create a Secret with the access keys. Use the [deploy/backup/backup-secret-s3.yaml :octicons-link-external-16:](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/backup/backup-secret-s3.yaml) manifest as the example. The Secret contains:

* `metadata.name` — the name you later set in `s3.credentialsSecret`
* `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` — the access key and secret key, base64-encoded

Encode each key with the following command:

=== ":simple-linux: in Linux"

    ```bash
    echo -n 'plain-text-string' | base64 --wrap=0
    ```

=== ":simple-apple: in macOS"

    ```bash
    echo -n 'plain-text-string' | base64
    ```

Save the encoded values in the Secret file:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-cluster-name-backup-s3
type: Opaque
data:
  AWS_ACCESS_KEY_ID: <YOUR-BASE64-ENCODED-KEY-HERE>
  AWS_SECRET_ACCESS_KEY: <YOUR-BASE64-ENCODED-SECRET-HERE>
```

Apply the file to create the Secret object:

```bash
kubectl apply -f deploy/backup/backup-secret-s3.yaml -n <namespace>
```

## Configure the storage in the Custom Resource

Edit the [`deploy/cr.yaml`](https://github.com/percona/percona-xtradb-cluster-operator/blob/v{{release}}/deploy/cr.yaml) manifest and set:

* `storages.<NAME>.type` to `s3`. Use `<NAME>` later when you make a backup or a restore.
* `storages.<NAME>.s3.credentialsSecret` to the Secret name from the previous section.
* `storages.<NAME>.s3.bucket` to the bucket that stores the backups.
* `storages.<NAME>.s3.region` to the bucket's region.

### AWS S3

This example shows configuration for the storage named `s3-us-west`:

```yaml
...
backup:
  ...
  storages:
    s3-us-west:
      type: s3
      s3:
        bucket: S3-BACKUP-BUCKET-NAME-HERE
        region: us-west-2
        credentialsSecret: my-cluster-name-backup-s3
  ...
```

If the storage uses a custom or self-signed TLS certificate, add those with the `caBundle` options. See [Configure TLS verification with custom certificates](#configure-tls-verification-with-custom-certificates).

### S3-compatible storage

To use S3-compatible storage instead of Amazon S3, add `endpointUrl` in the `s3` subsection and point it at your storage service's endpoint:

```yaml
backup:
  ...
  storages:
    s3-compatible:
      type: s3
      s3:
        bucket: BUCKET-NAME-HERE
        region: us-east-1
        credentialsSecret: my-cluster-name-backup-s3
        endpointUrl: https://STORAGE-ENDPOINT-HERE:9000
  ...
```

Depending on your provider, you may also need:

* **[`forcePathStyle`](operator.md#backupstoragesstorage-names3forcepathstyle)** — set to `true` if your provider addresses buckets as `endpoint/bucket` instead of `bucket.endpoint`. Without it, the Operator uses virtual-hosted-style addressing, which fails against providers that don't support it.
* **[`verifyTLS`](operator.md#backupstoragesstorage-nameverifytls)** — set to `false` if your provider uses a self-issued TLS certificate and you don't want to configure a [custom CA bundle](#configure-tls-verification-with-custom-certificates) instead. Prefer the CA bundle option in production: disabling verification removes protection against a man-in-the-middle attack.
* **[`skipBucketExistsCheck`](operator.md#backupstoragesstorage-names3skipbucketexistscheck)** — set to `true` if the credentials you're using can't run a bucket-existence check, for example a scoped IAM or API policy without that permission. Otherwise the Operator's default check fails before the backup even starts.

Set `region` regardless of provider — see [`s3.region`](operator.md#backupstoragesstorage-names3region) for why.

### Google Cloud Storage

Google Cloud Storage (GCS) doesn't have a dedicated storage type. Use `type: s3` and set `endpointUrl` to GCS's S3-compatible endpoint. Create the Secret with a GCS [HMAC key pair :octicons-link-external-16:](https://cloud.google.com/storage/docs/authentication/hmackeys) as the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` values.

```yaml
backup:
  ...
  storages:
    gcs-us:
      type: s3
      s3:
        bucket: GCS-BUCKET-NAME-HERE
        credentialsSecret: gcs-backup-secret
        endpointUrl: https://storage.googleapis.com
  ...
```

`forcePathStyle` is optional for GCS.
`region` is optional for GCS backups specifically, since this example sets `endpointUrl` directly. However, it is required if you also use GCS storage for [point-in-time recovery](backups-pitr.md) binlogs — the binlog collector requires it regardless of storage provider.

If the credentials can't access the bucket, the backup Job fails with the generic error `xbcloud: Probe failed. Please check your credentials and endpoint settings`. Check the bucket permissions for the HMAC key before you troubleshoot anything else.

## Allow the backup user to delete objects

When a backup upload fails, the next backup Job deletes the incomplete objects in the bucket and then starts the backup again. Grant the credentials [permission to delete objects in the bucket :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-actions.html). Without that permission, the Job cannot remove the leftovers and does not retry.

A [Google Cloud Storage retention period :octicons-link-external-16:](https://cloud.google.com/storage/docs/bucket-lock) blocks that delete, so the retry fails even when the key has permission.

## Configure TLS verification with custom certificates

!!! note "Version added: [1.19.0](ReleaseNotes/Kubernetes-Operator-for-PXC-RN1.19.0.md)"

You can use your organization's custom TLS / SSL certificates and instruct the Operator to securely verify TLS communication with the S3 storage.

To configure TLS verification with custom certificates, do the following:

1. Create the Secret object that contains the CA bundle needed to verify the S3 endpoint's TLS certificate.
2. Modify the S3 storage configuration in the Custom Resource and specify the following information:

    * `storages.<NAME>.s3.caBundle.name` is the name of the Secret object you created previously
    * `storages.<NAME>.s3.caBundle.key` is the name of the file in the Secret containing the CA bundle.

    Here's the example configuration:

    ```yaml
    ...
    backup:
      ...
      storages:
        s3-us-west:
          type: s3
          s3:
            bucket: S3-BACKUP-BUCKET-NAME-HERE
            region: us-west-2
            credentialsSecret: my-cluster-name-backup-s3
            caBundle:
              name: s3-ca-bundle-secret
              key: ca.crt
      ...
    ```

    The Operator will use this configuration to securely verify TLS communication with S3 storage during backups and restores.

For more configuration options, see the [Operator Custom Resource options](operator.md#operator-backup-section).

## Next step

[On-demand backup](backups-ondemand.md){.md-button}
[Scheduled backup](backups-scheduled.md){.md-button}
