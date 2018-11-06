# -*- coding: utf-8 -*-

# import all required libraries
# Flask is used as the websocket in order to communicate with all clients
from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, emit

#socket to get the IP Adresse of the Server
import socket

class GoT_Socket:
    # IP Adresse des Server mit socket auslesen
    IP = (([ip for ip in socket.gethostbyname_ex(socket.gethostname())[2] if not ip.startswith("127.")] or [[(s.connect(("8.8.8.8", 53)), s.getsockname()[0], s.close()) for s in [socket.socket(socket.AF_INET, socket.SOCK_DGRAM)]][0][1]]) + ["no IP found"])[0]

    # Funktionen des Sockets festlegen (Send Messages, Recieve,...)
    def __init__(self, PORT):
        self.app = Flask(__name__)
        self.socketio = SocketIO(self.app)
        self.socketio.run(self.app, host=self.IP, port=PORT)
    
  