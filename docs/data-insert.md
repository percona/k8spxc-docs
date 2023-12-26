# Insert sample data 

In this tutorial you will learn to insert sample data to Percona Server for MySQL.

MySQL provides multiple methods for data insert. We will use a `For` loop to insert some sample documents.
{.power-number}

1. Run the following command: 

    ``` {.mysql data-prompt="admin>"}
    ...
    }
    ```

    If there is no `test` collection created, MongoDB creates when inserting documents.

    ??? example "Output"

        ```{.mysql .no-copy}
        ...
        ```

2. Query the collection to verify the data insertion

    ``` {.mysql data-prompt="admin>"}
    ...
    ```

    ??? example "Output"

        ```{.mysql .no-copy}
        [
          ...
        ]
        ```

        You will have different `_id` values.

Now your cluster has some data in it.

## Next steps

[Make a backup :material-arrow-right:](backup-tutorial.md){.md-button}   
