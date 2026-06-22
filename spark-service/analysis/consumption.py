import os

def run_consumption_analysis(spark):

    df = spark.sql("""
        SELECT
            p.product_name,
            SUM(f.quantity) AS total_vendido
        FROM restaurant_dw.fact_orders f
        JOIN restaurant_dw.dim_product p
            ON f.product_id = p.product_id
        GROUP BY p.product_name
        ORDER BY total_vendido DESC
    """)

    print("\nTENDENCIAS DE CONSUMO")
    df.show(truncate=False)

    output_path = "outputs/consumption"

    df.write.mode("overwrite").option("header", True).csv(output_path)

    return df