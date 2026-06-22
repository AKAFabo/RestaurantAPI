from fastapi import FastAPI
from api.routes import router

app = FastAPI(title="Restaurant Analytics Service")

app.include_router(router)