module.exports = {
  /**
   * 店舗スタッフとしてログインした新しいブラウザセッションを作成する。
   * @param {function(I): void} fn
   */
  amStoreStaff(fn) {
    const I = actor({});
    session("StoreStaff", () => {
      I.amOnPage("/");
      I.click("ログインする");
      I.fillField("ユーザー名", "admin");
      I.fillField("パスワード", "admin");
      I.click("ログイン");
      fn(I);
    });
  },

  /**
   * 未ログインユーザーとしての新しいブラウザセッションを作成する。
   * @param {function(): void} fn
   */
  amAnonimousUser(fn) {
    const I = actor({});
    session("AnonimousUser", () => {
      fn(I);
    });
  },
};
