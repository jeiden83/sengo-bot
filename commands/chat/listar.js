async function run(messages, args) {
    const { message } = messages;

    // Revisamos si no es Jeiden quien ejecuta el comando
    if (message.author.id != '395623267530047489') {
        return `No puedes hacer esto, solo Jeiden puede.`;
    }

    let respuesta = 'Lista de servidores:\n';

    for (const guild of message.client.guilds.cache.values()) {
        try {
            // Obtener información del propietario del servidor
            const owner = await guild.fetchOwner();

            // Agregar detalles del servidor y del propietario a la respuesta
            respuesta += `- ${guild.name} (${guild.id}):\n`;
            respuesta += `  Miembros: ${guild.memberCount}\n`;
            respuesta += `  Propietario: ${owner.user.tag} (${owner.user.id})\n`;

            // Aseguramos que el bot sea identificado como miembro del servidor
            const botMember = await guild.members.fetch(message.client.user.id);

            // Filtramos los canales donde se pueda crear una invitación
            const channel = guild.channels.cache.find(
                (ch) =>
                    (ch.type === 0 || ch.type === 2) && // Solo canales de texto (GUILD_TEXT) o voz (GUILD_VOICE)
                    ch.permissionsFor(botMember).has('CreateInstantInvite')
            );

            if (channel) {
                // Creamos la invitación y la enviamos a la consola
                const invite = await channel.createInvite({ maxAge: 0, maxUses: 1 });
                console.log(`Servidor: ${guild.name} | Invitación: ${invite.url}`);
            } else {
                console.log(`Servidor: ${guild.name} | No se pudo generar una invitación`);
            }
        } catch (error) {
            console.error(`Error al procesar el servidor ${guild.name}:`, error);
            respuesta += `- ${guild.name}: Error al obtener detalles del servidor\n`;
        }
    }

    return respuesta;
}

run.description = "Medida para saber los guilds del bot";

module.exports = { run };