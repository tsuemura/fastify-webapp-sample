SuiteOf('smoke');

Scenario('test something',  ({ I }) => {
 I.amOnPage('https://fastify-webapp-sample.takuyasuemura.dev/')
 I.click('ログインする')
 I.fillField('ユーザー名', 'user1')
 I.fillField('パスワード', 'super-strong-passphrase')
 I.click('ログイン')
});

