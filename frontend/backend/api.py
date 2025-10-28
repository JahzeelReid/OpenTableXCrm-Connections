import time
from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm.attributes import flag_modified
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import uuid
from functools import wraps
from datetime import datetime, timezone, timedelta
import requests


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


app = Flask(__name__)
# configure the SQLite database, relative to the app instance folder
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
app.config["SECRET_KEY"] = "your_super_secret_key_here"
# initialize the app with the extension
db.init_app(app)
BASE_URL = "https://rest.gohighlevel.com/v1"


class Company(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    bearer_token: Mapped[str]


class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    public_id = db.Column(db.String(50), unique=True)
    username: Mapped[str] = mapped_column(unique=True)
    password: Mapped[str]
    email: Mapped[str]
    company_id: Mapped[int] = mapped_column(db.ForeignKey("company.id"))


class Post(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(db.ForeignKey("company.id"))
    title: Mapped[str]
    content: Mapped[str]
    image_url: Mapped[str] = mapped_column(nullable=True)
    user_id: Mapped[int] = mapped_column(db.ForeignKey("user.id"))


with app.app_context():
    db.create_all()


def get_header(company):
    # takes a company object returns the header
    # for our post requests
    BEARER_TOKEN = company.bearer_token
    HEADERS = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "Content-Type": "application/json",
        "Version": "2021-04-15",
    }
    return HEADERS


@app.route("/api/time")
def get_current_time():
    return {"time": time.time()}


@app.route("/api/create_company/user")
def create_company_user():
    # creates a test company and user
    new_company = Company(
        name="Test Company",
        email="twiddle dee",
        bearer_token="testtoken123",
    )
    db.session.add(new_company)
    db.session.flush()  # to get the id
    new_user = User(
        username="testuser",
        email="email#aaa",
        password="testpass",
        company_id=new_company.id,
    )
    db.session.add(new_user)
    db.session.commit()
    return {"message": "Company and user created"}


@app.route("/api/signup", methods=["POST"])
def register():

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    company = data.get("company_id")
    email = data.get("email")

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"message": "User already exists. Please login."}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(
        public_id=str(uuid.uuid4()),
        username=username,
        password=hashed_password,
        company_id=company,
        email=email,
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Account Created. Please login."}), 200


@app.route("/api/login", methods=["GET", "POST"])
def login():

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid email or password"}), 401

    token = jwt.encode(
        {
            "public_id": user.public_id,
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )

    response = make_response(jsonify({"token": token, "message": "Login successful"}))
    response.set_cookie("jwt_token", token)

    return response, 200


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get("jwt_token")

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.filter_by(public_id=data["public_id"]).first()
        except:
            return jsonify({"message": "Token is invalid!"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


@app.route("/dashboard")
@token_required
def dashboard(current_user):
    return f"Welcome {current_user.name}! You are logged in."


def send_mms_ghl(contact_id, message, image_url, company):
    url = f"https://services.leadconnectorhq.com/conversations/messages"
    headers = get_header(company)
    if image_url == None:
        payload = {
            "contactId": contact_id,
            "type": "SMS",
            "body": message,
            "message": message,
        }
    else:
        payload = {
            "contactId": contact_id,
            "type": "SMS",
            "body": message,
            "message": message,
            "attachments": [{"url": image_url, "type": "image/jpeg"}],
        }

    response = requests.post(url, json=payload, headers=headers)
    print("send mms response:", response.json())
    return response.json()


def get_contacts_ghl(headers):
    url = f"{BASE_URL}/contacts/"
    url = f"https://services.leadconnectorhq.com/contacts/"

    contacts = []
    page = 1
    limit = 100

    while True:
        params = {"limit": limit, "page": page, "locationId": "SAMRMXK1dqFwzEIFsOND"}
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        # print("data:", data)

        if "contacts" not in data or not data["contacts"]:
            break

        contacts.extend(data["contacts"])
        print(f"Fetched page {page} ({len(data['contacts'])} contacts)")
        page += 1

    print(f"✅ Total contacts pulled: {len(contacts)}")
    return contacts


@app.route("/api/new_post", methods=["POST"])
@token_required
def create_post(current_user):
    # retrieve data from frontend
    data = request.get_json()
    # user_id = data.get("user_id")
    title = data.get("title")
    content = data.get("content")
    image = data.get("image")

    # pull all contacts from crm
    # user = User.query.filter_by(id=user_id).first()
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    headers = get_header(company)
    contacts = get_contacts_ghl(headers)
    # print("contacts:", contacts)
    for contact in contacts:
        contact_id = contact["id"]
        # send mms to each contact
        send_mms_ghl(contact_id, content, image, company)

    # and send mms with image
    new_post = Post(
        user_id=user.id,
        title=title,
        content=content,
        image_url=None,
        company_id=company.id,
    )
    db.session.add(new_post)
    db.session.commit()
    return jsonify({"message": "Post created and messages sent!"}), 200


@app.route("/api/posts", methods=["GET"])
@token_required
def get_posts(current_user):
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    posts = Post.query.filter_by(company_id=company.id).all()
    output = []
    for post in posts:
        post_data = {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "image_url": post.image_url,
            "user_id": post.user_id,
        }
        output.append(post_data)
    return jsonify({"posts": output}), 200
