.PHONY: help install test run clean lint format migrate

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	uv sync --all-extras

test: ## Run tests
	uv run python -m pytest -v

test-coverage: ## Run tests with coverage
	uv run python -m pytest --cov=config_service --cov-report=html --cov-report=term-missing

run: ## Run the development server
	uv run python -m config_service.main

run-prod: ## Run the production server
	uv run uvicorn config_service.main:app --host 0.0.0.0 --port 8000

migrate: ## Run database migrations
	uv run python -c "from config_service.migrations import migration_manager; migration_manager.run_migrations()"

migrate-status: ## Check migration status
	uv run python -c "from config_service.migrations import migration_manager; import json; print(json.dumps(migration_manager.get_migration_status(), indent=2))"

clean: ## Clean up temporary files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf dist
	rm -rf build

lint: ## Run linting
	uv run python -m ruff check .
	uv run python -m mypy config_service

format: ## Format code
	uv run python -m ruff format .
	uv run python -m ruff check --fix .

dev-setup: install ## Set up development environment
	cp .env.example .env
	@echo "Development environment set up. Please edit .env with your database configuration."

docker-build: ## Build Docker image
	docker build -t config-service .

docker-run: ## Run Docker container
	docker run -p 8000:8000 --env-file .env config-service
