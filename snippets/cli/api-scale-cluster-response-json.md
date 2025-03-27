```json
{
   "apiVersion":"pxc.percona.com/v1",
   "kind":"PerconaXtraDBCluster",
   "metadata":{
      "annotations":{
         "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"pxc.percona.com/v1-5-0\",\"kind\":\"PerconaXtraDBCluster\",\"metadata\":{\"annotations\":{},\"finalizers\":[\"delete-pxc-pods-in-order\"],\"name\":\"cluster1\",\"namespace\":\"default\"},\"spec\":{\"allowUnsafeConfigurations\":true,\"backup\":{\"image\":\"percona/percona-xtradb-cluster-operator:1.5.0-pxc8.0-backup\",\"schedule\":[{\"keep\":3,\"name\":\"sat-night-backup\",\"schedule\":\"0 0 * * 6\",\"storageName\":\"s3-us-west\"},{\"keep\":5,\"name\":\"daily-backup\",\"schedule\":\"0 0 * * *\",\"storageName\":\"fs-pvc\"}],\"serviceAccountName\":\"percona-xtradb-cluster-operator\",\"storages\":{\"fs-pvc\":{\"type\":\"filesystem\",\"volume\":{\"persistentVolumeClaim\":{\"accessModes\":[\"ReadWriteOnce\"],\"resources\":{\"requests\":{\"storage\":\"6Gi\"}}}}},\"s3-us-west\":{\"s3\":{\"bucket\":\"S3-BACKUP-BUCKET-NAME-HERE\",\"credentialsSecret\":\"my-cluster-name-backup-s3\",\"region\":\"us-west-2\"},\"type\":\"s3\"}}},\"pmm\":{\"enabled\":false,\"image\":\"percona/percona-xtradb-cluster-operator:1.5.0-pmm\",\"serverHost\":\"monitoring-service\",\"serverUser\":\"pmm\"},\"proxysql\":{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"enabled\":true,\"gracePeriod\":30,\"image\":\"percona/percona-xtradb-cluster-operator:1.5.0-proxysql\",\"podDisruptionBudget\":{\"maxUnavailable\":1},\"resources\":{\"requests\":null},\"size\":3,\"volumeSpec\":{\"persistentVolumeClaim\":{\"resources\":{\"requests\":{\"storage\":\"2Gi\"}}}}},\"pxc\":{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"gracePeriod\":600,\"image\":\"percona/percona-xtradb-cluster:8.0.19-10.1\",\"podDisruptionBudget\":{\"maxUnavailable\":1},\"resources\":{\"requests\":null},\"size\":3,\"volumeSpec\":{\"persistentVolumeClaim\":{\"resources\":{\"requests\":{\"storage\":\"6Gi\"}}}}},\"secretsName\":\"my-cluster-secrets\",\"sslInternalSecretName\":\"my-cluster-ssl-internal\",\"sslSecretName\":\"my-cluster-ssl\",\"updateStrategy\":\"RollingUpdate\",\"vaultSecretName\":\"keyring-secret-vault\"}}\n"
      },
      "creationTimestamp":"2020-06-01T16:50:05Z",
      "finalizers":[
         "delete-pxc-pods-in-order"
      ],
      "generation":4,
      "managedFields":[
         {
            "apiVersion":"pxc.percona.com/v1-5-0",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:metadata":{
                  "f:annotations":{
                     ".":{

                     },
                     "f:kubectl.kubernetes.io/last-applied-configuration":{

                     }
                  },
                  "f:finalizers":{

                  }
               },
               "f:spec":{
                  ".":{

                  },
                  "f:allowUnsafeConfigurations":{

                  },
                  "f:backup":{
                     ".":{

                     },
                     "f:image":{

                     },
                     "f:schedule":{

                     },
                     "f:serviceAccountName":{

                     },
                     "f:storages":{
                        ".":{

                        },
                        "f:fs-pvc":{
                           ".":{

                           },
                           "f:type":{

                           },
                           "f:volume":{
                              ".":{

                              },
                              "f:persistentVolumeClaim":{
                                 ".":{

                                 },
                                 "f:accessModes":{

                                 },
                                 "f:resources":{
                                    ".":{

                                    },
                                    "f:requests":{
                                       ".":{

                                       },
                                       "f:storage":{

                                       }
                                    }
                                 }
                              }
                           }
                        },
                        "f:s3-us-west":{
                           ".":{

                           },
                           "f:s3":{
                              ".":{

                              },
                              "f:bucket":{

                              },
                              "f:credentialsSecret":{

                              },
                              "f:region":{

                              }
                           },
                           "f:type":{

                           }
                        }
                     }
                  },
                  "f:pmm":{
                     ".":{

                     },
                     "f:image":{

                     },
                     "f:serverHost":{

                     },
                     "f:serverUser":{

                     }
                  },
                  "f:proxysql":{
                     ".":{

                     },
                     "f:affinity":{
                        ".":{

                        },
                        "f:antiAffinityTopologyKey":{

                        }
                     },
                     "f:enabled":{

                     },
                     "f:gracePeriod":{

                     },
                     "f:image":{

                     },
                     "f:podDisruptionBudget":{
                        ".":{

                        },
                        "f:maxUnavailable":{

                        }
                     },
                     "f:resources":{

                     },
                     "f:size":{

                     },
                     "f:volumeSpec":{
                        ".":{

                        },
                        "f:persistentVolumeClaim":{
                           ".":{

                           },
                           "f:resources":{
                              ".":{

                              },
                              "f:requests":{
                                 ".":{

                                 },
                                 "f:storage":{

                                 }
                              }
                           }
                        }
                     }
                  },
                  "f:pxc":{
                     ".":{

                     },
                     "f:affinity":{
                        ".":{

                        },
                        "f:antiAffinityTopologyKey":{

                        }
                     },
                     "f:gracePeriod":{

                     },
                     "f:podDisruptionBudget":{
                        ".":{

                        },
                        "f:maxUnavailable":{

                        }
                     },
                     "f:resources":{

                     },
                     "f:volumeSpec":{
                        ".":{

                        },
                        "f:persistentVolumeClaim":{
                           ".":{

                           },
                           "f:resources":{
                              ".":{

                              },
                              "f:requests":{
                                 ".":{

                                 },
                                 "f:storage":{

                                 }
                              }
                           }
                        }
                     }
                  },
                  "f:secretsName":{

                  },
                  "f:sslInternalSecretName":{

                  },
                  "f:sslSecretName":{

                  },
                  "f:updateStrategy":{

                  },
                  "f:vaultSecretName":{

                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-06-01T16:52:30Z"
         },
         {
            "apiVersion":"pxc.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:spec":{
                  "f:backup":{
                     "f:storages":{
                        "f:fs-pvc":{
                           "f:podSecurityContext":{
                              ".":{

                              },
                              "f:fsGroup":{

                              },
                              "f:supplementalGroups":{

                              }
                           },
                           "f:s3":{
                              ".":{

                              },
                              "f:bucket":{

                              },
                              "f:credentialsSecret":{

                              }
                           }
                        },
                        "f:s3-us-west":{
                           "f:podSecurityContext":{
                              ".":{

                              },
                              "f:fsGroup":{

                              },
                              "f:supplementalGroups":{

                              }
                           }
                        }
                     }
                  },
                  "f:pmm":{
                     "f:resources":{

                     }
                  },
                  "f:proxysql":{
                     "f:podSecurityContext":{
                        ".":{

                        },
                        "f:fsGroup":{

                        },
                        "f:supplementalGroups":{

                        }
                     },
                     "f:sslInternalSecretName":{

                     },
                     "f:sslSecretName":{

                     },
                     "f:volumeSpec":{
                        "f:persistentVolumeClaim":{
                           "f:accessModes":{

                           }
                        }
                     }
                  },
                  "f:pxc":{
                     "f:podSecurityContext":{
                        ".":{

                        },
                        "f:fsGroup":{

                        },
                        "f:supplementalGroups":{

                        }
                     },
                     "f:sslInternalSecretName":{

                     },
                     "f:sslSecretName":{

                     },
                     "f:vaultSecretName":{

                     },
                     "f:volumeSpec":{
                        "f:persistentVolumeClaim":{
                           "f:accessModes":{

                           }
                        }
                     }
                  }
               },
               "f:status":{
                  ".":{

                  },
                  "f:conditions":{

                  },
                  "f:host":{

                  },
                  "f:observedGeneration":{

                  },
                  "f:proxysql":{
                     ".":{

                     },
                     "f:ready":{

                     },
                     "f:size":{

                     },
                     "f:status":{

                     }
                  },
                  "f:pxc":{
                     ".":{

                     },
                     "f:ready":{

                     },
                     "f:size":{

                     },
                     "f:status":{

                     }
                  },
                  "f:state":{

                  }
               }
            },
            "manager":"percona-xtradb-cluster-operator",
            "operation":"Update",
            "time":"2020-06-03T15:32:11Z"
         },
         {
            "apiVersion":"pxc.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:spec":{
                  "f:pxc":{
                     "f:image":{

                     },
                     "f:size":{

                     }
                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-06-03T15:32:14Z"
         }
      ],
      "name":"cluster1",
      "namespace":"default",
      "resourceVersion":"129605",
      "selfLink":"/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1",
      "uid":"15e5e7d6-10b2-46cf-85d0-d3fdea3412ca"
   },
   "spec":{
      "allowUnsafeConfigurations":true,
      "backup":{
         "image":"percona/percona-xtradb-cluster-operator:1.5.0-pxc8.0-backup",
         "schedule":[
            {
               "keep":3,
               "name":"sat-night-backup",
               "schedule":"0 0 * * 6",
               "storageName":"s3-us-west"
            },
            {
               "keep":5,
               "name":"daily-backup",
               "schedule":"0 0 * * *",
               "storageName":"fs-pvc"
            }
         ],
         "serviceAccountName":"percona-xtradb-cluster-operator",
         "storages":{
            "fs-pvc":{
               "type":"filesystem",
               "volume":{
                  "persistentVolumeClaim":{
                     "accessModes":[
                        "ReadWriteOnce"
                     ],
                     "resources":{
                        "requests":{
                           "storage":"6Gi"
                        }
                     }
                  }
               }
            },
            "s3-us-west":{
               "s3":{
                  "bucket":"S3-BACKUP-BUCKET-NAME-HERE",
                  "credentialsSecret":"my-cluster-name-backup-s3",
                  "region":"us-west-2"
               },
               "type":"s3"
            }
         }
      },
      "pmm":{
         "enabled":false,
         "image":"percona/percona-xtradb-cluster-operator:1.5.0-pmm",
         "serverHost":"monitoring-service",
         "serverUser":"pmm"
      },
      "proxysql":{
         "affinity":{
            "antiAffinityTopologyKey":"none"
         },
         "enabled":true,
         "gracePeriod":30,
         "image":"percona/percona-xtradb-cluster-operator:1.5.0-proxysql",
         "podDisruptionBudget":{
            "maxUnavailable":1
         },
         "resources":{
            "requests":null
         },
         "size":3,
         "volumeSpec":{
            "persistentVolumeClaim":{
               "resources":{
                  "requests":{
                     "storage":"2Gi"
                  }
               }
            }
         }
      },
      "pxc":{
         "affinity":{
            "antiAffinityTopologyKey":"none"
         },
         "gracePeriod":600,
         "image":"percona/percona-xtradb-cluster:5.7.30-31.43",
         "podDisruptionBudget":{
            "maxUnavailable":1
         },
         "resources":{
            "requests":null
         },
         "size":"5",
         "volumeSpec":{
            "persistentVolumeClaim":{
               "resources":{
                  "requests":{
                     "storage":"6Gi"
                  }
               }
            }
         }
      },
      "secretsName":"my-cluster-secrets",
      "sslInternalSecretName":"my-cluster-ssl-internal",
      "sslSecretName":"my-cluster-ssl",
      "updateStrategy":"RollingUpdate",
      "vaultSecretName":"keyring-secret-vault"
   },
   "status":{
      "conditions":[
         {
            "lastTransitionTime":"2020-06-01T16:50:37Z",
            "message":"create newStatefulSetNode: StatefulSet.apps \"cluster1-pxc\" is invalid: spec.updateStrategy: Invalid value: apps.StatefulSetUpdateStrategy{Type:\"SmartUpdate\", RollingUpdate:(*apps.RollingUpdateStatefulSetStrategy)(nil)}: must be 'RollingUpdate' or 'OnDelete'",
            "reason":"ErrorReconcile",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-06-01T16:52:31Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-06-01T16:55:59Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-06-01T17:19:15Z",
            "status":"True",
            "type":"Initializing"
         }
      ],
      "host":"cluster1-proxysql.default",
      "observedGeneration":3,
      "proxysql":{
         "ready":3,
         "size":3,
         "status":"ready"
      },
      "pxc":{
         "ready":1,
         "size":3,
         "status":"initializing"
      },
      "state":"initializing"
   }
}
```
