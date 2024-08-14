SuiteOf('スモークテスト');

Scenario('example.com にアクセス',  ({ I }) => {
    I.amOnPage('https://example.com');
    I.see('Example Domain');
});
