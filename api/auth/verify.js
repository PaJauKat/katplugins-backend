import jwt from 'jsonwebtoken';
import { checkDiscordRole } from '../_lib/discord.js';

export default async function handler(req, res) {
    const authHeaders = req.headers.authorization;

    // Se verifica que NO exista la cabecera O que NO empiece con "Bearer "
    if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
        return res.status(401).json({ valid: false, error: "Faltó el token o no empieza con Bearer" });
    }

    const token = authHeaders.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.discordId) {
            return res.status(401).json({ valid: false, error: "Token inválido: falta discordId" });
        }

        // Validar en tiempo real si el usuario aún tiene el rol en Discord
        const { hasRole } = await checkDiscordRole(decoded.discordId);

        if (!hasRole) {
            return res.status(403).json({
                valid: false,
                error: "El usuario ya no cuenta con el rol requerido en Discord"
            });
        }

        return res.status(200).json({ valid: true, userData: decoded });
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ valid: false, error: "Token expirado o inválido" });
        }

        if (err.code === 'NOT_IN_GUILD') {
            return res.status(403).json({ valid: false, error: "El usuario no está en el servidor de Discord" });
        }

        return res.status(500).json({ valid: false, error: "Error interno al verificar permisos" });
    }
}