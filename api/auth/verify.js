import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
    const authHeaders = req.headers.authorization;

    // Se verifica que NO exista la cabecera O que NO empiece con "Bearer "
    if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
        return res.status(401).json({ valid: false, error: "Faltó el token o no empieza con Bearer" });
    }

    const token = authHeaders.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({ valid: true, userData: decoded });
    } catch (err) {
        return res.status(401).json({ valid: false, error: "Token expirado o inválido" });
    }
}