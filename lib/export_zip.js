const fs = require('fs');
const JSZip = require('jszip');
const { fetchPrivacyData } = require('@quadrata/sdk/api');

const { addUserDataToZip } = require('./create_user_zip');
const { addEntityDataToZip } = require('./create_entity_zip');
const { API_KEY, PRIVATE_KEY_DER_BASE_64, environment } = require('../config');

const extracted = new Map();

// https://docs.quadrata.com/integration/how-to-integrate/quadrata-sdk/advanced/api-libraries/api-service-libraries/fetch-passport-list
async function getPrivacyData(walletAddress, retryCount = 0) {
    try {
        const response = await fetchPrivacyData({
            apiKey: API_KEY,
            privateKeyDerBase64: PRIVATE_KEY_DER_BASE_64,
            walletAddress: walletAddress
        }, environment);
        if (!response || !response.data || !response.data.attributes) {
            return undefined;
        }
        return response.data.attributes;
    } catch (err) {
        if (retryCount >= 3) {
            throw err;
        }
        await (new Promise((res) => {
            console.log(`Throttled, retrying in ${(retryCount + 1) * 10000} seconds...`);
            setTimeout(res, (retryCount + 1) * 10000);
        }));
        return getPrivacyData(walletAddress, retryCount + 1);
    }
}

async function exportZip(passports, environment) {
    const zip = new JSZip();
    const fileName = `privacy-data-${new Date().toISOString()}.zip`;
    const numPassports = passports.length;
    const batch = [];
    console.log(`fetching privacy data for ${numPassports} wallets...`);
    for (let i = 0; i < numPassports; i++) {
        const passport = passports[i];
        const association = passport.association ?? passport.associationType;
        const associationValue = passport.associationValue ?? passport.walletAddress;
        const walletAddress = passport.walletAddress;
        console.log(`fetching privacy data for ${walletAddress} (${i + 1} / ${numPassports})...`);
        // IMPORTANT: do not adjust the batch size!
        if (batch.length >= 5) {
            await Promise.all(batch)
                .catch(console.error);
            batch.length = 0;
        }
        batch.push(new Promise(async (res) => {
            const mapKey = associationValue;
            if (extracted.has(mapKey)) {
                res();
                return;
            }
            const privacyData = await getPrivacyData(walletAddress);
            if (!privacyData) {
                console.log(`no privacy data found for ${walletAddress}`);
                extracted.set(mapKey, true);
                res();
                return;
            }
            if (association === 'entities') {
                addEntityDataToZip(privacyData, zip, `${fileName}/Businesses`, associationValue)
                    .then(() => {
                        extracted.set(mapKey, true);
                        res();
                    })
                    .catch(console.error);
            } else {
                addUserDataToZip(privacyData, zip, `${fileName}/Individuals/${walletAddress}`)
                    .then(() => {
                        extracted.set(mapKey, true);
                        res();
                    })
                    .catch(console.error);
            }
        }));
    }
    if (batch.length !== 0) {
        await Promise.all(batch)
            .catch(console.error);
    }
    console.log('generating zip...');
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        .pipe(fs.createWriteStream(`output/${fileName}`))
        .on('finish', () => {
            console.log(`zip saved to output/${fileName}`);
        });
}

module.exports = {
    exportZip,
    getPrivacyData
};