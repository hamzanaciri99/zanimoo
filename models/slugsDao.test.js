jest.mock('../util');

const {getSlugCounter, addUrl, getSlug, getUrl} = require('./slugsDao');
const mysql = require('mysql');
const utils = require('../util');

const testDatabase = 'db_test';
const options = {
  host: 'localhost',
  user: 'root',
  password: '',
};
/**
 * @type {import('mysql').Connection}
 */
let connection = null;

describe('testing slugDao module', () => {
  beforeAll(() => {
    return new Promise((res, rej) => {
      const connection1 = mysql.createConnection(options);
      connection1.query(`DROP DATABASE IF EXISTS ${testDatabase}`, (err) => {
        if (!err) {
          connection1.query(`CREATE DATABASE ${testDatabase}`, (err) => {
            if (err) throw err;
            connection1.destroy();
            connection = mysql.createConnection({
              ...options,
              database: testDatabase,
            });
            connection.query('CREATE TABLE slugs (url TEXT, slug TEXT)');
            connection.query(
                'CREATE TABLE slug_counter (slug TEXT, counter INTEGER)');
            utils.setConnection(connection);
            res();
          });
        } else throw err;
      });
    });
  });

  it('should create test database', async () => {
    expect(utils.getConnection()).not.toBe(undefined);
  });

  it('should unique slug return strings without counter', async () => {
    expect(await addUrl(
        'https://www1.animeultima.to/a/kanojo-okarishimasu_120373',
        'Kanojo, Okarishimasu')).toBe('kanojo-okarishimasu');
  });

  it('should get existing slug\'s counter', async () => {
    expect(await getSlugCounter('kanojo-okarishimasu')).toBe(1);
  });

  it('should return 0 for inexistent slugs', async () => {
    expect(await getSlugCounter('some-inexistent-slug')).toBe(0);
  });

  it('should duplicated slugs append slug counter', async () => {
    expect(await addUrl(
        'https://www1.animeultima.to/a/kanojo-okarishimasu_120373sqdsqd',
        'Kanojo, Okarishimasu')).toBe('kanojo-okarishimasu-2');
  });

  it('should add new slug if it doesn\'t exist', async () => {
    expect(await getSlug(
        'https://www1.animeultima.to/a/detective-conan_410240/episode-961_650983-sub',
        'Detective Conan Episode 961')).toBe('detective-conan-episode-961');
  });

  it('should return existing slug', async () => {
    expect(await getSlug(
        'https://www1.animeultima.to/a/detective-conan_410240/episode-961_650983-sub',
        'Detective Conan Episode 961')).toBe('detective-conan-episode-961');
  });

  it('should return url corresponding to the provided slug', async () => {
    expect(await getUrl('kanojo-okarishimasu'))
        .toBe('https://www1.animeultima.to/a/kanojo-okarishimasu_120373');
  });

  afterAll(() => {
    connection.destroy();
  });
});
