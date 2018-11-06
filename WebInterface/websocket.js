var noSleep = new NoSleep();
var dong = new Audio("tones/silence.mp3");
var weitermachen = new Audio("tones/silence.mp3");
var attack = new Audio("tones/silence.mp3");
var countdown = new Audio("tones/silence.mp3");
var chaChing = new Audio("tones/silence.mp3");
var befehleStart = new Audio("tones/silence.mp3");

function enableNoSleep() {
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
    noSleep.enable();
    $('#button').off('click',enableNoSleep);
}
$('#button').on('click',enableNoSleep);
// Enable wake lock.
// (must be wrapped in a user input event handler e.g. a mouse or touch handler)
function setCookie(name,value,hours) {
    var expires = "";
    if (hours) {
        var date = new Date();
        date.setTime(date.getTime() + (hours*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name+'=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';  
}

var socket = io.connect('http://' + window.location.hostname + ':9191');
socket.emit('pong','');
socket.on('ping',function(){
    console.log('PING');
    socket.emit('pong','');
});
// verify our websocket connection is established
//eraseCookie('Username');
if(document.cookie || Username){
    if(document.cookie){
        Username = getCookie('Username');
        $('#input').val(Username);
    }
    console.log(Username)
    socket.emit('restore',Username);
    socket.on('restoreHaus', function(msg){
        $('#loadingDisplay').css('display','none');
        UserHaus = msg.Haus;
        saveUsernames(msg.Userliste)
        nachricht['Haus'] = msg.Haus;
        $('.container').css('opacity',1);
        var bildURL = 'url("Hauswappen/'+UserHaus+'.jpg")';
        $('#wrapper').css('background-image', bildURL);
        createNochNichtFertig(msg.Hausliste);
        hausliste = msg.Hausliste;
        var index = hausliste.indexOf(UserHaus);
        if (index !== -1){
            hausliste.splice(index, 1);
        } 
        
        createHausauswahl(msg.Hausliste);
        socket.emit('restoreSpielschritt',UserHaus);
    });

    socket.on('reconnect', function() {
        $('#loadingDisplay').css('display','none');
        console.log('Websocket connected!');
        $('#anzeige').html('Username eingeben!');
        $('#input').css('display','block').attr('placeholder','John Snow');
        $('#button').css('display','block').html('Senden');
        $('#button').on('click',saveName);
    });
}else{
    socket.on('connect', function() {
        $('#loadingDisplay').css('display','none');
        console.log('Websocket connected!');
        $('#anzeige').html('Username eingeben!');
        $('#input').css('display','block').attr('placeholder','John Snow');
        $('#button').css('display','block').html('Senden');
        $('#button').on('click',saveName);
    });
}

// message handler for the 'join_room' channel
socket.on('initialize',function(msg){
    spielschritt = 1;
    console.log('initialize');
    if(msg.message.User == Username){
        createHausauswahl(msg.message.Hausliste);
        showHausauswahl();
        createNochNichtFertig(msg.message.Hausliste);
    }
    
});

socket.on('joined', function(msg) {
    spielschritt = 2;
    if (msg.message ==UserHaus){
        console.log('joined');
        $('#anzeige').html('Auf andere Spieler warten ...');
    }
    if (msg.message =='Alle'){
        $('#anzeige').html('Alle Spieler beigetreten');
        $('#button').css('display','block').html('Bereit');
        $('#button').on('click',bereitSpielen);
    }
});
socket.on('start', function(msg) {
    console.log('start');
    saveUsernames(msg.message.usernames)
    $('#anzeige').html(msg.message.msg);
});
socket.on('befehle', function(msg) {
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
});
socket.on('Uberfall',function(msg){
    uberfalle();
    if(msg.message == UserHaus){
        $('#timer').css('display','block').html('Wildlingskarte anschauen oder Befehl tauschen!')
    }
});
socket.on('marsch', function(msg) {
    var betroffener = msg.message.Haus;
    if(betroffener == UserHaus){
        clearInterval(x);
        $('#timer').css('display','none');
        $('#anzeige').html(msg.message.Aktion);
        marschStart(parseInt(msg.message.Zeit));
    }else{
        showTimer(parseInt(msg.message.Zeit))
        $('#anzeige').html(msg.message.Geschehen);
    }
});
socket.on('anriffMachen', function(msg){
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
});
socket.on('westeros', function(msg) {
    console.log(msg.message);
    $('#anzeige').html(msg.message);
    $('#button').css('display','block').html('Ready für die nächste Runde!');
    $('#button').on('click',westerosphase);
});
socket.on('ende', function(msg){
    $('#anzeige').html(msg.message);
});
socket.on('zeigeHausAnzeige', function(msg){
    resetNochNichtFertig();
    displayFertig(msg.message);
});
socket.on('resetHausanzeige', function(msg){
    resetNochNichtFertig();
});
socket.onclose = function(e) {
    $('#anzeige').html('Verbindung verloren...');
};