const https = require('https');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: "Clé API GEMINI_API_KEY manquante dans Netlify." }) };
        }

        const requestBody = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2500 }
        });

        return new Promise((resolve) => {
            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            };

            const req = https.request(options, (res) => {
                let str = '';
                res.on('data', (chunk) => str += chunk);
                res.on('end', () => {
                    resolve({ statusCode: res.statusCode, headers, body: str });
                });
            });

            req.on('error', (e) => {
                resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
            });

            req.write(requestBody);
            req.end();
        });
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
