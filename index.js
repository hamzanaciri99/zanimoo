const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser').urlencoded({extended: true});
const {endConnection} = require('./util');

const app = express();

const port = process.env.PORT || 3001;
app.set('port', port);

app.use(cors({origin: true, credentials: true}));
app.use(bodyParser);

const animeController = require('./controllers/AnimeController.js');
animeController(app);

/**
 * end mysql connection when server stops Ctrl + C
 */
process.on('SIGINT', () => {
  console.log('\nClosing mysql connection...');
  endConnection();
  process.exit();
});

app.listen(port);
