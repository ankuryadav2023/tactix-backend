const { Server } = require('socket.io');

const socketToRoom = {};
const rooms = {};

const setupSocketIO = (expressServer) => {
    const io = new Server(expressServer, {
        cors: {
            origin: '*'
        }
    })

    io.on("connection", socket => {
        socket.on('join-room', data => {
            console.log('join-room')
            try {
                if (!(data.roomID in rooms)) {
                    rooms[data.roomID] = {};
                }
                if (data.usertype === 'player') {
                    let players = Object.values(rooms[data.roomID]).filter(value => {
                        return value.usertype === 'player';
                    })
                    let noOfPlayersInRoom = players.length;
                    if (noOfPlayersInRoom < 2) {
                        rooms[data.roomID][socket.id] = {
                            username: data.username,
                            userSocketID: socket.id,
                            usertype: data.usertype,
                            usermark: noOfPlayersInRoom === 0 ? 'O' : 'X',
                            userturn: noOfPlayersInRoom === 0 ? false : true,
                            matchesPlayed: 0,
                            userscore: 0
                        }
                        socket.join(data.roomID);
                        socketToRoom[socket.id] = data.roomID;
                        players = Object.values(rooms[data.roomID]).filter(value => {
                            return value.usertype === 'player';
                        })
                        socket.emit('join-room-success', { ...data, ...{ usermark: noOfPlayersInRoom === 0 ? 'O' : 'X', userturn: noOfPlayersInRoom === 0 ? false : true } }, players);
                        socket.to(socketToRoom[socket.id]).emit('update-players-matches-data', players);
                    } else {
                        socket.emit('join-room-error', data);
                    }
                } else if (data.usertype === 'spectator') {
                    let players = Object.values(rooms[data.roomID]).filter(value => {
                        return value.usertype === 'player';
                    })
                    rooms[data.roomID][socket.id] = {
                        username: data.username,
                        usertype: data.usertype
                    }
                    socket.join(data.roomID);
                    socketToRoom[socket.id] = data.roomID;
                    socket.emit('join-room-success', data, players);
                }
            } catch (error) {
                console.log(error.message);
                socket.emit('join-room-error', { ...data, ...{ errortype: 'general' } });
            }
        });
        socket.on('update-is-game-active-true', () => {
            io.to(socketToRoom[socket.id]).emit('update-is-game-active-true');
        })
        socket.on('update-is-game-active-false', () => {
            io.to(socketToRoom[socket.id]).emit('update-is-game-active-false');
        })
        socket.on('send-move', data => {
            io.to(socketToRoom[socket.id]).emit('recieve-move', data);
        });
        socket.on('update-players-turns', () => {
            console.log('update-players-turns')
            let players = Object.values(rooms[socketToRoom[socket.id]]).filter(user => user.usertype === 'player');
            players.forEach(player => {
                rooms[socketToRoom[socket.id]][player.userSocketID]['userturn'] = !(rooms[socketToRoom[socket.id]][player.userSocketID]['userturn']);
            })
            players = Object.values(rooms[socketToRoom[socket.id]]).filter(user => user.usertype === 'player');
            console.log(players)
            io.to(socketToRoom[socket.id]).emit('update-players-matches-data', players);
        });
        socket.on('send-message', data => {
            socket.to(socketToRoom[socket.id]).emit('recieve-message', data);
        });
        socket.on('update-players-matches-data-won', () => {
            console.log('update-players-matches-data-won')
            let players = Object.values(rooms[socketToRoom[socket.id]]).filter(user => user.usertype === 'player');
            players.forEach(player => {
                rooms[socketToRoom[socket.id]][player.userSocketID]['matchesPlayed'] += 1;
                if (player.userSocketID === socket.id) rooms[socketToRoom[socket.id]][player.userSocketID]['userscore'] += 1;
            })
            players = Object.values(rooms[socketToRoom[socket.id]]).filter(user => user.usertype === 'player');
            io.to(socketToRoom[socket.id]).emit('update-players-matches-data', players);
        });
        socket.on('update-players-matches-data-draw', () => {
            console.log('update-players-matches-data-draw')
            let players = Object.values(rooms[socketToRoom[socket.id]]).filter(user => user.usertype === 'player');
            players.forEach(player => {
                rooms[socketToRoom[socket.id]][player.userSocketID]['matchesPlayed'] += 1;
            })
            players = Object.values(rooms[socketToRoom[socket.id]]).filter(user => user.usertype === 'player');
            io.to(socketToRoom[socket.id]).emit('update-players-matches-data', players);
        });
        socket.on('disconnect', () => {
            console.log('disconnect')
            try {
                let roomID = socketToRoom[socket.id];
                delete rooms[roomID][socket.id];
                delete socketToRoom[socket.id];
                let players = Object.values(rooms[roomID]).filter(user => user.usertype === 'player');
                if (players.length === 1) {
                    rooms[roomID][players.userSocketID]['userturn'] = false;
                    players[0][userturn] = false;
                }
                if (players.length < 2) {
                    io.to(roomID).emit('update-is-game-active-false');
                }
                io.to(roomID).emit('update-players-matches-data', players);
            } catch (error) {
                console.log(error.message);
            }
        })
    });
}

module.exports = setupSocketIO;