import time as time_module
from flask import Flask, request, jsonify, make_response, redirect
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import JSON, Integer, String, func, insert
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
from datetime import datetime, timezone, timedelta, time, date
import base64
import secrets
import string
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
from flask_migrate import Migrate
import pytz
from sqlalchemy import extract
from zoneinfo import ZoneInfo
from collections import defaultdict


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
migrate = Migrate()


app = Flask(__name__)
# configure the SQLite database, relative to the app instance folder


# db_url = os.getenv("DATABASE_URL", "sqlite:///project.db")
# if db_url.startswith("postgres://"):
#     db_url = db_url.replace(
#         "postgres://", "postgresql://"
#     )  # Render uses an outdated URI format

db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise RuntimeError("DATABASE_URL is not set")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://")

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
# app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
app.config["SECRET_KEY"] = "your_super_secret_key_here"
# initialize the app with the extension
db.init_app(app)
migrate.init_app(app, db)
from model import (
    Company,
    CronLock,
    TestPost,
    TrackedLink,
    User,
    Post,
    ScheduledPost,
    LinkClick,
)

BASE_URL = "https://rest.gohighlevel.com/v1"


with app.app_context():
    db.create_all()


# class SafeDict(dict):
#     def __missing__(self, key):
#         return f"{{{key}}}"  # or "" if you want it empty


class SafeDict(dict):
    def __missing__(self, key):
        return "{" + key + "}"  # leaves {missing_key} untouched


CORS(
    app,
    supports_credentials=True,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://opentablexcrm-connections-1.onrender.com",
                "https://app.tabletextpro.com",
            ],
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        }
    },
)

# CORS(
#     app,
#     supports_credentials=True,
#     resources={r"/*": {
#         "origins": [
#             "http://localhost:5173",
#             "https://app.tabletextpro.com",
#         ]
#     }},
# )


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


@app.route("/api/create_company", methods=["GET"])
def create_company_user():
    # creates a test company and user
    new_company = Company(
        name="TestCompany",
        bearer_token="pit-abbad67c-17df-4042-a4a4-927a127e0815",
        location_id="SAMRMXK1dqFwzEIFsOND",
    )
    db.session.add(new_company)
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

    # response = make_response(jsonify({"token": token, "message": "Login successful"}))
    # response.set_cookie(
    #     "jwt_token",
    #     token,
    #     httponly=True,
    #     secure=False,
    #     samesite="Lax",
    # )
    # return response, 200
    return (
        jsonify(
            {
                "access_token": token,
                "token_type": "Bearer",
                "message": "Login successful",
            }
        ),
        200,
    )


# def token_required(f):
#     @wraps(f)
#     def decorated(*args, **kwargs):
#         token = request.cookies.get("jwt_token")

#         if not token:
#             return jsonify({"message": "Token is missing!"}), 401

#         try:
#             data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
#             current_user = User.query.filter_by(public_id=data["public_id"]).first()
#         except:
#             return jsonify({"message": "Token is invalid!"}), 401

#         return f(current_user, *args, **kwargs)

#     return decorated


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header.split(" ")[1]

        try:
            data = jwt.decode(
                token,
                app.config["SECRET_KEY"],
                algorithms=["HS256"],
            )
            current_user = User.query.filter_by(public_id=data["public_id"]).first()

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


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
    # url = f"{BASE_URL}/contacts/"
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
        # print(f"Fetched page {page} ({len(data['contacts'])} contacts)")
        page += 1

    # print(f"✅ Total contacts pulled: {len(contacts)}")
    real_contacts = []
    for contact in contacts:
        url = f"https://services.leadconnectorhq.com/contacts/{contact['id']}"
        response = requests.get(url, headers=headers, params=params)
        # print("contact details response:", response.json())
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
    title = request.form.get("title")
    # content = request.form.get("content")
    content_str = request.form.get("content")  # this is a string now
    content = json.loads(content_str)
    image_url = None
    company = Company.query.filter_by(id=current_user.company_id).first()
    menu = company.menu

    # check if the post is asap or scheduled
    if content.get("releaseType") == "Schedule":
        # if is scheduled, check if there are anymore manual posts available
        # if so, call the next free post in line and update the information to auto
        free_post = ScheduledPost.query.filter_by(
            company_id=company.id, mode="manual", posted=False
        ).first()
        if free_post:
            free_post.mode = "auto"
            free_post.promotion = content["selectedPromotion"]
            free_post.day_of_week = content["releaseDate"]
            free_post.time = content["releaseTime"]
            free_post.link = content["link"]
            free_post.created_at = datetime.now()
            db.session.commit()
            return jsonify({"message": "Post scheduled successfully."}), 200
        else:
            return jsonify({"message": "No manual posts available to schedule."}), 400

        # If not, post instantly. Check if their are anymore instant posts and charge if not

    destination_link = content["link"]
    # query for the special link
    tracked_link = TrackedLink.query.filter_by(destination_url=destination_link).first()
    link = (
        f"https://go.tabletextpro.com/t/{tracked_link.token}"
        if tracked_link
        else destination_link
    )

    # CHECK IS THERE ARE MANUAL POSTS AVAILABLE
    manual_post = ScheduledPost.query.filter_by(
        company_id=company.id, mode="manual", posted=False
    ).first()
    if not manual_post:
        return jsonify({"message": "No manual posts available."}), 400

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

    print("data received at backend: ", content)
    print("menu stored:", menu)
    # image = data.get("image")
    t = templates

    # First, figure out which bucket of templates to use
    t = templates[content["selectedPromotion"]]

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
        print("selected template:", selected_template)
    except (ValueError, IndexError):
        raise ValueError(f"Invalid AI response: {response.output_text}")

    data = {
        "link": link,
    }

    # IF "ITEM" IS IN TEMPLATE, FEED TEMPLATE TO AI TO SELECT AN ITEM
    if "{item}" in selected_template:
        items_list = "\n".join(
            [f"- {item['name']} ({item['price']})" for item in menu["items"]]
        )

        item_prompt = f"""
            You are an assistant that helps restaurant owners send text messages to customers.
            Choose the single most appropriate menu item based on the restaurant's chosen Text Template.
            Return **only** the name of the item, with no explanation or text.

            Menu Items:
            {items_list}

            Info: {selected_template}
            """
        item_response = client.responses.create(model="gpt-4o-mini", input=item_prompt)
        item_name = item_response.output_text.strip()
        print("item selected by ai:", item_name)

        # find the item in the menu to get more details if needed
        # item = next((itm for itm in items_list if itm["name"] == item_name), None)
        item = next(
            (itm for itm in menu["items"] if itm.get("name") == item_name), None
        )

        data["item"] = item_name
        if not item:
            raise ValueError(f"AI selected an invalid item: {item_name}")

        # now replace {{item}} in template with item details

    message = selected_template.format_map(SafeDict(data))

    # pull all contacts from crm
    # user = User.query.filter_by(id=user_id).first()

    headers = get_header(company)
    contacts = get_contacts_ghl(headers)
    company.total_messages += len(contacts)
    # print("contacts:", contacts)
    for contact in contacts:
        contact_id = contact["id"]
        # send mms to each contact

        data = {
            "contact.first_name": contact["contact_first_name"],
        }
        message1 = message.format_map(SafeDict(data))

        print("final message to send: ", message1)
        send_mms_ghl(contact_id, message1, image_url, company)

    manual_post.posted = True

    # and send mms with image
    new_post = Post(
        user_id=current_user.id,
        title="title",
        content=message,
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
            # "created_at": post.created_at.isoformat(),
            "created_at": post.created_at,
        }
        output.append(post_data)
    return jsonify({"posts": output}), 200


@app.route("/api/set_post_schedule", methods=["POST"])
@token_required
def set_post_schedule(current_user):
    # this function needs to take in an array of posts from the frontend
    # it then need to create those posts in the db if they have not been created
    # if they have been created, it needs to update them
    # updates only the posts that has posted = false
    data = request.get_json()
    days = data.get("days")
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    print("day received:", days)
    posts = ScheduledPost.query.filter_by(company_id=company.id).all()
    if not posts:
        # create new scheduled posts
        for post in days:
            if post["mode"] == "auto":
                new = ScheduledPost(
                    company_id=company.id,
                    mode=post["mode"],
                    promotion=post["promotion"],
                    local_id=post["local_id"],
                    day_of_week=post["day_of_week"],
                    time=post["time"],
                    link=post["link"],
                )
            else:
                new = ScheduledPost(
                    company_id=company.id, mode=post["mode"], local_id=post["local_id"]
                )
            db.session.add(new)
    else:
        # update existing scheduled posts
        for post in days:
            existing_post = ScheduledPost.query.filter_by(
                company_id=company.id, local_id=post["local_id"], posted=False
            ).first()
            if existing_post:
                if post["mode"] == "auto":
                    existing_post.mode = post["mode"]
                    existing_post.promotion = post["promotion"]
                    existing_post.day_of_week = post["day_of_week"]
                    existing_post.time = post["time"]
                    existing_post.created_at = datetime.now()
                    existing_post.link = post["link"]
                else:
                    existing_post.mode = post["mode"]
    db.session.commit()

    return jsonify({"message": "Scheduled post created!"}), 200


@app.route("/api/check_company_state", methods=["GET"])
@token_required
def check_company_state(current_user):
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    # company.state = 2  # set to active for testing
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
                    # {
                    #     "type": "input_text",
                    #     "text": 'Extract a JSON list of menu items and prices. Return ONLY valid JSON like: {"items": [{"name": "", "price": ""}]}. '
                    #     "Do NOT include explanations, text, no backticks, no markdown, or notes. ONLY the JSON. The output will be fed directly into a json.load()",
                    # },
                    {
                        "type": "input_text",
                        "text": "Extract all menu item names and prices from the text. Return ONLY valid JSON. No explanations, no markdown, no notes. The JSON must match this exact structure:"
                        '{ "menu": { "items": [ { "name": "", "price": "" } ] } }'
                        "Fill the array with all detected items. Return nothing outside the JSON. The output will be parsed directly with json.load(). Ensure the JSON is strictly valid with no trailing commas.",
                    },
                ],
            }
        ],
    )
    print(
        "ai response before",
        "Type: ",
        type(response.output_text),
        response.output_text,
        flush=True,
    )
    menu = json.loads(response.output_text)

    # print("ai response after", "Type: ", type(menu), menu)
    # return jsonify(response.output_text)
    return jsonify({"menu": menu}), 200


# after recieving the ai, users can tweak their menu and submit it
# need to create an endpoint to recieve the finalized menu and store it
# create a workflow that checks the time and sends promotions about the menu on set times
# for manual, on submit they can choose to schedule, and that post will be scheduled and take the next spot in the queue
def send_scheduled_post(company, post):
    # utility function to create a scheduled post
    # this function will be called by the cron job
    # this func will use the information in the queued post
    # this will use the model to generate post content
    # this will use the menu stored in company

    # What do I need to plug into the ai(turn these into strings):
    #   Post Templates / DONE
    #   Menu /
    #   Promotion Type / DONE

    menu = company.menu

    t = templates

    destination_link = post.link
    # query for the special link
    tracked_link = TrackedLink.query.filter_by(destination_url=destination_link).first()
    link = (
        f"https://go.tabletextpro.com/t/{tracked_link.token}"
        if tracked_link
        else destination_link
    )

    print("New link: ", link)

    # First, figure out which bucket of templates to use
    promotion = post.promotion
    t = templates[promotion]

    stringinfo = f"""
        "Day of the week: "
        + {str(post.day_of_week)}
        + ", Time of day: "
        + {str(post.time)}
        + ", Menu: "
        + {menu}
    """
    # second, send only that bucket to ai to choose from
    prompt = f"""
        You are an assistant that helps restaurant owners send text messages to customers.
        Choose the single most appropriate template based on the restaurant's provided info.
        Return **only** the number of the template (1–{len(t)}), with no explanation or text.

        Templates:
        {chr(10).join([f"{i+1}. {t}" for i, t in enumerate(t)] )}

        Info: {stringinfo}

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

    data = {
        # "link": content["link"],
        "link": link,
    }

    # IF "ITEM" IS IN TEMPLATE, FEED TEMPLATE TO AI TO SELECT AN ITEM
    print("menu items type:", type(menu))
    if "{item}" in selected_template:
        items_list = "\n".join(
            [f"- {item['name']} ({item['price']})" for item in menu["items"]]
        )

        item_prompt = f"""
            You are an assistant that helps restaurant owners send text messages to customers.
            Choose the single most appropriate menu item based on the restaurant's chosen Text Template.
            Return **only** the name of the item, with no explanation or text.

            Menu Items:
            {items_list}

            Info: {selected_template}
            """
        item_response = client.responses.create(model="gpt-4o-mini", input=item_prompt)
        item_name = item_response.output_text.strip()
        print("item selected by ai:", item_name)

        # find the item in the menu to get more details if needed
        # item = next((itm for itm in items_list if itm["name"] == item_name), None)
        item = next(
            (itm for itm in menu["items"] if itm.get("name") == item_name), None
        )

        data["item"] = item_name
        if not item:
            raise ValueError(f"AI selected an invalid item: {item_name}")

        # now replace {{item}} in template with item details

    message1 = selected_template.format_map(SafeDict(data))

    # pull all contacts from crm
    # user = User.query.filter_by(id=user_id).first()

    headers = get_header(company)
    contacts = get_contacts_ghl(headers)
    # print("contacts:", contacts)
    for contact in contacts:
        contact_id = contact["id"]
        # send mms to each contact

        data = {
            "contact.first_name": contact["contact_first_name"],
        }
        message = message1.format_map(SafeDict(data))

        print("final message to send: ", message)
        send_mms_ghl(contact_id, message, None, company)

    post.posted = True

    # and send mms with image
    new_post = Post(
        user_id=0,
        title="title",
        content=message1,
        image_url=None,
        company_id=company.id,
    )
    db.session.add(new_post)
    db.session.commit()
    return jsonify({"message": "Post created and messages sent!"}), 200

    # return new_post


@app.route("/api/schedule_posts", methods=["POST"])
def schedule_posts():
    # This endpoint would be called by a scheduler (like cron) to check for scheduled posts
    # Get all companies that have posts in queue
    data = request.get_json()
    # Retrieve the time from request data
    current_time = data.get("current_time")  # expected format: 0-3

    today = date.today()
    cronjobname = f"schedule_posts_{current_time}"

    try:
        db.session.add(CronLock(job_name=cronjobname, run_date=today))
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"status": "skipped", "reason": "already ran"}), 200

    weekday_number = datetime.today().weekday()  # 0-6 (Mon-Sun)
    # how to filter by companies that have posted
    companies = Company.query.all()

    results = []

    for company in companies:
        # If company has posted thrice this week, skip
        if company.week_tally >= 3:
            results.append({"company_id": company.id, "status": "weekly limit reached"})
            continue

        # Grab oldest scheduled post for this company (the front of the queue)

        next_post = (
            ScheduledPost.query.filter_by(
                posted=False, day_of_week=weekday_number, time=current_time, mode="auto"
            )
            .order_by(ScheduledPost.created_at.asc())
            .first()
        )

        if not next_post:
            results.append({"company_id": company.id, "status": "no posts in queue"})
            continue

        # ----- Your posting logic goes here -----
        try:
            # Example: Your post-sending function
            send_scheduled_post(company, next_post)

            # Remove the processed post from the queue
            # db.session.delete(next_post)
            next_post.posted = True
            company.week_tally += 1  # increment the week's post tally
            db.session.commit()

            results.append(
                {
                    "company_id": company.id,
                    "posted": next_post.promotion,
                    "status": "success",
                }
            )
        except Exception as e:
            db.session.rollback()
            results.append(
                {"company_id": company.id, "error": str(e), "status": "failed"}
            )
    print("scheduling results:", results)
    return jsonify({"results": results}), 200


@app.route("/api/submit_final_menu", methods=["POST"])
@token_required
def submit_final_menu(current_user):
    data = request.get_json()
    menu = data.get("menu")
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()

    # Store the finalized menu in the company's record (you may want to create a new table for menus)
    # company.menu = json.dumps(menu)  # assuming you add a 'menu' column to Company model
    company.menu = menu
    company.state = 2  # set company state to active
    db.session.commit()

    return jsonify({"message": "Final menu submitted successfully!"}), 200


@app.route("/api/get_menu", methods=["GET"])
@token_required
def get_menu(current_user):
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    print(type(company.menu))
    # print(type(json.loads(company.menu)))
    return jsonify({"menu": company.menu}), 200


@app.route("/api/get_schedule", methods=["GET"])
@token_required
def get_schedule(current_user):
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    scheduled_posts = ScheduledPost.query.filter_by(company_id=company.id).all()
    output = []
    for post in scheduled_posts:
        post_data = {
            "id": post.id,
            "local_id": post.local_id,
            "day_of_week": post.day_of_week,
            "time": post.time,
            "posted": post.posted,
            "mode": post.mode,
            "promotion": post.promotion,
            "link": post.link,
        }
        output.append(post_data)
    return jsonify({"schedule": output}), 200


# @app.route("/api/reset_weekly_tallies", methods=["POST"])


def generate_token(length=6):
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@app.route("/t/<token>")
def track_click(token):
    link = TrackedLink.query.filter_by(token=token).first()
    print("Token:", link.token)
    print("Destination URL:", link.destination_url if link else "No link found")

    if not link:
        return redirect("https://yourapp.com", code=302)

    click = LinkClick(
        tracked_link_id=link.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get("User-Agent"),
    )

    db.session.add(click)
    db.session.commit()

    return redirect(f"https://{link.destination_url}", code=302)


@app.route("/api/create_tracked_link", methods=["POST"])
@token_required
def create_tracked_link(current_user):
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    data = request.get_json()
    links = data.get("links")
    c = 0
    for link in links:
        # check if link already exists
        existing_link = TrackedLink.query.filter_by(
            destination_url=link, company_id=company.id
        ).first()
        if existing_link or link == "":
            continue
        # does nothing if link exists

        destination_url = link
        token = generate_token()

        new_link = TrackedLink(
            token=token,
            destination_url=destination_url,
            company_id=company.id,
        )
        c += 1

        db.session.add(new_link)

    db.session.commit()
    msg = f"{c} links created."

    return jsonify({"message": msg}), 200


@app.route("/api/get_tracked_links", methods=["GET"])
@token_required
def get_tracked_links(current_user):
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    links = TrackedLink.query.filter_by(company_id=company.id).all()
    output = []
    for link in links:
        output.append(link.destination_url)
    return jsonify({"links": output}), 200


# Presets
# override for item names
# company link tracking
# add link choice to post creation and beutiy /menu to displat and edit links
# change setup to include link choice


@app.route("/api/todays_link_clicks", methods=["GET"])
@token_required
def link_analytics(current_user):
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()
    links = TrackedLink.query.filter_by(company_id=company.id).all()
    # 1. Get the start and end of the current day in UTC
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min).replace(
        tzinfo=timezone.utc
    )
    today_end = datetime.combine(datetime.now(timezone.utc).date(), time.max).replace(
        tzinfo=timezone.utc
    )
    output = []
    for link in links:
        # link_data = {
        #     "url": link.destination_url,
        #     "clicks": link.clicks,
        #     "conversions": link.conversions,
        # }
        clicks = LinkClick.query.filter_by(
            tracked_link_id=link.id, created_at=datetime.today()
        ).all()
        click_count = (
            db.session.query(func.count(LinkClick.id))
            .filter(
                LinkClick.tracked_link_id == link.id,
                LinkClick.created_at >= today_start,
                LinkClick.created_at <= today_end,
            )
            .scalar()
        )
        output.append({"name": link.destination_url, "value": click_count})
    return jsonify({"link_analytics": output}), 200


def start_of_week(dt):
    # Monday as start of week
    return dt - timedelta(days=dt.weekday())


@app.route("/api/todays_clicks_timeseries", methods=["GET", "POST"])
# @token_required
def todays_clicks_timeseries():
    # company_id = current_user.company_id'
    company_id = 1  # for testing
    data = request.get_json()
    reach = data.get("range")
    if reach == "today":

        # Start & end of today (UTC)
        today = datetime.now(timezone.utc).date()
        today_start = datetime.combine(today, time.min, tzinfo=timezone.utc)
        today_end = datetime.combine(today, time.max, tzinfo=timezone.utc)

        # Get all tracked links for this company
        links = TrackedLink.query.filter_by(company_id=company_id).all()

        # Build 2-hour buckets
        bucket_starts = []
        current = today_start
        while current <= today_end:
            bucket_starts.append(current)
            current += timedelta(hours=2)

        labels = [dt.strftime("%H:%M") for dt in bucket_starts]

        # Fetch all clicks for today in ONE query
        clicks = (
            db.session.query(
                LinkClick.tracked_link_id,
                LinkClick.created_at,
            )
            .join(TrackedLink, TrackedLink.id == LinkClick.tracked_link_id)
            .filter(
                TrackedLink.company_id == company_id,
                LinkClick.created_at >= today_start,
                LinkClick.created_at <= today_end,
            )
            .all()
        )

        # { link_id: [0, 0, 0, ...] }
        link_buckets = {link.id: [0] * len(bucket_starts) for link in links}

        # Place each click into the correct 2-hour bucket
        for link_id, created_at in clicks:

            # bucket_index = int((created_at - today_start).total_seconds() // (2 * 3600))
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            bucket_index = int((created_at - today_start).total_seconds() // (2 * 3600))

            if 0 <= bucket_index < len(bucket_starts):
                link_buckets[link_id][bucket_index] += 1

        # Accumulate counts per link
        series = []
        for link in links:
            running_total = 0
            cumulative = []
            for count in link_buckets[link.id]:
                running_total += count
                cumulative.append(running_total)

            series.append(
                {
                    "id": link.id,
                    "name": link.destination_url,
                    "data": cumulative,
                }
            )
    elif reach == "week":
        today = datetime.now(timezone.utc).date()
        start_date = today - timedelta(days=6)  # includes today

        # Build day buckets
        day_starts = [
            datetime.combine(
                start_date + timedelta(days=i), time.min, tzinfo=timezone.utc
            )
            for i in range(7)
        ]

        labels = [(start_date + timedelta(days=i)).isoformat() for i in range(7)]

        # Get links
        links = TrackedLink.query.filter_by(company_id=company_id).all()

        # Fetch clicks for the full 7-day window
        clicks = (
            db.session.query(
                LinkClick.tracked_link_id,
                LinkClick.created_at,
            )
            .join(TrackedLink, TrackedLink.id == LinkClick.tracked_link_id)
            .filter(
                TrackedLink.company_id == company_id,
                LinkClick.created_at >= day_starts[0],
                LinkClick.created_at < day_starts[-1] + timedelta(days=1),
            )
            .all()
        )

        # Initialize buckets
        link_buckets = {link.id: [0] * 7 for link in links}

        # Bucket clicks by day
        for link_id, created_at in clicks:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            day_index = (created_at.date() - start_date).days
            if 0 <= day_index < 7:
                link_buckets[link_id][day_index] += 1

        # Accumulate per link
        series = []
        for link in links:
            running_total = 0
            cumulative = []

            for count in link_buckets[link.id]:
                running_total += count
                cumulative.append(running_total)

            series.append(
                {
                    "id": link.id,
                    "name": link.destination_url,
                    "data": cumulative,
                }
            )
    elif reach == "month":
        now = datetime.now(timezone.utc)
        this_week_start = start_of_week(now).replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
        )

        # Build 12 weekly buckets (oldest → newest)
        week_starts = [this_week_start - timedelta(weeks=11 - i) for i in range(12)]

        labels = [ws.date().isoformat() for ws in week_starts]

        links = TrackedLink.query.filter_by(company_id=company_id).all()

        # Fetch clicks for the full 12-week window
        clicks = (
            db.session.query(
                LinkClick.tracked_link_id,
                LinkClick.created_at,
            )
            .join(TrackedLink, TrackedLink.id == LinkClick.tracked_link_id)
            .filter(
                TrackedLink.company_id == company_id,
                LinkClick.created_at >= week_starts[0],
                LinkClick.created_at < this_week_start + timedelta(weeks=1),
            )
            .all()
        )

        # Initialize buckets
        link_buckets = {link.id: [0] * 12 for link in links}

        # Bucket clicks into weeks
        for link_id, created_at in clicks:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            week_index = (start_of_week(created_at) - week_starts[0]).days // 7

            if 0 <= week_index < 12:
                link_buckets[link_id][week_index] += 1

        # Accumulate per link
        series = []
        for link in links:
            running_total = 0
            cumulative = []

            for count in link_buckets[link.id]:
                running_total += count
                cumulative.append(running_total)

            series.append(
                {
                    "id": link.id,
                    "name": link.destination_url,
                    "data": cumulative,
                }
            )

    return (
        jsonify(
            {
                "labels": labels,
                "series": series,
            }
        ),
        200,
    )


@app.route("/api/weekly_reset", methods=["POST"])
def weekly_reset():
    companies = Company.query.all()
    for company in companies:
        company.week_tally = 0
    db.session.commit()
    return jsonify({"message": "Weekly tallies reset."}), 200


@app.route("/api/dashboard_stats", methods=["GET"])
@token_required
def dashboard_stats(current_user):
    user = current_user
    company = Company.query.filter_by(id=user.company_id).first()

    count = (
        db.session.query(func.count(LinkClick.id))
        .join(TrackedLink, LinkClick.tracked_link_id == TrackedLink.id)
        .filter(TrackedLink.company_id == company.id)
        .scalar()
    )  # .scalar() returns the first column of the first row (the integer)

    return (
        jsonify({"total_clicks": count, "total_messages": company.total_messages}),
        200,
    )


@app.route("/api/generate_message", methods=["POST"])
@token_required
def generate_message(current_user):
    data = request.get_json()
    promotion = data.get("promotion")
    info = data.get("info")  # this is a string now

    company = Company.query.filter_by(id=current_user.company_id).first()
    menu = company.menu
    link = data.get("link")
    print("link:", link, "promotion:", promotion, "info:", info)

    # query for the special link
    tracked_link = TrackedLink.query.filter_by(destination_url=link).first()
    link = (
        f"https://go.tabletextpro.com/t/{tracked_link.token}" if tracked_link else link
    )

    # print("data received at backend: ", content)
    print("menu stored:", menu)
    # image = data.get("image")
    t = templates

    # First, figure out which bucket of templates to use
    t = templates[promotion]

    # second, send only that bucket to ai to choose from
    prompt = f"""
        You are an assistant that helps restaurant owners send text messages to customers.
        Choose the single most appropriate template based on the restaurant's provided info.
        Return **only** the number of the template (1–{len(t)}), with no explanation or text.

        Templates:
        {chr(10).join([f"{i+1}. {t}" for i, t in enumerate(t)] )}

        Info: {info}
        """

    response = client.responses.create(model="gpt-4o-mini", input=prompt)
    # third, Parse response and send that template to contacts
    print("ai response ", response.output_text)
    # send info to ai

    try:
        template_index = int(response.output_text) - 1
        selected_template = t[template_index]
        print("selected template:", selected_template)
    except (ValueError, IndexError):
        raise ValueError(f"Invalid AI response: {response.output_text}")

    data = {
        "link": link,
    }

    # IF "ITEM" IS IN TEMPLATE, FEED TEMPLATE TO AI TO SELECT AN ITEM
    if "{item}" in selected_template:
        items_list = "\n".join(
            [f"- {item['name']} ({item['price']})" for item in menu["items"]]
        )

        item_prompt = f"""
            You are an assistant that helps restaurant owners send text messages to customers.
            Choose the single most appropriate menu item based on the restaurant's chosen Text Template.
            Similarly, Choose the most appropriate menu item based on the restaurant's provided info.
            Return **only** the name of the item, with no explanation or text.

            Menu Items:
            {items_list}

            Template: {selected_template}
            Extra Info: {info}
            """
        item_response = client.responses.create(model="gpt-4o-mini", input=item_prompt)
        item_name = item_response.output_text.strip()
        print("item selected by ai:", item_name)

        # find the item in the menu to get more details if needed
        # item = next((itm for itm in items_list if itm["name"] == item_name), None)
        item = next(
            (itm for itm in menu["items"] if itm.get("name") == item_name), None
        )

        data["item"] = item_name
        if not item:
            raise ValueError(f"AI selected an invalid item: {item_name}")

        # now replace {{item}} in template with item details

    message = selected_template.format_map(SafeDict(data))

    # pull all contacts from crm
    # user = User.query.filter_by(id=user_id).first()
    # print("contacts:", contacts)
    return jsonify({"message": message}), 200


@app.route("/api/schedule_post_new", methods=["POST"])
@token_required
def schedule_post_new(current_user):
    data = request.get_json()
    company = Company.query.filter_by(id=current_user.company_id).first()
    content = data.get("content")
    link = data.get("link")
    scheduled_at = data.get("scheduled_at")
    mode = data.get("mode")
    promotion = data.get("promotion")
    # This function will create a new post object
    # the cron job will pick it up and post it at the scheduled time
    scheduled_at_dt = datetime.fromisoformat(
        scheduled_at.replace("Z", "+00:00")
    ).astimezone(timezone.utc)

    if "T13" in scheduled_at:
        # 8am EST
        time = 0
    elif "T17" in scheduled_at:
        # 12pm EST
        time = 1
    elif "T21" in scheduled_at:
        # 4pm EST
        time = 2
    elif "T01" in scheduled_at:
        # 8pm EST
        time = 3

    print("scheduled at time slot: ", time)

    new_post = TestPost(
        user_id=current_user.id,
        company_id=company.id,
        content=content,
        link=link,
        scheduled_at=scheduled_at_dt,
        mode=mode,
        promotion=promotion,
        time=time,
    )
    db.session.add(new_post)
    db.session.flush()
    print("New_post Id: ", new_post.id)
    print("dscheduled time before saving: ", scheduled_at)
    print("scheduled time after", new_post.scheduled_at)

    db.session.commit()

    # Validate and process the incoming data
    # Schedule the post using the provided data
    return jsonify({"message": "Post scheduled successfully"}), 200


@app.route("/api/get_calendar_events", methods=["GET"])
@token_required
def get_calendar_events(current_user):
    # data = request.get_json()
    company = Company.query.filter_by(id=current_user.company_id).first()
    # This function will fetch calendar events for the company
    events = TestPost.query.filter_by(company_id=company.id).all()
    output = []
    for event in events:
        # print("Not.iso:", event.scheduled_at)
        # print("with.iso", event.scheduled_at.isoformat())

        scheduled_at_utc = event.scheduled_at
        if scheduled_at_utc.tzinfo is None:
            # assume naive datetimes are UTC
            scheduled_at_utc = scheduled_at_utc.replace(tzinfo=timezone.utc)
        else:
            # convert any timezone-aware datetime to UTC
            scheduled_at_utc = scheduled_at_utc.astimezone(timezone.utc)

        # Convert to ISO string with Z
        scheduled_at_iso = scheduled_at_utc.isoformat().replace("+00:00", "Z")
        print("final iso: ", scheduled_at_iso)
        output.append(
            {
                "id": event.id,
                "title": f"Promotion: {event.promotion}",
                "start": scheduled_at_iso,
                "extendedProps": {
                    "content": event.content,
                    "mode": event.mode,
                    "link": event.link,
                    "posted": event.posted,
                    "status": event.status,
                    "promotion": event.promotion,
                    "scheduled_at": event.scheduled_at,
                    # return it from a date time
                },
            }
        )
    return jsonify({"events": output}), 200


def est_day_to_utc_range(day):
    # day is a datetime.date
    est = pytz.timezone("America/New_York")

    est_start = est.localize(datetime.combine(day, time.min))
    est_end = est.localize(datetime.combine(day, time.max))

    return (
        est_start.astimezone(pytz.UTC),
        est_end.astimezone(pytz.UTC),
    )


@app.route("/api/send_mass_message", methods=["POST"])
def send_mass_message():
    data = request.get_json()
    # Retrieve the time from request data
    current_time = data.get("current_time")  # expected format: 0-3

    est = ZoneInfo("America/New_York")
    today = datetime.now(est).date()

    # today = date.today()
    print("todays, ", today)
    cronjobname = f"schedule_posts_{current_time}"
    hour_times = [13, 17, 21, 1]

    # try:
    #     db.session.add(CronLock(job_name=cronjobname, run_date=today))
    #     db.session.commit()
    # except IntegrityError:
    #     db.session.rollback()
    #     return jsonify({"status": "skipped", "reason": "already ran"}), 200

    # how to filter by companies that have posted
    companies = Company.query.all()
    results = []

    start_utc, end_utc = est_day_to_utc_range(today)

    for company in companies:
        posts = TestPost.query.filter(
            TestPost.company_id == company.id,
            TestPost.scheduled_at >= start_utc,
            TestPost.scheduled_at < end_utc,
            TestPost.time == current_time,
            # extract("hour", TestPost.scheduled_at) == hour_times[current_time],
        ).all()
        if len(posts) == 0:
            results.append({"company_id": company.id, "status": "no posts in queue"})
            continue

        for post in posts:
            print("found post", post.scheduled_at)
            print("content: ", post.content)
            print("time slot: ", post.time)
            # ----- Your posting logic goes here -----
            try:
                # Example: Your post-sending function
                send_scheduled_post_updated(company, post)

                # Remove the processed post from the queue
                # db.session.delete(next_post)
                post.posted = True
                company.week_tally += 1  # increment the week's post tally
                db.session.commit()

                results.append(
                    {
                        "company_id": company.id,
                        "posted": post.promotion,
                        "status": "success",
                    }
                )
            except Exception as e:
                db.session.rollback()
                results.append(
                    {"company_id": company.id, "error": str(e), "status": "failed"}
                )

    print("scheduling results:", results)
    posts = TestPost.query.filter(
        TestPost.company_id == company.id,
        TestPost.time == current_time,
    ).all()
    j = len(posts)
    posts = TestPost.query.filter(
        TestPost.company_id == company.id,
        TestPost.scheduled_at >= start_utc,
        TestPost.scheduled_at < end_utc,
    ).all()
    a = len(posts)

    return (
        jsonify(
            {
                "results": results,
                "just_time": j,
                "scheduled": a,
                "start": start_utc,
                "End": end_utc,
            }
        ),
        200,
    )


def send_scheduled_post_updated(company, post):
    headers = get_header(company)
    contacts = get_contacts_ghl(headers)
    company.total_messages += len(contacts)
    # print("contacts:", contacts)
    for contact in contacts:
        contact_id = contact["id"]
        # send mms to each contact

        data = {
            "contact.first_name": contact["contact_first_name"],
        }
        message = post.content.format_map(SafeDict(data))

        print("final message to send: ", message)
        send_mms_ghl(contact_id, message, None, company)

    post.posted = True
    post.status = "posted"

    # and send mms with image
    new_post = Post(
        user_id=1,
        title="title",
        content=post.content,
        image_url=None,
        company_id=company.id,
    )
    db.session.add(new_post)
    db.session.commit()
    return jsonify({"message": "Post created and messages sent!"}), 200


@app.route("/api/update_scheduled_post", methods=["POST"])
@token_required
def update_scheduled_post(current_user):
    data = request.get_json()
    postID = data.get("id")
    company = Company.query.filter_by(id=current_user.company_id).first()
    content = data.get("content")
    link = data.get("link")
    scheduled_at = data.get("scheduled_at")
    mode = data.get("mode")
    promotion = data.get("promotion")
    # This function will create a new post object
    # the cron job will pick it up and post it at the scheduled time
    scheduled_at_dt = datetime.fromisoformat(
        scheduled_at.replace("Z", "+00:00")
    ).astimezone(timezone.utc)

    if "T13" in scheduled_at:
        # 8am EST
        time = 0
    elif "T17" in scheduled_at:
        # 12pm EST
        time = 1
    elif "T21" in scheduled_at:
        # 4pm EST
        time = 2
    elif "T01" in scheduled_at:
        # 8pm EST
        time = 3

    post = TestPost.query.filter_by(id=postID, company_id=company.id).first()
    post.user_id = current_user.id
    post.content = content
    post.link = link
    post.scheduled_at = scheduled_at_dt
    post.mode = mode
    post.promotion = promotion
    post.time = time

    db.session.commit()
    return jsonify({"message": "Post Updated Successfully"}), 200


@app.route("/api/delete_scheduled_post", methods=["POST"])
@token_required
def delete_scheduled_post(current_user):
    data = request.get_json()
    postID = data.get("id")
    company = Company.query.filter_by(id=current_user.company_id).first()
    post = TestPost.query.filter_by(id=postID, company_id=company.id).first()
    if not post:
        return jsonify({"error": "Post not found"}), 404

    db.session.delete(post)
    db.session.commit()

    return (
        jsonify({"message": "Scheduled post deleted successfully", "id": postID}),
        200,
    )


@app.route("/api/reset", methods=["GET"])
def reset_db():
    db.drop_all()
    db.create_all()
    return jsonify({"message": "Database reset successful"}), 200


@app.route("/api/get_all_convos", methods=["GET"])
@token_required
def get_all_convos(current_user):
    company = Company.query.filter_by(id=current_user.company_id).first()
    parsed_convo_list = []
    headers = get_header(company)
    # GET /conversations/?contactId={CONTACT_ID}
    url = f"https://services.leadconnectorhq.com/conversations/search"
    params = {"limit": 100, "page": 1, "locationId": company.location_id}
    response = requests.get(url, headers=headers, params=params)
    search = response.json()

    for convo in search.get("conversations"):
        parsed_convo = {
            "id": convo["id"],
            "name": convo["contactName"],
            "preview": convo["lastMessageBody"],
            "time": "Test",
            "messages": [],
            "contact_id": convo["contactId"],
        }

        print(
            "Convo ID: ",
            convo["id"],
            "\nlastMessage: ",
            convo["lastMessageBody"],
            "\ncontactName: ",
            convo["contactName"],
        )
        print("---Messages--")
        url = (
            f"https://services.leadconnectorhq.com/conversations/{convo['id']}/messages"
        )
        response = requests.get(url, headers=headers, params=params)
        messages = response.json()
        # print("Messages: ", messages)
        for message in reversed(messages.get("messages")["messages"]):
            try:
                print(
                    f"{message["direction"]}: {message["body"]} time: {message["dateAdded"]}\n"
                )
                parsed_convo["messages"].append(
                    {
                        "sender": (
                            "them" if message["direction"] == "inbound" else "me"
                        ),
                        "text": message["body"],
                        "id": message["id"],
                        "time": message["dateAdded"],
                    }
                )
            except Exception as e:
                print("Error processing message:", e)
        parsed_convo["time"] = messages.get("messages")["messages"][0]["dateAdded"]
        parsed_convo_list.append(parsed_convo)
    return (
        jsonify(
            {"message": "Conversations fetched", "conversations": parsed_convo_list}
        ),
        200,
    )


@app.route("/api/manual_message", methods=["POST"])
@token_required
def manual_message(current_user):
    data = request.get_json()
    company = Company.query.filter_by(id=current_user.company_id).first()
    contact_id = data.get("contact_id")
    message_body = data.get("message")

    response = send_mms_ghl(contact_id, message_body, None, company)
    print("manual message response:", response)

    # if response.status_code == 200:
    #     return jsonify({"message": "Message sent successfully"}), 200
    # else:
    #     return jsonify({"error": "Failed to send message"}), 500
    return jsonify({"message": "Message sent successfully"}), 200


# @app.route("/api/import-contacts", methods=["POST"])
# @token_required
# def import_contacts(current_user):
#     data = request.get_json()
#     company = Company.query.filter_by(id=current_user.company_id).first()
#     contacts = data.get("contacts", [])
#     print("Data: ", data)
#     # Iterate throught the contact list and send to GHL
#     headers = get_header(company)
#     url = "https://services.leadconnectorhq.com/contacts/upsert"
#     for contact in contacts:
#         payload = {
#             "firstName": contact.get("first_name"),
#             "lastName": contact.get("last_name"),
#             "phone": contact.get("phone"),
#             "locationId": company.location_id,
#         }
#         response = requests.post(url, headers=headers, json=payload)
#         print(f"Importing contact {contact.get('first_name')} {contact.get('last_name')}: {response.status_code}")


#     return jsonify({"message": "Contacts imported successfully"}), 200


@app.route("/api/import-contacts", methods=["POST"])
@token_required
def import_contacts(current_user):
    data = request.get_json()
    company = Company.query.filter_by(id=current_user.company_id).first()
    contacts = data.get("contacts", [])
    print("Data: ", data)

    headers = get_header(company)
    url = "https://services.leadconnectorhq.com/contacts/upsert"

    results = []
    success_count = 0

    for contact in contacts:
        # 1. Strip everything except digits
        raw_phone = str(contact.get("phone", ""))
        digits = "".join(filter(str.isdigit, raw_phone))

        # 2. Normalize based on length
        if len(digits) == 10:
            # Assumes US/Canada: 5551112222 -> +15551112222
            phone_payload = f"+1{digits}"
        elif len(digits) > 10 and not raw_phone.startswith("+"):
            # If it's 11+ digits and no plus, just add the plus
            phone_payload = f"+{digits}"
        else:
            # If it's already +1555..., use as is
            phone_payload = raw_phone if raw_phone.startswith("+") else f"+{digits}"

        payload = {
            "firstName": contact.get("first_name"),
            "lastName": contact.get("last_name"),
            "phone": phone_payload,
            "locationId": company.location_id,
        }

        try:
            response = requests.post(url, headers=headers, json=payload)
            resp_data = response.json() if response.content else {}

            if response.status_code in [200, 201]:
                success_count += 1
                results.append(
                    {
                        "status": "success",
                        "contact": f"{payload['firstName']} {payload['lastName']}",
                        "ghl_id": resp_data.get("contact", {}).get("id"),
                        "is_new": resp_data.get("new", False),
                    }
                )
            else:
                results.append(
                    {
                        "status": "failed",
                        "contact": f"{payload['firstName']} {payload['lastName']}",
                        "error": resp_data.get("message", "Unknown error"),
                        "code": response.status_code,
                    }
                )

        except Exception as e:
            results.append(
                {
                    "status": "error",
                    "contact": f"{contact.get('first_name')}",
                    "error": str(e),
                }
            )

        # Small delay to respect GHL rate limits (approx 10 requests per second)
        time_module.sleep(0.1)

    return (
        jsonify(
            {
                "message": f"Processed {len(contacts)} contacts",
                "total_attempted": len(contacts),
                "success_count": success_count,
                "details": results,
            }
        ),
        200,
    )
