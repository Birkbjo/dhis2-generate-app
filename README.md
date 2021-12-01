# dhis2-generate-app

> Note: This is only used for testing! The uploaded version only contains a manifest!

Generates a simple app version for an app, incrementing the patch-version and optionally uploads the version to a running App Hub.


## Usage

```bash
node index.js <appId> -b -t <accessToken>
```


### Options

### `-t <accessToken>`

If present, the app will be uploaded to the App Hub using this accessToken


### `-b <base-url>`

Base-URL to App Hub service.

Can be either an absolute url, or one of shortcuts: `(staging, prod)`. In case of a shortcut it will use the DHIS2 hosted [staging server](https://staging.apps.dhis2.org) or [prod server](https://apps.dhis2.org).

Default: `https://localhost:3000`
