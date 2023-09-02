Feature("在庫管理");

Scenario(
  "店舗スタッフは、デフォルトの注文可能数を変更できる。ユーザーは、デフォルトの注文可能数まで商品を注文できる。",
  ({ I, utils }) => {
    // ## 事前準備: 商品データを作成する。

    // 店舗スタッフとしてログインする。
    I.amOnPage("/");
    I.click("ログインする");
    I.fillField("ユーザー名", "admin");
    I.fillField("パスワード", "admin");
    I.click("ログイン");

    // 商品を追加する。
    // 商品名はタイムスタンプなどからユニークなものを設定する。例えば、`牛ハラミ弁当-テスト-20230416120600` などのようにする。
    // 商品説明と価格はそれぞれ `テスト用の商品です` ・ `500` とする。
    I.click("商品を追加する");
    const itemName = `牛ハラミ弁当-テスト-${utils.now.format("YYYYMMDDHHmmss")}`;
    I.fillField("商品名", itemName);
    I.fillField("商品説明", "テスト用の商品です");
    I.fillField("価格", "500");
    I.click("追加");

    // ## 店舗スタッフはある商品のデフォルトの注文可能数を10個に設定する。

    // 店舗スタッフとしてログインする。
    // 事前準備でログイン済みのため省略。

    // ある商品の詳細ページを開く。
    I.amOnPage("/items");
    const itemContainer = locate("tr").withText(itemName);
    I.click("商品を編集", itemContainer);

    // デフォルトの注文可能数に `10` を設定する。
    I.fillField("デフォルトの注文可能数", "10");
    I.click("変更");

    // ## ユーザーはその商品を当日に10個注文する。

    session("user", () => {
      // 商品を10個カートに入れる。
      I.amOnPage("/items");
      I.fillField(
        locate("input").after(
          locate("label").withText("カートに入れる数量").inside(itemContainer)
        ),
        "10"
      );
      I.click("カートに入れる", itemContainer);

      // 注文画面を開き、当日の日付を入力する。
      I.click("カートを見る");
      I.fillField("お名前（受取時に必要です）", "ユーザー1");
      I.fillField("電話番号（連絡時に必要です）", "09000000000");
      I.fillField("受け取り日", utils.now.format("YYYY/MM/DD"));
      I.fillField(
        "受け取り目安時間",
        utils.now.add(1, "hour").format("HH:MM:SS")
      );

      // 注文を確定する。
      I.click("注文を確定する");
      I.see("ご注文が完了しました");
    });
  }
);

Scenario(
  "店舗スタッフは、デフォルトの注文可能数を変更できる。ユーザーは、デフォルトの注文可能数を越えて注文すると、エラーになる。",
  ({ I, utils }) => {
    // ## 事前準備: 商品データを作成する。

    // 店舗スタッフとしてログインする。
    I.amOnPage("/");
    I.click("ログインする");
    I.fillField("ユーザー名", "admin");
    I.fillField("パスワード", "admin");
    I.click("ログイン");

    // 商品を追加する。
    // 商品名はタイムスタンプなどからユニークなものを設定する。例えば、`牛ハラミ弁当-テスト-20230416120600` などのようにする。
    // 商品説明と価格はそれぞれ `テスト用の商品です` ・ `500` とする。
    I.click("商品を追加する");
    const itemName = `牛ハラミ弁当-テスト-${utils.now.format("YYYYMMDDHHmmss")}`;
    I.fillField("商品名", itemName);
    I.fillField("商品説明", "テスト用の商品です");
    I.fillField("価格", "500");
    I.click("追加");

    // ## 店舗スタッフはある商品のデフォルトの注文可能数を5個に設定する。

    // 店舗スタッフとしてログインする。
    // 事前準備でログイン済みのため省略。

    // ある商品の詳細ページを開く。
    I.amOnPage("/items");
    const itemContainer = locate("tr").withText(itemName);
    I.click("商品を編集", itemContainer);

    // デフォルトの注文可能数に `10` を設定する。
    I.fillField("デフォルトの注文可能数", "10");
    I.click("変更");

    // ## ユーザーはその商品を当日に11個注文する。

    session("user", () => {
      // 商品を11個カートに入れる。
      I.amOnPage("/items");
      I.fillField(
        locate("input").after(
          locate("label").withText("カートに入れる数量").inside(itemContainer)
        ),
        "11"
      );
      I.click("カートに入れる", itemContainer);

      // 注文画面を開き、当日の日付を入力する。
      I.click("カートを見る");
      I.fillField("お名前（受取時に必要です）", "ユーザー1");
      I.fillField("電話番号（連絡時に必要です）", "09000000000");
      I.fillField("受け取り日", utils.now.format("YYYY/MM/DD"));
      I.fillField(
        "受け取り目安時間",
        utils.now.add(1, "hour").format("HH:MM:SS")
      );

      // 注文を確定する。
      I.click("注文を確定する");

      // `商品 ${商品名} の在庫が足りませんでした` と表示されることを確認する。
      I.see(`商品 ${itemName} の在庫が足りませんでした`);
    });
  }
);
