# Labels and annotations

[Labels :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)
and [annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/)
are used to attach additional metadata information to Kubernetes resources.

Labels and annotations are rather similar. The difference between them is that
labels are used by Kubernetes to identify and select objects, while annotations
are assigning additional *non-identifying* information to resources.
Therefore, typical role of Annotations is facilitating integration with some
external tools.

## Setting labels and annotations in the Custom Resource

You can set labels and/or annotations as key/value string pairs in the Custom
Resource metadata section of the `deploy/cr.yaml` as follows:

```yaml
apiVersion: pxc.percona.com/v1
kind: PerconaXtraDBCluster
metadata:
  name: cluster1
  annotations:
    percona.com/issue-vault-token: "true"
  labels:
    ...
```

!!! note

    Setting `percona.com/issue-vault-token: "true"` annotation is just an
    example, but this exact annotation has a special meaning. If you add this
    annotation present and have [HashiCorp Vault :octicons-link-external-16:](https://www.vaultproject.io/)
    installed (for example, it is used for [data at rest encryption](encryption.md)),
    the Operator will not start a cluster but will be printing a
    `wait for token issuing` log message in a loop until the annotation is
    deleted (for example, this can be combined with a user's automation
    script making some Vault-related preparations).

The easiest way to check which labels are attached to a specific object with is
using the additional `--show-labels` option of the `kubectl get` command.
Checking the annotations is not much more difficult: it can be done as in the
following example:

``` {.bash data-prompt="$" }
$ kubectl get pod cluster1-pxc-0 -o jsonpath='{.metadata.annotations}'
```

## <a name="annotations-ignore"></a>Specifying labels and annotations ignored by the Operator

Sometimes various Kubernetes flavors can add their own annotations to the
objects managed by the Operator.

The Operator keeps track of all changes to its objects and can remove
annotations that appeared without its participation.

If there are no annotations or labels in the Custom Resource, the Operator does
nothing if new label or annotation added to the object.

If there is an annotation or a label specified in the Custom Resource, the
Operator starts to manage annotations and labels. In this case it removes
unknown annotations and labels.

Still, it is possible to specify which annotations and labels should be
ignored by the Operator by listing them in the `spec.ignoreAnnotations` or
`spec.ignoreLabels` keys of the `deploy/cr.yaml`, as follows:

```yaml

spec:
  ignoreAnnotations:
    - some.custom.cloud.annotation/smth
  ignoreLabels:
    - some.custom.cloud.label/smth
...
```

The Operator will ignore any Service annotation or label, key of which
**starts** with the mentioned above examples. For example, the following
annotations and labels will be ignored after applying the above `cr.yaml`
fragment:

```yaml
annotations:
  some.custom.cloud.annotation/smth: somethinghere
labels:
  some.custom.cloud.label/smth: somethinghere
```

