from pyspark.sql import SparkSession
from pyspark.sql import DataFrame
from pyspark.sql.functions import to_timestamp


def load_orders(spark: SparkSession) -> DataFrame:
    """
    Carga datos temporales de pedidos para
    ejecutar los análisis Spark.
    """

    data = [
        (1, 1, 2, 15000.0, "2026-01-10 12:30:00"),
        (2, 2, 1, 8000.0, "2026-01-10 13:15:00"),
        (3, 1, 3, 22500.0, "2026-02-15 19:00:00"),
        (4, 3, 1, 12000.0, "2026-02-20 20:10:00"),
        (5, 2, 4, 32000.0, "2026-03-05 12:45:00")
    ]

    columns = [
        "order_id",
        "product_id",
        "quantity",
        "total",
        "order_date"
    ]

    df = spark.createDataFrame(data, columns)

    # Convertir string -> timestamp
    df = df.withColumn(
        "order_date",
        to_timestamp("order_date")
    )

    return df