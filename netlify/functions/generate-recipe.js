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

        const requestBody = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        });

        return new Promise((resolve) => {
            const options = {
                hostname: 'generativelanguage.googleapis.com',
                // Utilisation de la version stable v1beta
                path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            };

            const req = https.request(options, (res) => {
                let str = '';
                res.on('data', (chunk) => str += chunk);
                res.on('end', () => {
                    // On renvoie exactement ce que Google nous donne
                    resolve({
                        statusCode: res.statusCode,
                        headers,
                        body: str
                    });
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
