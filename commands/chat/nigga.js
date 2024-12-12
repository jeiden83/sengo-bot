const { AttachmentBuilder } = require('discord.js');

async function run(message, args){
    const attachment = new AttachmentBuilder('https://jeiden.s-ul.eu/fMjrZrHG', { name: 'nigga.gif' });

    return { files: [attachment] };
}

run.description = 'just nigga being nigger';

module.exports = { run }