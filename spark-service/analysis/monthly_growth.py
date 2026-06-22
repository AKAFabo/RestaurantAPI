def run_monthly_growth(spark):

    df = spark.sql("""
        SELECT
            t.year,
            t.month,
            SUM(f.total_amount) AS ventas_totales,
            COUNT(*) AS total_pedidos
        FROM restaurant_dw.fact_orders f
        JOIN restaurant_dw.dim_time t
            ON f.time_id = t.time_id
        GROUP BY t.year, t.month
        ORDER BY t.year, t.month
    """)

    print("\nCRECIMIENTO MENSUAL")
    df.show(truncate=False)

    df.write.mode("overwrite").option("header", True).csv(
        "outputs/monthly_growth"
    )

    return df