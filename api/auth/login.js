export default function handler(req, res) {
    const estadoOriginal = req.query.state
    const localPort = req.query.port || '8888';

    // Empaquetamos el estado original y el puerto en un solo string Base64
    const stateObject = JSON.stringify({ state: estadoOriginal, port: localPort });
    const encodedState = Buffer.from(stateObject).toString('base64url');

    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: 'https://api.pajau.cl/api/auth/callback',
        response_type: 'code',
        scope: 'identify guilds.members.read',
        state: encodedState, 
    });


    return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
    //const url = "https://discord.com/oauth2/authorize?client_id=1540303769080832112&response_type=code&redirect_uri=https%3A%2F%2Fapi.pajau.cl%2Fapi%2Fauth%2Fcallback&scope=identify+guilds.members.read"

    //return res.redirect(url)
}