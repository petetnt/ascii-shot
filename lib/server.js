const express = require("express");
const app = express();
const open = require("open");
const fetch = require("node-fetch");
const FormData = require("form-data");
const AsciiShot = require("./ascii-shot");

var config = null; 
try {
    config = require("../.config");
} catch (e) {
    config = {};
}

const clientID = process.env.INSTAGRAM_CLIENT_ID || config.INSTAGRAM_CLIENT_ID;
const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || config.INSTAGRAM_CLIENT_SECRET;
const redirectURI = process.env.INSTAGRAM_REDIRECT_URI || config.INSTAGRAM_REDIRECT_URI;
const token = process.env.INSTAGRAM_ACCESS_TOKEN || config.INSTAGRAM_ACCESS_TOKEN;

if (!clientID) {
    throw new Error(`Missing INSTAGRAM_CLIENT_ID. See README.md on how to fix this`);
}

if (!clientSecret) {
    throw new Error(`Missing INSTAGRAM_CLIENT_SECRET. See README.md on how to fix this`);
}

if (!redirectURI) {
    throw new Error(`Missing INSTAGRAM_REDIRECT_URI. See README.md on how to fix this`);
}

app.get(`/${redirectURI.split("/").pop()}`, (req, redirectRes) => {
    if (req.query.error) {
        throw new Error(req.query.error);   
    }

    const code = req.query.code;    
    const form = new FormData();
    
    form.append("client_id", clientID);
    form.append("client_secret", clientSecret);
    form.append("grant_type", "authorization_code");
    form.append("redirect_uri", redirectURI);
    form.append("code", code);
    
    fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        body: form
    }).then(function(res) {
        return res.json();
    }).then(function(json) {
        console.log(`Your access_token is ${json.access_token}`);
        redirectRes.status(200).json({"message": `Successfully authed, you can now close this tab`});
        AsciiShot(json.access_token);
    });
});

if (token) {
    AsciiShot(token);
} else {
    app.listen(8080, () => {
        open(`https://api.instagram.com/oauth/authorize/?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code`);
    });
}
