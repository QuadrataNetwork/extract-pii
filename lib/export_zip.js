const fs = require('fs');
const JSZip = require('jszip');
const { fetchPrivacyData } = require('@quadrata/sdk/api');

const { addUserDataToZip } = require('./create_user_zip');
const { addEntityDataToZip } = require('./create_entity_zip');
const { API_KEY, PRIVATE_KEY_DER_BASE_64, environment } = require('../config');

const extracted = new Map();

async function getPrivacyData(walletAddress) {
    const response = await fetchPrivacyData({
        apiKey: API_KEY,
        privateKeyDerBase64: PRIVATE_KEY_DER_BASE_64,
        walletAddress: walletAddress
    }, environment);
    if (!response || !response.data || !response.data.attributes ) {
        return undefined;
    }
    return response.data.attributes;
}

async function exportZip(passports, environment) {
    const zip = new JSZip();
    const fileName = `privacy-data-${new Date().toISOString()}.zip`;
    const numPassports = passports.length;
    console.log(`fetching privacy data for ${numPassports} wallets...`);
    for (let i = 0; i < numPassports; i++) {
        const passport = passports[i];
        const association = passport.association ?? passport.associationType;
        const walletAddress = passport.walletAddress;
        console.log(`fetching privacy data for ${walletAddress} (${i + 1} / ${numPassports})...`);
        const mapKey = passport.associationValue ?? passport.walletAddress;
        if (extracted.has(mapKey)) {
            continue;
        }
        const privacyData = await getPrivacyData(walletAddress);
        if (!privacyData) {
            console.log(`no privacy data found for ${walletAddress}`);
            continue;
        }
        if (association === 'entities') {
            await addEntityDataToZip(privacyData, zip, `${fileName}/Businesses`);
        } else {
            await addUserDataToZip(privacyData, zip, `${fileName}/Individuals/${walletAddress}`);
        }
        extracted.set(mapKey, true);
    }
    console.log('generating zip...');
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        .pipe(fs.createWriteStream(`output/${fileName}`))
        .on('finish', () => {
            console.log(`zip saved to ${fileName}`);
        });
}

module.exports = {
    exportZip,
    getPrivacyData
};