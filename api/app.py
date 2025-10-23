import os
import requests
from flask import Flask, jsonify
import gmailapitest
from flask_apscheduler import APScheduler


# set configuration values
class Config:
    SCHEDULER_API_ENABLED = True


app = Flask(__name__)
app.config.from_object(Config())

# initialize scheduler
scheduler = APScheduler()
# if you don't wanna use a config, you can set options here:
# scheduler.api_enabled = True
scheduler.init_app(app)

BEARER_TOKEN = os.getenv("BEARER_TOKEN")

HEADERS = {
    "Authorization": f"Bearer {BEARER_TOKEN}",
    "Content-Type": "application/json",
}

BASE_URL = "https://rest.gohighlevel.com/v1"

# interval example
# @scheduler.task("interval", id="do_job_1", seconds=30, misfire_grace_time=900)
# def job1():
#     print("Job 1 executed")


# cron examples
@scheduler.task("cron", id="do_job_2", minute="*")
def job2():
    get_email_and_send_api()
    print("Job 2 executed")


scheduler.start()


def get_email_and_send_api():
    # results = gmailapitest.search_messages
    results = gmailapitest.complete("is:unread from:reidjahzeel@gmail.com")
    for msg in results:
        msg_contacts = msg["contacts"]
        print("APIthis is the msg contacts:", msg_contacts)
        print("api name: ", msg_contacts[0][0])
        print("api number: ", msg_contacts[0][1])
        print(send_to_CRM(msg_contacts[0][0], msg_contacts[0][1]))
    return results


def send_to_CRM(name, number):
    # This needs to check if the contacts are in crm already
    # DONEif not make a push request to crm with contact info
    payload = {
        # "email": "john@deo.com",
        "phone": number,
        "firstName": name,
        "lastName": "TESTS(DELETE)",
        "name": name,
    }
    url = f"https://rest.gohighlevel.com/v1/contacts/"
    response = requests.post(url, headers=HEADERS, json=payload)
    return jsonify(response.json()), response.status_code


@app.route("/")
def home():
    result = get_email_and_send_api()
    return {"results": result}


@app.route("/get")
def tome():

    url = f"https://rest.gohighlevel.com/v1/contacts/"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return None


def send_mms(contact_id, message, image_url):
    url = f"{BASE_URL}/messages/"
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    payload = {
        "contactId": contact_id,
        "type": "SMS",
        "body": message,
        "attachments": [{"url": image_url, "type": "image/jpeg"}],
    }

    response = requests.post(url, json=payload, headers=headers)
    return response.json()
