const mysql = require('mysql');
const puppeteer = require('puppeteer');

/**
 * @param {string} name Is a string
 * @return {string} This returns a slug string
 * that contains no special chars but '-'
 */
exports.slug = function(name) {
  /**
   * First regex replaces special chars with '-'
   * Second regex replaces multiple '-' with one '-'
   */
  const regexp1 = /([^A-Za-z0-9])/g;
  const regexp2 = /-+/g;

  return name.trim().replace(regexp1, '-').replace(regexp2, '-').toLowerCase();
};

exports.getPage = function() {
  return puppeteer
      .launch({headless: true, args: ['--no-sandbox']})
      .then(function(browser) {
        return browser.newPage();
      });
};

let connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'zanimoo',
});

exports.setConnection = function(c) {
  connection = c;
};

exports.getConnection = function() {
  return connection;
};

exports.endConnection = function() {
  if (connection) connection.destroy();
};
