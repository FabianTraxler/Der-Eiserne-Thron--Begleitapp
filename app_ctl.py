from game import User, Game
from app import app, socketio


def showStatus(game):
    for haus in game.spielbareHauser:
        print(haus + ' >>> ' + game.spiel['Spieler'][haus]['Status'])


def startBots(game):
        client = socketio.test_client(app)
        nachricht = {
                'gamename': game.name,
                'Name':'',
                'Haus':'',
                'message':''
                }
        for haus in game.spielbareHauser:
                if game.spiel['Spieler'][haus]['User'].name == '':
                        nachricht['Name'] = 'bot'
                        nachricht['Haus'] = haus
                        print(haus)
                        client.emit('join', nachricht)

def changeStatusBots(game, status):
        for haus in game.spielbareHauser:
                if game.spiel['Spieler'][haus]['User'].name == 'bot':
                        game.updateHausstatus(haus, status)
def changeStatusHouse(game, status, house):
        game.updateHausstatus(house, status)


