const AnimeUltimaScrapper = require('../scrappers/AnimeUltimaScrapper.js');
const bodyParser = require('body-parser').urlencoded({extended: true});
const {getUrl} = require('../models/slugsDao');

const PATH = '/animeultima';

/**
 * @enum {string}
 */
const STATUS = {
  /** Scrapping failed */
  FAILED: 'FAILED',
  /** Failed to retrieve url, slug dont exist in database */
  INVALID_URL: 'INVALID_URL',
};

module.exports = function(app) {
  app.get(`${PATH}/recent`, (request, response) => {
    AnimeUltimaScrapper.getRecents()
        .then((data) => response.send(data))
        .catch((error) => {
          console.log(error);
          response.send({
            status: STATUS.FAILED,
            error: error.message,
          });
        });
  });

  app.get(`${PATH}/trends`, (request, response) => {
    AnimeUltimaScrapper.getTrends()
        .then((data) => response.send(data))
        .catch((error) => {
          console.log(error);
          response.send({
            status: STATUS.FAILED,
            error: error.message,
          });
        });
  });

  app.get(`${PATH}/populars`, (request, response) => {
    AnimeUltimaScrapper.getPopulars()
        .then((data) => response.send(data))
        .catch((error) => {
          console.log(error);
          response.send({
            status: STATUS.FAILED,
            error: error.message,
          });
        });
  });

  app.get(`${PATH}/lastadded`, (request, response) => {
    AnimeUltimaScrapper.getLastAdded()
        .then((data) => response.send(data))
        .catch((error) => {
          console.log(error);
          response.send({
            status: STATUS.FAILED,
            error: error.message,
          });
        });
  });

  app.get(`${PATH}/search/:query/:page`, (request, response) => {
    AnimeUltimaScrapper.search(request.params.query, request.params.page)
        .then((data) => response.send(data))
        .catch((error) => {
          console.log(error);
          response.send({
            status: STATUS.FAILED,
            error: error.message,
          });
        });
  });

  app.post(`${PATH}/ep`, bodyParser, async (request, response) => {
    getUrl(request.body.slug)
        .then((url) => {
          AnimeUltimaScrapper.getEpisode(url)
              .then((data) => response.send(data))
              .catch((error) => {
                console.log(error);
                response.send({
                  status: STATUS.FAILED,
                  error: error.message,
                });
              });
        })
        .catch(() => {
          response.send({
            status: STATUS.INVALID_URL,
            error: 'Invalid Url',
          });
        });
  });

  app.post(`${PATH}/anime`, bodyParser, (request, response) => {
    getUrl(request.body.slug)
        .then((url) => {
          AnimeUltimaScrapper.getAnime(url)
              .then((data) => response.send(data))
              .catch((error) => {
                console.log(error);
                response.send({
                  status: STATUS.FAILED,
                  error: error.message,
                });
              });
        })
        .catch(() => {
          response.send({
            status: STATUS.INVALID_URL,
            error: 'Invalid Url',
          });
        });
  });
};
