"""
Clean Car – Python Backend Server
Handles contact form submissions, email validation, and static file serving.
"""

import json
import re
import html
import os
import logging
from http.server import HTTPServer, SimpleHTTPRequestHandler
from datetime import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

HOST = "127.0.0.1"
PORT = 8080
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
ALLOWED_MODELS = {"basis", "premium", "sport", ""}
MAX_BODY_SIZE = 10_000  # 10 KB


def sanitize(text: str) -> str:
    """Sanitize user input to prevent XSS."""
    return html.escape(text.strip(), quote=True)


def validate_contact(data: dict) -> list[str]:
    """Validate contact form fields. Returns list of error messages."""
    errors = []
    name = data.get("name", "")
    email = data.get("email", "")
    model = data.get("model", "")
    message = data.get("message", "")

    if not name or len(name) > 100:
        errors.append("Name ist erforderlich (max 100 Zeichen).")
    if not email or not EMAIL_RE.match(email) or len(email) > 200:
        errors.append("Gültige E-Mail-Adresse erforderlich.")
    if model not in ALLOWED_MODELS:
        errors.append("Ungültiges Modell.")
    if len(message) > 2000:
        errors.append("Nachricht darf max. 2000 Zeichen lang sein.")

    return errors


def save_contact(data: dict) -> None:
    """Save contact submission to a JSON file."""
    filename = DATA_DIR / "contacts.json"
    contacts = []
    if filename.exists():
        try:
            contacts = json.loads(filename.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            contacts = []

    entry = {
        "name": sanitize(data.get("name", "")),
        "email": sanitize(data.get("email", "")),
        "model": sanitize(data.get("model", "")),
        "message": sanitize(data.get("message", "")),
        "timestamp": datetime.now().isoformat(),
    }
    contacts.append(entry)
    filename.write_text(json.dumps(contacts, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("New contact saved: %s (%s)", entry["name"], entry["email"])


class CleanCarHandler(SimpleHTTPRequestHandler):
    """Custom request handler for Clean Car website."""

    def do_POST(self):
        if self.path == "/api/contact":
            self._handle_contact()
        else:
            self._json_response(404, {"error": "Not found"})

    def _handle_contact(self):
        content_length = int(self.headers.get("Content-Length", 0))

        if content_length > MAX_BODY_SIZE:
            self._json_response(413, {"error": "Anfrage zu groß."})
            return

        try:
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json_response(400, {"error": "Ungültige Anfrage."})
            return

        if not isinstance(data, dict):
            self._json_response(400, {"error": "Ungültige Anfrage."})
            return

        errors = validate_contact(data)
        if errors:
            self._json_response(422, {"errors": errors})
            return

        try:
            save_contact(data)
        except OSError as e:
            logger.error("Failed to save contact: %s", e)
            self._json_response(500, {"error": "Server-Fehler beim Speichern."})
            return

        self._json_response(200, {"message": "Vielen Dank! Wir melden uns bald bei Ihnen."})

    def _json_response(self, status: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def translate_path(self, path):
        """Serve files from project root."""
        root = Path(__file__).parent
        # Strip query string
        clean = path.split("?")[0].split("#")[0]
        # Prevent path traversal
        safe = Path(clean.lstrip("/"))
        full = (root / safe).resolve()
        if not str(full).startswith(str(root.resolve())):
            return str(root / "index.html")
        return str(full)

    def log_message(self, format, *args):
        logger.info(format, *args)


def main():
    server = HTTPServer((HOST, PORT), CleanCarHandler)
    logger.info("🌿 Clean Car Server running at http://%s:%d", HOST, PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
