const axios = require('axios');
const cheerio = require('cheerio');
const {getSlug} = require('../models/slugsDao');
const {getPage} = require('../util');

const site = 'https://www1.animeultima.to';
const paths = {
  recent: '/',
};

const NAVIGATION_TIMEOUT = 300000;

const getRecents = function() {
  return new Promise((resolve, reject) => {
    axios.get(site + paths.recent)
        .then((result) => {
          const $ = cheerio.load(result.data);
          const recentEpisodes = $('.episode-scroller > .card')
              .map(async (i, item) => {
                const episode = {
                  title: $('.episode-title', item).text().trim(),
                  episodeNum: $('.episode-num', item).text(),
                  url: $('a', item).attr('href'),
                  thumbnail: $('img', item).attr('src'),
                };
                return {
                  ...episode,
                  url: await getSlug(episode.url,
                      `${episode.title}-${episode.episodeNum}`),
                };
              }).toArray();
          resolve(Promise.all(recentEpisodes));
        })
        .catch((error) => reject(error));
  });
};

const getEpisode = function(url) {
  return new Promise((resolve, reject) => {
    axios.get(url)
        .then(async (result) => {
          const $ = cheerio.load(result.data);

          const infoSection = $('.video-content');
          const title = infoSection.find('div > span').first()
              .text().split('\n')[0];
          const episodeList = infoSection.find('#episode-list div')
              .map(async (i, epDiv) => {
                const ep = {
                  title: $('a', epDiv).text(),
                  url: $('a', epDiv).attr('href'),
                  isNowPlaying: ($(epDiv).attr('id')) ? true : false,
                };
                return {
                  ...ep,
                  url: await getSlug(ep.url, `${title}-${ep.title}`),
                };
              }).toArray();

          const episode = {
            title,
            num: infoSection.find('div > span').first().text().split('\n')[1]
                .trim(),
            type: infoSection.find('span > span', infoSection).first().text(),
            aired: infoSection.find('#rating ~ span', infoSection).eq(1)
                .text().trim().split('\n')[1].trim(),
            thumbnail: infoSection.find('.thumbnail').attr('src'),
            details: infoSection.find('.anime-meta .anime-details').text()
                .trim(),
            episodeList: await Promise.all(episodeList),
            players: [{
              name: null,
              iframe: $('.player-container > iframe').attr('src'),
            }],
          };

          episode.animeUrl = await getSlug(
              infoSection.find('.anime-box > a').attr('href'), episode.title);

          if (episode.players[0].iframe &&
            episode.players[0].iframe.startsWith('/')) {
            episode.players[0].iframe = site + episode.players[0].iframe;
          }

          resolve(episode);
        })
        .catch((error) => reject(error));
  });
};

const getAnime = function(url) {
  return new Promise((resolve, reject) => {
    getPage()
        .then(function(page) {
          page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
          // wait untill episodes table exists
          page.waitForSelector(
              '.table tbody tr',
          );
          return page.goto(url).then(function() {
            return page.content();
          });
        })
        .then(async function(html) {
          const $ = cheerio.load(html);
          const anime = {};

          const animeDetails = $('.anime-details');
          const episodesInfo = $('.table');

          anime.thumbnail = $('.thumbnail').attr('src');
          anime.name = animeDetails.find('h1[class*="title"]')
              .clone().children().remove().end().text().trim();
          [anime.year, anime.genre] = animeDetails
              .find('h1[class*="title"] > span').text().split('·');
          [anime.year, anime.genre] = [anime.year.trim(), anime.genre.trim()];
          anime.tags = animeDetails.find('.tags > .tag')
              .map((i, tag) => $(tag).text())
              .toArray();
          anime.rating = animeDetails.find('.anime-gwa span').text();
          anime.summary = animeDetails.find('.column-item').eq(1).text().trim()
              .split('\n')[0];

          anime.details = {};

          animeDetails.find('.table-info th').each((i, e) => {
            anime.details[$(e).text().trim()] = $(e).next('td').text().trim()
                .split('\n')[0].split(' ')[0];
          });

          anime.episodes = [];

          episodesInfo.find('tbody tr').each((i, e) => {
            anime.episodes.push({
              num: $('th', e).text().trim(),
              title: $('td', e).first().text().trim(),
              url: ($('td', e).first().find('a').length) ? $('td', e)
                  .first().find('a').attr('href').trim() : null,
              airing: $('td', e).last().text().trim(),
            });
          });

          console.log(anime.episodes.length);

          anime.episodes = anime.episodes.map(async (ep) => {
            if (!ep.url) return ep;
            return {
              ...ep,
              url: await getSlug(ep.url, `${anime.name}-${ep.num}-${ep.title}`),
            };
          });

          anime.episodes = await Promise.all(anime.episodes);

          resolve(anime);
        })
        .catch(function(err) {
          reject(err);
        });
  });
};

/**
 * @param {string} query
 * @param {numpber} page
 * @return {Promise}
 */
const search = function(query, page) {
  return new Promise((resolve, reject) => {
    axios.get(`${site}/search?search=${query}&page=${page}`)
        .then(async (html) => {
          const $ = cheerio.load(html.data);
          const result = $('.anime-box');
          const animes = [];

          if (result.length) {
            result.each((i, a) => {
              animes.push({
                title: $('.anime-meta > .anime-title', a).eq(0).text().trim(),
                thumbnail: $('.thumbnail', a).attr('src'),
                eps: $('.anime-details', a).clone().children().remove().end()
                    .text().trim().split(' ')[0],
                url: $('a', a).attr('href'),
                typeAndYear: $('.anime-details > strong', a).text().trim(),
              });
            });
          }

          resolve(await Promise.all(animes.map(async (anime) => ({
            title: anime.title,
            thumbnail: anime.thumbnail,
            eps: anime.eps,
            url: await getSlug(anime.url, anime.title),
            type: anime.typeAndYear.split('·')[0].trim(),
            year: anime.typeAndYear.split('·')[1].trim(),
          }))));
        })
        .catch((error) => reject(error));
  });
};

const getFrontPageExtra = function(sectionSelector, eq, isLast) {
  return new Promise((resolve, reject) => {
    axios.get(site + paths.recent)
        .then((html) => {
          const $ = cheerio.load(html.data);
          const extras = ((eq) ? $(sectionSelector).eq(2) :
            (isLast) ? $(sectionSelector).last() : $(sectionSelector))
              .find('.column')
              .map(async (i, item) => {
                const anime = {
                  title: $('.anime-title', item).text().trim(),
                  url: $('a', item).attr('href'),
                  thumbnail: $('.image', item).css('background').trim()
                      .split(' ')[0],
                  rating: $('.tag', item).length ?
                    $('.tag', item).text().trim() : null,
                  details: $('.anime-details', item).text().trim()
                      .replace(/\n/g, ' ').replace(/\s+/g, ' '),
                };
                return {
                  ...anime,
                  thumbnail: anime.thumbnail
                      .substring(5, anime.thumbnail.length - 2),
                  url: await getSlug(anime.url, `${anime.title}`),
                };
              }).toArray();

          resolve(Promise.all(extras));
        })
        .catch((error) => reject(error));
  });
};

const getTrends = function() {
  return getFrontPageExtra('.column-item', 2);
};

const getPopulars = function() {
  return getFrontPageExtra('section[class*="section is-dark-blue"]');
};

const getLastAdded = function() {
  return getFrontPageExtra('.section',
      null, true);
};

const getPlayers = function(url) {
  return new Promise((resolve, reject) => {
    getPage()
        .then(function(page) {
          page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
          return page.goto(url).then(function() {
            return page.content();
          });
        })
        .then(async function(html) {
          const $ = cheerio.load(html);
          let players = $('.mirror-selector > option');
          if (players.length) {
            const promises = players.map(async (i, item) => (
              {
                name: $(item).text(),
                iframe: await getPlayersIFrame($(item).attr('value')),
              }
            )).toArray();

            let results = await Promise.all(promises);
            results = results.filter((item) => item.iframe).map((player) => {
              if (player.iframe.startsWith('/')) {
                return {
                  name: player.name,
                  iframe: site + player.iframe,
                };
              } else {
                return player;
              }
            });

            resolve(results);
          } else {
            players = [{
              name: null,
              iframe: $('.player-container > iframe').attr('src'),
            }];
          }

          resolve(players);
        })
        .catch(function(err) {
          reject(err);
        });
  });
};

const getPlayersIFrame = function(url) {
  return new Promise((resolve, reject) => {
    getPage()
        .then(function(page) {
          page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
          return page.goto(url).then(function() {
            return page.content();
          });
        })
        .then(function(html) {
          const $ = cheerio.load(html);

          resolve($('.player-container > iframe').attr('src'));
        })
        .catch(function(err) {
          reject(err);
        });
  });
};


module.exports = {
  getRecents,
  getPlayers,
  getEpisode,
  getAnime,
  search,
  getTrends,
  getPopulars,
  getLastAdded,
};
