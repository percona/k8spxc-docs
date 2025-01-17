# 3. Insert sample data 

In this tutorial you will learn to insert sample data to Percona Server for MySQL.

We will enter SQL statements via the same MySQL shell we used to [connect to the database :octicons-link-external-16:](https://github.com/percona/k8spxc-docs/).
{.power-number}

1. Let's create a separate database for our experiments:

    ```mysql
    CREATE DATABASE mydb;
    use mydb;
    ```

    ??? example "Output"

        ```text
        Query OK, 1 row affected (0.01 sec)
        Database changed
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
        Query OK, 0 rows affected (0.04 sec)
        ```
   
3. Adding data to the newly created table will look as follows:

    ```mysql
    INSERT INTO extraordinary_gentlemen (name, occupation)
      VALUES
      ("Allan Quartermain","hunter"),
      ("Nemo","fish"),
      ("Dorian Gray", NULL),
      ("Tom Sawyer", "secret service agent");
    ```

    ??? example "Output"

        ```text
        Query OK, 4 rows affected (0.01 sec)
        Records: 4  Duplicates: 0  Warnings: 0
        ```

4. Query the collection to verify the data insertion

    ```mysql
    SELECT *
    FROM extraordinary_gentlemen;
    ```

    ???+ example "Output"

        ```text
        +----+-------------------+----------------------+
        | id | name              | occupation           |
        +----+-------------------+----------------------+
        |  1 | Allan Quartermain | hunter               |
        |  2 | Nemo              | fish                 |
        |  3 | Dorian Gray       | NULL                 |
        |  4 | Tom Sawyer        | secret service agent |
        +----+-------------------+----------------------+
        ```

5. Updating data in the database would be not much more difficult:

    ```mysql
    UPDATE  extraordinary_gentlemen
       SET occupation = "submariner"
    WHERE name = "Nemo";
    ```

    ??? example "Output"

        ```text
        Query OK, 1 row affected (0.00 sec)
        Rows matched: 1  Changed: 1  Warnings: 0
        ```

6. Now if you repeat the SQL statement from step 4, you will see the changes
    take effect:

    ```mysql
    SELECT *
    FROM extraordinary_gentlemen;
    ```

    ???+ example "Output"

        ```text
        +----+-------------------+----------------------+
        | id | name              | occupation           |
        +----+-------------------+----------------------+
        |  1 | Allan Quartermain | hunter               |
        |  2 | Nemo              | submariner           |
        |  3 | Dorian Gray       | NULL                 |
        |  4 | Tom Sawyer        | secret service agent |
        +----+-------------------+----------------------+
        ```

## Next steps

[Make a backup :material-arrow-right:](backup-tutorial.md){.md-button}
