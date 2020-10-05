const express = require('express');
const bodyParser = require('body-parser').urlencoded({extended: true});

const app = express();

const port = process.env.PORT || 3000;
app.set('port', port);

app.use(bodyParser);

const animeController = require('./controllers/AnimeController.js')
animeController(app);


app.listen(port);