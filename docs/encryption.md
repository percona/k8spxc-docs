# Data at rest encryption

Data-at-rest encryption ensures that data stored on disk remains protected even if the underlying storage is compromised. This process is transparent to your applications, meaning you don't need to change your application code. If an unauthorized user gains access to the storage, they can't read the data files.

The Operator supports [data at rest encryption in Percona XtraDB Cluster :octicons-link-external-16:](https://docs.percona.com/percona-xtradb-cluster/LATEST/data-at-rest-encryption.html) since version 1.4.0.

To encrypt tablespaces, schemas, backups and binlogs, the Operator uses the following tools:

* The `keyring_vault` **component** shipped with Percona XtraDB Cluster 8.4 and 5.7
* The `keyring_vault` **plugin** shipped with Percona XtraDB Cluster 8.0

   For more information about keyring plugins and components, see [Compare keyring components and keyring plugins :octicons-link-external-16:](https://docs.percona.com/percona-server/8.0/components-keyrings-comparison.html) chapter in Percona   Server for MySQL documentation.

* [HashiCorp Vault :octicons-link-external-16:](https://www.vaultproject.io/) to securely store and manage master encryption keys, perform automatic key rotation, and enable audit logging.

This setup enhances the overall security posture of your Percona XtraDB cluster on Kubernetes.

## Encryption flow

The encryption mechanism uses a two-tiered key architecture to secure your data:

* Each database instance has a master encryption key to encrypt tablespaces and binlogs. Master encryption key is stored separately from tablespace keys, in an external key management service like HashiCorp Vault.
* Each tablespace has a unique tablespace key to encrypt the data files (tables and indexes).

The data is encrypted before being written to disk. When you need to read the data, it's decrypted in memory for use and then re-encrypted before being written back to disk.

## Key rotation

Key rotation is replacing the old master encryption key with the new one. When a new master encryption key is created, it is stored in Vault and tablespace keys are re-encrypted with it. The entire dataset is not re-encrypted and this makes the key rotation a fast and lightweight operation.

Read more about key rotation in the [Rotate the master key :octicons-link-external-16:](https://docs.percona.com/percona-server/latest/rotating-master-key.html).

## Backups and encryption

Percona Operator for MySQL uses [Percona XtraBackup :octicons-link-external-16::](https://docs.percona.com/percona-xtrabackup/latest/index.html) for backups and fully supports backing up encrypted data. The backups remain encrypted, ensuring your data is secure both on your live cluster and in your backup storage.

!!! warning "Keep your encryption keys safe"

    To restore from an encrypted backup, you **must have the original master encryption key**. If the encryption key is lost, your backups will be irrecoverable. Always ensure you have a secure and reliable process for managing and backing up your master encryption keys separately from your database backups.

## Next steps

Choose a setup guide based on your security requirements:

* [Configure data-at-rest encryption without TLS](encryption-setup.md) - For development and testing environments
* [Configure data-at-rest encryption with TLS](encryption-setup-tls.md) - For production environments requiring encrypted communication

