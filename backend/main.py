from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes.auth import router as auth_router
from app.routes.lists import router as lists_router
from app.routes.todos import router as todos_router
from app.routes.permissions import router as permissions_router
from app.routes.tags import router as tags_router
from app.routes.activity import router as activity_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
	title="TODO List API",
	description="A RESTful API for managing TODO lists",
	version="2.0.0",
	docs_url="/docs",
	redoc_url="/redoc"
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"], 
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(lists_router)
app.include_router(todos_router)
app.include_router(permissions_router)
app.include_router(tags_router)
app.include_router(activity_router)


@app.get("/", tags=["root"])
def read_root():
	return {}


@app.get("/health", tags=["root"])
def health_check():
	return {"status": "OK"}


if __name__ == "__main__":
	import uvicorn
	uvicorn.run(app, host="0.0.0.0", port=8000)
