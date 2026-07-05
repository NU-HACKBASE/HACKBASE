.PHONY: setup install dev dev-backend dev-frontend docker-up docker-build build lint test openapi-check down logs clean

setup: install
	cp -n .env.example .env || true

install:
	npm --prefix backend install
	npm --prefix frontend install

dev:
	@echo "Run these in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

dev-backend:
	npm --prefix backend run dev

dev-frontend:
	npm --prefix frontend run dev

docker-up:
	docker compose up -d --build

docker-build:
	docker compose build

build:
	npm --prefix backend run build
	npm --prefix frontend run build

lint:
	npm --prefix backend run lint
	npm --prefix frontend run lint

test:
	npm --prefix backend run test

openapi-check:
	npm --prefix backend run openapi:check

down:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down -v
	rm -rf backend/dist frontend/dist
