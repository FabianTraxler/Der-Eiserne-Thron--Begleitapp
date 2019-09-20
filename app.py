# -*- coding: utf-8 -*-

# import all required libraries
# time is used to get the current time
import time
# import the Game Class
from game import Game
# Flask is used as the websocket in order to communicate with all clients
from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, emit
# thearding is used to run the socketio server in a different thread
import threading
# socket to get the IP Adresse of the Server
import socket

# initialize a dicstionary with all games in progress
games = {}
# start socket on Port 9191 
IP = (([ip for ip in socket.gethostbyname_ex(socket.gethostname())[2] if not ip.startswith("127.")] or [[(s.connect(("8.8.8.8", 53)), s.getsockname()[0], s.close()) for s in [socket.socket(socket.AF_INET, socket.SOCK_DGRAM)]][0][1]]) + ["no IP found"])[0]
app = Flask(__name__)
socketio = SocketIO(app)

# define event handlers, which indentify the right game and call the respective action
@socketio.on('startSession')
def initializGame(data):
    emit('setGamename',list(games.keys()), broadcast = False)
@socketio.on('restoreSession')
def restoreSession(data):
    if data['gamename'] in games:
        join_room(data['gamename'])
        games[data['gamename']].restoreSession(data)
    else:
        emit('noGame',list(games.keys()), broadcast = False)
@socketio.on('restoreSpielschritt')
def restoreSchritt(data):
    games[data['gamename']].restoreSchritt(data)
@socketio.on('reloadGames')
def reloadGames(data):
    emit('gameList',list(games.keys()), broadcast = False)
@socketio.on('join')
def on_join(data):
    games[data['gamename']].on_join(data)
@socketio.on('status')
def statusAktualisieren(data):
    games[data['gamename']].statusAktualisieren(data)
@socketio.on('angriff')
def angriff(data):
    games[data['gamename']].angriff(data)
@socketio.on('anzahlBefehlsmarker')
def anzahlBefehlsmarkerAktualisieren(data):
    print(data)
    games[data['gamename']].anzahlBefehlsmarkerAktualisieren(data)
@socketio.on('host')
def create_new_game(data):
    print('New game >>> ' + data['name'])
    print(data)
    name = data['name']
    variant = data['variant']
    numbOfPlayers = data['numb']
    games[name] = Game(name, variant,numbOfPlayers)
@socketio.on('westerosEnde')
def westerosEnde(data):
    print(data)
    games[data['gamename']].westerosphaseEnde(data)

### Spiel selbst starten mit game[__Name__des__Spiels__] = Game(name, variant, numbOfPlayers)
if __name__ == '__main__':
    # run socketio in different thread so games can be acces during runtime
    def socketthread():
        socketio.run(app, host=IP, port=9191)
    thread = threading.Thread(target=socketthread, args=())
    thread.daemon = True# Daemonize thread
    thread.start() 
