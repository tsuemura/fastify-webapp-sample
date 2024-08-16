SuiteOf('スモークテスト');

Scenario('example.com にアクセス',  ({ I }) => {
    I.amOnPage('https://example.com');
    I.see('Example Domain');
});

Scenario('Webサイトを開きログインする', ({ I }) => {
    I.amOnPage('/');
    // I.amOnPage('https://fastify-webapp-sample.takuyasuemura.dev/');
    I.click('ログインする');
    I.fillField('ユーザー名', 'user1');
    I.fillField('パスワード', 'super-strong-passphrase');
    I.click('ログイン');
    I.see('user1 さん');
});
