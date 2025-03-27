```json
{
   "apiVersion":"pxc.percona.com/v1",
   "kind":"PerconaXtraDBCluster",
   "metadata":{
      "annotations":{
         "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"pxc.percona.com/v1\",\"kind\":\"PerconaXtraDBCluster\",\"metadata\":{\"annotations\":{},\"creationTimestamp\":\"2020-05-27T22:23:58Z\",\"finalizers\":[\"delete-pxc-pods-in-order\"],\"generation\":1,\"managedFields\":[{\"apiVersion\":\"pxc.percona.com/v1-5-0\",\"fieldsType\":\"FieldsV1\",\"fieldsV1\":{\"f:metadata\":{\"f:finalizers\":{}},\"f:spec\":{\".\":{},\"f:allowUnsafeConfigurations\":{},\"f:backup\":{\".\":{},\"f:image\":{},\"f:schedule\":{},\"f:serviceAccountName\":{},\"f:storages\":{\".\":{},\"f:fs-pvc\":{\".\":{},\"f:type\":{},\"f:volume\":{\".\":{},\"f:persistentVolumeClaim\":{\".\":{},\"f:accessModes\":{},\"f:resources\":{\".\":{},\"f:requests\":{\".\":{},\"f:storage\":{}}}}}},\"f:s3-us-west\":{\".\":{},\"f:s3\":{\".\":{},\"f:bucket\":{},\"f:credentialsSecret\":{},\"f:region\":{}},\"f:type\":{}}}},\"f:pmm\":{\".\":{},\"f:image\":{},\"f:serverHost\":{},\"f:serverUser\":{}},\"f:proxysql\":{\".\":{},\"f:affinity\":{\".\":{},\"f:antiAffinityTopologyKey\":{}},\"f:enabled\":{},\"f:gracePeriod\":{},\"f:image\":{},\"f:podDisruptionBudget\":{\".\":{},\"f:maxUnavailable\":{}},\"f:resources\":{},\"f:size\":{},\"f:volumeSpec\":{\".\":{},\"f:persistentVolumeClaim\":{\".\":{},\"f:resources\":{\".\":{},\"f:requests\":{\".\":{},\"f:storage\":{}}}}}},\"f:pxc\":{\".\":{},\"f:affinity\":{\".\":{},\"f:antiAffinityTopologyKey\":{}},\"f:gracePeriod\":{},\"f:image\":{},\"f:podDisruptionBudget\":{\".\":{},\"f:maxUnavailable\":{}},\"f:resources\":{},\"f:size\":{},\"f:volumeSpec\":{\".\":{},\"f:persistentVolumeClaim\":{\".\":{},\"f:resources\":{\".\":{},\"f:requests\":{\".\":{},\"f:storage\":{}}}}}},\"f:secretsName\":{},\"f:sslInternalSecretName\":{},\"f:sslSecretName\":{},\"f:vaultSecretName\":{}}},\"manager\":\"kubectl\",\"operation\":\"Update\",\"time\":\"2020-05-27T22:23:58Z\"},{\"apiVersion\":\"pxc.percona.com/v1\",\"fieldsType\":\"FieldsV1\",\"fieldsV1\":{\"f:spec\":{\"f:backup\":{\"f:storages\":{\"f:fs-pvc\":{\"f:podSecurityContext\":{\".\":{},\"f:fsGroup\":{},\"f:supplementalGroups\":{}},\"f:s3\":{\".\":{},\"f:bucket\":{},\"f:credentialsSecret\":{}}},\"f:s3-us-west\":{\"f:podSecurityContext\":{\".\":{},\"f:fsGroup\":{},\"f:supplementalGroups\":{}}}}},\"f:pmm\":{\"f:resources\":{}},\"f:proxysql\":{\"f:podSecurityContext\":{\".\":{},\"f:fsGroup\":{},\"f:supplementalGroups\":{}},\"f:sslInternalSecretName\":{},\"f:sslSecretName\":{},\"f:volumeSpec\":{\"f:persistentVolumeClaim\":{\"f:accessModes\":{}}}},\"f:pxc\":{\"f:podSecurityContext\":{\".\":{},\"f:fsGroup\":{},\"f:supplementalGroups\":{}},\"f:sslInternalSecretName\":{},\"f:sslSecretName\":{},\"f:vaultSecretName\":{},\"f:volumeSpec\":{\"f:persistentVolumeClaim\":{\"f:accessModes\":{}}}}},\"f:status\":{\".\":{},\"f:conditions\":{},\"f:host\":{},\"f:observedGeneration\":{},\"f:proxysql\":{\".\":{},\"f:ready\":{},\"f:size\":{},\"f:status\":{}},\"f:pxc\":{\".\":{},\"f:ready\":{},\"f:size\":{},\"f:status\":{}},\"f:state\":{}}},\"manager\":\"percona-xtradb-cluster-operator\",\"operation\":\"Update\",\"time\":\"2020-05-27T23:06:47Z\"}],\"name\":\"cluster1\",\"namespace\":\"default\",\"resourceVersion\":\"15878\",\"selfLink\":\"/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1\",\"uid\":\"e9115e2a-49df-4ebf-9dab-fa5a550208d3\"},\"spec\":{\"allowUnsafeConfigurations\":true,\"backup\":{\"image\":\"percona/percona-xtradb-cluster-operator:1.5.0-pxc8.0-debug-backup\",\"schedule\":[{\"keep\":3,\"name\":\"sat-night-backup\",\"schedule\":\"0 0 * * 6\",\"storageName\":\"s3-us-west\"},{\"keep\":5,\"name\":\"daily-backup\",\"schedule\":\"0 0 * * *\",\"storageName\":\"fs-pvc\"}],\"serviceAccountName\":\"percona-xtradb-cluster-operator\",\"storages\":{\"fs-pvc\":{\"type\":\"filesystem\",\"volume\":{\"persistentVolumeClaim\":{\"accessModes\":[\"ReadWriteOnce\"],\"resources\":{\"requests\":{\"storage\":\"6Gi\"}}}}},\"s3-us-west\":{\"s3\":{\"bucket\":\"S3-BACKUP-BUCKET-NAME-HERE\",\"credentialsSecret\":\"my-cluster-name-backup-s3\",\"region\":\"us-west-2\"},\"type\":\"s3\"}}},\"pmm\":{\"enabled\":false,\"image\":\"percona/percona-xtradb-cluster-operator:1.5.0-pmm\",\"serverHost\":\"monitoring-service\",\"serverUser\":\"pmm\"},\"proxysql\":{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"enabled\":true,\"gracePeriod\":30,\"image\":\"percona/percona-xtradb-cluster-operator:1.5.0-proxysql\",\"podDisruptionBudget\":{\"maxUnavailable\":1},\"resources\":{\"requests\":null},\"size\":5,\"volumeSpec\":{\"persistentVolumeClaim\":{\"resources\":{\"requests\":{\"storage\":\"2Gi\"}}}}},\"pxc\":{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"gracePeriod\":600,\"image\":\"percona/percona-xtradb-cluster:8.0.19-10.1\",\"podDisruptionBudget\":{\"maxUnavailable\":1},\"resources\":{\"requests\":null},\"size\":5,\"volumeSpec\":{\"persistentVolumeClaim\":{\"resources\":{\"requests\":{\"storage\":\"6Gi\"}}}}},\"secretsName\":\"my-cluster-secrets\",\"sslInternalSecretName\":\"my-cluster-ssl-internal\",\"sslSecretName\":\"my-cluster-ssl\",\"vaultSecretName\":\"keyring-secret-vault\"},\"status\":{\"conditions\":[{\"lastTransitionTime\":\"2020-05-27T22:23:58Z\",\"status\":\"True\",\"type\":\"Initializing\"},{\"lastTransitionTime\":\"2020-05-27T22:25:43Z\",\"status\":\"True\",\"type\":\"Ready\"}],\"host\":\"cluster1-proxysql.default\",\"observedGeneration\":1,\"proxysql\":{\"ready\":3,\"size\":5,\"status\":\"ready\"},\"pxc\":{\"ready\":3,\"size\":5,\"status\":\"ready\"},\"state\":\"ready\"}}\n"
      },
      "creationTimestamp":"2020-05-27T22:23:58Z",
      "finalizers":[
         "delete-pxc-pods-in-order"
      ],
      "generation":6,
      "managedFields":[
         {
            "apiVersion":"pxc.percona.com/v1-5-0",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:metadata":{
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
                  "f:vaultSecretName":{

                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-05-27T22:23:58Z"
         },
         {
            "apiVersion":"pxc.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:metadata":{
                  "f:annotations":{
                     ".":{

                     },
                     "f:kubectl.kubernetes.io/last-applied-configuration":{

                     }
                  }
               },
               "f:spec":{
                  "f:backup":{
                     "f:image":{

                     }
                  },
                  "f:proxysql":{
                     "f:size":{

                     }
                  },
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
            "time":"2020-05-27T23:38:49Z"
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
                  "f:message":{

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
                     "f:message":{

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
            "time":"2020-05-28T10:42:00Z"
         }
      ],
      "name":"cluster1",
      "namespace":"default",
      "resourceVersion":"35660",
      "selfLink":"/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1",
      "uid":"e9115e2a-49df-4ebf-9dab-fa5a550208d3"
   },
   "spec":{
      "allowUnsafeConfigurations":true,
      "backup":{
         "image":"percona/percona-xtradb-cluster-operator:1.5.0-pxc8.0-debug-backup",
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
         "image":"percona/percona-xtradb-cluster-operator:1.5.0-pxc8.0-debug",
         "podDisruptionBudget":{
            "maxUnavailable":1
         },
         "resources":{

         },
         "size":3,
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
      "vaultSecretName":"keyring-secret-vault"
   },
   "status":{
      "conditions":[
         {
            "lastTransitionTime":"2020-05-27T22:25:43Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-05-27T23:06:48Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-05-27T23:08:58Z",
            "message":"ProxySQL upgrade error: context deadline exceeded",
            "reason":"ErrorReconcile",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-05-27T23:08:59Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-05-27T23:29:59Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-05-27T23:30:04Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-05-27T23:35:27Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-05-27T23:35:42Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-05-27T23:47:00Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-05-27T23:47:05Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-05-28T09:58:25Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-05-28T09:58:31Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-05-28T10:03:54Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-05-28T10:04:14Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-05-28T10:15:28Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-05-28T10:15:38Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-05-28T10:26:56Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-05-28T10:27:01Z",
            "status":"True",
            "type":"Initializing"
         },
         {
            "lastTransitionTime":"2020-05-28T10:38:28Z",
            "status":"True",
            "type":"Ready"
         },
         {
            "lastTransitionTime":"2020-05-28T10:38:33Z",
            "status":"True",
            "type":"Initializing"
         }
      ],
      "host":"cluster1-proxysql.default",
      "message":[
         "PXC: pxc: back-off 5m0s restarting failed container=pxc pod=cluster1-pxc-1_default(5b9b16e6-d0f8-4c97-a2d0-294feb9d014b); pxc: back-off 5m0s restarting failed container=pxc pod=cluster1-pxc-2_default(b8ebedd7-42f0-440b-aa5e-509d28926a5e); pxc: back-off 5m0s restarting failed container=pxc pod=cluster1-pxc-4_default(2dce12f2-9ebc-419c-a92a-9cec68912004); "
      ],
      "observedGeneration":6,
      "proxysql":{
         "ready":3,
         "size":3,
         "status":"ready"
      },
      "pxc":{
         "message":"pxc: back-off 5m0s restarting failed container=pxc pod=cluster1-pxc-1_default(5b9b16e6-d0f8-4c97-a2d0-294feb9d014b); pxc: back-off 5m0s restarting failed container=pxc pod=cluster1-pxc-2_default(b8ebedd7-42f0-440b-aa5e-509d28926a5e); pxc: back-off 5m0s restarting failed container=pxc pod=cluster1-pxc-4_default(2dce12f2-9ebc-419c-a92a-9cec68912004); ",
         "ready":2,
         "size":3,
         "status":"initializing"
      },
      "state":"initializing"
   }
}
```
