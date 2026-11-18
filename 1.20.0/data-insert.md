> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/llms.txt).

# 3. Insert sample data

In this tutorial you will learn to insert sample data to Percona Server for MySQL.

We will enter SQL statements via the same MySQL shell we used to [connect to the database](https://github.com/percona/k8spxc-docs/) .

1. Let’s create a separate database for our experiments:

   ```
   CREATE DATABASE mydb;
   use mydb;
   ```

   Output

   ```
   Query OK, 1 row affected (0.01 sec)
   Database changed
   ```

1. Now let’s create a table which we will later fill with some sample data:

   ```
   CREATE TABLE extraordinary_gentlemen (
       id int NOT NULL AUTO_INCREMENT,
       name varchar(255) NOT NULL,
       occupation varchar(255),
       PRIMARY KEY (id)
   );
   ```

   Output

   ```
   Query OK, 0 rows affected (0.04 sec)
   ```

1. Adding data to the newly created table will look as follows:

   ```
   INSERT INTO extraordinary_gentlemen (name, occupation)
     VALUES
     ("Allan Quartermain","hunter"),
     ("Nemo","fish"),
     ("Dorian Gray", NULL),
     ("Tom Sawyer", "secret service agent");
   ```

   Output

   ```
   Query OK, 4 rows affected (0.01 sec)
   Records: 4  Duplicates: 0  Warnings: 0
   ```

1. Query the collection to verify the data insertion

   ```
   SELECT *
   FROM extraordinary_gentlemen;
   ```

   Output

   ```
   +----+-------------------+----------------------+
   | id | name              | occupation           |
   +----+-------------------+----------------------+
   |  1 | Allan Quartermain | hunter               |
   |  2 | Nemo              | fish                 |
   |  3 | Dorian Gray       | NULL                 |
   |  4 | Tom Sawyer        | secret service agent |
   +----+-------------------+----------------------+
   ```

1. Updating data in the database would be not much more difficult:

   ```
   UPDATE  extraordinary_gentlemen
      SET occupation = "submariner"
   WHERE name = "Nemo";
   ```

   Output

   ```
   Query OK, 1 row affected (0.00 sec)
   Rows matched: 1  Changed: 1  Warnings: 0
   ```

1. Now if you repeat the SQL statement from step 4, you will see the changes take effect:

   ```
   SELECT *
   FROM extraordinary_gentlemen;
   ```

   Output

   ```
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

[Make a backup](https://docs.percona.com/percona-operator-for-xtradb-cluster/1.20.0/backup-tutorial.html)
