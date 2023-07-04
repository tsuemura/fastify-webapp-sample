const { utils } = inject()

module.exports = {
  /**
   * テスト用の商品を作成し、商品名を返す。商品名が与えられない場合はランダムな商品名を作成する。
   *
   * I.haveItem(商品名)
   * @param {name<string>} 商品名
   * @return {name<string>} 作成された商品の商品名
   */
  haveItem(name) {
    const I = actor({});
    if (!name)
      name = `牛ハラミ弁当-テスト-${utils.now.format("YYYYMMDDHHmmss")}`;
    I.amOnPage("/items/add");
    I.seeInTitle("商品追加");
    I.fillField("商品名", name);
    I.fillField("商品説明", "テスト用の商品です");
    I.fillField("価格", "500");
    I.click("追加");
    I.see(name);
    return name;
  },
};
