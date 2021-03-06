class UpdateChecker {
    constructor() {
        let https = require("https");
        let electron = require("electron");
        let current = electron.remote.app.getVersion();

        this._failed = false;
        this._willfail = false;
        this._fail = (e) => {
            this._failed = true;
            electron.ipcRenderer.send("log", "note", "UpdateChecker: Could not fetch latest release from GitHub's API.");
            electron.ipcRenderer.send("log", "debug", `Error: ${e}`);
        };

        https.get({
            protocol: "https:",
            host: "api.github.com",
            path: "/repos/GitSquared/edex-ui/releases/latest",
            headers: {
                "User-Agent": "eDEX-UI UpdateChecker"
            }
        }, res => {
            switch(res.statusCode) {
                case 200:
                    break;
                case 404:
                    this._fail("Got 404 (Not Found) response from server");
                    break;
                default:
                    this._willfail = true;
            }

            res.on('data', d => {
                if (this._failed === true) {
                    // Do nothing, it already failed
                } else if (this._willfail) {
                    this._fail(d.toString());
                } else {
                    try {
                        let release = JSON.parse(d.toString());
                        if (release.tag_name.slice(1) === current) {
                            electron.ipcRenderer.send("log", "info", "UpdateChecker: Running latest version.");
                        } else {
                            new Modal({
                                type: "info",
                                title: "New version available",
                                message: `eDEX-UI <strong>${release.tag_name}</strong> is now available.<br/>Head over to <a href="#" onclick="require('electron').shell.openExternal('${release.html_url}')">github.com</a> to download the latest version.`
                            });
                        }
                    } catch(e) {
                        this._fail(e);
                    }
                }
            });
        }).on('error', e => {
            this._fail(e);
        });
    }
}

module.exports = {
    UpdateChecker
};
