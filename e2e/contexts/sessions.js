const {
  shouldBeOnItemListPage,
  shouldBeOnItemDetailPage,
  shouldBeOnOrderPage,
  shouldBeOnOrderCompletePage,
} = require("./pages");
const { haveItem } = require("./prerequisites");

module.exports = {
  /**
   * 店舗スタッフとしてログインした新しいブラウザセッションを作成する。
   * @param {function(I): void} fn
   */
  amStoreStaff(fn) {
    const I = actor({
      shouldBeOnItemListPage,
      shouldBeOnItemDetailPage,
      haveItem,
    });
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
   * @param {function(I): void} fn
   */
  amAnonimousUser(fn) {
    const I = actor({
      shouldBeOnItemListPage,
      shouldBeOnOrderPage,
      shouldBeOnOrderCompletePage,
    });
    session("AnonimousUser", () => {
      fn(I);
    });
  },
};
