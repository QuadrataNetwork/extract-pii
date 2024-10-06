const { createAccessToken, resolveEnvironmentUrl } = require('@quadrata/sdk/api');

const { exportZip } = require('./lib/export_zip');
const { API_KEY, environment } = require('./config');

const API_URL = resolveEnvironmentUrl(environment);

async function getPassports(accessToken = undefined, page = 1) {
    if (!accessToken) {
        const accessTokenResponse = await createAccessToken({ apiKey: API_KEY }, environment);
        accessToken = accessTokenResponse.data.accessToken;
    }
    const { data: { response: { numPages, rows } } } = await fetch(`${API_URL}/v1/list/consent`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filters: {
                isActive: true
            },
            limit: 300,
            page: page,
            sortBy: ['createdAt', 'asc']
        })
    }).then((response) => response.json());
    if (page < numPages) {
        return rows.concat(await getPassports(accessToken, page + 1));
    }
    return rows;
}

getPassports()
    .then(exportZip)
    .catch(console.error);