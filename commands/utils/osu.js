const { Client, Auth } = require('osu-web.js');
const config = require("../../config.json");
const fs = require('fs/promises');
const path = require('path');     
const axios = require('axios');

async function loadToken(){
    const tokenFilePath = path.resolve('osu_token.json');

    try{
        const osu_token = JSON.parse(await fs.readFile(tokenFilePath, 'utf-8'));
        
        if(Date.now() >= osu_token.expires_at)
            return await createToken();

        return osu_token;
    } catch(error){

        return await createToken();
    }
    
    async function createToken() {
        const auth = new Auth(config.OSU_CLIENT_ID, config.OSU_CLIENT_SECRET, "");
        const osu_token = await auth.clientCredentialsGrant();

        const accessTokenData = {
            access_token: osu_token.access_token,
            expires_in: osu_token.expires_in,
            token_type: osu_token.token_type,
            expires_at: Date.now() + osu_token.expires_in * 1000
        };

        await fs.writeFile(tokenFilePath, JSON.stringify(accessTokenData, null, 2));

        console.log("# Token recargado");

        return osu_token;
    }
}

async function getOsuUser(parsed_args){
    const osu_token = await loadToken();
    const look_gamemode = parsed_args.gamemode || 'osu';
    let res;

    try {
        
        res = await new Client(osu_token.access_token).users.getUser(parsed_args.username[0], {urlParams:{mode: look_gamemode}});
        
        if(res.username === "undefined") throw("error");
    } catch (error) {

        res = `El usuario no se encuentra en osu!`;
    }
    
    return res;
}

async function getBeatmap(beatmap_id){
    const osu_token = await loadToken();

    const url = `https://osu.ppy.sh/api/v2/beatmaps/${beatmap_id}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${osu_token.access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        return response.data;
    } catch (error) {

        return 'Error obteniendo los datos del beatmap';
    }
}

async function getBeatmapUserScore(parsed_args) {
    const osu_token = await loadToken();
    
    const gamemode = parsed_args.gamemode || 'osu';
    const mods = parsed_args.mods || '';

    const beatmapId = parsed_args.beatmap_url;
    const userId = parsed_args.username[0];

    const url = `https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/scores/users/${userId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${osu_token.access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params: {
                legacy_only: 0,
                mode: gamemode,
                mods: mods
            }
        });

        return response.data;
    } catch (error) {
        return 'Error obteniendo las puntuaciones'
    }
}

async function getBeatmapUserAllScores(parsed_args) {
    
    const osu_token = await loadToken();
    const gamemode = parsed_args.gamemode || 'osu';
    
    const beatmapId = parsed_args.beatmap_url;
    const userId = parsed_args.username[0];

    const url = `https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/scores/users/${userId}/all`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${osu_token.access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params: {
                legacy_only: 0, 
                ruleset: gamemode
            }
        });

        const data = response.data;

        // to dump data for debuggin
        // const fs = require('fs');
        // const filePath = `./scores_${userId}_${beatmapId}.json`;
        // fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        // console.log(`Datos guardados en: ${filePath}`);

        return data;
    } catch (error) {
        console.error('Error obteniendo las puntuaciones:', error);
        return 'Error obteniendo las puntuaciones';
    }
}

async function getRecentScores(parsed_args, limit = 5, page = 0, include_fails = true){
    const osu_token = await loadToken();
    const gamemode = parsed_args.gamemode || 'osu';

    const res = await new Client(osu_token.access_token).users.getUserScores(parsed_args.username[0], 'recent', {
        query:{
            limit : limit,
            mode : gamemode,
            offset : page,
            include_fails : include_fails
        }})

    // const fs = require('fs'); 
        
    // // Guardar los datos en un archivo JSON
    //     const filePath = `./scores_${parsed_args.username[0]}.json`;
    //     fs.writeFileSync(filePath, JSON.stringify(res, null, 2), 'utf-8');
    //     console.log(`Datos guardados en: ${filePath}`);
    
    return res[0];
}

async function findBeatmapInChannel(message){

    const fetch_messages = await message.channel.messages.fetch({ limit: 30 });  // limite de 30 msj a revisar  

    const embedMessage = await fetch_messages.find(
        m => m.embeds.length > 0 && (
            (m.embeds[0].url && typeof m.embeds[0].url === 'string') || 
            (m.embeds[0].author && m.embeds[0].author.url && typeof m.embeds[0].author.url === 'string')
        )
    );

    // Si no se encuentra un mensaje
    if(!embedMessage){

        return {'beatmap_url' : null, 'bad_response' : `No se encontro un mapa al cual hacerle >c`};
    }

    // Guardamos la url del mapa encontrado
    const beatmap_url = embedMessage.embeds[0].url
    ? embedMessage.embeds[0].url.match(/(?:b|beatmaps)\/(\d+)/)[1]
    : embedMessage.embeds[0].author.url.match(/(?:b|beatmaps)\/(\d+)/)[1];

    return {'beatmap_url' : beatmap_url, 'bad_response' : `shh`};
}

async function parsingCommandFunction(parsed_args, command_parameters){
    const {message, res, command_function, beatmap_url} = command_parameters;
    const discord_id = message.author.id;
    let user_found;
    
    // Buscamos el user linkeado con el bot 
    user_found = await res.User.findOne({ discord_id });

    // Si no hay args
    const no_args = Object.values(parsed_args).flat().filter(el => el !== '').length == 0;
    if(no_args || parsed_args.override === 'rm' && parsed_args.username[0] == ''){

        // si no hay uno linkeado al bot
        if(!user_found) return {'fn_response': `No se encontro un usuario en \`osu\` linkeado al usuario \`${message.author.username}\` de discord.`, 'user_found': user_found, 'reparsed_args': parsed_args};

        // Aplicamos el comando con el linkeado al bot
        const fn_response = await command_function({'username' : [user_found.osu_id], 'beatmap_url' : beatmap_url, 'gamemode' : parsed_args.gamemode});
        return {'fn_response': fn_response, 'user_found': user_found, 'reparsed_args': parsed_args};
    // Si hay args
    } else {

        // Si entre los args hubo uno de username
        if(parsed_args.username.length != 0) {
            
            // Para manejar mejor el username
            let arg_user = parsed_args.username[0];

            // Si es una id de discord, buscamos en la db y actualizamos el parsed_arg con la id de osu vinculada
            if(arg_user.length >= 17) {
                user_found = await res.User.findOne({ discord_id : arg_user });

                if(!user_found) return {'fn_response': `No se encontro ese usuario de discord linkeado al bot.`, 'user_found': user_found, 'reparsed_args': parsed_args};
                parsed_args.username[0] = user_found.osu_id;

            // Se busca el nombre de osu 
            } else {

                // Se actualiza para cambiarlo a la id
                parsed_args.username[0] = (await getOsuUser(parsed_args)).id;
            }

        // Si no hubo un username entre los args
        } else {

            // Se usa el linkeado al bot
            if(!user_found) return `No se encontro un usuario en \`osu\` linkeado al usuario \`${message.author.username}\` de discord.`;
            parsed_args.username[0] = user_found.osu_id;
        }

        // Se hace la peticion con los args
        parsed_args['beatmap_url'] = beatmap_url;   // agregamos para el >c

        const fn_response = await command_function(parsed_args);

        return {'fn_response': fn_response, 'user_found': user_found, 'reparsed_args': parsed_args};
    }
}

function argsParserNoCommand(args) {
    let username = [];
    let gamemode = '';
    let args_aux = new String(args);

    const gamemode_set = {
        'mania': 'mania', 'osu': 'osu', 'std': 'osu', 'taiko': 'taiko', 'ctb': 'fruits', 'fruits': 'fruits'
    };

    const args_commands = [
        // Si empieza con un guion
        function (args) {
            if (gamemode_set[args.slice(1)]) {
                gamemode = gamemode_set[args.slice(1)];
                return true;
            }
            return false;
        },

        // Si empieza con el selector de modo
        function (args) {
            if (args.startsWith("m=")) {
                gamemode = gamemode_set[args.split("=")[1]];
                return true;
            }
            if (args.startsWith("mode") || args.startsWith("modo")) {
                gamemode = gamemode_set[args.split("=")[1]];
                return true;
            }
            return false;
        },

        // Si empieza con <@ y termina con > (discord_tag)
        function (args) {
            if (args.startsWith("<@") && args.endsWith(">")) {
                username.push(args.match(/\d+/)[0]);
                return true;
            }
            return false;
        },

        // Si el argumento es un numero de tamaño 18 (discord_id)
        function (args) {
            if (args.length >= 17) {
                username.push(args);
                return true;
            }
            return false;
        }
    ];

    // Separamos por las comas y revisamos cada args_commands por cada args del mensaje
    args_aux.split(",").forEach(arg => {
        let handled = false;

        args_commands.forEach(fn => {

            if (fn(arg)) {
                handled = true;
            }
        });

        if (!handled) {
            username.push(arg);
        }
    });

    let parsed_args = {
        'username': username,
        'gamemode': gamemode
    };
    return parsed_args;
}

async function argsParser(args, command_parameters){
    const parsed_args = argsParserNoCommand(args);
    const { fn_response, user_found, reparsed_args} = await parsingCommandFunction(parsed_args, command_parameters);

    return {
        'fn_response': fn_response,
        'parsed_args': reparsed_args,
        'user_found': user_found        
    }
}

module.exports = { 
    getBeatmap,
    findBeatmapInChannel,
    parsingCommandFunction,
    getBeatmapUserScore,
    loadToken, 
    getOsuUser, 
    getRecentScores, 
    argsParser, 
    argsParserNoCommand, 
    getBeatmapUserAllScores}