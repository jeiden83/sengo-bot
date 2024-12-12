async function run(messages, args){
    const { message } = messages;

    // Revisamos si no es Jeiden quien ejecuta el comando
    // abuse filter
    if(message.author.id != '395623267530047489') return `No puedes hacer esto, solo Jeiden puede.`;

    const to_tag = args[0];                     // Usuario a etiquetar
    const times = parseInt(args[1], 10);        // Veces a repetir
    const delay = parseInt(args[2], 10) * 1000; // Retraso en milisegundos

    async function sendMessage() {
        // Recorre y envía los mensajes con retraso
        for (let i = 0; i < times; i++) {
            await new Promise((resolve) => 
                setTimeout(() => {
                    message.channel.send(`${to_tag}`);
                    resolve(); // Marca que esta iteración ha terminado
                }, i * delay)
            );
        }
    
        return '\nY ya';
    }

    return await sendMessage();
}

module.exports = { run }