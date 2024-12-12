const { Client, Auth } = require('osu-web.js');
const { EmbedBuilder } = require('discord.js');
const { argsParser, getBeatmapUserAllScores, findBeatmapInChannel, getBeatmap, getOsuUser } = require("../utils/osu.js");
const config = require("../../config.json");
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

    user_scores.scores.forEach(score => {

        let rank_pos = `#${user_scores.scores.indexOf(score)}`;

        let grade_emoji = emoji_grades[score.rank];
            grade_emoji = `<:${grade_emoji[0]}:${grade_emoji[1]}>`;

        let legacy_score = score.score.toLocaleString('es-ES');
        
        let accuracy = (score.accuracy * 100).toFixed(2);
        
        let max_combo = score.max_combo;

        let statistics = score.statistics;
            statistics = `\`${statistics.count_300}/${statistics.count_100}/${statistics.count_50}/${statistics.count_miss}\``

        let pp = `${score.pp ? score.pp.toFixed(2) : 0}`;

        let time_set = `<t:${Math.floor((new Date(score.created_at)).getTime() / 1000)}:R>`;

        let mods_used = score.mods.length > 0 ? 
            score.mods.reduce((acc, mod) => `${acc}<:${mod}:${emoji_mods[mod]}>`, '')
        :   `<:NM:${emoji_mods['NM']}>`;

        
        embed_description = embed_description.concat(user_scores.scores.indexOf(score) != 0 ?
`${rank_pos} - ${grade_emoji} - ${legacy_score} - ${accuracy}% - ${max_combo} - ${statistics} - ${pp} - ${time_set} - ${mods_used}\n` : 
`**${rank_pos}** - ${grade_emoji} - **${legacy_score}** - **${accuracy}%** - **${max_combo}** - ${statistics} - **${pp}** - ${time_set} - ${mods_used}\n`
        )

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

async function doContent(parsed_args, user_found){

    if(parsed_args.username[0] == '') parsed_args.username[0] = user_found.osu_id;
    const username = (await getOsuUser(parsed_args)).username;

    const content = `> **Puntuaciones** de \`${username}\` en \`osu!${parsed_args.gamemode}\`:`;
    
    return content;
}

async function run(messages, args){
    const {message, res} = messages;

    const {beatmap_url, bad_response} = await findBeatmapInChannel(message);
    if(!beatmap_url) return bad_response;

    const { fn_response, parsed_args, user_found } = await argsParser(args,
		{"message" : message, "res" : res, "beatmap_url" : beatmap_url, "command_function" : getBeatmapUserAllScores});

    if(typeof fn_response === 'string') return `Error consiguiendo las puntuaciones para ese mapa.`;   
    if(fn_response.scores.length == 0) return `El usuario no tiene scores en el mapa.`;

    const embed = await doEmbed(message, fn_response);
    const content = await doContent(parsed_args, user_found);

    return {content: content, embeds: [embed]};
}

run.description = "El >c de toda la vida";

module.exports = { run, "description": run.description}