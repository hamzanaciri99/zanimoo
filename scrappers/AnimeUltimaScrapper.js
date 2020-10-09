const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const {getSlug} = require('../models/slugsDao');

const site = 'https://www1.animeultima.to';
const paths = {
  recent: '/',
};

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

          if (episode.players[0].iframe.startsWith('/')) {
            episode.players[0].iframe = site + episode.players[0].iframe;
          }

          resolve(episode);
        })
        .catch((error) => reject(error));
  });
};

const getAnime = function(url) {
  return new Promise((resolve, reject) => {
    puppeteer
        .launch({
          headless: true,
          args: [
            '--no-sandbox',
          ],
        })
        .then(function(browser) {
          return browser.newPage();
        })
        .then(function(page) {
          page.setDefaultNavigationTimeout(300000);
          // wait untill episodes table exists
          page.waitForSelector(
              'table[class="table is-fullwidth is-hoverable is-narrow-mobile"]',
          );
          return page.goto(url).then(function() {
            return page.content();
          });
        })
        .then(async function(html) {
          const $ = cheerio.load(html);
          const anime = {};

          const animeDetails = $('.anime-details');
          const episodesInfo = $('section').eq(1).find('.table');

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

const getPlayers = function(url) {
  return new Promise((resolve, reject) => {
    puppeteer
        .launch({
          headless: true,
          args: [
            '--no-sandbox',
          ],
        })
        .then(function(browser) {
          return browser.newPage();
        })
        .then(function(page) {
          page.setDefaultNavigationTimeout(300000);
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
    puppeteer
        .launch({
          headless: true,
          args: [
            '--no-sandbox',
          ],
        })
        .then(function(browser) {
          return browser.newPage();
        })
        .then(function(page) {
          page.setDefaultNavigationTimeout(300000);
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
};
