
export default async function handler(req, res) {
    const authHeaders = req.headers.authorization;
    if(authHeaders || !authHeaders.startWith("Bearer ")){
        return res.status(401).json({valid: false, error: "Falto el token o no parte con Bearer"})
    }

    const token = authHeaders.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        return res.status(200).json({valid: true, userData: decoded})
    } catch (err) {
        return res.status(401).json({ valid: false, error: 'Token expirado o inválido' });
    }
    
}