import time
from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import JSON, Integer, String
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import uuid
from functools import wraps
import requests, os
from openai import OpenAI
from templates import templates
import boto3
import json
from extensions import db
from datetime import datetime, timezone, timedelta
import base64


# initialize the client with API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
)

# # make a request
# response = client.responses.create(
#     model="gpt-5", input="Write a one-sentence bedtime story about a unicorn."
# )

# print(response.output_text)


class Base(DeclarativeBase):
    pass


# db = SQLAlchemy(model_class=Base)


app = Flask(__name__)
# configure the SQLite database, relative to the app instance folder
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
app.config["SECRET_KEY"] = "your_super_secret_key_here"
# initialize the app with the extension
db.init_app(app)
from model import Company, User, Post, ScheduledPost

BASE_URL = "https://rest.gohighlevel.com/v1"


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
    response = client.responses.create(
        model="gpt-4o",
        instructions="Choose a template that best matches the theme and purpose of the information provided by the restuarunt owner. The chosen template will be sent to resturaunt goers via text. Return only the number of the template.",
        input="How do I check if a Python object is an instance of a class?",
    )

    print(response.output_text)
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
        print("\nIMAGE ADDED URL:", image_url)
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
    real_contacts = []
    for contact in contacts:
        url = f"https://services.leadconnectorhq.com/contacts/{contact['id']}"
        response = requests.get(url, headers=headers, params=params)
        print("contact details response:", response.json())
        try:
            contact["contact_first_name"] = response.json()["contact"]["firstName"]
            real_contacts.append(contact)
        except:
            pass
    print("contacts with names:", contacts)

    return real_contacts


@app.route("/api/new_post", methods=["POST"])
@token_required
def create_post(current_user):
    # retrieve data from frontend
    # data = request.get_json()
    # # user_id = data.get("user_id")
    # title = data.get("title")
    # content = data.get("content")
    title = request.form.get("title")
    # content = request.form.get("content")
    content_str = request.form.get("content")  # this is a string now
    content = json.loads(content_str)
    image_url = "https://storage.googleapis.com/msgsndr/SAMRMXK1dqFwzEIFsOND/media/6922202477eb5bfc2f61f6e4.jpg"

    # File comes from request.files
    image = request.files.get("image")
    if image:
        s3.upload_fileobj(
            image,
            "resturaunt-connect",
            image.filename,
            ExtraArgs={"ContentType": image.content_type},
        )
        image_url = (
            f"https://resturaunt-connect.s3.us-east-2.amazonaws.com/{image.filename}"
        )

    print("data received at backend:", content)
    # image = data.get("image")
    t = templates

    # First, figure out which bucket of templates to use
    print("data received at backend:", content)
    if content["selectedPromotion"] == "Reservations":
        t = templates["reservation_templates"]
    elif content["selectedPromotion"] == "Brunch":
        t = templates["brunch_templates"]
    elif content["selectedPromotion"] == "Dinner":
        t = templates["dinner_templates"]
    elif content["selectedPromotion"] == "Happy Hour":
        t = templates["happy_hour_templates"]

    # second, send only that bucket to ai to choose from
    prompt = f"""
        You are an assistant that helps restaurant owners send text messages to customers.
        Choose the single most appropriate template based on the restaurant's provided info.
        Return **only** the number of the template (1–{len(t)}), with no explanation or text.

        Templates:
        {chr(10).join([f"{i+1}. {t}" for i, t in enumerate(t)] )}

        Info: {content}
        """

    response = client.responses.create(model="gpt-4o-mini", input=prompt)
    # third, Parse response and send that template to contacts
    print("ai response ", response.output_text)
    # send info to ai

    try:
        template_index = int(response.output_text) - 1
        selected_template = t[template_index]
    except (ValueError, IndexError):
        raise ValueError(f"Invalid AI response: {response.output_text}")

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
        message = selected_template.replace(
            "{{contact.first_name}}", contact["contact_first_name"]
        )

        print("final message to send:", message)
        send_mms_ghl(contact_id, message, image_url, company)

    # and send mms with image
    new_post = Post(
        user_id=user.id,
        title=title,
        content=selected_template,
        image_url=image_url if image else None,
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


@app.route("/api/set_post_schedule", methods=["POST"])
@token_required
def set_post_schedule(current_user):
    data = request.get_json()
    days = data.get("days")
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    print("day received:", days)
    for post in days:
        if post["mode"] == "auto":
            new = ScheduledPost(
                company_id=company.id, mode=post["mode"], promotion=post["promotion"]
            )
            db.session.add(new)
    db.session.commit()

    return jsonify({"message": "Scheduled post created!"}), 200


@app.route("/api/check_company_state", methods=["GET"])
@token_required
def check_company_state(current_user):
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    company.state = 2  # set to active for testing
    db.session.commit()
    return jsonify({"state": company.state}), 200


@app.route("/api/parse_menu", methods=["POST"])
def parse_menu():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file"}), 400

    # Read file bytes
    file_bytes = file.read()
    encoded = base64.b64encode(file_bytes).decode("utf-8")

    response = client.responses.create(
        model="gpt-4o-mini",
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_image",
                        "image_url": f"data:{file.mimetype};base64,{encoded}",
                    },
                    {
                        "type": "input_text",
                        "text": 'Extract a JSON list of menu items and prices. Return ONLY valid JSON like: {"items": [{"name": "", "price": ""}]}. '
                        "Do NOT include explanations, text, no backticks, no markdown, or notes. ONLY the JSON. The output will be fed directly into a json.load()",
                    },
                ],
            }
        ],
    )
    print("ai response before", response.output_text)
    menu = json.loads(response.output_text)

    print("ai response after", menu)

    return jsonify({"menu": menu})


@app.route("/test-s3")
def test_s3():
    print(os.getenv("AWS_ACCESS_KEY_ID"))
    print(os.getenv("AWS_SECRET_ACCESS_KEY"))
    try:
        result = s3.list_buckets()
        return {"success": True, "buckets": result["Buckets"]}
    except Exception as e:
        return {"success": False, "error": str(e)}, 500
