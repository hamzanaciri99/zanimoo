/**
 * @jest-environment node
 */

const AnimeUltimaScrapper = require('../scrappers/AnimeUltimaScrapper.js');

test('should get recent return 20 last episodes', async () => {
  const episodes = await AnimeUltimaScrapper.getRecents();
  expect(episodes.length).toBe(20);
});
