var canvas = document.getElementById('gamePong');
var ctx = canvas.getContext('2d');
var speed = 30;

// communication avec le serveur
var socket = io.connect(document.location.host)


var waitService = true;
var playerService = 1;


var currentPlayer = 0;

var player1 = { 
    score : 0, 
    racket : {
        color : '#06457E',
        top : 200,
        height : 150
    }
};

var player2 = { 
    score : 0, 
    racket : {
        color : '#06457E',
        top : 200,
        height : 150
    }
};

var ball = {
    size : 10,
    x : 12,
    y: 50,
    dx : 3,
    dy : -3
}

// Verrifie une collision de la balle et d'un bord ou d'une raquette
function moveBall() {
    if( waitService ) return;

    // collision vertical
    if( ball.y + ball.dy > canvas.height-ball.size 
        || 
        ball.y + ball.dy < ball.size
    ) {
        ball.dy = -ball.dy;
    }
    
    // si colision sur une raquette 
    if( ball.y + ball.dy >= player1.racket.top 
        && 
        ball.y + ball.dy <= player1.racket.top+player1.racket.height
        &&
        ball.x <= 30+(ball.size/2)
        &&
        ball.x > 20 // on  dépassé la raquette
    ) {
        ball.dy = -ball.dy;
        ball.dx = -ball.dx;
    }
    else if( ball.y + ball.dy >= player2.racket.top 
        && 
        ball.y + ball.dy <= player2.racket.top+player2.racket.height
        &&
        ball.x >= 970-(ball.size/2)
        &&
        ball.x < 971 // on  dépassé la raquette
    ) {
        ball.dy = -ball.dy;
        ball.dx = -ball.dx;
    }
    else {
        // possible point perdu
        if(ball.x + ball.dx > canvas.width+ball.size) {
            player1.score++;
            service(1)
        }
        if(ball.x + ball.dx < ball.size) {
            player2.score++;
            service(2)
        }
    }
}


function service(player)
{
    // todo : on replace les joueurs 
    waitService = true;
    playerService = player;
}


function game () {
    // On vide le canvas
    ctx.clearRect(0,0,canvas.width,canvas.height); // effacer le canvas

    //-----------------------------------------------------------------
    //                          Le court
    //-----------------------------------------------------------------
    ctx.fillStyle = '#E7410C';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'white'; 
    ctx.strokeRect(0, 0, canvas.width,canvas.height);
    ctx.strokeRect(0, 75, canvas.width/4,450);
    ctx.strokeRect(canvas.width/4, 75, canvas.width/2,450);
    ctx.strokeRect(canvas.width/2, 75, canvas.width,450);
    
    ctx.beginPath();
    // le filet cotés
    ctx.moveTo(canvas.width/2,0);
    ctx.lineTo(canvas.width/2,canvas.height);
    
    ctx.moveTo(canvas.width/4,canvas.height/2);
    ctx.lineTo(canvas.width*0.75,canvas.height/2);

    ctx.stroke(); 

    //-----------------------------------------------------------------
    //                           Joueur 1
    //-----------------------------------------------------------------
    // On vérifie la position de la raquette du joueur 1
    if(player1.racket.top < 0) player1.racket.top = 0;
    if(player1.racket.top > canvas.height-player1.racket.height) 
        player1.racket.top = (canvas.height-player1.racket.height);

    // on redessine la raquette du jouer 1
    ctx.fillStyle = player1.racket.color; 
    ctx.fillRect(10, player1.racket.top, 20, player1.racket.height);

    //-----------------------------------------------------------------
    //                           Joueur 2
    //-----------------------------------------------------------------
    // On vérifie la position de la raquette du joueur 2
    if(player2.racket.top < 0) player2.racket.top = 0;
    if(player2.racket.top > canvas.height-player2.racket.height) 
        player2.racket.top = (canvas.height-player2.racket.height);
    
    // on redessine la raquette du jouer 2
    ctx.fillStyle = player2.racket.color;
    ctx.fillRect(970, player2.racket.top, 20, player2.racket.height);


    //-----------------------------------------------------------------
    //                     La balle
    //-----------------------------------------------------------------
    ctx.beginPath();
    ctx.fillStyle = 'yellow'; 
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI*2, true); 
    ctx.closePath();
    ctx.fill();
  
    if(waitService == true) {
        if(playerService == 1){
            ball.y = player1.racket.top+player1.racket.height/2;
            ball.x = 40;
        } else  if(playerService == 2){
            ball.y = player2.racket.top+player2.racket.height/2;
            ball.x = 960;
        }
    } else {
        ball.x += ball.dx;
        ball.y += ball.dy;
        moveBall();
    }

    // On rappel la fonction
    window.requestAnimationFrame(game);
}


function keyPress(event, player)
{
    switch(event.keyCode) 
    {
        // Déplacement vers le haut
        case 38: player.racket.top-=speed; break;
        // Déplacement vers le bas
        case 40: player.racket.top+=speed; break;
        // fais le service
        case 32:    
            // seulement l'utilisateur qui a le service peut lancer la balle
            if(currentPlayer == playerService && waitService) {
                socket.emit('client:player:service');              
            }
        break;
    }
}



document.addEventListener('DOMContentLoaded',() => {
    socket.on('connect', () => {
        
        socket.on('server:player:service', () => {
            waitService = false;
            moveBall();  
        });
        // Ecoute serveur
        socket.on('server:game:start', () => {
            // On ne peut plus cliquer sur le bouton jouer
            document.getElementById('play').style.display = 'none';
            // affichage du jeu
            document.getElementById('gamePong').style.display = 'block';
            // démarrage du jeu
            game();
            // Ecoute des touches clavier
            document.addEventListener('keydown',(event) => {
                if(currentPlayer == 1)
                    keyPress(event, player1);
                else if(currentPlayer == 2)
                    keyPress(event, player2);

                socket.emit('client:racket:move', player1, player2);
            })

            socket.on('server:racket:move', (player_1, player_2) => {
                if (currentPlayer == 1) {
                    player2 = player_2
                } else if (currentPlayer == 2) {
                    player1 = player_1
                }
            });
        })

        // Nombre de spectateur
        socket.on('server:spectator:count', (id) => {
            currentPlayer = id;
        })

        // Récupération du choix du player par le serveur
        socket.on('server:player:current', (id) => {
            currentPlayer = id;
        })

        // Ecoute serveur
        socket.on('server:player:quit', () => {    
            document.getElementById('play').style.display = 'block';
            document.getElementById('gamePong').style.display = 'none';
        })
        
        // Veut etre joueur
        document.getElementById('play').addEventListener('click', () => {
            document.getElementById('play').style.display = 'none';
            socket.emit('client:player:new');
        })

        // Veut etre spectateur
        document.getElementById('spectator').addEventListener('click', () => {
            document.getElementById('spectator').style.display = 'none';
            socket.emit('client:spectator:new');
        })
    })
})

