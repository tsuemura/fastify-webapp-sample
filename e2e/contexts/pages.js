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
    const locateItem = (itemName) => locate("tr").withText(itemName)
    const I = actor({
      locateItem,
      locateWithinItem: (itemName) => ({
        商品を編集: locate("a").withText('商品を編集').inside(locateItem(itemName)).as('商品を編集'),
        カートに入れる数量: locate("input").after(
          locate("label").withText("カートに入れる数量")
        ).inside(locateItem(itemName)).as('カートに入れる数量'),
        カートに入れる: locate('input').withAttr({value: 'カートに入れる'}).inside(locateItem(itemName)).as('カートに入れる')
      }),
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
    fn(I);
  },
};
