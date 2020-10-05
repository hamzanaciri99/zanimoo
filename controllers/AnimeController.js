const AnimeUltimaScrapper = require('../scrappers/AnimeUltimaScrapper.js');
const bodyParser = require('body-parser').urlencoded({extended:true});


const PATH = '/animeultima';



module.exports =  function(app) {

    app.get(PATH + '/recent', (request, response) => {
        AnimeUltimaScrapper.getRecents()
            .then(data => response.send(data))
            .catch(error => response.send(error));
    });

    app.post(PATH + '/ep', bodyParser, (request, response) => {
        let url = request.body.url;
        //exemple: url = 'https://www1.animeultima.to/a/kanojo-okarishimasu_120373/episode-4_708644-sub';
        AnimeUltimaScrapper.getEpisode(url)
            .then(data => response.send(data))
            .catch(error => response.send(error));
    });

    app.post(PATH + '/anime', bodyParser, (request, response) => {
        let url = request.body.url;
        //exemple: url = 'https://www1.animeultima.to/a/major-2nd-2nd-season_785390';
        AnimeUltimaScrapper.getAnime(url)
            .then(data => response.send(data))
            .catch(error => response.send(error));
    });
}