# -*- coding: utf-8 -*-

# time is used to get the current time
import time
from game import Game
# import all required libraries
# Flask is used as the websocket in order to communicate with all clients
from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, emit

#socket to get the IP Adresse of the Server
import socket

games = {}
# Soketverbing starten auf Port 9191 
IP = (([ip for ip in socket.gethostbyname_ex(socket.gethostname())[2] if not ip.startswith("127.")] or [[(s.connect(("8.8.8.8", 53)), s.getsockname()[0], s.close()) for s in [socket.socket(socket.AF_INET, socket.SOCK_DGRAM)]][0][1]]) + ["no IP found"])[0]
app = Flask(__name__)
socketio = SocketIO(app)


@socketio.on('joining')
def initializGame(data):
    
    if data['gamename']:
        games[data['gamename']].initializeGame(data)
    else:
        emit('setGamename',list(games.keys()), broadcast = False)
@socketio.on('join')
def on_join(data):
    games[data['gamename']].on_join(data)
@socketio.on('status')
def statusAktualisieren(data):
    games[data['gamename']].statusAktualisieren(data)
@socketio.on('angriff')
def angriff(data):
    games[data['gamename']].angriff(data)
@socketio.on('restore')
def restoreSession(data):
    if data['gamename'] in games:
        games[data['gamename']].restoreSession(data)
    else:
        emit('setGamename',list(games.keys()), broadcast = False)
@socketio.on('restoreSpielschritt')
def restoreSchritt(data):
    games[data['gamename']].restoreSchritt(data)
@socketio.on('anzahlBefehlsmarker')
def anzahlBefehlsmarkerAktualisieren(data):
    games[data['gamename']].anzahlBefehlsmarkerAktualisieren(data)
@socketio.on('host')
def create_new_game(data):
    print('New game >>> ' + data['name'])
    print(data)
    name = data['name']
    variant = data['variant']
    numbOfPlayers = data['numb']
    games[name] = Game(name, variant,numbOfPlayers,app,socketio)
@socketio.on('westerosEnde')
def westerosEnde(data):
    games[data['gamename']].westerosphase(data)
### Spiel selbst starten mit name = game1
# game1 = Game('normal','2', socket)
# IP Adresse des Server mit socket auslesen
if __name__ == '__main__':
    #create_new_game({'name':'test','variant':'normal','numb':'2'})
    socketio.run(app, host=IP, port='9191')