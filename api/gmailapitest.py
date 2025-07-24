import os
import pickle
import re

# Gmail API utils
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# for encoding/decoding messages in base64
from base64 import urlsafe_b64decode, urlsafe_b64encode

# for dealing with attachement MIME types
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.audio import MIMEAudio
from email.mime.base import MIMEBase
from mimetypes import guess_type as guess_mime_type

# Request all access (permission to read/send/receive emails, manage the inbox, and more)
SCOPES = ["https://mail.google.com/"]
our_email = "reidjahzeel@gmail.com"


def gmail_authenticate():
    creds = None
    # the file token.pickle stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first time
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)
    # if there are no (valid) credentials availablle, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        # save the credentials for the next run
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)
    return build("gmail", "v1", credentials=creds)


# get the Gmail API service
# service = gmail_authenticate()


def search_messages(service, query):
    result = service.users().messages().list(userId="me", q=query).execute()
    messages = []
    if "messages" in result:
        messages.extend(result["messages"])
    while "nextPageToken" in result:
        page_token = result["nextPageToken"]
        result = (
            service.users()
            .messages()
            .list(userId="me", q=query, pageToken=page_token)
            .execute()
        )
        if "messages" in result:
            messages.extend(result["messages"])
    return messages


# utility functions
def get_size_format(b, factor=1024, suffix="B"):
    """
    Scale bytes to its proper byte format
    e.g:
        1253656 => '1.20MB'
        1253656678 => '1.17GB'
    """
    for unit in ["", "K", "M", "G", "T", "P", "E", "Z"]:
        if b < factor:
            return f"{b:.2f}{unit}{suffix}"
        b /= factor
    return f"{b:.2f}Y{suffix}"


def clean(text):
    # clean text for creating a folder
    return "".join(c if c.isalnum() else "_" for c in text)


def parse_parts(service, parts, folder_name, message):
    """
    Utility function that parses the content of an email partition
    """
    if parts:
        for part in parts:
            filename = part.get("filename")
            mimeType = part.get("mimeType")
            body = part.get("body")
            data = body.get("data")
            file_size = body.get("size")
            part_headers = part.get("headers")
            if part.get("parts"):
                # recursively call this function when we see that a part
                # has parts inside
                parse_parts(service, part.get("parts"), folder_name, message)
            if mimeType == "text/plain":
                # if the email part is text plain
                if data:
                    text = urlsafe_b64decode(data).decode()
                    print("contents: ", text)
                    return text
            # elif mimeType == "text/html":
            #     # if the email part is an HTML content
            #     # save the HTML file and optionally open it in the browser
            #     if not filename:
            #         filename = "index.html"
            #     filepath = os.path.join(folder_name, filename)
            #     print("Saving HTML to", filepath)
            #     with open(filepath, "wb") as f:
            #         f.write(urlsafe_b64decode(data))
            else:
                # attachment other than a plain text or HTML
                for part_header in part_headers:
                    part_header_name = part_header.get("name")
                    part_header_value = part_header.get("value")
                    if part_header_name == "Content-Disposition":
                        if "attachment" in part_header_value:
                            # we get the attachment ID
                            # and make another request to get the attachment itself
                            print(
                                "Found file:",
                                filename,
                                "size:",
                                get_size_format(file_size),
                                "Not Downloaded",
                            )
                            attachment_id = body.get("attachmentId")
                            attachment = (
                                service.users()
                                .messages()
                                .attachments()
                                .get(
                                    id=attachment_id,
                                    userId="me",
                                    messageId=message["id"],
                                )
                                .execute()
                            )
                            data = attachment.get("data")
                            # filepath = os.path.join(folder_name, filename)
                            # if data:
                            #     with open(filepath, "wb") as f:
                            #         f.write(urlsafe_b64decode(data))


def read_message_d(service, message):
    """
    This function takes Gmail API `service` and the given `message_id` and does the following:
        - Downloads the content of the email
        - Prints email basic information (To, From, Subject & Date) and plain/text parts
        - Creates a folder for each email based on the subject
        - Downloads text/html content (if available) and saves it under the folder created as index.html
        - Downloads any file that is attached to the email and saves it in the folder created
        -returns a dict of the contents
    """
    msg_dict = {}
    msg = (
        service.users()
        .messages()
        .get(userId="me", id=message["id"], format="full")
        .execute()
    )
    # parts can be the message body, or attachments
    payload = msg["payload"]
    headers = payload.get("headers")
    parts = payload.get("parts")
    folder_name = "email"
    has_subject = False
    if headers:
        # this section prints email basic info & creates a folder for the email
        for header in headers:
            name = header.get("name")
            value = header.get("value")
            if name.lower() == "from":
                # we print the From address
                print("From:", value)
                msg_dict["from"] = value
            if name.lower() == "to":
                # we print the To address
                print("To:", value)
                msg_dict["to"] = value
            if name.lower() == "subject":
                # make our boolean True, the email has "subject"
                has_subject = True
                # make a directory with the name of the subject

                #
                # folder_name = clean(value)
                # # we will also handle emails with the same subject name
                # folder_counter = 0
                # while os.path.isdir(folder_name):
                #     folder_counter += 1
                #     # we have the same folder name, add a number next to it
                #     if folder_name[-1].isdigit() and folder_name[-2] == "_":
                #         folder_name = f"{folder_name[:-2]}_{folder_counter}"
                #     elif folder_name[-2:].isdigit() and folder_name[-3] == "_":
                #         folder_name = f"{folder_name[:-3]}_{folder_counter}"
                #     else:
                #         folder_name = f"{folder_name}_{folder_counter}"
                # os.mkdir(folder_name)
                #

                print("Subject:", value)
                msg_dict["subject"] = value
            if name.lower() == "date":
                # we print the date when the message was sent
                print("Date:", value)
                msg_dict["date"] = value
    #
    # if not has_subject:
    #     # if the email does not have a subject, then make a folder with "email" name
    #     # since folders are created based on subjects
    #     if not os.path.isdir(folder_name):
    #         os.mkdir(folder_name)
    #
    msg_dict["content"] = parse_parts(service, parts, folder_name, message)
    print("=" * 50)
    return msg_dict


def mark_as_read(service, msglist):
    # messages_to_mark = search_messages(service, query)
    print(f"Matched emails: {len(msglist)}")
    return (
        service.users()
        .messages()
        .batchModify(
            userId="me",
            body={"ids": [msg["id"] for msg in msglist], "removeLabelIds": ["UNREAD"]},
        )
        .execute()
    )


def complete(query):
    message_list = []
    service = gmail_authenticate()
    mark_read_list = []

    # get emails that match the query you specify
    results = search_messages(service, query)
    print("results: ", results)
    print(f"Found {len(results)} results.")
    # for each email matched, read it (output plain/text to console & save HTML and attachments)
    for msg in results:
        msg_digest = read_message_d(service, msg)
        # rudimetary content parsing/ this will check the email for keywords
        try:
            pattern = r"name:\s*(.+?)\s+.*?number:\s*(\S+)"
            matches = re.findall(pattern, msg_digest["content"], re.IGNORECASE)

            if len(matches) != 0:
                msg_digest["contacts"] = matches
                message_list.append(msg_digest)
                mark_read_list.append(msg)
                print("marked as read")

        except:
            matches = []

        print("matches: ", matches)

    # https://thepythoncode.com/article/use-gmail-api-in-python
    print("messagelist\n", message_list)
    if len(mark_read_list) != 0:
        mark_as_read(service, mark_read_list)
    return message_list


complete("from:is:unread from:reidjahzeel@gmail.com ")
