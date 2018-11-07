# -*- coding: utf-8 -*-
from flask_socketio import SocketIO, join_room, emit

# json to parse json data
import json
# time is used to get the current time
import time
import datetime
# User Klasse anlegen
class User:
    def __init__(self):
        self.befehlsmarkerZeit = 0
        self.marschBefehleZeit = 0
        self.machtmarkerZeit = 0
        self.haus = 'abc'
        self.name = 'abc'
    def updateBefehle(self, time):
        if (self.befehlsmarkerZeit == 0):
            self.befehlsmarkerZeit = time
        else:
            self.befehlsmarkerZeit = (self.befehlsmarkerZeit + time) / 2
    def updateMarsch(self, time):
        if(self.marschBefehleZeit == 0):
            self.marschBefehleZeit = time
        else:
            self.marschBefehleZeit = (self.marschBefehleZeit + time) / 2
    def updateMachtmarker(self, time):
        if(self.machtmarkerZeit == 0):
            self.machtmarkerZeit = time
        else:
            self.machtmarkerZeit = (self.machtmarkerZeit + time) / 2
    def initialize(self,haus, name):
        self.haus = haus
        self.name = name


class Game:
    # Spiel initialisieren
    def __init__(self,gamename, game_variant, numb_of_players, socketApp, socketIO):
        #Spielnamen initialisieren
        self.name = gamename
        # Spielkonfiguaration laden
        self.spiel = json.load(open('spiel_config.json'))
        # Spielstatistiken laden
        self.stats = json.load(open('stats.json'))
        self.spielerAnzahl = int(numb_of_players)
        # Liste mit spielbaren Häusern anlegen
        self.spielbareHauser = self.spiel['Spiel_Config']['spielbareHauser'][game_variant][numb_of_players]
        # neue Liste für die Reihenfolge anlegen (es werden immer Spieler aus der Liste geworfen die schon dran waren - nach der Runde wird sie wieder befüllt)
        self.reihenfolge = self.spielbareHauser.copy()
        # weitere Liste die angibt welche Spieler beim derzeitigen Spielzug noch nicht fertig sind
        self.nochNichtFertig = self.spielbareHauser.copy()
        # Variable für Rundenanzahl anlegen
        self.spielrunde = 1
        # ???
        self.AmZugReihenfolgeDurchgang = 0
        # Ein Dict das speichert wer wie viele Marschbefehle in der Runde gelegt hat
        self.gelegteMarschbefehle={}
        # ???
        self.hatAngegriffen = ''
        # Eine Varibale anlegen welche speichert wer gerade der Rabe ist
        self.rabe = ''
        # Eine Liste für alle Usernamen anlegen
        self.usernames = []
        # Ein Dict anleten welches Usernamen zu dem gewählten Haus mapped
        self.dictUserHaus = {}

        #Einige Variablen initialisieren um unterbrochene Spielverbindungen wieder zu aktualisieren
        # Derzeitigen Spielschritt als Variabel speichern
        self.Spielschritt =''
        # Variable für den Spieler der am Zug ist
        self.AmZug = ''
        # Festhalten wann der Timergestartet wurde
        self.timerStart = 0

        # Alle Spieler initialisieren und festlegen wer der Rabe ist
        self.rabenleistePositionen = []
        for self.haus in self.spielbareHauser:
            self.spiel['Spieler'][self.haus]['User'] = User()
            self.rabenleistePositionen.append(self.spiel['Spieler'][self.haus]['PositionenNormal']['Königshof'])
            self.gelegteMarschbefehle[self.haus] = 0
        self.rabenPosition = min(tuple(self.rabenleistePositionen))
        # Den Raben ermitteln (Rabe = Haus mit der niedrigsten Position auf der Königshofleiste)
        for self.haus in self.spielbareHauser:
            if(self.rabenPosition == self.spiel['Spieler'][self.haus]['PositionenNormal']['Königshof']):
                self.rabe = self.haus
        self.app = socketApp
        self.socketio = socketIO
        date = datetime.datetime.now()
        self.today = str(date.year) +'-'+str(date.month) +'-'+str(date.day)
    
    def sendMessage(self, ID, Nachricht, broadcast = True):
        self.nachricht = {
            'Name': self.name,
            'Haus': 'admin',
            'message': Nachricht
        }
        emit(ID,self.nachricht, broadcast = broadcast)
    
    def updateStatusAlle(self,status):
        for self.haus in self.spielbareHauser:
            self.spiel['Spieler'][self.haus]['Status'] = status

    def createTimer(self, aktion, zeit, betroffener):
        self.timer = {
            "Haus" : betroffener,
            "Aktion": aktion,
            "Zeit": zeit,
            'Geschehen':''
        }
        self.timerStart = time.time()
        if(betroffener != 'Alle'):
                self.timer["Geschehen"] = self.spiel['Spieler'][betroffener]['User'].name + ' ist am Zug!'
        return self.timer
    ####
    def verbleibendeZeit(self,zeit):
        now = time.time()
        result = int(self.timerStart - now) + zeit
        return result
    def alleBereit(self,Status):
        bereit = 0
        for haus in self.spielbareHauser:
            if(self.spiel['Spieler'][haus]['Status'] == Status):
                bereit += 1
        if(bereit == int(self.spielerAnzahl)):
            return True
        else:
            return False

    def neuenSpielerAktualisieren(self, haus):
        if(self.Spielschritt == 'Joined'):
            self.sendMessage('joined','Alle')
            self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig, broadcast=False)
        elif(self.Spielschritt == 'Start'):
            nachricht = {
                'msg': 'Spiel wird gestartet',
                'usernames':self.usernames
            }
            self.sendMessage('start', nachricht)
        elif(self.Spielschritt == 'Befehle'):
            self.timer = self.createTimer('Befehlsmarker legen', self.verbleibendeZeit(self.spiel['Spiel_Config']['Spielzugdauer']['BefehlsmarkerLegen']), haus)
            self.sendMessage('befehle', self.timer, broadcast=False)
            self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig,broadcast=False)
        elif(self.Spielschritt == 'Uberfall'):
            self.sendMessage('Uberfall',self.rabe, broadcast=False)
        elif(self.Spielschritt == 'Marsch'):
            self.timer = self.createTimer('Marschbefehl ausführen', self.verbleibendeZeit(self.spiel['Spiel_Config']['Spielzugdauer']['Marschbefehl']), self.AmZug)
            self.sendMessage('marsch', self.timer,broadcast=False)
            self.nochNichtFertig = self.spielbareHauser.copy()
            try:
                self.nochNichtFertig.remove(self.AmZug)
            except:
                pass
            self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig, broadcast=False)
        elif(self.Spielschritt == 'Machtzuwachs'):
            self.timer = self.createTimer('Machtmarker nehmen', self.verbleibendeZeit(self.spiel['Spiel_Config']['Spielzugdauer']['Machtzuwachs']), haus)
            self.sendMessage('machtzuwachs', self.timer, broadcast=False)
            self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig, broadcast=False)
        elif(self.Spielschritt =='Westeros'):
            self.sendMessage('westeros','Westerosphase beginnt!', broadcast=False)
        print('---------------------')
        print('self.Spielschritt ' + self.Spielschritt + ' wiederhergestellt!')
        print('---------------------')

    def updateStats(self, haus, status, zeit):
        #daten = [status, zeit]
        self.user = self.spiel['Spieler'][haus]['User']
        if(status == 'Befehlsmarker gelegt'):
            self.user.updateBefehle(zeit)
        elif(status == 'Machtmarker genommen'):
            self.user.updateMachtmarker(zeit)
        elif(status == 'Marschbefehl ausgeführt'):
            self.user.updateMarsch(zeit)
        
    def createStat(self, haus):
        userObj = self.spiel['Spieler'][haus]['User']
        user = userObj.name
        daten = {
            "Befehlsmarker legen":userObj.befehlsmarkerZeit,
            "Marschausführen":userObj.marschBefehleZeit,
            "Machtmarker nehmen":userObj.machtmarkerZeit
        }
        if user in self.stats['Spieler'].keys(): # neue Statistik hinzufügen
            self.stats['Spieler'][user][self.today] = {}
            for spielzug in daten.keys():
                self.stats['Spieler'][user][self.today][spielzug] = daten[spielzug]
        else: #neuen User anlegen
            self.stats['Spieler'][user] = {self.today:{}}
            for spielzug in daten.keys():
                self.stats['Spieler'][user][self.today][spielzug] = daten[spielzug]
    #Funktionen die nacheinandern (verkehrte Reihenfolge) durchgeführt werden
    def westerosphase(self):
        
        if(change == 'Y'):
            print('--------------')
            print('---------------------')
            print('Bitte bei jedem Haus die Position auf der Thronfolge eingeben!')
            reihenfolgeNeu = self.reihenfolge.copy()
            for haus in self.spielbareHauser:
                index = int(input('Haus ' + haus + ' >>> '))
                self.spiel['Spieler'][haus]['Thronfolge'] = index
                reihenfolgeNeu[index - 1] = haus
            self.reihenfolge = reihenfolgeNeu.copy()
            rabe = input('Wer ist der Rabe? >>> ')
            while(rabe not in self.spielbareHauser):
                rabe = input('Wer ist der Rabe? >>> ')
        self.AmZugReihenfolgeDurchgang = 0
        fertig = ''
        while(fertig != 'Y'):
            fertig = input('Westerosphase zu Ende?(Y/N)')
        self.spielrunde +=1
        self.startRound(self.spielrunde)

    def machtzuwachsMachen(self):
        print('---------------------')
        print('Machtzuwachsbefehle ausführen ...')
        self.timer = self.createTimer('Machtmarker nehmen', self.spiel['Spiel_Config']['Spielzugdauer']['Machtzuwachs'], 'Alle')
        self.sendMessage('machtzuwachs', self.timer)
        self.Spielschritt = 'Machtzuwachs'
        self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)

    def angriffMachen(self, angreifer, verteidiger):
        now = time.time()
        zeit = int(now - self.timerStart)
        self.hatAngegriffen = angreifer
        self.updateStats(angreifer,'Marschbefehl ausgeführt', zeit)
        nachricht = {
            'Angreifer':angreifer,
            'Verteidiger':verteidiger
        }
        self.sendMessage('anriffMachen',nachricht)
    def marschMachen(self, haus):
        print('---------------------')
        print(haus + ' macht seinen Marsch')
        timer = self.createTimer('Marschbefehl ausführen', self.spiel['Spiel_Config']['Spielzugdauer']['Marschbefehl'], haus)
        self.sendMessage('marsch', timer)
        self.Spielschritt='Marsch'
        self.nochNichtFertig = self.spielbareHauser.copy()
        try:
            self.nochNichtFertig.remove(haus)
        except:
            pass
        self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
    
    def marschBefehle(self):
        maxIndex = self.spielerAnzahl -1
        print(self.gelegteMarschbefehle)
        self.kommendeMarschbefehle = 0
        for haus in self.reihenfolge:
            self.kommendeMarschbefehle += int(self.gelegteMarschbefehle[haus])
        if(self.kommendeMarschbefehle != 0): #Es gibt noch einen Marschbefehl
            self.AmZug = self.reihenfolge[self.AmZugReihenfolgeDurchgang]
            while (self.gelegteMarschbefehle[self.AmZug] == 0):
                print(self.AmZug +' hat keine Marschis mehr')
                if(self.AmZugReihenfolgeDurchgang < maxIndex):
                    self.AmZugReihenfolgeDurchgang += 1
                else:
                    self.AmZugReihenfolgeDurchgang = 0
                self.AmZug = self.reihenfolge[self.AmZugReihenfolgeDurchgang]
            if(self.gelegteMarschbefehle[self.AmZug] != 0):
                self.gelegteMarschbefehle[self.AmZug] -= 1
                if(self.AmZugReihenfolgeDurchgang < maxIndex):
                    self.AmZugReihenfolgeDurchgang += 1
                else:
                    self.AmZugReihenfolgeDurchgang = 0
                self.marschMachen(self.AmZug)
            else: #Es gibt keinen Marschbefehl mehr
                print('Fehler')
        else:  #Es gibt keinen Marschbefehl mehr
            self.machtzuwachsMachen()
        
    #Funktion für start der Runde >>> Die Funktion ruft die nächste auf undo weiter undso weiter

    def startRound(self,round):
        if(round <=10):
            print('--------------')
            print('--------------')
            print('Runde ' + str(round) + ' wird gestartet ...')
            
            # Führe ganze Runde aus
            #Reihenfolge aktualisieren
            # Befeghlsmarker legen
            self.updateStatusAlle('Befehl legen')
            print('---------------------')
            print('Befehlsmarker werden gelegt ...')
            self.timer = self.createTimer('Befehlsmarker legen', self.spiel['Spiel_Config']['Spielzugdauer']['BefehlsmarkerLegen'], 'Alle')
            self.sendMessage('befehle', self.timer)
            self.Spielschritt = 'Befehle'
            self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
        else:
            print('---------------------')
            print('Spiel ist zuende!')
            self.sendMessage('ende', 'Das Spiel ist zuende!')

    #Funktion mit der das Spiel gestartet wird >>> ruft startRunde() auf
    def startGame(self):
        self.usernames = []
        for haus in self.spielbareHauser:
            self.usernames.append(self.spiel['Spieler'][haus]['User'].name)
            self.dictUserHaus[self.spiel['Spieler'][haus]['User'].name] = haus
        nachricht = {
            'msg': 'Spiel wird gestartet',
            'usernames':self.usernames
        }
        print(self.spiel)
        self.sendMessage('start', nachricht)
        self.Spielschritt = 'Start'
        self.startRound(self.spielrunde)

    #Checkt ab ob alle Spieler bereit sind und wenn ja startet das Spiel mit startGame()
    def spielerBeitritt(self, Haus, User):
        self.spiel['Spieler'][Haus]['User'].initialize(Haus,User)
        self.spiel['Spieler'][Haus]['Status'] = 'Beigetreten'
        try:
            self.nochNichtFertig.remove(Haus)
        except:
            pass
        self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
        print(self.alleBereit('Beigetreten'))
        if(self.alleBereit('Beigetreten')):
            self.Spielschritt = 'Joined'
            self.sendMessage('joined','Alle')
            self.Spielschritt = 'Joined'
            self.nochNichtFertig = self.spielbareHauser.copy()
            self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
        else:
            self.sendMessage('joined', Haus)

    def updateHausstatus(self, Haus,Status):
        now = time.time()
        self.zeit = int(now -self.timerStart)
        self.spiel['Spieler'][Haus]['Status'] = Status
        print('---------------------')
        print(Haus + ' >>> ' + self.spiel['Spieler'][Haus]['Status'])

        if(self.alleBereit(Status)):
            if(Status == 'bereitStart'):
                print('Starting the game ...')
                self.nochNichtFertig = self.spielbareHauser.copy()
                self.startGame()
            if(Status == 'Befehlsmarker gelegt'):
                self.updateStats(Haus,Status, self.zeit)
                self.nochNichtFertig = self.spielbareHauser.copy()
                self.Spielschritt = 'Uberfall'
                self.sendMessage('resetHausanzeige','')
                print('---------------------')
                print('Überfälle ausführen ...')
                self.updateStatusAlle('Uberfalle')
                self.sendMessage('Uberfall',self.rabe)
            if(Status == 'uberfall gemacht'):
                self.updateStats(Haus,Status, self.zeit)
                self.nochNichtFertig = self.spielbareHauser.copy()
                self.sendMessage('resetHausanzeige','')
                print('---------------------')
                print('Marschbefehle ausführen ...')
                self.updateStatusAlle('Uberfall')
                self.updateStatusAlle('Marschbefehle')
                self.marschBefehle()
            if(Status == 'Machtmarker genommen'):
                self.updateStats(Haus,Status, self.zeit)
                self.sendMessage('resetHausanzeige','')
                self.nochNichtFertig = self.spielbareHauser.copy()
                self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
                self.sendMessage('westeros','Westerosphase beginnt!')
                self.Spielschritt ='Westeros'
                print('---------------------')
                print('---------------------')
                print('Westerosphase beginnt ...')
                print('---------------------')
                print('---------------------')
                for haus in self.spielbareHauser:
                    self.createStat(haus)
                with open('stats.json', 'w') as outfile:
                    json.dump(self.stats, outfile, ensure_ascii=False,indent=4, sort_keys=True)  
            if(Status == 'westerosphaseFertig'):
                self.nochNichtFertig = self.spielbareHauser.copy()
                self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
                self.westerosphase()
        else:
            if(Status == 'Befehlsmarker gelegt'):
                self.updateStats(Haus,Status, self.zeit)
                try:
                    self.nochNichtFertig.remove(Haus)
                except:
                    pass
                self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
            if(Status == 'uberfall gemacht'):
                self.updateStats(Haus,Status, self.zeit)
                try:
                    self.nochNichtFertig.remove(Haus)
                except:
                    pass
                self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
            if(Status == 'Machtmarker genommen'):
                self.updateStats(Haus,Status, self.zeit)
                try:
                    self.nochNichtFertig.remove(Haus)
                except:
                    pass
                self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
            if(Status == 'bereitStart'):
                try:
                    self.nochNichtFertig.remove(Haus)
                except:
                    pass
                self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
            if(Status == 'westerosphaseFertig'):
                try:
                    self.nochNichtFertig.remove(Haus)
                except:
                    pass
                self.sendMessage('zeigeHausAnzeige', self.nochNichtFertig)
        if(Status == 'Marschbefehl ausgeführt'):
            if(self.hatAngegriffen == Haus):
                self.hatAngegriffen = ''
            else:
                self.updateStats(Haus,Status, self.zeit)
                self.hatAngegriffen = ''
            print('---------------------')
            print('Auf weitere Marschbefehle warten ...')
            self.marschBefehle()
    #Dieser Bereich definiert was mit den Nachrichten geschehen soll die an den Server gesendet werden        
    def initializeGame(self,data):
            message = {
                'User':data['Name'],
                'Hausliste':self.spielbareHauser
            }
            self.sendMessage('initialize',message)
    def on_join(self,data):
            self.spielerBeitritt(data['Haus'], data['Name'])
    def statusAktualisieren(self, data):
            stat = data['message']
            self.updateHausstatus(data['Haus'],stat)
    def angriff(self, data):
            print('++++++++++++++++++++++++')
            print(self.spiel['Spieler'][data['Angreifer']]['User'].name + ' greift ' + data['Verteidiger']+ ' an')
            print('++++++++++++++++++++++++')
            self.angriffMachen(data['Angreifer'], self.dictUserHaus[data['Verteidiger']])
    def restoreSession(self, data):
            print(str(data['Name']) + ' >>> restoring session ...')
            message = {
                'Haus':'',
                'Hausliste':self.spielbareHauser,
                'Userliste' : self.usernames
            }
            for haus in self.spielbareHauser:
                if(self.spiel['Spieler'][haus]['User'].name == data['Name']):
                    message['Haus'] = haus
                    emit('restoreHaus',message, broadcast = False)
            if not message['Haus']:
                print(str(data['Name']) + ' noch nicht im Spiel >>> Neuen Spieler anlegen')
                emit('reconnect','',broadcast = False)
    def restoreSchritt(self, data):
            self.neuenSpielerAktualisieren(data)
    def anzahlBefehlsmarkerAktualisieren(self, data):
            haus = data['Haus']
            anzahl = int(data['Anzahl'])
            self.gelegteMarschbefehle[haus] = anzahl
