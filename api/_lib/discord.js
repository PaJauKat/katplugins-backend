const logBlock = (title, data) => {
    const formatted = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    console.log(`\n========================================`);
    console.log(title);
    console.log('----------------------------------------');
    console.log(formatted);
    console.log('========================================\n');
};

/**
 * Verifica si un usuario de Discord pertenece a la guild y tiene el rol requerido.
 * @param {string} discordUserId - ID del usuario en Discord.
 * @returns {Promise<{ hasRole: boolean, memberData: object | null }>}
 */
export async function checkDiscordRole(discordUserId) {
    if (!process.env.DISCORD_GUILD_ID || !process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_ROLE_ID) {
        throw new Error('Faltan variables de entorno de Discord (DISCORD_GUILD_ID, DISCORD_BOT_TOKEN o DISCORD_ROLE_ID)');
    }

    const memberResponse = await fetch(
        `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUserId}`,
        {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        }
    );

    const memberData = await memberResponse.json();
    logBlock('Detalles del miembro en Discord', memberData);

    if (memberResponse.status === 404) {
        const error = new Error(`Usuario con ID ${discordUserId} no está en el servidor de Discord`);
        error.code = 'NOT_IN_GUILD';
        throw error;
    }

    if (!memberResponse.ok) {
        throw new Error(memberData.message || `Error al consultar Discord API (HTTP ${memberResponse.status})`);
    }

    const hasRole = Array.isArray(memberData.roles) && memberData.roles.includes(process.env.DISCORD_ROLE_ID);

    return {
        hasRole,
        memberData
    };
}
