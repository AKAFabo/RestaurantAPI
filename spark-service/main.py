from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .appName("RestaurantAnalytics")
    .config(
        "spark.hadoop.hive.metastore.uris",
        "thrift://hive-metastore:9083"
    )
    .config("spark.sql.catalogImplementation", "hive")
    .enableHiveSupport()
    .getOrCreate()
)

spark.sql("SHOW DATABASES").show()
spark.sql("SHOW TABLES IN restaurant_dw").show()

spark.stop()