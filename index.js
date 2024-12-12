const { Client, GatewayIntentBits } = require("discord.js");
const { load_listeners } = require("./listeners/commands.js");
const { connectDB } = require("./db/database.js");
const { login } = require("./listeners/login.js");
const config = require("./config.json");
const readline = require('readline');

let res;
let client;

async function main(reload) {
    if(reload != "reload") client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });
    if(reload != "reload") res = await connectDB(config);

    client = await load_listeners(res, client, config, reload);
    await login(client, config);

    if(reload != "r") setupCommandLineInterface();
}
main();

async function setupCommandLineInterface() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', async (input) => {
        input = input.trim().toLowerCase();
        if (input === 'exit') {

            console.log('Saliendo...');
            client.user.setActivity(null);
            process.exit(0);
        } else if(input === "reload"){

            console.log('# Recargando...');
            client.user.setActivity(null);
            main("reload");
        } else {
            console.log(`Comando no reconocido: ${input}`);
        }
    });
}