```json
{
   "kind":"Table",
   "apiVersion":"meta.k8s.io/v1",
   "metadata":{
      "selfLink":"/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters",
      "resourceVersion":"10528"
   },
   "columnDefinitions":[
      {
         "name":"Name",
         "type":"string",
         "format":"name",
         "description":"Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names",
         "priority":0
      },
      {
         "name":"Endpoint",
         "type":"string",
         "format":"",
         "description":"Custom resource definition column (in JSONPath format): .status.host",
         "priority":0
      },
      {
         "name":"Status",
         "type":"string",
         "format":"",
         "description":"Custom resource definition column (in JSONPath format): .status.state",
         "priority":0
      },
      {
         "name":"PXC",
         "type":"string",
         "format":"",
         "description":"Ready pxc nodes",
         "priority":0
      },
      {
         "name":"proxysql",
         "type":"string",
         "format":"",
         "description":"Ready pxc nodes",
         "priority":0
      },
      {
         "name":"Age",
         "type":"date",
         "format":"",
         "description":"Custom resource definition column (in JSONPath format): .metadata.creationTimestamp",
         "priority":0
      }
   ],
   "rows":[
      {
         "cells":[
            "cluster1",
            "cluster1-proxysql.default",
            "ready",
            "3",
            "3",
            "8m37s"
         ],
         "object":{
            "kind":"PartialObjectMetadata",
            "apiVersion":"meta.k8s.io/v1",
            "metadata":{
               "name":"cluster1",
               "namespace":"default",
               "selfLink":"/apis/pxc.percona.com/v1/namespaces/default/perconaxtradbclusters/cluster1",
               "uid":"e9115e2a-49df-4ebf-9dab-fa5a550208d3",
               "resourceVersion":"10517",
               "generation":1,
               "creationTimestamp":"2020-05-27T22:23:58Z",
               "finalizers":[
                  "delete-pxc-pods-in-order"
               ],
               "managedFields":[
                  {
                     "manager":"kubectl",
                     "operation":"Update",
                     "apiVersion":"pxc.percona.com/v1-5-0",
                     "time":"2020-05-27T22:23:58Z",
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
                           "f:secretsName":{

                           },
                           "f:sslInternalSecretName":{

                           },
                           "f:sslSecretName":{

                           },
                           "f:vaultSecretName":{

                           }
                        }
                     }
                  },
                  {
                     "manager":"percona-xtradb-cluster-operator",
                     "operation":"Update",
                     "apiVersion":"pxc.percona.com/v1",
                     "time":"2020-05-27T22:32:31Z",
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
                     }
                  }
               ]
            }
         }
      }
   ]
}
```
