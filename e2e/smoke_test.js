SuiteOf('スモークテスト');

Scenario('Access to example.com', ({ I }) => {
  I.amOnPage('https://example.com')
  I.see('Example Domain')
});

Scenario('Webサイトを開きログインする', ({ I }) => {
  I.amOnPage("/"); // BASE_URLからの相対パスに書き換える
  I.click("ログインする");
  I.fillField("ユーザー名", "user1");
  I.fillField("パスワード", "super-strong-passphrase");
  I.click("ログイン");
  I.see("user1 さん");
})
