# import time
from flask import Flask, request, jsonify, make_response, redirect
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import JSON, Integer, String, func
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
from datetime import datetime, timezone, timedelta, time
import base64
import secrets
import string
from flask_cors import CORS


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
db_url = os.getenv("DATABASE_URL", "sqlite:///project.db")
if db_url.startswith("postgres://"):
    db_url = db_url.replace(
        "postgres://", "postgresql://"
    )  # Render uses an outdated URI format

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
# app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
app.config["SECRET_KEY"] = "your_super_secret_key_here"
# initialize the app with the extension
db.init_app(app)
from model import Company, TrackedLink, User, Post, ScheduledPost, LinkClick

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
            ],
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        }
    },
)

# CORS(app, resources={r"/*": {"origins": "*"}})


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
    url = f"{BASE_URL}/contacts/"
    url = f"https://services.leadconnectorhq.com/contacts/"

    contacts = []
    page = 1
    limit = 100

    while True:
        params = {"limit": limit, "page": page, "locationId": "SAMRMXK1dqFwzEIFsOND"}
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        print("data:", data)

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
        f"http://127.0.0.1:5000/t/{tracked_link.token}"
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
        "ai response before", "Type: ", type(response.output_text), response.output_text
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
        f"http://127.0.0.1:5000/t/{tracked_link.token}"
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
        send_scheduled_post(company, next_post)
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
