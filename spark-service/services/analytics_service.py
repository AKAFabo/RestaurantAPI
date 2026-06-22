from analysis.consumption import run_consumption_analysis
from analysis.peak_hours import run_peak_hours
from analysis.monthly_growth import run_monthly_growth
import sys

print("PATH:", sys.path)

import os

print("ANALYSIS EXISTS:", os.path.exists("/app/analysis"))
print("ANALYSIS FILES:", os.listdir("/app/analysis"))

def get_consumption(spark):
    return run_consumption_analysis(spark)


def get_peak_hours(spark):
    return run_peak_hours(spark)


def get_monthly_growth(spark):
    return run_monthly_growth(spark)