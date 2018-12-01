var noSleep = new NoSleep();
var dong = new Audio("tones/silence.mp3");
var weitermachen = new Audio("tones/silence.mp3");
var attack = new Audio("tones/silence.mp3");
var countdown = new Audio("tones/silence.mp3");
var chaChing = new Audio("tones/silence.mp3");
var befehleStart = new Audio("tones/silence.mp3");
var spielAuswahl = [];
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
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    }else{
        document.cookie = name + "=" + (value || "")  +  "; path=/";
    }
   
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
function eraseAllCookies(){
    var theCookies = document.cookie.split(';');
    for(var i = 0; i <  theCookies.length; i++){
        var name = theCookies[i].split('=')[0]
        console.log(name)
        eraseCookie(theCookies[i])
    }
}

var socket = io.connect('http://' + window.location.hostname + ':9191');
socket.emit('syn','')
console.log('syn')
socket.on('ack',function(){
    console.log('Websocket connected!')
    if(document.cookie.includes('Username') && document.cookie.includes('gamename') && document.cookie.includes('host')){
        console.log('Cookies detected')
        Username = getCookie('Username');
        gamename = getCookie('gamename');
        host = getCookie('host');
        $('#input').val(Username);
        nachricht['gamename'] = gamename;
        nachricht['Name'] = Username;
        socket.emit('restore',nachricht);
        $('#loadingDisplay').css('display','none');
        socket.on('restoreHaus', function(msg){
            UserHaus = msg.Haus;
            saveUsernames(msg.Userliste)
            nachricht['Haus'] = UserHaus;
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
            socket.emit('restoreSpielschritt',nachricht);
        });
    }else{
        console.log('No Cookies detected')
        if(document.cookie.includes('Username')){
            console.log('Username gefunden')
            $('#loadingDisplay').css('display','none');            
            $('#anzeige').html(getCookie('Username') + ', bist du es? ' + String.fromCodePoint(0x1F632));
            $('#button').css('left','0')
            $('#button').css('display','block').html('Na sicher doch!');
            $('#button').on('click',function(){
                nachricht['Name'] = getCookie('Username');
                socket.emit('joining', nachricht);
                $('#input').css('display','none');
                $('#input').css('display','none');
                $('#button').css('display','none').html('');
                $('#button').off('click');
            });
            $('#angriffButton').css('display','block')
            $('#angriffButton').html('Neu');
            $('#angriffButton').on('click',function(){
                $('#angriffButton').off('click')
                askName()
            });
        }else{
            askName()
        }
    }
})



socket.on('setGamename', function(msg){
    eraseCookie('gamename');
    eraseCookie('host');
    eraseCookie('Haus');
    spielAuswahl = msg;
    $('#anzeige').html('Spiel hosten oder beitreten?');
    $('#button').css('left','0')
    $('#button').css('display','block').html('Spiel hosten');
    $('#button').on('click',function(){
        host = true;
        setCookie('host', true, 4);
        $('#angriffButton').off('click');
        $('#button').off('click');
        $('#angriffButton').css('display','none');
        $('#button').css('display','none');
        $('#button').css('left','15%');
        $('#hostPage').css('display','block');
        $('#spielname').css('display','block');
        $('#variant').css('display','block');
        $('#spieleranzahl').css('display','block');
        $('#spielnameLabel').css('display','block');
        $('#variantLabel').css('display','block');
        $('#spieleranzahlLabel').css('display','block');
        $('#hostInputs').css('display','block');
        $('#footerHost').css('display','block');
        $('#spielerposition').css('display','none');
        $('#hostButton').on('click', function(){
            $('#spielname').css('display','none');
            $('#variant').css('display','none');
            $('#spieleranzahl').css('display','none');
            $('#spielnameLabel').css('display','none');
            $('#variantLabel').css('display','none');
            $('#spieleranzahlLabel').css('display','none');
            $('#hostButton').off('click');
            console.log('Spiel hosten')
            $('#hostPage').css('display','none');
            gamename = $('#spielname').val();
            message = {
                'name':gamename,
                'variant':$('#variant').val(),
                'numb':$('#spieleranzahl').val()
            }
            socket.emit('host', message);
            nachricht['gamename'] = gamename;
            setCookie('gamename',nachricht['gamename'],4);
            setTimeout(function(){ socket.emit('restore',nachricht); }, 500);
        })
    });
    $('#angriffButton').html('Beitreten');
    $('#angriffButton').css('display','block');
    $('#angriffButton').on('click',function(){
        host = false;
        setCookie('host', false, 4);
        socket.emit('reloadGames','');
        $('#spielname').css('display','none');
        $('#variant').css('display','none');
        $('#spieleranzahl').css('display','none');
        $('#spielnameLabel').css('display','none');
        $('#variantLabel').css('display','none');
        $('#spieleranzahlLabel').css('display','none');
        $('#angriffButton').off('click');
        $('#angriffButton').css('display','none')
        $('#button').off('click');
        $('#button').css('display','none')
        $('#button').css('left','15%');
        $('#spielAuswahl').html('');
        for(var i = 0; i < spielAuswahl.length; i++){
            $('#spielAuswahl').append('<li><a class="spiel">' + spielAuswahl[i] + '</a></li>');   
        }
        $('#spielAuswahl').css('display','block');
        $('.spiel').on('click',function(){
            $('#spielAuswahl').css('display','none');
            $('#button').css('left','15%');
            $('#angriffButton').css('display','none');
            $('.spiel').off('click');
            gamename = $(this).html();
            nachricht['gamename'] = $(this).html();
            setCookie('gamename',nachricht['gamename'],4)
            socket.emit('restore',nachricht)
        });
    });    
});
socket.on('gameList', function(msg){
    spielAuswahl = msg;
    $('#spielAuswahl').html('');
    for(var i = 0; i < spielAuswahl.length; i++){
        $('#spielAuswahl').append('<li><a class="spiel">' + spielAuswahl[i] + '</a></li>');   
    }
    $('.spiel').on('click',function(){
        $('#spielAuswahl').css('display','none');
        $('#button').css('left','15%');
        $('#angriffButton').css('display','none');
        $('.spiel').off('click');
        nachricht['gamename'] = $(this).html();
        gamename = nachricht['gamename']
        setCookie('gamename',nachricht['gamename'],4)
        socket.emit('restore',nachricht)
    });
});


socket.on('initialize',function(msg){
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
    console.log(msg.message.usernames);
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
    if(host){
        westerosphase()
        nachricht['message'] = {};
        $('#anzeige').html('Gab es Änderungen in der Westerosphase?');
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
                
                // Diese Funktion muss noch richtig implementirert werden
                
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