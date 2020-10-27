/**
 * @jest-environment node
 */

jest.mock('../models/slugsDao');
jest.setTimeout(30 * 1000);
const AnimeUltimaScrapper = require('../scrappers/AnimeUltimaScrapper.js');

describe('testing AnimeUltimaScrapper module', () => {
  it('should get recent return 20 last episodes', async () => {
    const episodes = await AnimeUltimaScrapper.getRecents();
    expect(episodes).toHaveLength(20);
  });

  afterAll(() => {
    require('../models/slugsDao').cleanUp();
  });
});
