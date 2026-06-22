def run_peak_hours(spark):

    df = spark.sql("""
        SELECT
            t.hour,
            COUNT(*) AS total_pedidos
        FROM restaurant_dw.fact_orders f
        JOIN restaurant_dw.dim_time t
            ON f.time_id = t.time_id
        GROUP BY t.hour
        ORDER BY total_pedidos DESC
    """)

    print("\n HORARIOS PICO")
    df.show(truncate=False)

    df.write.mode("overwrite").option("header", True).csv(
        "outputs/peak_hours"
    )

    return df