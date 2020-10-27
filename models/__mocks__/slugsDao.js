const {slug} = require('../../util');

let dbSlugs = [];
let dbSlugCounter = [];

const getSlugCounter = function(slug) {
  const item = dbSlugCounter.find((item) => item.slug == slug);
  return new Promise((resolve) => resolve((item) ? item.counter : 0));
};

const addUrl = function(url, title) {
  return new Promise(async (resolve, reject) => {
    const generatedSlug = slug(title);
    const slugCounter = await getSlugCounter(generatedSlug);

    addSlug(generatedSlug, slugCounter + 1)
        .then((addedSlug) => {
          let slug = addedSlug;

          if (slugCounter != 0) {
            slug = slug.concat(`-${slugCounter + 1}`);
          }

          dbSlugs.push({slug, url});
          resolve(slug);
        });
  });
};

const addSlug = function(slug, counter) {
  return new Promise((resolve, reject) => {
    if (counter == 1) {
      dbSlugCounter.push({slug, counter});
    } else {
      dbSlugCounter.forEach((item) => {
        if (item.slug === slug) item.counter = counter;
      });
    }
    resolve(slug);
  });
};

exports.getSlug = function(url, title) {
  return new Promise((resolve, reject) => {
    const res = dbSlugs.find((item) => item.url === url);
    if (res) resolve(res.slug);
    else addUrl(url, title).then(resolve).catch(reject);
  });
};

exports.getUrl = function(slug) {
  return new Promise((resolve, reject) => {
    const res = dbSlugs.find((item) => item.slug === slug);
    if (res) resolve(res.url);
    else reject(new Error('Invalid url'));
  });
};

exports.cleanUp = function() {
  dbSlugs = [];
  dbSlugCounter = [];
};

exports.addUrl = addUrl;
exports.getSlugCounter = getSlugCounter;
