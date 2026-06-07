from pyspark.sql import DataFrame
from pyspark.sql.functions import sum


def analizar_tendencias_consumo(
    orders_df: DataFrame
) -> DataFrame:
    """
    Obtiene los productos más consumidos
    según la cantidad total vendida.
    """

    resultado = (
        orders_df
        .groupBy("product_id")
        .agg(
            sum("quantity").alias("total_vendido")
        )
        .orderBy(
            "total_vendido",
            ascending=False
        )
    )

    return resultado