import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
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
CORS(app)

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
            created_at TEXT NOT NULL
        )
        """
    )
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
        "created_at": row["created_at"],
    }
    if include_details:
        result["data"] = json.loads(row["data"] or "{}")
        result["files"] = json.loads(row["files"] or "[]")
    return result


def error(message, status=400):
    return jsonify({"error": message}), status


init_db()


@app.get("/api/healthz")
def healthz():
    return jsonify({"status": "ok"})


@app.get("/api/products")
def products():
    return jsonify([product_payload(key, product) for key, product in PRODUCTS.items()])


@app.get("/api/orders")
def list_orders():
    connection = get_db()
    rows = connection.execute("SELECT * FROM orders ORDER BY id DESC").fetchall()
    connection.close()
    return jsonify([serialize_order(row) for row in rows])


@app.post("/api/orders")
def create_order():
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
    connection = get_db()
    cursor = connection.execute(
        """
        INSERT INTO orders
        (order_number, product_type, product_name, client, contact, comment, data, files, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    connection = get_db()
    row = connection.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    connection.close()
    if row is None:
        return error("Заявка не найдена.", 404)
    return jsonify(serialize_order(row, include_details=True))


@app.get("/api/uploads/<path:filename>")
def uploads(filename):
    return send_from_directory(UPLOAD_DIR, filename)


@app.errorhandler(413)
def too_large(_error):
    return error("Размер загружаемых файлов не должен превышать 50 МБ.", 413)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")), debug=False)