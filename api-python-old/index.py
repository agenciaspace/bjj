from fastapi import FastAPI
from mangum import Mangum

app = FastAPI(title="BJJ Test API")

@app.get("/")
async def root():
    return {"message": "Hello from Vercel Python!", "status": "working"}

@app.get("/api")
async def api_root():
    return {"message": "API endpoint", "test": "successful"}

handler = Mangum(app, lifespan="off")
