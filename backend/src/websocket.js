const socketio = require('socket.io');

const parseStringAsArray = require('./utils/parseStringAsArray');
const calculateDistance = require('./utils/calculateDistance');

let io;
const connections = [];

exports.setupWebSocket = (server) => {
    io = socketio(server);

    io.on('connection', socket => {
        const { latitude, longitude, techs } = socket.handshake.query;

        connections.push({
            id: socket.id,
            coordinates: {
                latitude: Number(latitude),
                longitude: Number(longitude)
            },
            techs: parseStringAsArray(techs)
        })
    })
}

/*
    Busca os novos devs cadastrados em realtime e verifica se satisfazem as
    condições de estarem no raio de 100km de visão do usuário do mapa E
    trabalham com pelo menos um item que está na no filtro de tecnologias    
*/
exports.findConnections = (coordinates, techs) => {
    return connections.filter(connection => {
        return calculateDistance(coordinates, connection.coordinates) < 10
        && connection.techs.some(item => techs.includes(item))
    })
}

exports.sendMessage = (to, messageKey, data) => {
    to.forEach(connection => {
        io.to(connection.id).emit(messageKey, data)
    });
}