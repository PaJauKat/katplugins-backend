
const logBlock = (title, data) => {
    const formatted = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    console.log(`\n========================================`);
    console.log(title);
    console.log('----------------------------------------');
    console.log(formatted);
    console.log('========================================\n');
};

export default async function handler(req, res) {
    const { code, state: localPort } = req.query;

    logBlock('Auth callback recibido', {
        code: code || null,
        localPort: localPort || null,
        query: req.query,
    });

    if (!code) {
        console.log('❌ Falta el código de autorización de Discord.');
        return res.status(400).send('Falta el código de autorización de Discord.');
    }

    try {
        // 1. Intercambiar el código por el Access Token de Discord
        console.log("DiscordClient=",process.env.DISCORD_CLIENT_ID)
        console.log("DiscordClientSec=",process.env.DISCORD_CLIENT_SECRET)
        const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: 'https://api.pajau.cl/api/auth/callback'
            })
        });

        const tokenData = await tokenResponse.json();
        logBlock('Respuesta del token de Discord', tokenData);

        /*
        logBlock('Respuesta del token de Discord', {
            status: tokenResponse.status,
            ok: tokenResponse.ok,
            data: tokenData,
        });
        */

        if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Error de token');

        // 2. Obtener la identidad del usuario de Discord
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const userData = await userResponse.json();
        logBlock('Datos del usuario de Discord', userData);
        /*
        logBlock('Datos del usuario de Discord', {
            status: userResponse.status,
            ok: userResponse.ok,
            data: userData,
        });
        */

        // 3. Verificar si es miembro de tu servidor y si tiene el rol requerido
        const memberResponse = await fetch(
            `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userData.id}`,
            {
                headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
            }
        );

        logBlock('Respuesta del miembro en Discord', {
            status: memberResponse.status,
            ok: memberResponse.ok,
        });

        if (memberResponse.status === 404) {
            const redirectUrl = `http://localhost:${localPort}/callback?status=error&reason=No_estas_en_el_servidor_de_katPlugins`;
            console.log('🚫 Usuario no está en el servidor:', redirectUrl);
            return res.redirect(redirectUrl);
        }

        const memberData = await memberResponse.json();
        logBlock('Detalles del miembro', memberData);

        const hasRole = memberData.roles && memberData.roles.includes(process.env.DISCORD_ROLE_ID);
        logBlock('¿Tiene el rol requerido?', {
            hasRole,
            requiredRoleId: process.env.DISCORD_ROLE_ID,
            memberRoles: memberData.roles || [],
        });

        if (!hasRole) {
            const redirectUrl = `http://localhost:${localPort}/callback?status=error&reason=No_tienes_el_rol_requerido`;
            console.log('🚫 Usuario no tiene el rol requerido:', redirectUrl);
            return res.redirect(redirectUrl);
        }

        const redirectUrl = `http://localhost:${localPort}/callback?status=success&username=${encodeURIComponent(userData.username)}&id=${userData.id}`;
        logBlock('Redirección final exitosa', {
            redirectUrl,
            username: userData.username,
            id: userData.id,
        });

        // 4. Redirigir al servidor local de Java en RuneLite con éxito
        return res.redirect(redirectUrl);

    } catch (err) {
        const redirectUrl = `http://localhost:${localPort}/callback?status=error&reason=Error_interno_servidor`;
        console.error('💥 Error en auth callback');
        logBlock('Error completo', {
            message: err.message,
            stack: err.stack,
            redirectUrl,
        });
        return res.redirect(redirectUrl);
    }
}