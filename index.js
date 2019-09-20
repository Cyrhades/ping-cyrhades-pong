const express = require('express')
const app = express()
const PORT = process.env.PORT || 9000

const server = app.listen(PORT,() => {
    console.log(`Le serveur http est en écoute sur le port ${PORT}`)
})

// on précise le répertoire des fichiers static
app.use(express.static('assets'))

app.get('/', (request, response) => {
    response.sendFile('./views/index.html', { root: __dirname })  
})

var spectators = 0;
var players = 0;
var socketsList = [];
const io = require('socket.io')(server) 

io.on('connection', (socket) => {
    socket.on('client:player:new', (pseudo) => {

        let index = socketsList.indexOf(socket.id)
        if(index == -1) {
            socketsList.push(socket.id)
     
            if(players < 2) {
                players++;
                socket.emit('server:player:current',players);


                socket.on('client:racket:move', (player_1, player_2) => {
                    io.sockets.emit('server:racket:move',player_1, player_2);
                })

                socket.on('client:player:service', () => {
                    io.sockets.emit('server:player:service');
                })
            } else {
                spectators++;
                io.sockets.emit('server:spectator:count',spectators);
            }

            if(players == 2) {
                io.sockets.emit('server:game:start');
            }

            socket.on('disconnect', () => {
                io.sockets.emit('server:player:quit');
            });
        } else {
            console.log('Vous ne pouvez pas jouer les 2 joueurs en même temps')
        }

    })

    socket.on('client:spectator:new', (pseudo) => {
        spectators++;
        io.sockets.emit('server:spectator:count',spectators);
    })

    socket.on('disconnect', () => {
        io.sockets.emit('server:spectator:count',spectators);
    });
})

