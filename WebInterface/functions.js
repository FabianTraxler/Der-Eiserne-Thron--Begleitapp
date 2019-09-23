// Initialize some variables
var Username = '';
var UserHaus = '';
var UserNames = [];
var gamename = '';
var host = false;
// Structure of messages exchanged between client and server
var nachricht = {
    'gamename': '',
    'Name':'',
    'Haus':'',
    'message':''
};
var x;
var nochNichtFertig = [];
$('#reload').on('click',function(){
    location.reload(); 
});    
// initialize heights of objects
$('#middle').css('top', $('#header').height())
// define helper functions
function setCookie(name,value,hours) {
    var expires = "; max-age=9999999999999999";
    if (parseInt(hours)) {
        var duration = hours * 60 * 60
        expires = "; max-age=" + String(duration);
    }
    var cookie =  name + "=" + value  + expires + "; path=/";
    console.log(cookie)
    document.cookie = cookie;
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
    document.cookie = name+'=; max-age=0; path=/';  
}

function resetCookies_variables(){
    eraseCookie('Username');
    eraseCookie('Haus');
    eraseCookie('gamename');
    eraseCookie('host');
    var Username = '';
    var UserHaus = '';
    var UserNames = [];
    var gamename = '';
    var host = false;
    var nachricht = {
        'gamename': '',
        'Name':'',
        'Haus':'',
        'message':''
    };
    var x;
    nochNichtFertig = [];
}

// All functions called by websocket.js
// msg.id = connect
function connected(){
    //check if already in a game == username, gamename and host are stored in cookies
    if(document.cookie.includes('Username') && document.cookie.includes('gamename') && document.cookie.includes('host')){
        console.log('Username and Gamename detected')
        // fill variables with respective values
        Username = getCookie('Username');
        gamename = getCookie('gamename');
        host = getCookie('host');
        if(getCookie('Haus')){
            haus = getCookie('Haus')
            nachricht['Haus'] = haus;
        }
        //fill message with values
        nachricht['gamename'] = gamename;
        nachricht['Name'] = Username;
        //emit message
        socket.emit('restoreSession',nachricht);
        // hide loading screen
        $('#loadingDisplay').css('display','none');
    }else{
        console.log('No Game in Progress')
        if(document.cookie.includes('Username')){
            console.log('found Username')
            $('#loadingDisplay').css('display','none');            
            $('#anzeige').html(getCookie('Username') + ', bist du es? ' + String.fromCodePoint(0x1F632));
            $('#button').css('left','0')
            $('#button').css('display','block').html('Na sicher doch!');
            $('#button').on('click',function(){
                nachricht['Name'] = getCookie('Username');
                Username = getCookie('Username');
                socket.emit('startSession', nachricht);
                $('#input').css('display','none');
                $('#input').html('');
                $('#button').css('display','none').html('');
                $('#button').css('left','15%');
                $('#button').off('click');
                $('#anzeige').html('Spiel hosten oder beitreten?');
                $('#anzeige').css('display','block')
                $('#angriffButton').css('display','none')
                $('#angriffButton').html('');
                $('#angriffButton').off('click');
            });
            $('#angriffButton').css('display','block')
            $('#angriffButton').html('Nein');
            $('#angriffButton').on('click',function(){
                $('#angriffButton').off('click')
                askName()
            });
        }else{
            askName()
        }
    }
}
function restoreHaus(msg){
    // store housename
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
    
    socket.emit('restoreSpielschritt',nachricht);
};
function spieleAuswahl(msg){
    spielAuswahl = msg;
    $('.spiel').off('click');
    $('#spielAuswahl').html('');
    $('#spielAuswahl').css('display','block');
    for(var i = 0; i < spielAuswahl.length; i++){
        $('#spielAuswahl').append('<li><a class="spiel">' + spielAuswahl[i] + '</a></li>');   
    }
    $('#spielAuswahl').append('<li><a class="back"> <-- </a></li>');
    $('.spiel').on('click',function(){
        $('#spielAuswahl').css('display','none');
        $('#button').css('left','15%');
        $('#button').css('display','none');
        $('#angriffButton').css('display','none');
        $('.spiel').off('click');
        nachricht['gamename'] = $(this).html();
        gamename = nachricht['gamename']
        setCookie('gamename',nachricht['gamename'],4)
        socket.emit('restoreSession',nachricht)
    });
    $('.back').on('click',function(){
        socket.emit('startSession', nachricht);
    });
};
function setGamename(gameList){
    spielAuswahl = gameList;
    $('.spiel').off('click');
    $('#spielAuswahl').html('');
    $('#anzeige').html('Spiel hosten oder beitreten?');
    $('#button').css('left','0')
    $('#button').css('display','block').html('Spiel hosten');
    $('#button').on('click',function(){
        host = true;
        setCookie('host', host, 8);
        $('#angriffButton').off('click');
        $('#button').off('click');
        $('#angriffButton').css('display','none');
        $('#button').css('display','none');
        $('#button').css('left','15%');
        $('#anzeige').html('');
        $('#anzeige').css('display','none');
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
            setCookie('gamename',nachricht['gamename'],8);
            setTimeout(function(){ socket.emit('restoreSession',nachricht); }, 500);
        })
    });
    $('#angriffButton').html('Beitreten');
    $('#angriffButton').css('display','block');
    $('#angriffButton').on('click',function(){
        socket.emit('reloadGames', '')
        host = false;
        setCookie('host', host, 8);
        // socket.emit('reloadGames','');
        $('#input').css('display','none');
        $('#anzeige').html('Spiel auswählen');
        $('#spielname').css('display','none');
        $('#variant').css('display','none');
        $('#spieleranzahl').css('display','none');
        $('#spielnameLabel').css('display','none');
        $('#variantLabel').css('display','none');
        $('#spieleranzahlLabel').css('display','none');
        $('#angriffButton').off('click');
        $('#angriffButton').css('display','none');
        $('#button').off('click');
        $('#button').css('display','none');
        $('#button').css('left','15%');
        $('#spielAuswahl').html('');
        spieleAuswahl(spielAuswahl);
    });    
};

function createNochNichtFertig(hausliste){
    for(var i=0; i <hausliste.length;i++){
        if(hausliste.length>6){
            nochNichtFertig[i] = "<div class='hausStatusBig' id='"+hausliste[i]+"'></div>";
            if(i<4){
                $('#container1').append(nochNichtFertig[i]);
            }else if(i<8){
                $('#container2').append(nochNichtFertig[i]);
            }else{
                $('#container3').append(nochNichtFertig[i]);
            }
            $('#containerTop').css('display','none');
            $('#containerBottom').css('display','none');
        }else{
            nochNichtFertig[i] = "<div class='hausStatus' id='"+hausliste[i]+"'></div>";
            if(i<3){
                $('#containerTop').append(nochNichtFertig[i]);
            }else{
                $('#containerBottom').append(nochNichtFertig[i]);
            }
        }
    }
}
function displayFertig(hausliste){
    for(var i=0; i <hausliste.length;i++){
        $('#'+hausliste[i]).html('')
        $('#'+hausliste[i]).append("<div class='hausWarten'></div>");
    }
}

function resetNochNichtFertig(){
    $('.container').html('');
    for(var i=0; i <nochNichtFertig.length;i++){
        if(i<3){
            $('#containerTop').append(nochNichtFertig[i]);
        }else{
            $('#containerBottom').append(nochNichtFertig[i]);
        }
    }
    
}
function createHausauswahl(hausListe){
    $('#hausAuswahl').html('');
    for(var i = 0; i < hausListe.length; i++){
        $('#hausAuswahl').append('<li><a class="haus">' + hausListe[i] + '</a></li>');   
    }
}

function showHausauswahl(){
    $('#anzeige').css('display','block');
    $('#anzeige').html('Haus auswählen');
    $('#hausAuswahl').css('display','block');
    $('.haus').on('click',saveHaus);
}
function saveHaus(){
    $('.haus').off('click',saveHaus);
    UserHaus = $(this).html();
    nachricht['Haus'] = UserHaus;
    setCookie('Haus', UserHaus);
    $(this).remove();
    $('.container').css('opacity',1)
    var bildURL = 'url("Hauswappen/'+UserHaus+'.jpg")';
    $('#wrapper').css('background-image', bildURL)

    $('#hausAuswahl').css('display','none');
    $('#anzeige').html('Trete Spiel bei ...');
    socket.emit('join', nachricht);
    console.log('User gespeichert: ' + Username + ' >>> ' + UserHaus );
}


function askName(){
    resetCookies_variables();
    $('#loadingDisplay').css('display','none');            
    $('#anzeige').html('Username eingeben!');
    $('#input').css('display','block').attr('placeholder','John Snow');
    $('#button').css('display','block').html('Senden');
    $('#button').css('left','15%')
    $('#angriffButton').css('display','none');
    $('#button').on('click',saveName);
}
function saveName(){
    Username = $('#input').val();
    nachricht['Name'] = Username;
    setCookie('Username',Username, null);
    socket.emit('startSession', nachricht);
    $('#input').css('display','none');
    $('#input').css('display','none');
    $('#button').css('display','none').html('');
    $('#button').off('click',saveName);
}

function bereitSpielen(){
    $('#button').css('display','none').html('');
    $('#button').off('click',bereitSpielen);
    nachricht['message'] = 'bereitStart';
    socket.emit('status', nachricht);
}
function saveUsernames(Usernames){
    UserNames = Usernames
    UserNames = jQuery.grep(UserNames, function(value) {
        return value != Username;
      });
    $('#userAuswahl').html('');
    for(var i = 0; i < UserNames.length; i++){
        $('#userAuswahl').append('<li><a class="haus">' + UserNames[i] + '</a></li>');   
    }
}
function befehlsmarkerStart(sekunden){
    befehleStart.play();
    clearInterval(x);
    var marschbefehle = 0;
    var sekunde = sekunden;
    $('#timer').html('verbleibende Zeit: <br>');
    $('#timer').css('display','block');
    $('#button').css('display','block').html('Ich warats dann amal!');
    $('#button').on('click',befehlsmarkerEnd);
    $('#button').css('left','0')
    $('#angriffButton').css('display','block')
    $('#angriffButton').html(marschbefehle);
    $('#angriffButton').on('click',function(){
        if(marschbefehle <3){
            marschbefehle +=1;
            $('#angriffButton').html(marschbefehle);
        }else{
            marschbefehle =0;
            $('#angriffButton').html(marschbefehle);
        } 
    });
    x = setInterval(function() {
        var distance = sekunde * 1000;
        
        // Time calculations for days, hours, minutes and seconds
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Output the result in an element with id="demo"
        $('#timer').html('verbleibende Zeit: <br>' + minutes + "m " + seconds + "s ")
        if(sekunde == 30){
            weitermachen.play()
        }
        if(sekunde == 4){
            countdown.play()
        }
        if(distance < 0){
            clearInterval(x);
            $('#timer').html('"Zeit abgelaufen!<br>Einen Machtmarker abgeben!')
        }
        sekunde = sekunde - 1;
    },1000)
}

function befehlsmarkerEnd(){
    countdown.pause();
    clearInterval(x);
    var anzahl = $('#angriffButton').html();
    $('#timer').css('display','none');
    $('#button').css('display','none').html('');
    $('#button').css('left','15%');
    $('#button').off('click',befehlsmarkerEnd);
    $('#angriffButton').css('display','none')
    $('#angriffButton').html('');
    $('#angriffButton').off('click',);
    nachricht['message'] = 'Befehlsmarker gelegt';
    var befehlsmarker = {
        'gamename' : gamename,
        'Anzahl': anzahl,
        'Haus':UserHaus
    }
    socket.emit('anzahlBefehlsmarker',befehlsmarker )
    socket.emit('status', nachricht);
}
function uberfalle(){
    $('#anzeige').html('Überfallsbefehle durchführen!');
    $('#input').css('display','none');
    $('#button').css('display','block').html('Alle ausgeführt');
    $('#button').on('click',uberfallgenommen);
}
function uberfallgenommen(){
    $('#button').off('click',uberfallgenommen);
    $('#button').css('display','none').html('');
    $('#anzeige').html('Auf andere Spieler warten ...');
    nachricht['message'] = 'uberfall gemacht';
    socket.emit('status', nachricht);
}
function marschStart(sekunden){
    dong.play();
    $('#middle').css('background-color','rgba(255,255,255,0.9)');
    clearInterval(x);
    $('.container').css('opacity',0)
    var sekunde = sekunden;
    $('#timer').html('verbleibende Zeit: <br>');
    $('#timer').css('display','block');
    $('#button').css('left','0')
    $('#button').css('display','block').html('Marsch ausgeführt');
    $('#button').on('click',marschEnde);
    $('#angriffButton').html('Angriff!');
    $('#angriffButton').css('display','block');
    $('#angriffButton').on('click',angriffStart);
    
    x = setInterval(function() {
        $('#middle').css('background-color','rgba(255,255,255,0)');
        var distance = sekunde * 1000;
        // Time calculations for days, hours, minutes and seconds
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Output the result in an element
        $('#timer').html('verbleibende Zeit: <br>' + minutes + "m " + seconds + "s ")
        if(sekunde == 4){
            countdown.play()
        }
        if(distance < 0){
            clearInterval(x);
            $('#timer').html('Zeit abgelaufen!<hr>Einen Machtmarker abgeben!')
        }
        sekunde = sekunde - 1;
    },1000)
}
function angriffStart(){
    countdown.pause();
    clearInterval(x);
    $('#timer').css('display','none');
    $('#angriffButton').css('display','none');
    $('#userAuswahl').css('display','block');
    $('#button').html('Angriff beendet!');
    $('.haus').on('click',function(){
        verteidiger = $(this).html();
        angriffMachen(verteidiger)
    });
}
function angriffMachen(verteidiger){
    $('.haus').off('click',);
    $('#userAuswahl').css('display','none');
    message ={
        'gamename':gamename,
        'Angreifer':UserHaus,
        'Verteidiger':verteidiger
    };
    socket.emit('angriff',message);
}
function angriffZeigen(angreifer, verteidiger){
    $('#timer').css('display','none');
    $('#anzeige').html(angreifer + ' greift ' + verteidiger + ' an!')
}
function marschEnde(){
    countdown.pause();
    $('#angriffButton').css('display','none');
    $('#angriffButton').off('click',angriffStart);
    $('.container').css('opacity',1)
    $('#anzeige').html('Auf andere Spieler warten ...');
    clearInterval(x);
    $('#timer').css('display','none');
    $('#button').css('display','none').html('');
    $('#button').off('click',marschEnde);
    $('#button').css('left','15%')
    nachricht['message'] = 'Marschbefehl ausgeführt';
    socket.emit('status', nachricht);
}
function machtStart(sekunden){
    chaChing.play();
    clearInterval(x);
    var sekunde = sekunden;
    $('#timer').html('verbleibende Zeit: <br>');
    $('#timer').css('display','block');
    $('#button').css('display','block').html('Machtmarker genommen');
    $('#button').on('click',machtEnde);
    x = setInterval(function() {
        var distance = sekunde * 1000;
        
        // Time calculations for days, hours, minutes and seconds
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Output the result in an element
        $('#timer').html('verbleibende Zeit: <br>' + minutes + "m " + seconds + "s ");
        if(sekunde == 4){
            countdown.play()
        }
        if(distance < 0){
            clearInterval(x);
            $('#timer').html('Zeit abgelaufen!<hr>Einen Machtmarker abgeben!')
        }
        sekunde = sekunde - 1;
    },1000)
}

function machtEnde(){
    countdown.pause();
    $('#anzeige').html('Auf andere Spieler warten ...');
    clearInterval(x);
    $('#timer').css('display','none');
    $('#button').css('display','none').html('');
    $('#button').off('click',machtEnde);
    nachricht['message'] = 'Machtmarker genommen';
    socket.emit('status', nachricht);
}
function showTimer(sekunden){
    clearInterval(x);
    var sekunde = sekunden;
    $('#timer').css('display','block');
    x = setInterval(function() {
        var distance = sekunde * 1000;
        
        // Time calculations for days, hours, minutes and seconds
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Output the result in an element with id="demo"
        
        $('#timer').html('verbleibende Zeit: <br>' + minutes + "m " + seconds + "s ")
        
        if(distance < 0){
            clearInterval(x);
            $('#timer').html('"Zeit abgelaufen!')
        }
        sekunde = sekunde - 1;
    },1000)
}
function westerosphase(){
    $('#button').off('click',westerosphase);
    $('#button').css('display','none');
    $('anzeige').html('Auf andere Spieler warten ...')
    nachricht['message'] = 'westerosphaseFertig';
    socket.emit('status',nachricht)
}

