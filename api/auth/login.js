export default function handler(req, res) {
    const localPort = req.query.port || '8888';

    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: 'https://api.pajau.cl/api/auth/callback',
        response_type: 'code',
        scope: 'identify guilds.members.read',
        state: localPort // Enviamos el puerto local del cliente Java
    });

    const url = "https://discord.com/oauth2/authorize?client_id=1540303769080832112&response_type=code&redirect_uri=https%3A%2F%2Fapi.pajau.cl%2Fapi%2Fauth%2Fcallback&scope=identify+guilds.members.read"

    //return res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
    return res.redirect(url)
}