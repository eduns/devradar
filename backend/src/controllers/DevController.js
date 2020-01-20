const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {
    async index(request, response) {
        const devs = await Dev.find();
        
        return response.json(devs)
    },

    async store(request, response) {
        const { github_username, techs, latitude, longitude } = request.body;

        let dev = await Dev.findOne({ github_username });

        if(!dev) {
            const techsArray = parseStringAsArray(techs);
            
            const apiRes = await axios.get(`https://api.github.com/users/${github_username}`);
            
            let { name = login, avatar_url, bio } = apiRes.data;

            const location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            };
            
            dev = await Dev.create({
                github_username, name, avatar_url, bio, techs: techsArray, location
            })

            /* 
                Filtrar as conexões e buscar as que estão a no máximo 100km de distância
                e que o novo dev inserido tenha pelo menos uma das tecnologias filtradas.
            */
            const sendSocketMessageTo = findConnections(
                { latitude, longitude }, techsArray
            );

            sendMessage(sendSocketMessageTo, 'newDev', dev)
        }
        
        return response.json(dev)
    },

    async update(request, response) {
        // atualizar os dados de name, avatar_url, bio, techs e location (latitude e longitude)
        const { _id } = request.params;
        const { name, avatar_url, bio, techs, latitude, longitude } = request.body;

        const techsArray = parseStringAsArray(techs);

        await Dev.findByIdAndUpdate(
            _id,
            {
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                }
            },
            function(err) {
                if(err) {
                    return response.json({ "status": "erro ao atualizar dados do dev", err })
                } 
                return response.json({ "status": "dev atualizado com sucesso" })
            }
        );
    },

    async destroy(request, response) {
        const { _id } = request.params;

        await Dev.findByIdAndDelete(
            _id,
            function (err) {
                if(err) {
                    return response.json({ "status" : "erro ao deletar dev", err })
                }
                return response.json({ "status" : "dev deletado com sucesso"})
            }
        )
    }
}