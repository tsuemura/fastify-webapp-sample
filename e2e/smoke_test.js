SuiteOf('スモークテスト');

Scenario('example.comにアクセスする',  ({ I }) => {
  I.amOnPage('https://example.com')
  I.see('Example Domain')
});
