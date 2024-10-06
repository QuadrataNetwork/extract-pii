const { addUserDataToZip } = require('./create_user_zip');

async function addEntityDataToZip(data, zip, folderName) {
    const hasFiles = data.KYB_FILES && data.KYB_FILES.value;
    const hasOwners = data.KYB_OWNERS && data.KYB_OWNERS.value;
    const kybDataName = (data.KYB_NAME && data.KYB_NAME.value) || undefined;
    const entityName = kybDataName
        ? (kybDataName.entityName ?? kybDataName.legalName ?? kybDataName.dba)
        : undefined;
    const entityFilePath = `${folderName}/${entityName || 'KYB'}-${new Date().toISOString()}`;
    if (hasFiles) {
        const promises = [];
        for (const file of data.KYB_FILES.value) {
            promises.push(
                fetch(file.url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file.url}`);
                    }
                    return response.arrayBuffer()
                })
                .then((buffer) => {
                    zip.file(`${entityFilePath}/Business Documents/${file.filename}`, buffer);
                })
                .catch((err) => {
                    console.error(err);
                    zip.file(
                        `${entityFilePath}/Business Documents/${file.filename}-error.txt`,
                        err.message
                    );
                })
            );
        }
        await Promise.all(promises);
    }
    if (hasOwners) {
        const ownerData = data.KYB_OWNERS.value;
        const ownerFileNames = {};
        for (const key in ownerData) {
            const owner = ownerData[key];
            const ownerType = Array.isArray(owner.type) ? owner.type.join('-') : owner.type;
            const ownerName = `${owner.attributes.FN.value} ${owner.attributes.LN.value}`.trim();
            let ownerFileName = `(${ownerType}) ${ownerName}`;
            if (ownerFileName in ownerFileNames) {
                ownerFileNames[ownerFileName]++;
                const idx = ownerFileNames[ownerFileName];
                ownerFileName = `${ownerFileName} (${idx})`;
            } else {
                ownerFileNames[ownerFileName] = 0;
            }
            const folderName = `${entityFilePath}/Beneficial Owners & Control Persons/${ownerFileName}`;
            await addUserDataToZip(owner.attributes, zip, folderName);
        }
    }
    zip.file(`${entityFilePath}/response.json`, JSON.stringify(data, null, 2));
}

module.exports = { addEntityDataToZip };