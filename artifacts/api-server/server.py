import json
import base64
import hashlib
import hmac
import os
import re
import smtplib
import sqlite3
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
DB_FILE = DATA_DIR / "toolorder.db"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

def configured_origins():
    return [
        origin.strip().rstrip("/")
        for origin in os.environ.get("API_ALLOWED_ORIGINS", "").split(",")
        if origin.strip() and origin.strip() != "*"
    ]


CORS(
    app,
    origins=configured_origins(),
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

AUTH_TOKEN_TTL_SECONDS = 30 * 60
LOGIN_WINDOW_SECONDS = 5 * 60
LOGIN_MAX_ATTEMPTS = 5
ORDER_WINDOW_SECONDS = 60
ORDER_MAX_ATTEMPTS = 10
MAX_FILES_PER_ORDER = 10
MAX_FILE_SIZE = 45 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    ".pdf", ".dxf", ".dwg", ".step", ".stp", ".ai", ".zip",
    ".jpg", ".jpeg", ".png", ".webp", ".heic", ".svg",
}
BLOCKED_EXTENSIONS = {".html", ".htm", ".js", ".mjs", ".cjs", ".css"}
rate_limits = defaultdict(deque)

PRODUCTS = {
    "magnetic": {
        "name": "Магнитный цилиндр",
        "fields": [
            ("machine", "Марка и модель машины", "text", True),
            ("machine_photo", "Фото шильдика машины", "file", True),
            ("cylinder_id", "ID номер цилиндра Kocher+Beck / аналог другого Z", "text", False),
            ("drawing", "Чертёж магнитного цилиндра и шестерни с линейными размерами", "file", True),
            ("teeth", "Количество зубьев / Z", "number", True),
            ("tooth_module", "Модуль зуба", "select", True, ["C.P.", "D.P."]),
            ("repeat", "Раппорт", "text", True),
            ("cylinder_count", "Количество цилиндров каждого раппорта", "number", True),
        ],
    },
    "printing": {
        "name": "Формные / печатные цилиндры",
        "fields": [
            ("machine", "Марка и модель машины", "text", True),
            ("drawing", "Чертёж формного / печатного цилиндра и шестерни с линейными размерами", "file", True),
            ("teeth", "Количество зубьев / Z", "number", True),
            ("tooth_module", "Модуль зуба", "select", True, ["C.P.", "D.P."]),
            ("repeat", "Раппорт", "text", True),
            ("cylinder_count", "Количество цилиндров", "number", True),
            ("tape", "Толщина 2-х стороннего скотча, мм", "number", True),
            ("polymer", "Толщина полимера / формы, мм", "number", True),
        ],
    },
    "counterpressure": {
        "name": "Цилиндр противодавления",
        "fields": [
            ("machine", "Марка и модель машины", "text", True),
            ("drawing", "Чертёж цилиндра противодавления и шестерни с линейными размерами", "file", True),
            ("teeth", "Количество зубьев / Z", "number", True),
            ("tooth_module", "Модуль зуба", "select", True, ["C.P.", "D.P."]),
            ("repeat", "Раппорт", "text", True),
            ("shaft_count", "Количество валов", "number", True),
        ],
    },
    "solid_die": {
        "name": "Цельнометаллический вырубной цилиндр",
        "fields": [
            ("machine", "Марка и модель машины", "text", True),
            ("drawing", "Чертёж магнитного цилиндра и шестерни с линейными размерами", "file", True),
            ("repeat", "Какой раппорт / Z нужен", "text", True),
            ("die_drawing", "Чертёж вырубки / чертёж режущих кромок", "file", True),
            ("cut_type", "Тип операции", "select", True, ["Сквозная высечка", "Надсечка", "Вырубка с перфорацией"]),
            ("material", "Техническая спецификация материала", "textarea", True),
            ("sample", "Образец материала для прокаток", "file", False),
        ],
    },
    "embossing": {
        "name": "Конгревные цилиндры",
        "fields": [
            ("machine", "Марка и модель машины", "text", True),
            ("magnetic_drawing", "Чертёж магнитного цилиндра и шестерни", "file", True),
            ("counter_drawing", "Чертёж цилиндра противодавления и шестерни", "file", True),
            ("teeth", "Количество зубьев / Z магнитного цилиндра", "number", True),
            ("repeat", "Раппорт", "text", True),
            ("tape", "Толщина 2-х стороннего скотча, мм", "number", True),
            ("polymer", "Толщина полимера, мм", "number", True),
            ("material_thickness", "Толщина материала для вычисления глубины конгрева, мм", "number", True),
            ("material", "Технические характеристики материала", "textarea", True),
        ],
    },
    "gapmaster": {
        "name": "GapMaster",
        "fields": [
            ("machine", "Марка и модель машины", "text", True),
            ("machine_photo", "Фото шильдика машины", "file", True),
            ("counter_drawing", "Чертёж цилиндра противодавления и шестерни", "file", True),
            ("section_inside", "Фото вырубной секции — внутренняя сторона", "file", True),
            ("section_outside", "Фото вырубной секции — внешняя сторона", "file", True),
            ("section_side", "Фото вырубной секции — сбоку", "file", True),
            ("section_top", "Фото вырубной секции — сверху", "file", True),
            ("pressure_system", "Фото системы контроля давления", "file", True),
            ("minimum_z", "Минимальный Z / раппорт магнитного цилиндра", "text", True),
        ],
    },
    "kms": {
        "name": "KMS",
        "fields": [
            ("machine", "Марка и модель машины", "text", True),
            ("working_width", "Рабочая ширина, мм", "number", True),
            ("screw_length", "Длина винта для поддачи давления, мм", "number", True),
            ("tip_photo", "Фото наконечника с нескольких ракурсов", "file", True),
            ("spindle_photo", "Фото шпиндельной площадки", "file", True),
            ("spindle_width", "Ширина шпиндельной площадки, мм", "number", True),
            ("beam_photo", "Фото балки, куда упирается наконечник", "file", True),
        ],
    },
    "flat_base": {
        "name": "Плоская магнитная база",
        "fields": [
            ("machine", "Марка и модель машины", "text", True),
            ("machine_photo", "Фото шильдика машины", "file", True),
            ("drawing", "Чертёж плиты", "file", True),
            ("working_width", "Рабочая ширина, мм", "number", False),
            ("length", "Длина, мм", "number", False),
            ("width", "Ширина, мм", "number", False),
            ("thickness", "Толщина, мм", "number", False),
            ("notes", "Дополнительные требования", "textarea", False),
        ],
    },
}


def get_db():
    connection = sqlite3.connect(DB_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_db()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE NOT NULL,
            product_type TEXT NOT NULL,
            product_name TEXT NOT NULL,
            client TEXT NOT NULL DEFAULT '',
            contact TEXT NOT NULL DEFAULT '',
            comment TEXT NOT NULL DEFAULT '',
            data TEXT NOT NULL DEFAULT '{}',
            files TEXT NOT NULL DEFAULT '[]',
            status TEXT NOT NULL DEFAULT 'Получен',
            created_at TEXT NOT NULL
        )
        """
    )
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(orders)").fetchall()}
    if "status" not in columns:
        connection.execute("ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'Получен'")
    connection.commit()
    connection.close()


def product_payload(key, product):
    fields = []
    for field in product["fields"]:
        field_payload = {
            "key": field[0],
            "label": field[1],
            "type": field[2],
            "required": field[3],
        }
        if len(field) > 4:
            field_payload["options"] = field[4]
        if key in {"magnetic", "printing", "counterpressure"} and field[0] == "repeat":
            field_payload["readOnly"] = True
        fields.append(field_payload)
    return {"key": key, "name": product["name"], "fields": fields}


def serialize_order(row, include_details=False):
    result = {
        "id": row["id"],
        "order_number": row["order_number"],
        "product_type": row["product_type"],
        "product_name": row["product_name"],
        "client": row["client"],
        "contact": row["contact"],
        "comment": row["comment"],
        "status": row["status"],
        "created_at": row["created_at"],
    }
    if include_details:
        result["data"] = json.loads(row["data"] or "{}")
        result["files"] = json.loads(row["files"] or "[]")
    return result


def error(message, status=400):
    return jsonify({"error": message}), status


def unauthorized():
    return error("Требуется авторизация.", 401)


def token_part(value):
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def token_bytes(value):
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def issue_token():
    secret = os.environ.get("API_AUTH_SECRET", "")
    now = int(time.time())
    payload = f"operator|{now}|{now + AUTH_TOKEN_TTL_SECONDS}".encode()
    signature = hmac.new(secret.encode(), payload, hashlib.sha256).digest()
    return f"{token_part(payload)}.{token_part(signature)}"


def valid_token(token):
    secret = os.environ.get("API_AUTH_SECRET", "")
    if not secret or not token or token.count(".") != 1:
        return False
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        payload = token_bytes(encoded_payload)
        signature = token_bytes(encoded_signature)
        expected = hmac.new(secret.encode(), payload, hashlib.sha256).digest()
        subject, issued_at, expires_at = payload.decode().split("|")
        now = int(time.time())
        return (
            subject == "operator"
            and int(issued_at) <= now
            and now < int(expires_at)
            and hmac.compare_digest(signature, expected)
        )
    except (ValueError, TypeError, UnicodeDecodeError):
        return False


def require_auth():
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not valid_token(token.strip()):
        return unauthorized()
    return None


def rate_limited(key, limit, window):
    now = time.monotonic()
    attempts = rate_limits[key]
    while attempts and now - attempts[0] >= window:
        attempts.popleft()
    if len(attempts) >= limit:
        return True
    attempts.append(now)
    return False


def extension_for(uploaded):
    safe_name = secure_filename(uploaded.filename or "")
    return Path(safe_name).suffix.lower()


def has_valid_signature(extension, content):
    if extension == ".pdf":
        return content.startswith(b"%PDF-")
    if extension == ".zip":
        return content.startswith((b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"))
    if extension in {".jpg", ".jpeg"}:
        return content.startswith(b"\xff\xd8\xff")
    if extension == ".png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if extension == ".webp":
        return len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    if extension == ".svg":
        return b"<svg" in content[:4096].lower()
    return True


def validate_uploads(product, file_fields):
    declared = file_fields
    allowed_fields = {field[0] for field in product["fields"] if field[2] == "file"}
    if not isinstance(declared, list) or any(
        not isinstance(field, str) or field not in allowed_fields for field in declared
    ):
        return "Параметры файлов заказа некорректны."
    if len(request.files.getlist("files")) > MAX_FILES_PER_ORDER:
        return "Можно прикрепить не более 10 файлов."
    for field_name in request.files:
        if field_name != "files":
            return "Файлы должны передаваться в поле files."
    for uploaded in request.files.getlist("files"):
        if not uploaded or not uploaded.filename:
            return "Имя файла не указано."
        extension = extension_for(uploaded)
        if extension in BLOCKED_EXTENSIONS or extension not in ALLOWED_EXTENSIONS:
            return "Тип файла не поддерживается."
        content = uploaded.read(MAX_FILE_SIZE + 1)
        uploaded.seek(0)
        if not content:
            return "Пустые файлы не допускаются."
        if len(content) > MAX_FILE_SIZE:
            return "Размер одного файла не должен превышать 45 МБ."
        if not has_valid_signature(extension, content):
            return "Содержимое файла не соответствует его расширению."
    return None


init_db()


TOOTH_MODULES = {"C.P.": 3.175, "D.P.": 2.49364}


def calculated_repeat(product_type, data):
    if product_type not in {"magnetic", "printing", "counterpressure"}:
        return
    module = TOOTH_MODULES.get(str(data.get("tooth_module", "")).strip())
    try:
        teeth = float(str(data.get("teeth", "")).replace(",", "."))
    except (TypeError, ValueError):
        return
    if module is None or teeth <= 0:
        return
    repeat = teeth * module
    data["repeat"] = f"{repeat:.5f}".rstrip("0").rstrip(".") + " мм"


def email_value(value):
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def send_order_email(order_number, product, product_type, client, contact, comment, data, uploaded_files, created_at):
    host = os.environ.get("SMTP_HOST", "").strip()
    if not host:
        raise RuntimeError("SMTP_HOST is not configured")
    port = int(os.environ.get("SMTP_PORT", "587"))
    sender = os.environ.get("SMTP_FROM", "").strip()
    recipient = "spavlov@kocher-beck.ru"
    if not sender or not recipient:
        raise RuntimeError("SMTP_FROM or ORDER_EMAIL_TO is not configured")

    message = EmailMessage()
    message["Subject"] = f"Новая заявка Kocher+Beck Smart Order — {product['name']}"
    message["From"] = sender
    message["To"] = recipient
    rows = [
        "Новая заявка",
        "",
        "Основная информация",
        f"Номер: {order_number}",
        f"Дата/время: {created_at}",
        f"Тип оснастки: {product['name']}",
        "",
        "Контакты",
        f"Компания: {client}",
        f"Контактное лицо: {contact}",
        "",
        "Технические параметры и расчёты",
    ]
    rows.extend(f"{key}: {email_value(value)}" for key, value in data.items() if key != "__file_fields")
    rows.extend(["", "Комментарий", comment, "", "Вложения"])
    rows.extend(Path(path).name for path in uploaded_files)
    message.set_content("\n".join(rows))

    for path in uploaded_files:
        file_path = UPLOAD_DIR / Path(path).name
        if not file_path.is_file():
            continue
        message.add_attachment(
            file_path.read_bytes(),
            maintype="application",
            subtype="octet-stream",
            filename=file_path.name,
        )

    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    with smtplib.SMTP(host, port, timeout=20) as smtp:
        if os.environ.get("SMTP_STARTTLS", "1").lower() not in {"0", "false", "no"}:
            smtp.starttls()
        if username:
            smtp.login(username, password)
        smtp.send_message(message)


@app.get("/api/healthz")
def healthz():
    return jsonify({"status": "ok"})


@app.post("/api/auth/login")
def login():
    key = f"login:{request.remote_addr or 'unknown'}"
    if rate_limited(key, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS):
        return error("Слишком много попыток входа. Попробуйте позже.", 429)
    configured_password = os.environ.get("API_OPERATOR_PASSWORD", "")
    password = request.get_json(silent=True)
    supplied_password = password.get("password", "") if isinstance(password, dict) else ""
    if (
        not configured_password
        or not isinstance(supplied_password, str)
        or not hmac.compare_digest(supplied_password, configured_password)
        or not os.environ.get("API_AUTH_SECRET")
    ):
        return unauthorized()
    return jsonify({"access_token": issue_token(), "token_type": "Bearer", "expires_in": AUTH_TOKEN_TTL_SECONDS})


@app.get("/api/products")
def products():
    return jsonify([product_payload(key, product) for key, product in PRODUCTS.items()])


@app.get("/api/orders")
def list_orders():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    connection = get_db()
    rows = connection.execute("SELECT * FROM orders ORDER BY id DESC").fetchall()
    connection.close()
    return jsonify([serialize_order(row) for row in rows])


@app.post("/api/orders")
def create_order():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    rate_key = f"orders:{request.remote_addr or 'unknown'}"
    if rate_limited(rate_key, ORDER_MAX_ATTEMPTS, ORDER_WINDOW_SECONDS):
        return error("Слишком много заявок. Попробуйте позже.", 429)
    product_type = request.form.get("product_type", "").strip()
    if product_type not in PRODUCTS:
        return error("Не выбран корректный тип оснастки.")

    try:
        data = json.loads(request.form.get("data", "{}"))
    except json.JSONDecodeError:
        return error("Параметры заказа должны быть корректным JSON.")
    if not isinstance(data, dict):
        return error("Параметры заказа должны быть объектом.")

    product = PRODUCTS[product_type]
    upload_error = validate_uploads(product, data.get("__file_fields", []))
    if upload_error:
        return error(upload_error, 400)
    calculated_repeat(product_type, data)
    missing = []
    file_fields = data.get("__file_fields", [])
    if not isinstance(file_fields, list):
        file_fields = []
    for field in product["fields"]:
        key, label, field_type, required = field[:4]
        if not required:
            continue
        if field_type == "file":
            if key not in file_fields:
                missing.append(label)
        elif not str(data.get(key, "")).strip():
            missing.append(label)
    if missing:
        return error(f"Заполните обязательные поля: {', '.join(missing)}")

    saved_files = []
    for field_key, uploaded in request.files.items(multi=True):
        if not uploaded or not uploaded.filename:
            continue
        extension = Path(secure_filename(uploaded.filename)).suffix.lower()
        filename = f"{uuid.uuid4().hex}{extension}"
        uploaded.save(UPLOAD_DIR / filename)
        file_url = f"/api/uploads/{filename}"
        saved_files.append(file_url)
        data[field_key] = file_url

    now = datetime.now(timezone.utc).isoformat()
    order_number = f"TP-{datetime.now(timezone.utc):%Y%m%d}-{uuid.uuid4().hex[:6].upper()}"
    try:
        send_order_email(
            order_number,
            product,
            product_type,
            request.form.get("client", "").strip(),
            request.form.get("contact", "").strip(),
            request.form.get("comment", "").strip(),
            data,
            saved_files,
            now,
        )
    except (OSError, smtplib.SMTPException, ValueError, RuntimeError) as exc:
        for path in saved_files:
            try:
                (UPLOAD_DIR / Path(path).name).unlink(missing_ok=True)
            except OSError:
                pass
        return error(f"Не удалось отправить заявку по e-mail: {type(exc).__name__}", 503)

    connection = get_db()
    cursor = connection.execute(
        """
        INSERT INTO orders
        (order_number, product_type, product_name, client, contact, comment, data, files, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            order_number,
            product_type,
            product["name"],
            request.form.get("client", "").strip(),
            request.form.get("contact", "").strip(),
            request.form.get("comment", "").strip(),
            json.dumps(data, ensure_ascii=False),
            json.dumps(saved_files, ensure_ascii=False),
            "Получен",
            now,
        ),
    )
    connection.commit()
    order_id = cursor.lastrowid
    row = connection.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    connection.close()
    return jsonify(serialize_order(row, include_details=True)), 201


@app.get("/api/orders/<int:order_id>")
def get_order(order_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error
    connection = get_db()
    row = connection.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    connection.close()
    if row is None:
        return error("Заявка не найдена.", 404)
    return jsonify(serialize_order(row, include_details=True))


@app.get("/api/uploads/<path:filename>")
def uploads(filename):
    auth_error = require_auth()
    if auth_error:
        return auth_error
    if Path(filename).name != filename or not re.fullmatch(r"[a-f0-9]{32}\.[a-z0-9]+", filename):
        return error("Файл не найден.", 404)
    response = send_from_directory(UPLOAD_DIR, filename, mimetype="application/octet-stream", as_attachment=True)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "private, no-store"
    return response


@app.errorhandler(413)
def too_large(_error):
    return error("Размер загружаемых файлов не должен превышать 50 МБ.", 413)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")), debug=False)