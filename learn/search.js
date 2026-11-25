(() => {
  const search = document.querySelector('.g-search');
  if (!search) return;

  const input = search.querySelector('input');
  const clear = search.querySelector('button');
  const status = search.querySelector('[role="status"]');
  const statusLabel = status.querySelector('span');
  const count = status.querySelector('[data-count]');
  const empty = document.querySelector('.g-no-results');
  const groups = [...document.querySelectorAll('[data-group]')];

  const stopWords = new Set((
    'a an am and are as at be before by can cant could did do does for from get give had has have how i if in into is it its me my of on or our still that the their they this to use want what when where which why will with would you your need ' +
    'a al alla alle anche chi che col come con cosa da dal dalla dei del della di devo e gli ho il in io la le lo ma mi mio nei nel nella non per posso quale quanto se si sono su sul un una vorrei ' +
    'a al como con cual cuando de del el en es esta estoy hay mi mis necesito para por puedo que se si su un una uso yo'
  ).split(/\s+/));

  function normalize(value) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function words(value) {
    return normalize(value).match(/[a-z0-9]+/g) || [];
  }

  // Index page copy in the selected language. The aliases cover common names
  // for the same task, such as receiving a payment and making a deposit.
  const entries = groups.flatMap(group =>
    [...group.querySelectorAll('[data-topic]')].map(item => ({
      group, item,
      terms: new Set(words([
        item.querySelector('summary').textContent,
        item.querySelector('p').textContent,
        item.querySelector('[data-alias]').textContent
      ].join(' ')))
    }))
  );

  function update() {
    const raw = input.value.trim();
    const queryWords = [...new Set(words(raw).filter(token => !stopWords.has(token)))];
    const scores = entries.map(({ terms }) => queryWords.reduce((score, token) => {
      const match = terms.has(token) || (token.length >= 3 && [...terms].some(term => term.startsWith(token)));
      return score + Number(match);
    }, 0));
    const bestScore = Math.max(...scores);
    const visibleGroups = new Set();
    let total = 0;
    entries.forEach(({ item, group }, index) => {
      // Retain equally good answers. For longer phrases, allow a single extra
      // matching word without admitting results that share only generic words.
      const threshold = bestScore >= 3 ? bestScore - 1 : bestScore;
      const visible = !raw || (scores[index] > 0 && scores[index] >= threshold);
      item.hidden = !visible;
      if (visible) {
        total++;
        visibleGroups.add(group);
      }
    });
    groups.forEach(group => { group.hidden = !visibleGroups.has(group); });
    empty.hidden = total !== 0;
    clear.hidden = !input.value;
    statusLabel.hidden = !raw;
    count.textContent = raw ? String(total) : '';
  }

  input.addEventListener('input', update);
  input.addEventListener('search', update);
  clear.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });
  search.hidden = false;
  update();
})();
