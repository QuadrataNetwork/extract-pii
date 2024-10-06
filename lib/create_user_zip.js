async function addUserDataToZip(data, zip, folderName) {
    const promises = [];
    if (data.GP && data.GP.value) {
        const { frontPhoto, backPhoto } = data.GP.value;
        if (frontPhoto) {
            promises.push(
                fetch(frontPhoto.url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${frontPhoto.url}`);
                    }
                    return response.arrayBuffer();
                })
                .then((buffer) => {
                    zip.file(`${folderName}/Government Documents/frontPhoto.jpg`, buffer);
                })
                .catch((err) => {
                    console.error(err);
                    zip.file(
                        `${folderName}/Government Documents/frontPhoto-error.txt`,
                        err.message
                    );
                })
            );
        }
        if (backPhoto) {
            promises.push(
                fetch(backPhoto.url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${backPhoto.url}`);
                    }
                    return response.arrayBuffer();
                })
                .then((buffer) => {
                    zip.file(`${folderName}/Government Documents/backPhoto.jpg`, buffer);
                })
                .catch((err) => {
                    console.error(err);
                    zip.file(
                        `${folderName}/Government Documents/backPhoto-error.txt`,
                        err.message
                    );
                })
            );
        }
    }
    if (data.SLF && data.SLF.value) {
        for (const slf of data.SLF.value) {
            promises.push(
                fetch(slf.url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${slf.url}`);
                    }
                    return response.arrayBuffer();
                })
                .then((buffer) => {
                    zip.file(`${folderName}/Selfies/${slf.page}.jpg`, buffer);
                })
                .catch((err) => {
                    console.error(err);
                    zip.file(
                        `${folderName}/Selfies/${slf.page}-error.txt`,
                        err.message
                    );
                })
            );
        }
    }
    await Promise.all(promises);
    zip.file(`${folderName}/response.json`, JSON.stringify(data, null, 2));
}

module.exports = { addUserDataToZip };