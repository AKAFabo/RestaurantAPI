import sys
import os

sys.path.insert(0, os.path.abspath("/app"))

print("PATH:", sys.path)


print("FILES IN /app:", os.listdir("/app"))
print("FILES IN /app/analysis:", os.listdir("/app/analysis"))

from services.analytics_service import (
    get_consumption,
    get_peak_hours,
    get_monthly_growth
)
from core.spark_session import create_spark



def show(df, title):
    print("\n" + "=" * 70)
    print(f"{title}")
    print("=" * 70)
    df.show(truncate=False)


def main():
    spark = create_spark()

    show(get_consumption(spark), " TENDENCIAS DE CONSUMO")
    show(get_peak_hours(spark), "HORARIOS PICO")
    show(get_monthly_growth(spark), "CRECIMIENTO MENSUAL")
    spark.sql("""
    SELECT *
    FROM restaurant_dw.dim_product
    """).show(50, truncate=False)
    spark.stop()


if __name__ == "__main__":
    main()