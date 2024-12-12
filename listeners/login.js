const { ActivityType } = require('discord.js');

async function login(client, config) {
    client.login(config.TOKEN);
    client.once('ready', () => {

        client.user.setActivity('Sengo bot activo', { type: ActivityType.Playing });
        console.log(`> Bot iniciado con exito como ${client.user.tag}`);
    })    
}

module.exports = { login };