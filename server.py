"""
Clean Car – Python Backend Server
Handles contact form submissions, user auth, email verification, and static file serving.
"""

import json
import re
import html
import os
import hashlib
import secrets
import smtplib
import logging
from http.server import HTTPServer, SimpleHTTPRequestHandler
from http import cookies
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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

# --------------- SMTP Configuration ---------------
# Set these environment variables or change defaults for email sending.
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "noreply@cleancar.de")
BASE_URL = os.environ.get("BASE_URL", f"http://{HOST}:{PORT}")

# In-memory sessions: {session_token: email}
sessions: dict[str, str] = {}

USERS_FILE = DATA_DIR / "users.json"


# --------------- Password helpers ---------------
def hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    if salt is None:
        salt = secrets.token_bytes(32)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260_000)
    return dk.hex(), salt.hex()


def verify_password(password: str, stored_hash: str, salt_hex: str) -> bool:
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 260_000)
    return secrets.compare_digest(dk.hex(), stored_hash)


# --------------- User storage ---------------
def load_users() -> list[dict]:
    if USERS_FILE.exists():
        try:
            return json.loads(USERS_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []
    return []


def save_users(users: list[dict]) -> None:
    USERS_FILE.write_text(json.dumps(users, ensure_ascii=False, indent=2), encoding="utf-8")


def find_user(email: str) -> dict | None:
    for u in load_users():
        if u["email"].lower() == email.lower():
            return u
    return None


# --------------- Email sending ---------------
def send_verification_email(to_email: str, token: str) -> bool:
    verify_link = f"{BASE_URL}/api/verify?token={token}"
    logger.info("Verification link for %s: %s", to_email, verify_link)

    if not SMTP_HOST:
        logger.warning("SMTP not configured – verification link printed to console only.")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Clean Car – E-Mail bestätigen"
        msg["From"] = SMTP_FROM
        msg["To"] = to_email

        text = f"Bitte bestätigen Sie Ihre E-Mail-Adresse:\n\n{verify_link}\n\nDer Link ist 24 Stunden gültig."
        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#0a0f1a;color:#e2e8f0;border-radius:16px;">
            <h2 style="color:#4ecdc4;">🌿 Clean Car</h2>
            <p>Bitte bestätigen Sie Ihre E-Mail-Adresse:</p>
            <a href="{verify_link}" style="display:inline-block;padding:14px 32px;background:#4ecdc4;color:#0a0f1a;border-radius:50px;text-decoration:none;font-weight:700;margin:20px 0;">E-Mail bestätigen</a>
            <p style="color:#94a3b8;font-size:0.85rem;margin-top:24px;">Der Link ist 24 Stunden gültig.</p>
        </div>
        """
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
        logger.info("Verification email sent to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send verification email: %s", e)
        return False


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

    def do_GET(self):
        if self.path.startswith("/api/verify"):
            self._handle_verify()
        elif self.path == "/api/session":
            self._handle_session_check()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/contact":
            self._handle_contact()
        elif self.path == "/api/register":
            self._handle_register()
        elif self.path == "/api/login":
            self._handle_login()
        elif self.path == "/api/logout":
            self._handle_logout()
        else:
            self._json_response(404, {"error": "Not found"})

    # ----------- Auth handlers -----------

    def _read_json_body(self) -> dict | None:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > MAX_BODY_SIZE:
            self._json_response(413, {"error": "Anfrage zu groß."})
            return None
        try:
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json_response(400, {"error": "Ungültige Anfrage."})
            return None
        if not isinstance(data, dict):
            self._json_response(400, {"error": "Ungültige Anfrage."})
            return None
        return data

    def _get_session_email(self) -> str | None:
        cookie_header = self.headers.get("Cookie", "")
        c = cookies.SimpleCookie()
        try:
            c.load(cookie_header)
        except cookies.CookieError:
            return None
        morsel = c.get("session")
        if morsel:
            return sessions.get(morsel.value)
        return None

    def _handle_register(self):
        data = self._read_json_body()
        if data is None:
            return

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        errors = []
        if not name or len(name) > 100:
            errors.append("Name ist erforderlich (max 100 Zeichen).")
        if not email or not EMAIL_RE.match(email) or len(email) > 200:
            errors.append("Gültige E-Mail-Adresse erforderlich.")
        if len(password) < 8:
            errors.append("Passwort muss mindestens 8 Zeichen lang sein.")
        if errors:
            self._json_response(422, {"errors": errors})
            return

        if find_user(email):
            self._json_response(409, {"error": "Ein Account mit dieser E-Mail existiert bereits."})
            return

        pw_hash, salt = hash_password(password)
        token = secrets.token_urlsafe(48)
        user = {
            "name": sanitize(name),
            "email": sanitize(email),
            "password_hash": pw_hash,
            "salt": salt,
            "verified": False,
            "verify_token": token,
            "created": datetime.now().isoformat(),
        }

        users = load_users()
        users.append(user)
        save_users(users)
        send_verification_email(email, token)

        logger.info("New user registered: %s", email)
        self._json_response(201, {"message": "Account erstellt! Bitte bestätigen Sie Ihre E-Mail-Adresse. Prüfen Sie Ihren Posteingang."})

    def _handle_verify(self):
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        token = params.get("token", [None])[0]

        if not token:
            self._redirect_with_msg("Ungültiger Verifizierungslink.", False)
            return

        users = load_users()
        for u in users:
            if u.get("verify_token") == token and not u.get("verified"):
                u["verified"] = True
                u["verify_token"] = ""
                save_users(users)
                logger.info("User verified: %s", u["email"])
                self._redirect_with_msg("E-Mail erfolgreich bestätigt! Sie können sich jetzt einloggen.", True)
                return

        self._redirect_with_msg("Ungültiger oder bereits verwendeter Link.", False)

    def _redirect_with_msg(self, msg: str, success: bool):
        status_param = "success" if success else "error"
        from urllib.parse import quote
        location = f"/?verify={status_param}&msg={quote(msg)}"
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def _handle_login(self):
        data = self._read_json_body()
        if data is None:
            return

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            self._json_response(400, {"error": "E-Mail und Passwort erforderlich."})
            return

        user = find_user(email)
        if not user or not verify_password(password, user["password_hash"], user["salt"]):
            self._json_response(401, {"error": "E-Mail oder Passwort falsch."})
            return

        if not user.get("verified"):
            self._json_response(403, {"error": "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse."})
            return

        token = secrets.token_urlsafe(48)
        sessions[token] = user["email"]

        self._json_response(200, {"message": "Erfolgreich eingeloggt!", "user": {"name": user["name"], "email": user["email"]}}, set_cookie=f"session={token}; Path=/; HttpOnly; SameSite=Strict")

    def _handle_logout(self):
        cookie_header = self.headers.get("Cookie", "")
        c = cookies.SimpleCookie()
        try:
            c.load(cookie_header)
        except cookies.CookieError:
            pass
        morsel = c.get("session")
        if morsel and morsel.value in sessions:
            del sessions[morsel.value]
        self._json_response(200, {"message": "Ausgeloggt."}, set_cookie="session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0")

    def _handle_session_check(self):
        email = self._get_session_email()
        if email:
            user = find_user(email)
            if user:
                self._json_response(200, {"loggedIn": True, "user": {"name": user["name"], "email": user["email"], "verified": user.get("verified", False)}})
                return
        self._json_response(200, {"loggedIn": False})

    def _handle_contact(self):
        # Require authenticated & verified user
        email = self._get_session_email()
        if not email:
            self._json_response(401, {"error": "Bitte melden Sie sich an, um eine Anfrage zu senden."})
            return
        user = find_user(email)
        if not user or not user.get("verified"):
            self._json_response(403, {"error": "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse."})
            return

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

    def _json_response(self, status: int, data: dict, set_cookie: str = ""):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        if set_cookie:
            self.send_header("Set-Cookie", set_cookie)
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
