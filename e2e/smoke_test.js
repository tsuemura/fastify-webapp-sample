SuiteOf('Smoke test');

Scenario('Access to example.com', ({ I }) => {
  I.amOnPage('https://example.com')
  I.see('Example Domain')
});

Scenario('Login and confirm order', async ({ I, date }) => {
  // 一般ユーザーとしてログインする
  I.amOnPage("/");
  I.click("ログインする");
  I.fillField("ユーザー名", "user1");
  I.fillField("パスワード", "super-strong-passphrase");
  I.click("ログイン");
  I.see("user1 さん");

  // カートに商品を入れる
  I.fillField("カートに入れる数量", "1")
  I.click("カートに入れる")

  // 受け取り情報を入力し、注文を確定する
  I.fillField('お名前（受取時に必要です）', 'ユーザー1')
  I.fillField('電話番号（連絡時に必要です）', '09000000000')
  I.fillField('受け取り日', date.now.format('YYYY/MM/DD'))
  I.fillField('受け取り目安時間', date.now.add(1, 'hour').format('HH:MM:SS'))
  I.click('注文を確定する')

  // 注文番号を控えておく
  const orderNo = await I.grabTextFrom('h3')

  session('お弁当屋さんのブラウザ', () => {

    // お弁当屋さんのアカウントでログインする
    I.amOnPage("/");
    I.click("ログインする");
    I.fillField("ユーザー名", "admin");
    I.fillField("パスワード", "admin");
    I.click("ログイン");

    // 注文管理画面から注文を引き渡す
    I.click("注文を管理する")
    within(locate('aside').withText(orderNo), () => {
      I.click("この注文を引き渡しました")
      I.see("引き渡し済みの注文です")
    })

  })
})

