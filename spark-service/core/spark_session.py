from pyspark.sql import SparkSession


def create_spark():
    return (
        SparkSession.builder
        .appName("RestaurantAnalytics")
        .config("spark.sql.warehouse.dir", "/opt/hive/data/warehouse")
        .config("spark.hadoop.hive.metastore.uris", "thrift://hive-metastore:9083")
        .config("spark.sql.hive.metastore.version", "3.1.3")
        .config("spark.sql.hive.metastore.jars", "maven")
        .enableHiveSupport()
        .getOrCreate()
    )
    