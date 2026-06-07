from pyspark.sql import SparkSession

from loaders.mock_loader import load_orders

from analysis.tendencias_consumo import (
    analizar_tendencias_consumo
)

from analysis.horarios_pico import (
    analizar_horarios_pico
)

from analysis.crecimiento_mensual import (
    analizar_crecimiento_mensual
)


def main():

    spark = (
        SparkSession.builder
        .appName("RestaurantAnalytics")
        .getOrCreate()
    )

    orders_df = load_orders(spark)

    print("\n===== DATOS DE PEDIDOS =====")
    orders_df.show()

    print("\n===== TENDENCIAS DE CONSUMO =====")
    tendencias_df = analizar_tendencias_consumo(
        orders_df
    )
    tendencias_df.show()

    print("\n===== HORARIOS PICO =====")
    horarios_df = analizar_horarios_pico(
        orders_df
    )
    horarios_df.show()

    print("\n===== CRECIMIENTO MENSUAL =====")
    crecimiento_df = analizar_crecimiento_mensual(
        orders_df
    )
    crecimiento_df.show()

    spark.stop()


if __name__ == "__main__":
    main()