const { createAccessToken, fetchPassportList } = require('@quadrata/sdk/api');

const { exportZip } = require('./lib/export_zip');
const { API_KEY, DATE_FROM, DATE_TO, environment } = require('./config');

async function getPassports(accessToken = undefined, page = 1) {
    if (!accessToken) {
        const accessTokenResponse = await createAccessToken({ apiKey: API_KEY }, environment);
        accessToken = accessTokenResponse.data.accessToken;
    }
    const { data: { response: { numPages, rows }}} = await fetchPassportList({
        apiAccessToken: accessToken,
        filters: {
            isProcessed: true,
            dateFrom: DATE_FROM,
            dateTo: DATE_TO,
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

console.log('fetching passports...');

getPassports()
    .then(exportZip)
    .catch(console.error);