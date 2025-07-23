from flask import Flask
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
    return results


@app.route("/")
def home():
    result = get_email_and_send_api()
    return {"results": result}
