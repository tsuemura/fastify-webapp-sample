SuiteOf('Smoke test');

Scenario('Access to example.com', ({ I }) => {
  I.amOnPage('https://example.com')
  I.see('Example Domain')
});

