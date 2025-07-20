const StockLedger = artifacts.require("StockLedger");

module.exports = function (deployer) {
  deployer.deploy(StockLedger);
};
