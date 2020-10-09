const mysql = require('mysql');

exports.slug = function(name) {
  /**
   * First regex replaces special chars with '-'
   * Second regex replaces multiple '-' with one '-'
   */
  const regexp1 = /([^A-Za-z0-9])/g;
  const regexp2 = /-+/g;

  return name.trim().replace(regexp1, '-').replace(regexp2, '-').toLowerCase();
};

exports.requireDatabase = function() {
  return mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'zanimoo',
  });
};
