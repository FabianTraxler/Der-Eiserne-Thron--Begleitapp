// Initialize all audios and store them in variable
var noSleep = new NoSleep();
var dong = new Audio("tones/silence.mp3");
var weitermachen = new Audio("tones/silence.mp3");
var attack = new Audio("tones/silence.mp3");
var countdown = new Audio("tones/silence.mp3");
var chaChing = new Audio("tones/silence.mp3");
var befehleStart = new Audio("tones/silence.mp3");
//cretae variable for list of available games
var spielAuswahl = [];

var spielschritt = 0
// define function to enable no sleep functionallity for mobile devices
function enableNoSleep() {
    noSleep.enable();
    dong.play();
    weitermachen.play();
    countdown.play();
    chaChing.play();
    befehleStart.play();
    dong = new Audio("tones/tone.mp3");;
    weitermachen = new Audio("tones/memo.m4a");
    attack = new Audio("tones/attack.mp3");
    countdown = new Audio("tones/countdown.mp3");
    befehleStart = new Audio("tones/befehleStart.mp3");

    chaChing = new Audio("tones/chaChing.mp3");
    $('#button').off('click',enableNoSleep);
}
// call function by clicking the first buttom, so noSleep gets activated
$('#button').on('click',enableNoSleep);

//connect to the Socket
var socket = io.connect('http://' + window.location.hostname + ':9191');
// First connection with the Server
socket.on('connect',function(){
    console.log('Websocket connected!')
    connected()
})
// Game in Progress and waiting for server to tell house
socket.on('restoreHaus', function(msg){
    if(msg.User == getCookie('Username')){
        restoreHaus(msg);
    }

});
// Game not in Progress
socket.on('noGame', function(msg){
    eraseCookie('gamename');
    eraseCookie('host');
    eraseCookie('Haus');
    nachricht['Haus'] = '';
    nachricht['gamename'] = '';
    nachricht['host'] = '';
    if(document.cookie.includes('Username')){
        console.log('Found Username')
        $('#loadingDisplay').css('display','none');            
        $('#anzeige').html(getCookie('Username') + ', bist du es? ' + String.fromCodePoint(0x1F632));
        $('#button').css('left','0')
        $('#button').css('display','block').html('Na sicher doch!');
        $('#button').on('click',function(){
            nachricht['Name'] = getCookie('Username');
            $('#angriffButton').off('click');
            $('#button').off('click');
            setGamename(msg)
        });
        $('#angriffButton').css('display','block')
        $('#angriffButton').html('Nein');
        $('#angriffButton').on('click',function(){
            $('#angriffButton').off('click');
            $('#button').off('click');
            askName();
        });
    }else{
        askName();
    }
});
socket.on('setGamename', function(msg){
    setGamename(msg);
});
// reload the available games
socket.on('gameList', function(msg){
    spieleAuswahl(msg);
});
socket.on('initializeUser',function(msg){
    spielschritt = 1;
    console.log('initialize');
    if(msg.message.User == nachricht['Name']){
        createHausauswahl(msg.message.Hausliste);
        showHausauswahl();
        createNochNichtFertig(msg.message.Hausliste);
    }
    
});
socket.on('joined', function(msg) {
    spielschritt = 2;
    if(msg.Betroffener == "Alle" || msg.Betroffener == UserHaus){
        if (msg.message ==UserHaus){
            console.log('joined');
            $('#anzeige').html('Auf andere Spieler warten ...');
        }
        else if (msg.message =='Alle'){
            $('#anzeige').html('Alle Spieler beigetreten');
            if (!('erledigt' in msg)){
                $('#button').css('display','block').html('Bereit');
                $('#button').on('click',bereitSpielen);
            }
        }
    }
});
socket.on('start', function(msg) {
    if(msg.Betroffener == "Alle" || msg.Betroffener == UserHaus){
        console.log(msg.message.usernames);
        saveUsernames(msg.message.usernames)
        $('#anzeige').html(msg.message.msg);
    }
});
socket.on('befehle', function(msg) {
    if(msg.Betroffener == "Alle" || msg.Betroffener == UserHaus){
        var betroffener = msg.message.Haus;
        if(betroffener == UserHaus){
            clearInterval(x);
            $('#timer').css('display','none');
            $('#anzeige').html(msg.message.Aktion);
            befehlsmarkerStart(parseInt(msg.message.Zeit) );
        }
        if(betroffener == 'Alle'){
            $('#anzeige').html(msg.message.Aktion);
            befehlsmarkerStart(parseInt(msg.message.Zeit) );
        }
    }
});
socket.on('uberfall',function(msg){
    if(msg.Betroffener == "Alle" || msg.Betroffener == UserHaus){
        uberfalle();
        if(msg.message.rabe == UserHaus){
            $('#timer').css('display','block').html('Wildlingskarte anschauen oder Befehl tauschen!')
        }
    }
});
socket.on('marsch', function(msg) {
    if(msg.Betroffener == "Alle" || msg.Betroffener == UserHaus){
        var amZug = msg.message.Haus;
        if(amZug == UserHaus){
            clearInterval(x);
            $('#timer').css('display','none');
            $('#anzeige').html(msg.message.Aktion);
            marschStart(parseInt(msg.message.Zeit));
        }else{
            showTimer(parseInt(msg.message.Zeit))
            $('#anzeige').html(msg.message.Geschehen);
        }
    }
});
socket.on('angriffMachen', function(msg){
    var angreifer = msg.message.Angreifer;
    var verteidiger = msg.message.Verteidiger;
    if(verteidiger == UserHaus){
        attack.play()
        $('#timer').css('display','none');
        $('#anzeige').html(angreifer + ' gerift dich an!')
    }else{
        angriffZeigen(angreifer,verteidiger);
    }
})
socket.on('machtzuwachs', function(msg) {
    if(msg.Betroffener == "Alle" || msg.Betroffener == UserHaus){
        resetNochNichtFertig();
        var betroffener = msg.message.Haus;
        if(betroffener == UserHaus){
            clearInterval(x);
            $('#timer').css('display','none');
            $('#anzeige').html(msg.message.Aktion);
            machtStart(parseInt(msg.message.Zeit) );
        }
        if(betroffener == 'Alle'){
            $('#anzeige').html(msg.message.Aktion);
            machtStart(parseInt(msg.message.Zeit) );
        }
    }
});
socket.on('westeros', function(msg) {
    if(msg.Betroffener == "Alle" || msg.Betroffener == UserHaus){
        console.log(msg.message);
        if(getCookie('host') === 'true'){
            nachricht['message'] = {};
            $('.container').html('');
            $('#anzeige').html('Gab es Änderungen?');
            $('#button').css('left','0')
            $('#button').css('display','block').html('Änderungen');
            $('#button').on('click',function(){
                $('#angriffButton').off('click');
                $('#button').off('click');
                $('#angriffButton').css('display','none');
                $('#button').css('display','none');
                $('#button').css('left','15%');
                $('#hostPage').css('display','block');
                $('#hostInputs').css('display','block');
                $('#spielerposition').css('display','block');
                $('#rabe').css('display','block');
                $('#spielerpositionLabel').css('display','block');
                $('#rabeLabel').css('display','block');
                $('#footerHost').css('display','block');
                $('#hostButton').html('Änderungen übernehmen')
                $('#hostButton').on('click', function(){                
                    $('#hostButton').off('click');
                    $('#hostInputs').css('display','none');
                    $('#spielerposition').css('display','none');
                    $('#rabe').css('display','none');
                    $('#spielerpositionLabel').css('display','none');
                    $('#rabeLabel').css('display','none');
                    $('#hostPage').css('display','none');
                    
                    nachricht['message']['change'] = true;
                    nachricht['message']['rabe'] = $('#rabe').val();
                    var charString = String($('#spielerposition').val());
                    console.log(charString)
                    nachricht['message']['reihenfolge'] = charString;
                    socket.emit('westerosEnde', nachricht)
                });
            });
            $('#angriffButton').html('Keine Änderungen');
            $('#angriffButton').css('display','block');
            $('#angriffButton').on('click',function(){
                $('#angriffButton').off('click');
                $('#button').off('click');
                $('#angriffButton').css('display','none');
                $('#button').css('display','none');
                $('#button').css('left','15%');
                nachricht['message']['change'] = false;
                socket.emit('westerosEnde', nachricht)
            });
        }else{
            $('#anzeige').html(msg.message);
            $('#button').css('display','block').html('Ready für die nächste Runde!');
            $('#button').on('click',westerosphase);
        }
    }
    
});
socket.on('ende', function(msg){
    $('#anzeige').html(msg.message);
});
socket.on('zeigeHausAnzeige', function(msg){
    if(msg.Betroffener == "Alle" || msg.Betroffener == UserHaus){
        resetNochNichtFertig();
        displayFertig(msg.message);
    }
});
socket.on('resetHausanzeige', function(msg){
    resetNochNichtFertig();
});
socket.onclose = function(e) {
    $('#anzeige').html('Verbindung verloren...');
};
