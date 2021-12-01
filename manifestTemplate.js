module.exports = (id, name, version) =>`{
    "app_hub_id": "${id}",
    "appType": "APP",
    "short_name": "${name.replace(/ /g,'-')}",
    "name": "${name}",
    "description": "The Application Management App provides the ability to upload webapps in .zip files, as well as installing apps directly from the official DHIS 2 App Store",
    "version": "${version}",
    "launch_path": "index.html",
    "default_locale": "en",
    "activities": {
      "dhis": {
        "href": "*"
      }
    },
    "icons": {
      "48": "dhis2-app-icon.png"
    },
    "developer": {
      "name": "Birk Johansson",
      "url": "https://www.dhis2.org"
    },
    "manifest_generated_at": "${new Date().toISOString()}",
    "display": "standalone",
    "theme_color": "#ffffff",
    "background_color": "#ffffff",
    "scope": "."
  }
  `;
