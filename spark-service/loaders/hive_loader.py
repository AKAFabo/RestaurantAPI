def load_fact_orders(spark):

    spark.sql("USE restaurant_dw")

    return spark.sql("""
        SELECT *
        FROM fact_orders
    """)