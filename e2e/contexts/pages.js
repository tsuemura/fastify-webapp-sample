module.exports = {
  /**
   * 注文完了画面が表示されていることを期待する。
   * @param {function(I): void} fn
   */
  shouldBeOnOrderCompletePage(fn) {
    const I = actor({});
    I.seeCurrentUrlEquals("/order");
    I.seeInTitle("ご注文が完了しました");
    fn(I);
  },

  /**
   * 注文画面が表示されていることを期待する。
   * @param {function(I): void} fn
   */
  shouldBeOnOrderPage(fn) {
    const I = actor({});
    I.seeCurrentUrlEquals("/order");
    I.seeInTitle("注文する");
    fn(I);
  },

  /**
   * 商品一覧画面が表示されていることを期待する。
   * @param {function(I): void} fn
   */
  shouldBeOnItemListPage(fn) {
    const I = actor({
      findItem: (itemName) => locate("tr").withText(itemName),
    });
    I.seeCurrentUrlEquals("/items");
    I.seeInTitle("商品一覧");
    fn(I);
  },

  /**
   * 商品詳細画面が表示されていることを期待する。
   * @param {function(I): void} fn
   */
  shouldBeOnItemDetailPage(fn) {
    const I = actor({});
    // URLが `/items/2/edit` のようになることを期待する
    I.seeInCurrentUrl("/items");
    I.seeInCurrentUrl("/edit");
    I.seeInTitle("商品編集");
  },
};
