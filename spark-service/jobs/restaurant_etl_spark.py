import os
import shutil
import glob

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    year,
    month,
    dayofmonth,
    hour,
    to_timestamp,
    date_format,
)


# CONFIGURACIÓN DE POSTGRESQL OLTP


POSTGRES_HOST = os.getenv("PG_HOST", "db")
POSTGRES_PORT = os.getenv("PG_PORT", "5432")
POSTGRES_DB = os.getenv("PG_DB", "restaurant")
POSTGRES_USER = os.getenv("PG_USER", "admin")
POSTGRES_PASSWORD = os.getenv("PG_PASSWORD", "admin123")

POSTGRES_URL = f"jdbc:postgresql://{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
POSTGRES_DRIVER = "org.postgresql.Driver"

# Carpeta compartida entre spark-service y hive-server
OUTPUT_BASE_PATH = "/tmp/etl_data/dw_output"


def read_postgres_table(spark, table_name):
    """
    Lee una tabla desde PostgreSQL usando JDBC.
    """
    return (
        spark.read
        .format("jdbc")
        .option("url", POSTGRES_URL)
        .option("dbtable", table_name)
        .option("user", POSTGRES_USER)
        .option("password", POSTGRES_PASSWORD)
        .option("driver", POSTGRES_DRIVER)
        .load()
    )


import os
import shutil
import glob


def write_single_csv(df, output_file):
    """
    Spark escribe CSV como carpeta con part-0000.
    Esta función genera primero una carpeta temporal,
    toma el part-*.csv y lo renombra como un archivo CSV final.
    """

    temp_dir = output_file + "_tmp"

    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

    if os.path.exists(output_file):
        os.remove(output_file)

    (
        df.coalesce(1)
        .write
        .mode("overwrite")
        .option("header", "false")
        .option("delimiter", ",")
        .csv(temp_dir)
    )

    part_files = glob.glob(os.path.join(temp_dir, "part-*.csv"))

    if not part_files:
        raise Exception(f"No se generó archivo CSV en {temp_dir}")

    shutil.move(part_files[0], output_file)

    shutil.rmtree(temp_dir)

    print(f"Archivo generado: {output_file}")

def main():
    spark = (
        SparkSession.builder
        .appName("Restaurant OLTP to Data Warehouse ETL")
        .getOrCreate()
    )

    print("Conectando a PostgreSQL OLTP...")
    print(f"URL JDBC: {POSTGRES_URL}")


    # 1. EXTRACCIÓN DESDE POSTGRESQL OLTP


    roles = read_postgres_table(spark, "roles")
    users = read_postgres_table(spark, "users")
    restaurants = read_postgres_table(spark, "restaurants")
    menus = read_postgres_table(spark, "menus")
    products = read_postgres_table(spark, "products")
    orders = read_postgres_table(spark, "orders")
    order_items = read_postgres_table(spark, "order_items")
    user_locations = read_postgres_table(spark, "user_locations")


    # 2. TRANSFORMACIÓN AL MODELO DIMENSIONAL


    # -------------------------
    # DIM_USER
    # Hive:
    # user_id INT,
    # name STRING,
    # role_name STRING
    # -------------------------

    dim_user = (
        users.alias("u")
        .join(
            roles.alias("r"),
            col("u.role_id") == col("r.id"),
            "left"
        )
        .select(
            col("u.id").cast("int").alias("user_id"),
            col("u.name").alias("name"),
            col("r.name").alias("role_name")
        )
        .dropDuplicates(["user_id"])
    )

    # -------------------------
    # DIM_RESTAURANT
    # Hive:
    # restaurant_id INT,
    # restaurant_name STRING
    # -------------------------

    dim_restaurant = (
        restaurants
        .select(
            col("id").cast("int").alias("restaurant_id"),
            col("name").alias("restaurant_name")
        )
        .dropDuplicates(["restaurant_id"])
    )

    # -------------------------
    # DIM_PRODUCT
    # Hive actualizado:
    # product_id INT,
    # product_name STRING,
    # product_category STRING,
    # price DOUBLE
    #
    # Tu tabla products no tiene category.
    # Por eso usamos menus.name como product_category.
    # -------------------------

    dim_product = (
        products.alias("p")
        .join(
            menus.alias("m"),
            col("p.menu_id") == col("m.id"),
            "left"
        )
        .select(
            col("p.id").cast("int").alias("product_id"),
            col("p.name").alias("product_name"),
            col("m.name").alias("product_category"),
            col("p.price").cast("double").alias("price")
        )
        .dropDuplicates(["product_id"])
    )

    # -------------------------
    # DIM_LOCATION
    # Hive:
    # user_id INT,
    # latitude DOUBLE,
    # longitude DOUBLE,
    # address STRING
    # -------------------------

    dim_location = (
        user_locations
        .select(
            col("user_id").cast("int").alias("user_id"),
            col("latitude").cast("double").alias("latitude"),
            col("longitude").cast("double").alias("longitude"),
            col("address").alias("address")
        )
        .dropDuplicates(["user_id"])
    )

    # -------------------------
    # DIM_TIME
    # Hive:
    # time_id INT,
    # full_date STRING,
    # day INT,
    # month INT,
    # year INT,
    # hour INT
    #
    # Usamos orders.id como time_id para que coincida
    # con fact_orders.time_id.
    # -------------------------

    orders_with_time = (
        orders
        .withColumn("created_ts", to_timestamp(col("created_at")))
    )

    dim_time = (
        orders_with_time
        .select(
            col("id").cast("int").alias("time_id"),
            date_format(col("created_ts"), "yyyy-MM-dd").alias("full_date"),
            dayofmonth(col("created_ts")).cast("int").alias("day"),
            month(col("created_ts")).cast("int").alias("month"),
            year(col("created_ts")).cast("int").alias("year"),
            hour(col("created_ts")).cast("int").alias("hour")
        )
        .dropDuplicates(["time_id"])
    )

    # -------------------------
    # FACT_ORDERS
    # Hive:
    # order_id INT,
    # time_id INT,
    # user_id INT,
    # restaurant_id INT,
    # product_id INT,
    # quantity INT,
    # total_amount DOUBLE
    #
    # total_amount se calcula con:
    # order_items.quantity * order_items.price
    # -------------------------

    fact_orders = (
        orders_with_time.alias("o")
        .join(
            order_items.alias("oi"),
            col("o.id") == col("oi.order_id"),
            "inner"
        )
        .select(
            col("o.id").cast("int").alias("order_id"),
            col("o.id").cast("int").alias("time_id"),
            col("o.user_id").cast("int").alias("user_id"),
            col("o.restaurant_id").cast("int").alias("restaurant_id"),
            col("oi.product_id").cast("int").alias("product_id"),
            col("oi.quantity").cast("int").alias("quantity"),
            (col("oi.quantity") * col("oi.price")).cast("double").alias("total_amount")
        )
    )


    # 3. ESCRITURA DE ARCHIVOS PARA HIVE


    print("Escribiendo archivos transformados para Hive...")

    write_single_csv(dim_time, f"{OUTPUT_BASE_PATH}/dim_time.csv")
    write_single_csv(dim_user, f"{OUTPUT_BASE_PATH}/dim_user.csv")
    write_single_csv(dim_product, f"{OUTPUT_BASE_PATH}/dim_product.csv")
    write_single_csv(dim_restaurant, f"{OUTPUT_BASE_PATH}/dim_restaurant.csv")
    write_single_csv(dim_location, f"{OUTPUT_BASE_PATH}/dim_location.csv")
    write_single_csv(fact_orders, f"{OUTPUT_BASE_PATH}/fact_orders.csv")

    print("ETL finalizado correctamente.")
    print(f"Archivos generados en: {OUTPUT_BASE_PATH}")

    spark.stop()


if __name__ == "__main__":
    main()