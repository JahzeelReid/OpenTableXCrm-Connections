# OpenTableXCrm-Connections

This is Custom Software meant to create an automated pipeline from rservation software "OpenTable" and Mr. Davids Crm.

The purpose of this software is to automatically parse the reservations made on open table, adding those contacts to the Crm Database.

Those contacts will be used in Mr. Davids innovative marketing strategy.


The scope of this project as of 7/21/2025 is to acheive the following goals:
* Receieve reservation info from OpenTable(without api access, this can be done by parsing emails. 
* Parse Reservation info to recieve contact information
* Use Crm API to autonomously input contacts into the database
* (Challenge)This process must run whenever an email is recieved, but the get request count must be relatively low or 1-1


This project will currently use Flask as the backend. There will be no frontend, render will be used as the service provider
