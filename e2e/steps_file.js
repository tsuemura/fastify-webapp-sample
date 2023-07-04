// in this file you can append custom step methods to 'I' object

const { amAnonimousUser, amStoreStaff } = require("./contexts/sessions")
const { shouldBeOnItemListPage, shouldBeOnItemDetailPage, shouldBeOnOrderPage, shouldBeOnOrderCompletePage } = require("./contexts/pages")
const { haveItem } = require("./contexts/prerequisites")

module.exports = function() {
  return actor({

    // Define custom steps here, use 'this' to access default methods of I.
    // It is recommended to place a general 'login' function here.

    amAnonimousUser,
    amStoreStaff,
    shouldBeOnItemListPage,
    shouldBeOnItemDetailPage,
    shouldBeOnOrderPage,
    shouldBeOnOrderCompletePage,
    haveItem,

  });
}
