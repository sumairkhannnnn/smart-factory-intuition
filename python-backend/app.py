from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent
DATA_FILE = ROOT_DIR / "data" / "factory_data.json"


def normalize_status(value: str | None) -> str:
    status = (value or "healthy").strip().lower()
    if status not in {"healthy", "warning", "critical"}:
        return "healthy"
    return status


def load_factory_data() -> dict[str, Any]:
    if not DATA_FILE.exists():
        return {
            "machines": [],
            "alerts": [],
            "maintenance": [],
            "summary": {
                "uptime": 98.7,
                "output": 12420,
                "efficiency": 93.5,
                "activeAlerts": 0,
            },
        }

    with DATA_FILE.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    machines = data.get("machines", [])
    alerts = data.get("alerts", [])
    maintenance = data.get("maintenance", [])

    for machine in machines:
        machine["status"] = normalize_status(machine.get("status"))

    for alert in alerts:
        alert["status"] = normalize_status(alert.get("status"))

    for item in maintenance:
        item["status"] = normalize_status(item.get("status"))

    return {
        "machines": machines,
        "alerts": alerts,
        "maintenance": maintenance,
        "summary": data.get("summary", {}),
    }


FACTORY_DATA = load_factory_data()
SEVERITY_RANK = {"healthy": 0, "warning": 1, "critical": 2}


def get_required_api_key() -> str:
    return os.getenv("SMART_FACTORY_API_KEY", "demo-key")


def is_authorized(headers: dict[str, str]) -> bool:
    expected = get_required_api_key()
    if expected == "demo-key":
        return True

    provided = headers.get("X-API-Key") or headers.get("Authorization", "")
    if provided.startswith("Bearer "):
        provided = provided.split(" ", 1)[1]

    return provided == expected


def build_assistant_reply(question: str, history: list[dict[str, Any]], data: dict[str, Any]) -> dict[str, Any]:
    normalized_question = (question or "").strip().lower()
    machines = data.get("machines", [])
    alerts = data.get("alerts", [])
    maintenance = data.get("maintenance", [])
    summary = data.get("summary", {})

    recent_context = ""
    if history:
        recent_context = " ".join(str(item.get("content", "")) for item in history[-3:] if isinstance(item, dict))

    if any(keyword in normalized_question for keyword in ["risk", "critical", "danger"]):
        ranked_machines = sorted(
            machines,
            key=lambda machine: (
                SEVERITY_RANK.get(machine.get("status", "healthy"), 0),
                -(machine.get("downtimeMinutes", 0)),
            ),
            reverse=True,
        )
        best = ranked_machines[0] if ranked_machines else None
        if best:
            reply = (
                f"{best['name']} is the highest-risk asset right now with status {best['status']} "
                f"and {best.get('downtimeMinutes', 0)} minutes of downtime."
            )
        else:
            reply = "No machines are currently flagged as at risk."
        return {"reply": reply, "contextUsed": {"machines": len(machines), "alerts": len(alerts)}}

    if any(keyword in normalized_question for keyword in ["downtime", "down", "stop", "production"]):
        active_alerts = [alert for alert in alerts if alert.get("status") == "critical"]
        if active_alerts:
            top_alert = active_alerts[0]
            reply = (
                f"Production risk is concentrated around {top_alert.get('machine', 'the main line')} "
                f"with the alert: {top_alert.get('message', 'No detail available')}."
            )
        else:
            reply = "No critical production interruptions are currently active."
        return {"reply": reply, "contextUsed": {"alerts": len(alerts)}}

    if any(keyword in normalized_question for keyword in ["maintenance", "recommend", "service"]):
        pending_items = maintenance[:3]
        if pending_items:
            details = "; ".join(
                f"{item.get('machine', 'Unknown')} ({item.get('status', 'healthy')})" for item in pending_items
            )
            reply = f"Recommended maintenance focus: {details}."
        else:
            reply = "No maintenance actions are currently queued."
        return {"reply": reply, "contextUsed": {"maintenance": len(maintenance)}}

    if any(keyword in normalized_question for keyword in ["summary", "overview", "status"]):
        reply = (
            f"Current overview: uptime is {summary.get('uptime', 0)}%, output is {summary.get('output', 0)}, "
            f"efficiency is {summary.get('efficiency', 0)}%, and {summary.get('activeAlerts', 0)} alerts are active."
        )
        return {"reply": reply, "contextUsed": {"summary": True}}

    if recent_context:
        reply = (
            f"Based on the recent conversation context, the most relevant action is to review the active alerts "
            f"and prioritise corrective steps for the current production window."
        )
    else:
        reply = (
            "The factory is operating steadily. Review the active alerts and maintenance queue for any items that require attention."
        )

    return {"reply": reply, "contextUsed": {"machines": len(machines), "alerts": len(alerts)}}


class AssistantRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        return

    def _send_json(self, status_code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            return {}
        raw_body = self.rfile.read(content_length).decode("utf-8")
        return json.loads(raw_body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send_json(204, {})

    def do_GET(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path == "/health":
            self._send_json(200, {"status": "ok", "service": "smart-factory-python-backend"})
            return
        if path == "/":
            self._send_json(200, {"message": "Smart Factory Python backend is running."})
            return
        self._send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path != "/api/assistant":
            self._send_json(404, {"error": "Not found"})
            return

        headers = {key: value for key, value in self.headers.items()}
        if not is_authorized(headers):
            self._send_json(401, {"error": "Invalid or missing API key."})
            return

        try:
            payload = self._read_json()
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Request body must be valid JSON."})
            return

        question = payload.get("question", "")
        history = payload.get("history", [])
        if not isinstance(history, list):
            history = []

        reply_payload = build_assistant_reply(question, history, FACTORY_DATA)
        self._send_json(200, {"status": "ok", **reply_payload})


def main() -> None:
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), AssistantRequestHandler)
    print(f"Smart Factory backend listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down backend.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
