import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase con variables de entorno de Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
    // Manejo de preflight CORS (método OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ valid: false, reason: 'Método no permitido. Usa POST.' });
    }

    const { apiKey, hwid, pluginVersion } = req.body || {};

    // Validar datos recibidos
    if (!apiKey || !hwid) {
        return res.status(400).json({
            valid: false,
            reason: 'Parámetros incompletos (apiKey o hwid faltante).'
        });
    }

    try {
        // Si Supabase está configurado, realizar la validación en la base de datos
        if (supabase) {
            const { data: license, error } = await supabase
                .from('licenses')
                .select('*')
                .eq('api_key', apiKey)
                .single();

            if (error || !license) {
                return res.status(401).json({ valid: false, reason: 'Licencia no encontrada.' });
            }

            if (!license.active) {
                return res.status(403).json({ valid: false, reason: 'La licencia está inactiva o fue revocada.' });
            }

            // Validar HWID
            if (license.hwid && license.hwid !== hwid) {
                return res.status(403).json({ valid: false, reason: 'Esta clave está vinculada a otro equipo.' });
            }

            // Si es el primer uso de la clave, vincular el HWID actual
            if (!license.hwid) {
                await supabase
                    .from('licenses')
                    .update({ hwid: hwid })
                    .eq('api_key', apiKey);
            }
        }

        // Respuesta exitosa al cliente
        return res.status(200).json({
            valid: true,
            message: 'Licencia activa y validada.',
            remoteConfig: {
                pluginEnabled: true,
                minVersion: '1.0.0'
            }
        });

    } catch (err) {
        return res.status(500).json({ valid: false, reason: 'Error interno en el servidor de licencias.' });
    }
}