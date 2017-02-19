const EOL = require("os").EOL;
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const ansi = require("ansi");
const cursor = ansi(process.stdout);

/**
 * Takes a HTML-formatted text and parses the containing ASCII image to text.
 * Also writes the attached metadata to console.
 * @param {String} text - HTML body
 * @param {Object} image - Object containing related metadata.
 * @param {Object} counter  - Counter that contains the current image number
 * @param {Object} flags - flags passed to the cli
 * @returns {Promise.resolve} - Resolved promise for chaining.
 */
function writeInstagramShot(text, image, count, flags) {
  const $ = cheerio.load(text);
  const imageParts = $("font").children();

  const {
    likes,
    date,
    caption,
  } = image;

  const {
    noColor,
    highRes,
  } = flags;

  const lineLength = highRes ? 104 : 52;

  cursor.write(`${"-".repeat(lineLength)}${EOL}`);
  cursor.write(`${count}${EOL}`);

  const captionWords = caption.split(" ");
  let line = "";

  for (const word of captionWords) {
    line = `${line} ${word}`;

    if (line.length > lineLength) {
      line = "";
      cursor.write(EOL);
    }

    cursor.write(`${word} `);
  }

  cursor.write(EOL);

  cursor.write(`Created at: ${date}${EOL}`);
  cursor.write(`Likes: ${likes}${EOL}`);
  cursor.write(`${"-".repeat(lineLength)}${EOL}`);

  imageParts.each((index, elem) => {
    if (elem.name === "span") {
      const $elem = $(elem);
      const elemText = $elem.text();

      if (noColor) {
        cursor.write(elemText).reset();
      } else {
        const [, color] = $elem.attr("style").split(":");
        cursor.hex(color).write(elemText).reset();
      }
    }

    if (elem.name === "br") {
      cursor.write(EOL);
    }
  });

  return Promise.resolve();
}

/**
 * Formats the itemsArray to caption/likes/imageurl format
 * @param {Array} itemsArray - Array of instagram items
 * @param {Object} flags - flags passed to the cli
 * @returns {Array} - Array of image urls
 */
const formatItemsArray = (itemsArray, flags) => (
  itemsArray.map((item) => {
    const {
      id,
      images,
      likes,
      caption,
      created_time: createdTime,
    } = item;

    const {
      standard_resolution: standardResolution,
      low_resolution: lowResolution,
    } = images;

    let url = null;

    if (lowResolution && !flags.highRes) {
      url = lowResolution.url.split("?")[0];
    } else if (standardResolution) {
      url = standardResolution.url.split("?")[0];
    }

    return {
      id,
      likes: likes.count,
      caption: caption ? caption.text : "",
      date: new Date(createdTime * 1000),
      url,
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime())
);

/**
 * Writes an image to the console
 * @param {String} imageUrl - Url of the image to fetch
 * @param {Object} counter - Counter that contains the amount of images and current image number
 * @param {Object} flags - flags passed to the cli
 * @returns {Promise} - Resolves when image is written
 */
const writeImageToConsole = (image, counter, flags) => fetch(`${image.url}.html`)
  .then((res) => res.text())
  .then((text) => writeInstagramShot(text, image, counter, flags))
  .catch((err) => {
    console.error("  Error: Errors fetching/parsing images:");
    console.error(err.message);
  });

let IS_FETCHING = false;

const fetchPageForUsername = (username, maxId, flags) => {
  const baseUrl = `https://instagram.com/${username}/media`;
  const url = `${baseUrl}/${maxId ? `?max_id=${maxId}` : ""}`;

  IS_FETCHING = true;

  return fetch(url).then((res) => res.json()).then(json => {
    const {
      items: itemsArray,
      more_available: moreAvailable,
    } = json;

    if (!json || !itemsArray) {
      throw new Error("No items found.");
    }

    IS_FETCHING = false;

    const instagramShots = formatItemsArray(itemsArray, flags);

    return {
      instagramShots,
      moreAvailable,
    };
  });
};

/**
 * Fetches the latest Instagram shot of username
 * @param {String} username - username
 * @param {String} maxId - lastId fetched
 * @param {Object} flags - flags passed to the cli
 */
const asciiShot = (username, maxId, flags, count = 0) => (
  fetchPageForUsername(username, maxId, flags)
  .then(({ instagramShots, moreAvailable }) => {
    const hasRawMode = process.stdin.setRawMode; // for tests
    let lastId = null;

    /**
     * Fetches the next image or ends the program
     * @param {Buffer} data - Data from process.stdin
     */
    const fetchNextOrDie = (data) => {
      if (hasRawMode) {
        process.stdin.setRawMode(false);
      }

      if (IS_FETCHING) {
        return;
      }


      if (data && data.toString("hex") !== "20") {
        process.exit(0);
      }

      const image = instagramShots.pop();

      if (!image && moreAvailable) {
        process.stdin.removeAllListeners("data");
        console.log("Fetching more images...");
        asciiShot(username, lastId, flags, count);
      } else {
        count = count + 1; // eslint-disable-line

        lastId = image.id;
        IS_FETCHING = true;

        writeImageToConsole(image, count, flags).then(() => {
          if (instagramShots.length || moreAvailable) {
            IS_FETCHING = false;

            if (hasRawMode) {
              process.stdin.setRawMode(true);
            }
            process.stdin.resume();
            console.log("");
            console.log("");
            console.log("Press space to fetch the next one or any other key to exit");
          } else {
            console.log(`No more images for ${username} :)`);
            process.exit(0);
          }
        });
      }
    };

    fetchNextOrDie();
    process.stdin.on("data", fetchNextOrDie);
  })
  .catch((err) => {
    console.error(`  Error: Couldn't fetch images for username ${username}`);
    console.error(err.message);
  })
);

module.exports = asciiShot;
