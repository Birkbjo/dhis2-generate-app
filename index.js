const AdmZip = require("adm-zip");
const Got = require("got");
const Path = require("path");
const generateManifest = require("./manifestTemplate");
const FormData = require("form-data");
const { exit } = require("process");


const BASE_URLS = {
    staging: 'https://staging.apps.dhis2.org',
    prod: 'https://apps.dhis2.org',
}

function getBaseUrl(baseUrl) {
    return BASE_URLS[baseUrl] || baseUrl
}

function zip(name, data) {
    const zip = new AdmZip();
    const content = Buffer.from(data, "utf8");
    zip.addFile("manifest.webapp", content);

    const p = Path.join(process.cwd(), `${name}.zip`);

    console.log("Zipping file...");
    return new Promise((resolve, reject) => {
        zip.writeZip(p, (e) => {
            e && reject(e);
            console.log("Zipped to", p);
            resolve(zip);
        });
    });
}

async function getApp(id, baseUrl) {
    const url = new URL(`/api/v1/apps/${id}`, getBaseUrl(baseUrl));

    console.log("request to", url.toString());
    try {
        const data = await Got.get(url).json();

        return data
   } catch(e) {
       console.error('Failed to get app:', e.message)
       exit(-1)
   }

}

async function postVersion(
    app,
    { zip, nextVersion, version },
    { baseUrl, token }
) {
    const newVersion = {
        version: nextVersion,
        minDhisVersion: version.minDhisVersion || "",
        maxDhisVersion: "2.36",
        demoUrl: version.demoUrl || "",
        channel: "stable",
    };

    const fileBuffer = await zip.toBufferPromise();

    const formData = new FormData();
    const fileBufferOptions = {
        contentType: "application/zip",
        filename: `${app.name
            .substring(0, 10)
            .replace(/ /g, "_")}_${nextVersion}.zip`,
    };
    formData.append("version", JSON.stringify(newVersion));
    formData.append("file", fileBuffer, fileBufferOptions);

    const url = new URL(`/api/v1/apps/${app.id}/versions`, getBaseUrl(baseUrl));
    console.log("Uploading to ", url.toString());

    const gotOptions = {
        headers: token
            ? {
                  authorization: `Bearer ${token}`,
              }
            : undefined,
    };

    try {
        await Got.post(url, {
            body: formData,
            ...gotOptions,
        });
        console.log(
            "Sucessfully uploaded version",
            nextVersion,
            " to ",
            app.name
        );
    } catch (e) {
        console.log("Failed to upload version!");
        console.log(e.response.body);
        process.exit(-1);
    }
}

function parseArgs(args) {
    const appId = args[0];

    if(!appId) {
        console.error('Missing required app-id')
        exit(-1)
    }
    const argValue = (key, defaultValue) => {
        const keyInd = args.findIndex((a, index) => a === `${key}`);

        return keyInd > -1 ? args[keyInd + 1] : defaultValue;
    };

    const baseUrl = argValue("-b", "http://localhost:3000");
    const version = argValue("-v", null);
    return {
        appId,
        baseUrl,
        version,
        token: argValue("-t", null),
    };
}

const getVersionAsArray = (vStr) =>
    vStr.split(".").map((v) => parseInt(v.replace(/[^\d]/, "")));

function findLatestVersion(app) {
    let max = [0, 0, 0];

    const compareDesc = (a, b) => {
        const len = Math.min(a.length, b.length);
        for (let i = 0; i < len; i++) {
            if (b[i] > a[i]) {
                return 1;
            } else if (b[i] < a[i]) {
                return -1;
            }
        }
        return b.length - a.length;
    };

    return app.versions
        .map((v) => [getVersionAsArray(v.version), v])
        .sort(([a], [b]) => compareDesc(a, b))[0];
}

function calcNextVersion(version) {
    let nextVersion = [...version];

    if (version.length != 3) {
        nextVersion[2] = 1;
    } else {
        nextVersion[2] = version[version.length - 1] + 1;
    }
    return nextVersion.join(".");
}
async function main(args) {
    const argv = parseArgs(args);

    const app = await getApp(argv.appId, argv.baseUrl);
    const [latestVersion, versionObj] = findLatestVersion(app);

    const nextVersion = calcNextVersion(latestVersion);

    console.log("Latest version ", latestVersion);
    console.log("Next Version", nextVersion);

    const manifest = generateManifest(app.id, app.name, nextVersion);

    console.log("Generated manifest", manifest);
    const zipped = await zip(
        app.name.substring(0, 10).replace(/ /g, "_"),
        manifest
    );

    if (argv.token) {
        console.log("Token set uploading");

        postVersion(
            app,
            { zip: zipped, nextVersion, version: versionObj },
            argv
        );
    }
}

main(process.argv.slice(2));
