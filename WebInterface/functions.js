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
var nochNichtFertig = [];
$('#middle').css('top', $('#header').height())
function createNochNichtFertig(hausliste){
    for(var i=0; i <hausliste.length;i++){
        nochNichtFertig[i] = "<div class='hausStatus' id='"+hausliste[i]+"'></div>";
        if(i<3){
            $('#containerTop').append(nochNichtFertig[i]);
        }else{
            $('#containerBottom').append(nochNichtFertig[i]);
        }
    }
}
function displayFertig(hausliste){
    for(var i=0; i <hausliste.length;i++){
        $('#'+hausliste[i]).html('')
        $('#'+hausliste[i]).append("<div class='hausWarten'></div>");
    }
}
function resetCookies_variables(){
    eraseCookie('Username');
    eraseCookie('Haus');
    eraseCookie('gamename');
    eraseCookie('host');
    varUsername = '';
    varUserHaus = '';
    varUserNames = [];
    vargamename = '';
    varhost = false;
    varnachricht = {
        'gamename': '',
        'Name':'',
        'Haus':'',
        'message':''
    };
    x;
    nochNichtFertig = [];
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

function restoreHaus(haus){
    UserHaus = haus;
    nachricht['Haus'] = UserHaus;
    var bildURL = 'url("Hauswappen/'+UserHaus+'.jpg")';
    $('#wrapper').css('background-image', bildURL)
}
function askName(){
    resetCookies_variables();
    $('#loadingDisplay').css('display','none');            
    $('#anzeige').html('Username eingeben!');
    $('#input').css('display','block').attr('placeholder','John Snow');
    $('#button').css('display','block').html('Senden');
    $('#button').on('click',saveName);
}
function saveName(){
    Username = $('#input').val();
    nachricht['Name'] = Username;
    setCookie('Username',Username, 4);
    socket.emit('joining', nachricht);
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

