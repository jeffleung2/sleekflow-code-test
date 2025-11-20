# TODO List API

A RESTful API for managing TODO items built with FastAPI and PostgreSQL.

## Features

- Full CRUD operations for TODO items
- Advanced filtering by status and due date
- Flexible sorting by name, due date, or status
- PostgreSQL database with SQLAlchemy ORM
- Automatic API documentation with Swagger UI
- Pydantic validation for request/response data

## Prerequisites

- Python 3.8+
- PostgreSQL 12+

## Installation

Checkout the README.md in root folder

## Running the Application

The API will be available at:
- API: http://localhost:8000
- Swagger UI Documentation: http://localhost:8000/docs
- ReDoc Documentation: http://localhost:8000/redoc

## API Endpoints

Please checkout the Swagger UI Documentation

```python
import requests
from datetime import date, timedelta

BASE_URL = "http://localhost:8000"

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── database.py      # Database configuration and session management
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas for validation
│   ├── crud.py          # CRUD operations
│   └── routes.py        # API route handlers
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env.example         # Example environment variables
└── README.md           # This file
```
## Response Examples

### Single TODO Response
```json
{
  "id": 1,
  "name": "Complete project documentation",
  "description": "Write comprehensive README and API docs",
  "due_date": "2025-12-31",
  "status": "In Progress",
  "created_at": "2025-11-19T10:30:00Z",
  "updated_at": "2025-11-19T15:45:00Z"
}
```

### List Response with Pagination
```json
{
  "total": 25,
  "items": [
    {
      "id": 1,
      "name": "Task 1",
      "description": "Description 1",
      "due_date": "2025-11-20",
      "status": "Not Started",
      "created_at": "2025-11-19T10:00:00Z",
      "updated_at": null
    },
    {
      "id": 2,
      "name": "Task 2",
      "description": "Description 2",
      "due_date": "2025-11-21",
      "status": "In Progress",
      "created_at": "2025-11-19T11:00:00Z",
      "updated_at": "2025-11-19T12:00:00Z"
    }
  ]
}
```

## Error Handling

The API returns standard HTTP status codes:
- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error

## License

MIT License

## Author

Jeff