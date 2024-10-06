const { createAccessToken, fetchPassportList, fetchPrivacyData, QuadrataEnvironment } = require('@quadrata/sdk/api');

const { exportZip } = require('./lib/export_zip');
const { API_KEY, environment } = require('./config');

async function getPassports(accessToken = undefined, page = 1) {
    if (!accessToken) {
        const accessTokenResponse = await createAccessToken({ apiKey: API_KEY }, environment);
        accessToken = accessTokenResponse.data.accessToken;
    }
    const { data: { response: { numPages, rows }}} = await fetchPassportList({
        apiAccessToken: accessToken,
        filters: {
            isApproved: true
        },
        limit: 300,
        page: page,
        sortBy: ['createdAt', 'asc']
    }, environment);
    if (page < numPages) {
        return rows.concat(await getPassports(accessToken, page + 1));
    }
    return rows;
}

getPassports()
    .then(exportZip)
    .catch(console.error);