const {getSlugCounter, addUrl, getSlug} = require('./slugsDao');

test('should get existing slug\'s counter', async () => {
  expect(await getSlugCounter('some-slug')).toBe(2);
});

test('should return 0 for inexistent slugs', async () => {
  expect(await getSlugCounter('some-inexistent-slug')).toBe(0);
});

test('should unique slug return strings without counter', async () => {
  expect(await addUrl(
      'https://www1.animeultima.to/a/kanojo-okarishimasu_120373',
      'Kanojo, Okarishimasu')).toBe('kanojo-okarishimasu');
});

test('should duplicated slugs append slug counter', async () => {
  expect(await addUrl(
      'https://www1.animeultima.to/a/kanojo-okarishimasu_120373',
      'Kanojo, Okarishimasu')).toBe('kanojo-okarishimasu-2');
});

test('should add new slug if it doesn\'t exist', async () => {
  expect(await getSlug(
      'https://www1.animeultima.to/a/detective-conan_410240/episode-961_650983-sub',
      'Detective Conan Episode 961')).toBe('detective-conan-episode-961');
});

test('should return existing slug', async () => {
  expect(await getSlug(
      'https://www1.animeultima.to/a/detective-conan_410240/episode-961_650983-sub',
      'Detective Conan Episode 961')).toBe('detective-conan-episode-961');
});
