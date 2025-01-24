SuiteOf('smoke');

Scenario('test something',  ({ I }) => {
 I.amOnPage('https://example.com')
 I.see('Example Domain')
});
