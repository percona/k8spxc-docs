> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# Use docker images from a custom registry

Using images from a private Docker registry may be useful in different situations: it may be related to storing images inside of a company, for privacy and security reasons, etc. In such cases, Percona Distribution for MySQL Operator based on Percona XtraDB Cluster allows to use a custom registry, and the following instruction illustrates how this can be done by the example of the Operator deployed in the OpenShift environment.

1. First of all login to the OpenShift and create project.

   ```
   oc login
   Authentication required for https://192.168.1.100:8443 (openshift)
   Username: admin
   Password:
   Login successful.
   oc new-project pxc
   Now using project "pxc" on server "https://192.168.1.100:8443".
   ```

1. There are two things you will need to configure your custom registry access:

   - the token for your user
   - your registry IP address.

   The token can be find out with the following command:

   ```
   oc whoami -t
   ADO8CqCDappWR4hxjfDqwijEHei31yXAvWg61Jg210s
   ```

   And the following one tells you the registry IP address:

   ```
   kubectl get services/docker-registry -n default
   NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
   docker-registry   ClusterIP   172.30.162.173   <none>        5000/TCP   1d
   ```

1. Now you can use the obtained token and address to login to the registry:

   ```
   docker login -u admin -p ADO8CqCDappWR4hxjfDqwijEHei31yXAvWg61Jg210s 172.30.162.173:5000
   Login Succeeded
   ```

1. Pull the needed image by its SHA digest:

   ```
   docker pull docker.io/perconalab/percona-xtradb-cluster-operator@sha256:841c07eef30605080bfe80e549f9332ab6b9755fcbc42aacbf86e4ac9ef0e444
   Trying to pull repository docker.io/perconalab/percona-xtradb-cluster-operator ...
   sha256:841c07eef30605080bfe80e549f9332ab6b9755fcbc42aacbf86e4ac9ef0e444: Pulling from docker.io/perconalab/percona-xtradb-cluster-operator
   Digest: sha256:841c07eef30605080bfe80e549f9332ab6b9755fcbc42aacbf86e4ac9ef0e444
   Status: Image is up to date for docker.io/perconalab/percona-xtradb-cluster-operator@sha256:841c07eef30605080bfe80e549f9332ab6b9755fcbc42aacbf86e4ac9ef0e444
   ```

   You can find correct names and SHA digests in the [current list of the Operator-related images officially certified by Percona](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/images.html).

1. The following way is used to push an image to the custom registry (into the OpenShift pxc project):

   ```
   docker tag \
       docker.io/perconalab/percona-xtradb-cluster-operator@sha256:841c07eef30605080bfe80e549f9332ab6b9755fcbc42aacbf86e4ac9ef0e444 \
       172.30.162.173:5000/pxc/percona-xtradb-cluster-operator:1.20.0
   docker push 172.30.162.173:5000/pxc/percona-xtradb-cluster-operator:1.20.0
   ```

1. Check the image in the OpenShift registry with the following command:

   ```
   oc get is
   NAME                              DOCKER REPO                                                            TAGS      UPDATED
   percona-xtradb-cluster-operator   docker-registry.default.svc:5000/pxc/percona-xtradb-cluster-operator   1.20.0     2 hours ago
   ```

1. When the custom registry image is Ok, put a Docker Repo + Tag string (it should look like `docker-registry.default.svc:5000/pxc/percona-xtradb-cluster-operator:1.20.0`) into the `initImage` option in `deploy/operator.yaml` configuration file.

1. Repeat steps 3-5 for other images, updating the ``` image\``options in the corresponding sections of the the ``deploy/cr.yaml ``` file.

   Note

   Don’t forget to set [upgradeoptions.apply](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/operator.html#upgradeoptionsapply) option to `Disabled`. Otherwise [Smart Upgrade functionality](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/update.html#update-strategies) will try using the image recommended by the Version Service instead of the custom one.

   Please note it is possible to specify `imagePullSecrets` option for the images, if the registry requires authentication.

1. Now follow the standard [Percona Operator for MySQL installation instruction](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/openshift.html).
