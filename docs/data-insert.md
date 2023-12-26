# Insert sample data 

In this tutorial you will learn to insert sample data to Percona Server for MySQL.

MySQL provides multiple methods for data insert. We will use a `For` loop to insert some sample documents.
{.power-number}

1. Run the following command: 

    ```mysql
    CREATE TABLE extraordinary_gentlemen (
        id int NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        occupation varchar(255),
        PRIMARY KEY (id)
    );
    ```

    If there is no `test` collection created, MongoDB creates when inserting documents.





    ??? example "Output"

        ```mysql
        ...
        ```

2. Query the collection to verify the data insertion

    ```mysql
    INSERT INTO `extraordinary_gentlemen` (`name`,`occupation`)
      VALUES
      ("Allan Quartermain","hunter"),
      ("Nemo","clownfish"),
      ("Dorian Gray", NULL),
      (“Tom Sawyer”, “secret service agent”);
    ```


    ``` {.mysql data-prompt="admin>"}
    UPDATE  `extraordinary_gentlemen`
       SET occupation = 'submariner'
    WHERE name = “Nemo”;
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
