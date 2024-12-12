const { findBeatmapInChannel, loadToken, getBeatmap } = require("../utils/osu.js");
const { Collection } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

async function doEmbed(message, user_scores){
    const emoji_mods = {
        'TD': '1292664385348571187',
        'SO': '1292664378017189949',
        'SD': '1292664367841804380',
        'PF': '1292664359633551391',
        'NM': '1292664351953649696',
        'NF': '1292664344517021788',
        'NC': '1292664337533763634',
        'HT': '1292664330554310749',
        'HR': '1292664323470135457',
        'HD': '1292664317061107732',
        'FL': '1292664310199222282',
        'EZ': '1292664304025468928',
        'DT': '1292664294311198761'
    }
    const emoji_grades = {
        'A': ['grade_a', '1292652764844789891'],
        'B': ['grade_b','1292652775733465188'],
        'C': ['grade_c','1292652783610363985'],
        'D': ['grade_d','1292652789507428395'],
        'S': ['grade_s','1292652798302748763'],
        'X': ['grade_ss','1292652824127078611'],
        'SH': ['grade_s_s','1292652815734538281'],
        'XH': ['grade_ss_s','1292652831785877585']
    }
    // const beatmap_metadata = getBeatmap(recent_scores.beatmap.id); // beatmap_metadata.max_combo
    let embed_description = '';

    user_scores.forEach(score => {

        let rank_pos = `#${score.position}`;
    
        // Convierte el código de país a un emoji real usando Unicode.
        const getFlagEmoji = (countryCode) => {
            return countryCode
                .toUpperCase()
                .replace(/./g, char => String.fromCodePoint(0x1F1E6 - 65 + char.charCodeAt()));
        };
        let flag = getFlagEmoji(score.score.user.country_code);
    
        let username = score.score.user.username;
        let username_link = `[${username}](https://osu.ppy.sh/users/${score.score.user_id})`;
    
        let grade_emoji = emoji_grades[score.score.rank];
        grade_emoji = `<:${grade_emoji[0]}:${grade_emoji[1]}>`;
    
        let legacy_score = score.score.score.toLocaleString('es-ES');
    
        let accuracy = (score.score.accuracy * 100).toFixed(2);
    
        let max_combo = score.score.max_combo;
    
        let statistics = score.score.statistics;
        statistics = `\`${statistics.count_300}/${statistics.count_100}/${statistics.count_50}/${statistics.count_miss}\``;
    
        let pp = `${score.score.pp ? score.score.pp.toFixed(2) : 0}`;
    
        let time_set = `<t:${Math.floor((new Date(score.score.created_at)).getTime() / 1000)}:R>`;
    
        let mods_used = score.score.mods.length > 0 ? 
            score.score.mods.reduce((acc, mod) => `${acc}<:${mod}:${emoji_mods[mod]}>`, '') 
            : `<:NM:${emoji_mods['NM']}>`;
    
        embed_description = embed_description.concat(embed_description !== '' ?
            `${rank_pos} - ${flag} ${username_link} - ${time_set}
    ${grade_emoji} - ${legacy_score} - ${accuracy}% - x${max_combo} - [${statistics}] - ${pp}PP - ${mods_used}\n\n` :
            `**${rank_pos}** - ${flag} **${username_link}** - ${time_set}
    ${grade_emoji} - **${legacy_score}** - **${accuracy}%** - **x${max_combo}** - [${statistics}] - **${pp}PP** - ${mods_used}\n\n`
        );
    
    });
    

    const embed = new EmbedBuilder()
        .setDescription(embed_description)
        .setFooter({
            text: "SengoBot",
            iconURL: "https://jeiden.s-ul.eu/3ssHl9Gd",
        })
        .setTimestamp();

    return embed;
}

async function doContent(beatmap_metadata, user_scores, sorted_user_scores){

    let mapa = `[mapa](${beatmap_metadata.url})`;

    let content = `**De \`${user_scores.length}\` usuarios, \`${sorted_user_scores.size}\` tienen una score en el ${mapa}.**`;

    if(sorted_user_scores.size > 5) content = content.concat(`\n**Mostrando los primeros \`5\`**`);

    return content;
}

async function getLinkedMembers(message, res) {
    try {
        // Paso 1: Obtener el guildId directamente del mensaje
        const guild = message.guild;
        const members = await guild.members.fetch();

        // Paso 2: Obtener usuarios linkeados de la base de datos
        const linkedUsers = await res.User.find({ osu_id: { $ne: null } });
        const linkedDiscordIds = linkedUsers.map(user => user.discord_id);

        // Paso 3: Filtrar los miembros que están en la base de datos
        const linkedMembers = members.filter(member => linkedDiscordIds.includes(member.user.id));

        // Crear un array para almacenar los nombres, IDs y osu_id
        const userArray = linkedMembers.map(member => {
            // Obtener el usuario linkeado correspondiente
            const linkedUser = linkedUsers.find(user => user.discord_id === member.user.id);
            return {
                id: member.user.id,
                username: member.user.username,
                osu_id: linkedUser.osu_id
            };
        });

        return userArray;
    } catch (error) {
        console.error('Error obteniendo usuarios linkeados:', error);
        return [];
    }
}

async function getBeatmapUserScores(beatmapId, usersArray, gamemode = 'osu') {
    const osu_token = await loadToken();

    const scores = new Collection();

    const promises = usersArray.map(async (user) => {
        const url = `https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/scores/users/${user.osu_id}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${osu_token.access_token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (response.data) {
                scores.set(user.osu_id, response.data);
            }
        } catch (error) {
            console.log(`# El usuario de id ${user.osu_id} no tiene una score en el mapa de id ${beatmapId}`);
        }
    });

    // Usa Promise.all con grupos de promesas para manejar al menos 10 hilos
    const chunkSize = 10;
    for (let i = 0; i < promises.length; i += chunkSize) {
        await Promise.all(promises.slice(i, i + chunkSize));
    }

    return scores;
}


async function run(messages, args){
    const { message, res } = messages;


    const usersArray = await getLinkedMembers(message, res);

    const {beatmap_url, bad_response} = await findBeatmapInChannel(message);
    if(!beatmap_url) return bad_response;

    
    const user_scores = await getBeatmapUserScores(beatmap_url, usersArray);
    if(user_scores.size === 0) return {content: `**De los \`${usersArray.length}\` usuarios en el servidor** pues ninguno tiene una score en el mapa.`};

    // Si el mapa es loved, sera por puntuacion, sino por pp de manera descendente
    let sorted_user_scores = user_scores.first().score.beatmap.status === "loved" ? 
        user_scores.sort((a, b) => b.score.score - a.score.score) : 
        user_scores.sort((a, b) => b.score.pp - a.score.pp);

    const beatmap_metadata = await getBeatmap(beatmap_url); // beatmap_metadata.max_combo
    const content = await doContent(beatmap_metadata, usersArray, sorted_user_scores);

    // Si hay mas de 5 de usuarios con una score en el mapa
    if(sorted_user_scores.size > 5) sorted_user_scores = sorted_user_scores.first(5);

    const embed = await doEmbed(message, sorted_user_scores);
    return {content: content, embeds: [embed]};
}

run.description = "Un >compare entre los del server y obteniendo una lista entre los de mayor pp"

module.exports = { run, "description": run.description}