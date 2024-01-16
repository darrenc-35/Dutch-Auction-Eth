const TokerFactory = artifacts.require("TokerFactory");

module.exports = async function (deployer) {
  await deployer.deploy(TokerFactory);
};
