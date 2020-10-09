const {requireDatabase, slug} = require('../util');

const getSlugCounter = function(slug) {
  return new Promise((resolve, reject) => {
    const connection = requireDatabase();
    connection.connect();

    connection.query(
        'SELECT * FROM slug_counter WHERE ?',
        [{slug}],
        function(err, res) {
          if (!err) {
            if (res.length > 0) {
              resolve(res[0].counter);
            } else resolve(0);
          } else reject(err);
        });

    connection.end();
  });
};

const addUrl = function(url, title) {
  return new Promise(async (resolve, reject) => {
    const generatedSlug = slug(title);
    const slugCounter = await getSlugCounter(generatedSlug);

    /**
     * if slug slugCounter = 0 then create new entry with counter = 1
     * else increment the counter of the existing slug by one
     */
    addSlug(generatedSlug, slugCounter + 1)
        .then((addedSlug) => {
          const connection = requireDatabase();
          connection.connect();

          let slug = addedSlug;

          if (slugCounter != 0) {
            slug = slug.concat(`-${slugCounter + 1}`);
          }

          connection.query(
              'INSERT INTO slugs SET ?',
              {slug, url},
              (err) => {
                if (err) throw err;
                else resolve(slug);
              });

          connection.end();
        })
        .catch((error) => {
          reject(error);
        });
  });
};

const addSlug = function(slug, counter) {
  return new Promise((resolve, reject) => {
    const connection = requireDatabase();
    connection.connect();

    let queryString;
    let params;

    if (counter == 1) {
      queryString = 'INSERT INTO slug_counter SET ?';
      params = {counter, slug};
    } else {
      queryString = 'UPDATE slug_counter SET ? WHERE ?';
      params = [{counter}, {slug}];
    }

    connection.query(queryString, params, (err) => {
      if (err) reject(err);
      else resolve(slug);
    });

    connection.end();
  });
};

/**
 * adds new Slug if it doesn't exist
 * return slug if it exist already
 */

exports.getSlug = function(url, title) {
  return new Promise((resolve, reject) => {
    const connection = requireDatabase();
    connection.connect();

    connection.query('SELECT * FROM slugs WHERE ?', {url}, (err, res) => {
      if (err) {
        reject(err);
      } else {
        if (res.length > 0) resolve(res[0].slug);
        else addUrl(url, title).then(resolve).catch(reject);
      }
    });

    connection.end();
  });
};

exports.addUrl = addUrl;
exports.getSlugCounter = getSlugCounter;
