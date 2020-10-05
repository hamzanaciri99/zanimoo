const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const site = 'https://www1.animeultima.to';
const paths = {
    recent: '/',
}

const getRecents = function() {
    return new Promise((resolve, reject) => {
        axios.get(site + paths.recent)
            .then(result => {
                let $ = cheerio.load(result.data);
                let recentEpisodes = $('.episode-scroller > .card')
                    .map((i, item) => (
                        {   
                            title: $('.episode-title', item).text().trim(),
                            episodeNum: $('.episode-num', item).text(),
                            url: $('a', item).attr('href'),
                            thumbnail: $('img', item).attr('src')
                        }
                    )).toArray();

                resolve(recentEpisodes);
            })
            .catch(error => reject(error));
    });
}

const getEpisode = function(url) {
    return new Promise((resolve, reject) => {
        axios.get(url)
            .then(result => {
                let $ = cheerio.load(result.data);
                let player =  {
                    name: null,
                    iframe: $('.player-container > iframe').attr('src')
                }
                
                if(player.iframe.startsWith('/')) player.iframe = site + player.iframe;

                const infoSection = $('.video-content')
                const episodeList = infoSection.find('#episode-list div').map((i, epDiv) => ({
                    title: $('a', epDiv).text(),
                    url: $('a', epDiv).attr('href'),
                    isNowPlaying: ($(epDiv).attr('id')) ? true : false
                })).toArray();

                let episode =  {
                    title: infoSection.find('div > span').first().text().split('\n')[0],
                    num: infoSection.find('div > span').first().text().split('\n')[1].trim(),
                    type: infoSection.find('span > span', infoSection).first().text(),
                    aired: infoSection.find('#rating ~ span', infoSection).eq(1).text().trim().split('\n')[1].trim(),
                    thumbnail: infoSection.find('.thumbnail').attr('src'),
                    details: infoSection.find('.anime-meta .anime-details').text().trim(),
                    episodeList: episodeList
                }

                episode.players = [player,];
                resolve(episode);
            })
            .catch(error => reject(error));

    });
}

const getAnime =  function(url) {
    return new Promise((resolve, reject) => {
        puppeteer
            .launch({
                headless: true,
                args: [
                  '--no-sandbox',
                ]
            })
            .then(function(browser) {
                return browser.newPage();
            })
            .then(function(page) {
                page.setDefaultNavigationTimeout(300000);
                page.waitForSelector('table[class="table is-fullwidth is-hoverable is-narrow-mobile"]'); // wait untill episodes table exists
                return page.goto(url).then(function() {
                    return page.content();
                });
            })
            .then(function(html) {
                let $ = cheerio.load(html),
                    anime = {};

                const animeDetails = $('.anime-details');
                const episodesInfo = $('section').eq(1).find('.table');
                    
                anime.name = animeDetails.find('h1[class*="title"]').clone().children().remove().end().text().trim();
                [anime.year, anime.genre] = animeDetails.find('h1[class*="title"] > span').text().split('·');
                [anime.year, anime.genre] = [anime.year.trim(), anime.genre.trim()]
                anime.tags = animeDetails.find('.tags > .tag').map((i, tag) => $(tag).text()).toArray();
                anime.rating = animeDetails.find('.anime-gwa span').text();
                anime.summary = animeDetails.find('.column-item').eq(1).text().trim().split('\n')[0];

                anime.details = {}

                animeDetails.find('.table-info th').each((i, e) => {
                    anime.details[$(e).text().trim()] = $(e).next('td').text().trim().split('\n')[0].split(' ')[0];
                });

                anime.episodes = [];

                console.log(episodesInfo.find('tbody tr').length);

                episodesInfo.find('tbody tr').each((i, e) => {

                    anime.episodes.push({
                        num: $('th', e).text().trim(),
                        title: $('td', e).first().text().trim(),
                        url: ($('td', e).first().find('a').length) ? $('td', e).first().find('a').attr('href').trim() : null,
                        airing: $('td', e).last().text().trim()
                    })

                    
                });
                resolve(anime);
            })
            .catch(function(err) {
                reject(err)
            });
    });
}

const getPlayers = function(url) {
    return new Promise((resolve, reject) => {
        puppeteer
            .launch({
                headless: true,
                args: [
                  '--no-sandbox',
                ]
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
                let $ = cheerio.load(html);
                let players = $('.mirror-selector > option');
                if(players.length) {
                    const promises = players.map(async (i, item) => (
                        {
                            name: $(item).text(),
                            iframe: await getPlayersIFrame($(item).attr('value'))
                        })).toArray();
                    
                    let results = await Promise.all(promises);
                    results = results.filter(item => item.iframe).map(player => {
                        if(player.iframe.startsWith('/')) {
                            return { 
                                name: player.name,
                                iframe: site + player.iframe
                            }
                        }
                        else return player;
                    });

                    resolve(results);
                }
                else {
                    players = [{
                        name: null,
                        iframe: $('.player-container > iframe').attr('src')
                    }];
                }
                
                resolve(players);
            })
            .catch(function(err) {
                reject(err)
            });
        /*axios.get(url)
            .then(async result => {
                if(result.status === 200) {
                    let $ = cheerio.load(result.data);
                    let players = $('.mirror-selector > option');
                    if(players.length) {
                        const promises = players.map(async (i, item) => (
                            {
                                name: $(item).text(),
                                iframe: await getPlayersIFrame($(item).attr('value'))
                            })).toArray();
                        
                        let results = await Promise.all(promises);
                        results = results.filter((item) => item.iframe);
                        resolve(results);
                    }
                    else {
                        players = [{
                            name: null,
                            iframe: $('.player-container > iframe').attr('src')
                        }];
                    }
                    
                    resolve(players);
                }
                else {
                    var error = new Error('Error ' + result.status + ': ' + result.statusText);
                    error.result = result;
                    throw error;
                }
            })
            .catch(error => reject(error));*/

    });
}

const getPlayersIFrame = function(url) {
    return new Promise((resolve, reject) => {

        puppeteer
            .launch({
                headless: true,
                args: [
                  '--no-sandbox',
                ]
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
                let $ = cheerio.load(html);
                let iframe = $('.player-container > iframe').attr('src');
                
                resolve(iframe);
            })
            .catch(function(err) {
                reject(err)
            });
    });
}



module.exports = {
    getRecents,
    getPlayers,
    getEpisode,
    getAnime
}