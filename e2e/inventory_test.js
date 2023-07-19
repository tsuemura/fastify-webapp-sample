Feature("在庫管理");

Scenario(
  "店舗スタッフは、デフォルトの注文可能数を変更できる。ユーザーは、デフォルトの注文可能数まで商品を注文できる。",
  ({ I, utils }) => {
    let itemName;

    // ## 店舗スタッフはある商品のデフォルトの注文可能数を10個に設定する。
    I.amStoreStaff((I) => {
      itemName = I.haveItem();
      I.amOnPage("/items");
      I.shouldBeOnItemListPage((I) =>{
        I.click(I.findItem(itemName).find('a').withText('商品を編集'));
        I.shouldBeOnItemDetailPage((I) =>{
          I.fillField("デフォルトの注文可能数", "10");
          I.click("変更");
        });
      });
    });

    // ## ユーザーはその商品を当日に10個注文する。
    I.amAnonimousUser((I) =>{
      I.amOnPage("/items");
      I.shouldBeOnItemListPage((I) =>{
        I.fillField(
          I.findItem(itemName).find(
            `//*[@id=//label[text()="カートに入れる数量"]/@for][self::input or self::textarea]`
          ),
          "10"
        );
        I.click(
          I.findItem(itemName)
            .find("input")
            .withAttr({ value: "カートに入れる" })
        );
      });

      I.click("カートを見る");
      I.shouldBeOnOrderPage((I) =>{
        I.fillField("お名前（受取時に必要です）", "ユーザー1");
        I.fillField("電話番号（連絡時に必要です）", "09000000000");
        I.fillField("受け取り日", utils.now.format("YYYY/MM/DD"));
        I.fillField(
          "受け取り目安時間",
          utils.now.add(1, "hour").format("HH:mmA")
        );
        I.click("注文を確定する");
      });

      I.shouldBeOnOrderCompletePage((I) =>{
        I.see("ご注文が完了しました");
      });
    });
  }
);

Scenario(
  "店舗スタッフは、デフォルトの注文可能数を変更できる。ユーザーは、デフォルトの注文可能数を越えて注文すると、エラーになる。",
  ({ I, utils }) => {
    let itemName;

    // ## 店舗スタッフはある商品のデフォルトの注文可能数を10個に設定する。
    I.amStoreStaff((I) =>{
      itemName = I.haveItem();

      I.amOnPage("/items");
      I.shouldBeOnItemListPage((I) =>{
        I.click("商品を編集", I.findItem(itemName));
        I.shouldBeOnItemDetailPage((I) =>{
          I.fillField("デフォルトの注文可能数", "10");
          I.click("変更");
        });
      });
    });

    // ## ユーザーはその商品を当日に11個注文する。
    I.amAnonimousUser((I) =>{
      I.amOnPage("/items");
      I.shouldBeOnItemListPage((I) =>{
        I.fillField(
          I.findItem(itemName).find(
            `//*[@id=//label[text()="カートに入れる数量"]/@for][self::input or self::textarea]`
          ),
          "11"
        );
        I.click(
          I.findItem(itemName)
            .find("input")
            .withAttr({ value: "カートに入れる" })
        );
      });

      I.click("カートを見る");
      I.shouldBeOnOrderPage((I) =>{
        I.fillField("お名前（受取時に必要です）", "ユーザー1");
        I.fillField("電話番号（連絡時に必要です）", "09000000000");
        I.fillField("受け取り日", utils.now.format("YYYY/MM/DD"));
        I.fillField(
          "受け取り目安時間",
          utils.now.add(1, "hour").format("HH:mmA")
        );
        I.click("注文を確定する");
        I.see(`商品 ${itemName} の在庫が足りませんでした`);
      });
    });
  }
);
