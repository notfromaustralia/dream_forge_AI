.PHONY: dev up down seed migrate backend frontend mcp

dev:
	docker compose up --build

up:
	docker compose up -d

down:
	docker compose down

seed:
	cd backend && python -m app.demo.seed

migrate:
	cd backend && alembic upgrade head

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

mcp:
	cd mcp-server && npx tsx index.ts
