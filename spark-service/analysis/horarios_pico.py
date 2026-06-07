from pyspark.sql import DataFrame
from pyspark.sql.functions import hour, count


def analizar_horarios_pico(
    orders_df: DataFrame
) -> DataFrame:
    """
    Identifica las horas con mayor cantidad de pedidos.
    """

    resultado = (
        orders_df
        .withColumn(
            "hora",
            hour("order_date")
        )
        .groupBy("hora")
        .agg(
            count("*").alias("cantidad_pedidos")
        )
        .orderBy(
            "cantidad_pedidos",
            ascending=False
        )
    )

    return resultado