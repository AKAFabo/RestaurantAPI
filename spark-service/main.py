from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .appName("RestaurantAnalytics")
    .config("spark.sql.warehouse.dir", "/opt/hive/data/warehouse")
    .config("spark.hadoop.hive.metastore.uris", "thrift://hive-metastore:9083")
    .config("spark.sql.hive.metastore.version", "3.1.3")
    .config("spark.sql.hive.metastore.jars", "maven")
    .enableHiveSupport()
    .getOrCreate()
)

print("=== DATABASES ===")
spark.sql("SHOW DATABASES").show(truncate=False)

print("=== TABLES ===")
spark.sql("SHOW TABLES IN restaurant_dw").show(truncate=False)

print("=== FACT ORDERS ===")
spark.sql("SELECT COUNT(*) FROM restaurant_dw.fact_orders").show()

print("=== DIM PRODUCT ===")
spark.sql("SELECT COUNT(*) FROM restaurant_dw.dim_product").show()

print("=== FACT ORDERS SAMPLE ===")

spark.sql("""
SELECT *
FROM restaurant_dw.fact_orders
LIMIT 10
""").show(truncate=False)

spark.stop() 