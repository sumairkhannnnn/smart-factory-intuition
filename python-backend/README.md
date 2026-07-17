# Smart Factory Python Backend

This folder contains a lightweight Python backend for the factory assistant.

## Features
- JSON-backed factory data
- Health endpoint
- Assistant endpoint protected by an API key
- Deterministic response generation based on machine, alert, and maintenance data

## Run locally

```bash
cd python-backend
python app.py
```

## Environment variables

```bash
SMART_FACTORY_API_KEY=your-api-key-here
PORT=8000
HOST=0.0.0.0
```

## Example request

```bash
curl -X POST http://127.0.0.1:8000/api/assistant \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"question":"Which machine is most at risk?","history":[]}'
```
