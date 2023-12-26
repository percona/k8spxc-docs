# Insert sample data 

In this tutorial you will learn to insert sample data to Percona Server for MySQL.

We will enter SQL statements via the same MySQL shell we used to [connect to the database](https://github.com/percona/k8spxc-docs/).
{.power-number}

1. Let's create a separate database for our experiments:

    ```mysql
    CREATE DATABASE mydb;
    use mydb;
    ```

   ??? example "Output"

        ```text
        ...
        ```

2. Now let's create a table which we will later fill with some sample data: 

    ```mysql
    CREATE TABLE extraordinary_gentlemen (
        id int NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        occupation varchar(255),
        PRIMARY KEY (id)
    );
    ```

   ??? example "Output"

        ```text
        ...
        ```
   
3. Adding data to the newly created table will look as follows:

    ```mysql
    INSERT INTO `extraordinary_gentlemen` (`name`,`occupation`)
      VALUES
      ("Allan Quartermain","hunter"),
      ("Nemo","clownfish"),
      ("Dorian Gray", NULL),
      (“Tom Sawyer”, “secret service agent”);
    ```

    ??? example "Output"

        ```text
        ...
        ```

4. Query the collection to verify the data insertion

    ```mysql
    SELECT *
    FROM `extraordinary_gentlemen`;
    ```

   ??? example "Output"

        ```text
        ...
        ```
   
5. Updating data in the database would be not much more difficult:

    ```mysql
    UPDATE  `extraordinary_gentlemen`
       SET occupation = 'submariner'
    WHERE name = “Nemo”;
    ```

   ??? example "Output"

        ```text
        ...
        ```
   
## Next steps

[Make a backup :material-arrow-right:](backup-tutorial.md){.md-button}   
