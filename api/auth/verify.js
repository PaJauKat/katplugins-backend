import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const authHeaders = req.headers.authorization;
    const token = authHeaders?.startsWith("Bearer ") ? authHeaders.split(" ")[1] : authHeaders;

    const decoded = token ? jwt.decode(token) : null;

    return res.status(200).json({
        valid: true,
        userData: decoded && decoded.discordId ? decoded : { discordId: "000000000000000000", username: "dev" }
    });
}