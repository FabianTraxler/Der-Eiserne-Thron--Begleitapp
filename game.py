# json to parse json data
import json
# time is used to get the current time
import time
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
    def __init__(self,game_variant, numb_of_players, socketObject):
        # Spielkonfiguaration laden
        self.spiel = json.load(open('spiel_config.json'))
        # Spielstatistiken laden
        self.stats = json.load(open('stats.json'))
        self.spielerAnzahl = numb_of_players
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
        self.socket = socketObject
    
    def sendMessage(ID, Nachricht, broadcast = True):
        nachricht = {
            'Name': 'admin',
            'Haus': 'admin',
            'message': Nachricht
        }
        emit(ID,nachricht, broadcast = broadcast)
    
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
                self.timer["Geschehen"] = self.spiel['Spieler'][self.betroffener]['User'].name + ' ist am Zug!'
        return timer
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
        if(bereit == self.spielerAnzahl):
            return True
        else:
            return False

    def neuenSpielerAktualisieren(haus):
        global nochNichtFertig
        if(self.Spielschritt == 'Joined'):
            sendMessage('joined','Alle')
            sendMessage('zeigeHausAnzeige', nochNichtFertig, broadcast=False)
        elif(self.Spielschritt == 'Start'):
            sendMessage('start', 'Spiel wird gestartet',broadcast=False)
        elif(self.Spielschritt == 'Befehle'):
            timer = createTimer('Befehlsmarker legen', verbleibendeZeit(spiel['Spiel_Config']['Spielzugdauer']['BefehlsmarkerLegen']), haus)
            sendMessage('befehle', timer, broadcast=False)
            sendMessage('zeigeHausAnzeige', nochNichtFertig,broadcast=False)
        elif(self.Spielschritt == 'Uberfall'):
            sendMessage('Uberfall',rabe, broadcast=False)
        elif(self.Spielschritt == 'Marsch'):
            timer = createTimer('Marschbefehl ausführen', verbleibendeZeit(spiel['Spiel_Config']['Spielzugdauer']['Marschbefehl']), AmZug)
            sendMessage('marsch', timer,broadcast=False)
            nochNichtFertig = spielbareHauser.copy()
            try:
                nochNichtFertig.remove(AmZug)
            except:
                pass
            sendMessage('zeigeHausAnzeige', nochNichtFertig, broadcast=False)
        elif(self.Spielschritt == 'Machtzuwachs'):
            timer = createTimer('Machtmarker nehmen', verbleibendeZeit(spiel['Spiel_Config']['Spielzugdauer']['Machtzuwachs']), haus)
            sendMessage('machtzuwachs', timer, broadcast=False)
            sendMessage('zeigeHausAnzeige', nochNichtFertig, broadcast=False)
        elif(self.Spielschritt =='Westeros'):
            sendMessage('westeros','Westerosphase beginnt!', broadcast=False)
        print('---------------------')
        print('self.Spielschritt ' + Spielschritt + ' wiederhergestellt!')
        print('---------------------')
    def pingPong():
        print('pong')
        emit('ping','',broacast=False)
    def updateStats(haus, status, zeit):
        #daten = [status, zeit]
        user = spiel['Spieler'][haus]['User']
        if(status == 'Befehlsmarker gelegt'):
            user.updateBefehle(zeit)
        elif(status == 'Machtmarker genommen'):
            user.updateMachtmarker(zeit)
        elif(status == 'Marschbefehl ausgeführt'):
            user.updateMarsch(zeit)
        
    def createStat(haus):
        userObj = spiel['Spieler'][haus]['User']
        user = userObj.name
        daten = {
            "Befehlsmarker legen":userObj.befehlsmarkerZeit,
            "Marschausführen":userObj.marschBefehleZeit,
            "Machtmarker nehmen":userObj.machtmarkerZeit
        }
        if user in stats['Spieler'].keys(): # neue Statistik hinzufügen
            stats['Spieler'][user][today] = {}
            for spielzug in daten.keys():
                stats['Spieler'][user][today][spielzug] = daten[spielzug]
        else: #neuen User anlegen
            stats['Spieler'][user] = {today:{}}
            for spielzug in daten.keys():
                stats['Spieler'][user][today][spielzug] = daten[spielzug]
    #Funktionen die nacheinandern (verkehrte Reihenfolge) durchgeführt werden
    def westerosphase():
        global reihenfolge
        global spielrunde
        global AmZugReihenfolgeDurchgang
        global rabe
        change = input('Gab es Änderungen in der Zugreihenfolge? (Y/N)')
        if(change == 'Y'):
            print('--------------')
            print('---------------------')
            print('Bitte bei jedem Haus die Position auf der Thronfolge eingeben!')
            reihenfolgeNeu = reihenfolge.copy()
            for haus in spielbareHauser:
                index = int(input('Haus ' + haus + ' >>> '))
                spiel['Spieler'][haus]['Thronfolge'] = index
                reihenfolgeNeu[index - 1] = haus
            reihenfolge = reihenfolgeNeu.copy()
            rabe = input('Wer ist der Rabe? >>> ')
            while(rabe not in spielbareHauser):
                rabe = input('Wer ist der Rabe? >>> ')
        AmZugReihenfolgeDurchgang = 0
        fertig = ''
        while(fertig != 'Y'):
            fertig = input('Westerosphase zu Ende?(Y/N)')
        spielrunde +=1
        startRound(spielrunde)

    def machtzuwachsMachen():
        global Spielschritt
        print('---------------------')
        print('Machtzuwachsbefehle ausführen ...')
        timer = createTimer('Machtmarker nehmen', spiel['Spiel_Config']['Spielzugdauer']['Machtzuwachs'], 'Alle')
        sendMessage('machtzuwachs', timer)
        Spielschritt = 'Machtzuwachs'
        sendMessage('zeigeHausAnzeige', nochNichtFertig)

    def angriffMachen(angreifer, verteidiger):
        global hatAngegriffen
        now = time.time()
        zeit = int(now -timerStart)
        hatAngegriffen = angreifer
        updateStats(angreifer,'Marschbefehl ausgeführt', zeit)
        nachricht = {
            'Angreifer':angreifer,
            'Verteidiger':verteidiger
        }
        print(nachricht)
        sendMessage('anriffMachen',nachricht)
    def marschMachen(haus):
        global Spielschritt
        print('---------------------')
        print(haus + ' macht seinen Marsch')
        timer = createTimer('Marschbefehl ausführen', spiel['Spiel_Config']['Spielzugdauer']['Marschbefehl'], haus)
        sendMessage('marsch', timer)
        Spielschritt='Marsch'
        nochNichtFertig = spielbareHauser.copy()
        try:
            nochNichtFertig.remove(haus)
        except:
            pass
        sendMessage('zeigeHausAnzeige', nochNichtFertig)

    
    
    
    
    
    def marschBefehle():
        global AmZug
        global gelegteMarschbefehle
        global reihenfolge
        global AmZugReihenfolgeDurchgang
        global spielerAnzahl
        maxIndex = spielerAnzahl -1
        pprint(gelegteMarschbefehle)
        kommendeMarschbefehle = 0
        for haus in reihenfolge:
            kommendeMarschbefehle += gelegteMarschbefehle[haus]
        if(kommendeMarschbefehle != 0): #Es gibt noch einen Marschbefehl
            AmZug = reihenfolge[AmZugReihenfolgeDurchgang]
            while (gelegteMarschbefehle[AmZug] == 0):
                print(AmZug +' hat keine Marschis mehr')
                if(AmZugReihenfolgeDurchgang < maxIndex):
                    AmZugReihenfolgeDurchgang += 1
                else:
                    AmZugReihenfolgeDurchgang = 0
                AmZug = reihenfolge[AmZugReihenfolgeDurchgang]
            if(gelegteMarschbefehle[AmZug] != 0):
                gelegteMarschbefehle[AmZug] -= 1
                if(AmZugReihenfolgeDurchgang < maxIndex):
                    AmZugReihenfolgeDurchgang += 1
                else:
                    AmZugReihenfolgeDurchgang = 0
                marschMachen(AmZug)
            else: #Es gibt keinen Marschbefehl mehr
                print('Fehler')
        else:  #Es gibt keinen Marschbefehl mehr
            machtzuwachsMachen()
        
    #Funktion für start der Runde >>> Die Funktion ruft die nächste auf undo weiter undso weiter

    def startRound(round):
        global Spielschritt
        if(round <=10):
            print('--------------')
            print('--------------')
            print('Runde ' + str(round) + ' wird gestartet ...')
            
            
            # Führe ganze Runde aus
            #Reihenfolge aktualisieren
            # Befeghlsmarker legen
            updateStatusAlle('Befehl legen')
            print('---------------------')
            print('Befehlsmarker werden gelegt ...')
            timer = createTimer('Befehlsmarker legen', spiel['Spiel_Config']['Spielzugdauer']['BefehlsmarkerLegen'], 'Alle')
            sendMessage('befehle', timer)
            Spielschritt = 'Befehle'
            sendMessage('zeigeHausAnzeige', nochNichtFertig)
        else:
            print('---------------------')
            print('Spiel ist zuende!')
            sendMessage('ende', 'Das Spiel ist zuende!')

    #Funktion mit der das Spiel gestartet wird >>> ruft startRunde() auf
    def startGame():
        global Spielschritt
        global dictUserHaus
        global usernames
        usernames = []
        for haus in spielbareHauser:
            usernames.append(spiel['Spieler'][haus]['User'].name)
            dictUserHaus[spiel['Spieler'][haus]['User'].name] = haus
        nachricht = {
            'msg': 'Spiel wird gestartet',
            'usernames':usernames
        }
        sendMessage('start', nachricht)
        Spielschritt = 'Start'
        startRound(spielrunde)

    #Checkt ab ob alle Spieler bereit sind und wenn ja startet das Spiel mit startGame()
    def spielerBeitritt(Haus, User):
        global nochNichtFertig
        global Spielschritt
        spiel['Spieler'][Haus]['User'].initialize(Haus,User)
        spiel['Spieler'][Haus]['Status'] = 'Beigetreten'
        try:
            nochNichtFertig.remove(Haus)
        except:
            pass
        sendMessage('zeigeHausAnzeige', nochNichtFertig)
        if(alleBereit('Beigetreten')):
            Spielschritt = 'Joined'
            sendMessage('joined','Alle')
            Spielschritt = 'Joined'
            nochNichtFertig = spielbareHauser.copy()
            sendMessage('zeigeHausAnzeige', nochNichtFertig)
        else:
            sendMessage('joined', Haus)

    def updateHausstatus(Haus,Status):
        global nochNichtFertig
        global spielbareHauser
        global Spielschritt
        global timerStart
        global hatAngegriffen
        now = time.time()
        zeit = int(now -timerStart)
        spiel['Spieler'][Haus]['Status'] = Status
        print('---------------------')
        print(Haus + ' >>> ' + spiel['Spieler'][Haus]['Status'])

        if(alleBereit(Status)):
            if(Status == 'bereitStart'):
                print('Starting the game ...')
                nochNichtFertig = spielbareHauser.copy()
                startGame()
            if(Status == 'Befehlsmarker gelegt'):
                updateStats(Haus,Status, zeit)
                nochNichtFertig = spielbareHauser.copy()
                Spielschritt = 'Uberfall'
                sendMessage('resetHausanzeige','')
                print('---------------------')
                print('Überfälle ausführen ...')
                updateStatusAlle('Uberfalle')
                sendMessage('Uberfall',rabe)
            if(Status == 'uberfall gemacht'):
                updateStats(Haus,Status, zeit)
                nochNichtFertig = spielbareHauser.copy()
                sendMessage('resetHausanzeige','')
                print('---------------------')
                print('Marschbefehle ausführen ...')
                updateStatusAlle('Uberfall')
                updateStatusAlle('Marschbefehle')
                marschBefehle()
            if(Status == 'Machtmarker genommen'):
                updateStats(Haus,Status, zeit)
                sendMessage('resetHausanzeige','')
                nochNichtFertig = spielbareHauser.copy()
                sendMessage('zeigeHausAnzeige', nochNichtFertig)
                sendMessage('westeros','Westerosphase beginnt!')
                Spielschritt ='Westeros'
                print('---------------------')
                print('---------------------')
                print('Westerosphase beginnt ...')
                print('---------------------')
                print('---------------------')
                for haus in spielbareHauser:
                    createStat(haus)
                with open('stats.json', 'w') as outfile:
                    json.dump(stats, outfile, ensure_ascii=False,indent=4, sort_keys=True)  
            if(Status == 'westerosphaseFertig'):
                nochNichtFertig = spielbareHauser.copy()
                sendMessage('zeigeHausAnzeige', nochNichtFertig)
                westerosphase()
        else:
            if(Status == 'Befehlsmarker gelegt'):
                updateStats(Haus,Status, zeit)
                try:
                    nochNichtFertig.remove(Haus)
                except:
                    pass
                sendMessage('zeigeHausAnzeige', nochNichtFertig)
            if(Status == 'uberfall gemacht'):
                updateStats(Haus,Status, zeit)
                try:
                    nochNichtFertig.remove(Haus)
                except:
                    pass
                sendMessage('zeigeHausAnzeige', nochNichtFertig)
            if(Status == 'Machtmarker genommen'):
                updateStats(Haus,Status, zeit)
                try:
                    nochNichtFertig.remove(Haus)
                except:
                    pass
                sendMessage('zeigeHausAnzeige', nochNichtFertig)
            if(Status == 'bereitStart'):
                try:
                    nochNichtFertig.remove(Haus)
                except:
                    pass
                sendMessage('zeigeHausAnzeige', nochNichtFertig)
            if(Status == 'westerosphaseFertig'):
                try:
                    nochNichtFertig.remove(Haus)
                except:
                    pass
                sendMessage('zeigeHausAnzeige', nochNichtFertig)
        if(Status == 'Marschbefehl ausgeführt'):
            if(hatAngegriffen == Haus):
                hatAngegriffen = ''
            else:
                updateStats(Haus,Status, zeit)
                hatAngegriffen = ''
            print('---------------------')
            print('Auf weitere Marschbefehle warten ...')
            marschBefehle()

    #Dieser Bereich definiert was mit den Nachrichten geschehen soll die an den Server gesendet werden        


if __name__ == '__main__':
    global game1
    game1 = Game('normal','2','')