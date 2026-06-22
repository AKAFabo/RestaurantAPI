from fastapi import APIRouter
from core.spark_session import create_spark
from services.analytics_service import (
    get_consumption,
    get_peak_hours,
    get_monthly_growth
)

router = APIRouter()
spark = create_spark()


@router.get("/analytics/consumption")
def consumption():
    df = get_consumption(spark)
    return df.toPandas().to_dict(orient="records")


@router.get("/analytics/peak-hours")
def peak_hours():
    df = get_peak_hours(spark)
    return df.toPandas().to_dict(orient="records")


@router.get("/analytics/monthly-growth")
def monthly_growth():
    df = get_monthly_growth(spark)
    return df.toPandas().to_dict(orient="records")