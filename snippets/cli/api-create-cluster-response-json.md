```json
{
   "apiVersion":"pxc.percona.com/v1-5-0",
   "kind":"PerconaXtraDBCluster",
   "metadata":{
      "creationTimestamp":"2020-05-27T22:23:58Z",
      "finalizers":[
         "delete-pxc-pods-in-order"
      ],
      "generation":1,
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
                     "f:enabled":{

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
                        ".":{

                        },
                        "f:requests":{

                        }
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
                     "f:image":{

                     },
                     "f:podDisruptionBudget":{
                        ".":{

                        },
                        "f:maxUnavailable":{

                        }
                     },
                     "f:resources":{
                        ".":{

                        },
                        "f:requests":{

                        }
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
         }
      ],
      "name":"cluster1",
      "namespace":"default",
      "resourceVersion":"8694",
      "selfLink":"/apis/pxc.percona.com/v1-5-0/namespaces/default/perconaxtradbclusters/cluster1",
      "uid":"e9115e2a-49df-4ebf-9dab-fa5a550208d3"
   },
   "spec":{
      "allowUnsafeConfigurations":false,
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
         "image":"percona/percona-xtradb-cluster:8.0.19-10.1",
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
   }
}
```
