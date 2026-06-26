from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.bash import BashOperator


default_args = {
    "owner": "fabricio",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="restaurant_oltp_to_dw_etl",
    description="ETL desde PostgreSQL OLTP hacia Hive Data Warehouse usando Spark",
    default_args=default_args,
    start_date=datetime(2026, 6, 26),
    schedule_interval="0 */6 * * *",
    catchup=False,
    tags=["postgres", "spark", "hive", "dw"],
) as dag:

    check_postgres_oltp = BashOperator(
        task_id="check_postgres_oltp",
        bash_command="""
        set -e

        echo 'Verificando PostgreSQL OLTP...'

        nc -z postgres_db 5432

        echo 'PostgreSQL OLTP disponible y aceptando conexiones en el puerto 5432.'
        """,
    )
    run_spark_etl = BashOperator(
        task_id="run_spark_etl",
        bash_command="""
        set -e

        echo 'Ejecutando transformación ETL con Spark...'

        docker exec spark-service spark-submit \
        --packages org.postgresql:postgresql:42.7.3 \
        /app/jobs/restaurant_etl_spark.py

        echo 'Transformación Spark completada.'
        """,
    )

    load_data_to_hive = BashOperator(
        task_id="load_data_to_hive",
        bash_command="""

        set -e
        echo 'Cargando datos transformados en Hive...'

        docker exec hive-server beeline -u jdbc:hive2://localhost:10000/restaurant_dw -e "
        LOAD DATA LOCAL INPATH '/tmp/etl_data/dw_output/dim_time.csv' INTO TABLE dim_time;
        LOAD DATA LOCAL INPATH '/tmp/etl_data/dw_output/dim_user.csv' INTO TABLE dim_user;
        LOAD DATA LOCAL INPATH '/tmp/etl_data/dw_output/dim_product.csv' INTO TABLE dim_product;
        LOAD DATA LOCAL INPATH '/tmp/etl_data/dw_output/dim_restaurant.csv' INTO TABLE dim_restaurant;
        LOAD DATA LOCAL INPATH '/tmp/etl_data/dw_output/dim_location.csv' INTO TABLE dim_location;
        LOAD DATA LOCAL INPATH '/tmp/etl_data/dw_output/fact_orders.csv' INTO TABLE fact_orders;
        "

        echo 'Carga en Hive completada.'
        """,
    )

    validate_dw = BashOperator(
        task_id="validate_dw",
        bash_command="""
        echo 'Validando tablas del Data Warehouse...'

        docker exec hive-server beeline -u jdbc:hive2://localhost:10000/restaurant_dw -e "
        SELECT COUNT(*) AS total_dim_time FROM dim_time;
        SELECT COUNT(*) AS total_dim_user FROM dim_user;
        SELECT COUNT(*) AS total_dim_product FROM dim_product;
        SELECT COUNT(*) AS total_dim_restaurant FROM dim_restaurant;
        SELECT COUNT(*) AS total_dim_location FROM dim_location;
        SELECT COUNT(*) AS total_fact_orders FROM fact_orders;
        "

        echo 'Validación completada.'
        """,
    )

    check_postgres_oltp >> run_spark_etl >> load_data_to_hive >> validate_dw