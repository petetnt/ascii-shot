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
 * @param {Object} counter  - Counter that contains the amount of images and current image number
 * @param {Object} flags - flags passed to the cli
 * @returns {Promise.resolve} - Resolved promise for chaining.
 */
function writeInstagramShot(text, image, counter, flags) {
  const $ = cheerio.load(text);
  const imageParts = $("font").children();

  const {
    likes,
    date,
    caption,
  } = image;

  const {
    amount,
    count,
  } = counter;

  const {
    noColor,
    highRes,
  } = flags;

  const repeatAmount = highRes ? 104 : 52;

  cursor.write(`${"-".repeat(repeatAmount)}${EOL}`);
  cursor.write(`${count}/${amount}${EOL}`);
  cursor.write(`Caption: ${caption}${EOL}`);
  cursor.write(`Created at: ${date}${EOL}`);
  cursor.write(`Likes: ${likes}${EOL}`);
  cursor.write(`${"-".repeat(repeatAmount)}${EOL}`);

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
 * @param {Object} counter  - Counter that contains the amount of images and current image number
 * @param {Object} flags - flags passed to the cli
 * @returns {Promise} - Resolves when image is written
 */
const writeImageToConsole = (image, counter, flags) => {
  console.log(`Fetching ${image.url}...`);
  return fetch(`${image.url}.html`)
    .then((res) => res.text())
    .then((text) => writeInstagramShot(text, image, counter, flags))
    .catch((err) => {
      console.error("  Error: Ressor fetching/parsing images:");
      console.error(err.message);
    });
};

/**
 * Fetches the latest Instagram shot of the owner of the access_token
 * @param {String} token - access token
 * @param {Object} flags - flags passed to the cli
 */
const AsciiShot = (username, flags) => (
  fetch(`https://instagram.com/${username}/media`)
  .then((res) => res.json())
  .then(json => {
    const itemsArray = json.items;

    if (!json || !itemsArray) {
      throw new Error("No items found.");
    }

    let isFetching = false;

    const instagramShots = formatItemsArray(itemsArray, flags);
    const amount = instagramShots.length;
    const hasRawMode = process.stdin.setRawMode; // for tests
    let count = 0;

    /**
     * Fetches the next image or ends the program
     * @param {Buffer} data - Data from process.stdin
     */
    const fetchNextOrDie = (data) => {
      if (hasRawMode) {
        process.stdin.setRawMode(false);
      }
      count = count + 1;

      const counter = {
        amount,
        count,
      };

      if (isFetching) {
        return;
      }

      if (data && data.toString("hex") !== "20") {
        process.exit(0);
      }

      isFetching = true;

      writeImageToConsole(instagramShots.pop(), counter, flags).then(() => {
        isFetching = false;
        if (instagramShots.length) {
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
    };

    fetchNextOrDie();
    process.stdin.on("data", fetchNextOrDie);
  })
  .catch((err) => {
    console.error(`  Error: Couldn't fetch images for username ${username}`);
    console.error(err.message);
  })
);

module.exports = AsciiShot;
