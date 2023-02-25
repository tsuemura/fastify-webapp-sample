SuiteOf("Generic error test scenarios");

Scenario(
  "When a user access to a dead link, the user will see pretty error message and the link to the item list",
  ({ I }) => {
    I.amOnPage("/undefined");
    I.see("お探しのページは見つかりませんでした。");
    I.click("商品一覧へ戻る");
    I.seeInTitle("商品一覧");
  }
);
