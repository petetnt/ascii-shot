const EOL = require("os").EOL;
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const ansi = require('ansi');
const cursor = ansi(process.stdout);

/**
 * Takes a HTML-formatted text and parses the containing ASCII image to text.
 * @param {String} text - HTML body
 */
function _parseAsciiImage(text) {
    const $ = cheerio.load(text);
    const imageParts = $("font").children();
    
    imageParts.each((index, elem) => {
        if (elem.name === "span") { 
            const $elem = $(elem);
            cursor.red().write($elem.text()).reset();
        }

        if (elem.name === "br") {
            cursor.write(EOL);   
        }
    });
}

/**
 * Fetches the latest Instagram shot of the owner of the access_token
 * @param {String} token - access token
 */
const AsciiShot = (token) => {
    fetch(`https://api.instagram.com/v1/users/self/media/recent/?access_token=${token}`).then(res => {
        return res.json();
    }).then(json => {
        const image = json.data[0].images.standard_resolution.url.split("?")[0];
        return fetch(`${image}.html`);
    }).then(res => {
        return res.text();
    }).then(_parseAsciiImage);
};

module.exports = AsciiShot;
