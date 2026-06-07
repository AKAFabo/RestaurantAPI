from pyspark.sql import DataFrame
from pyspark.sql.functions import year, month, sum


def analizar_crecimiento_mensual(
    orders_df: DataFrame
) -> DataFrame:
    """
    Calcula los ingresos mensuales para analizar
    el crecimiento del negocio a lo largo del tiempo.
    """

    resultado = (
        orders_df
        .withColumn(
            "anio",
            year("order_date")
        )
        .withColumn(
            "mes",
            month("order_date")
        )
        .groupBy(
            "anio",
            "mes"
        )
        .agg(
            sum("total").alias("ingresos")
        )
        .orderBy(
            "anio",
            "mes"
        )
    )

    return resultado