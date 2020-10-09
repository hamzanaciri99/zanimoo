const {slug} = require('./util');

test('should generate a valid slug with no special chars but \'-\'', () => {
  const names = [
    {
      name: 'Kanojo, Okarishimasu',
      slug: 'kanojo-okarishimasu',
    },
    {
      name: 'Re:Zero kara Hajimeru Isekai Seikatsu 2nd Season Episode 11',
      slug: 're-zero-kara-hajimeru-isekai-seikatsu-2nd-season-episode-11',
    },
    {
      name: '.hack//Sign - Unison',
      slug: '-hack-sign-unison',
    },
  ];

  for (name of names) {
    expect(slug(name.name)).toBe(name.slug);
  }
});
