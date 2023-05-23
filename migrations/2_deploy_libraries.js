const {singletons } = require('@openzeppelin/test-helpers');
require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });

const TokenImplementation = artifacts.require('TokenImplementation');
const NFTCatalogImplementation = artifacts.require('NFTCatalogImplementation');
const NFTOwnershipImplementation = artifacts.require('NFTOwnershipImplementation');
const NFT_TransactionPool_Implementation = artifacts.require('NFT_TransactionPool_Implementation');
const ProjectCatalogImplementation = artifacts.require('ProjectCatalogImplementation');
const DebtManagerImplementation = artifacts.require('DebtManagerImplementation');
const RevenuesManagerImplementation = artifacts.require('RevenuesManagerImplementation');
const StakesManagerImplementation = artifacts.require('StakesManagerImplementation');
const GovernanceTokenImplementation = artifacts.require('GovernanceTokenImplementation');

const ExternalFuncs = artifacts.require('ExternalFuncs');
const IterableSet = artifacts.require('IterableSet');
const NFT_Helpers = artifacts.require('NFT_Helpers');

module.exports = async (deployer, network, accounts) => {

  await deployer.deploy(ExternalFuncs);
  await ExternalFuncs.deployed();
  deployer.link(ExternalFuncs, NFT_Helpers);
  deployer.link(ExternalFuncs, TokenImplementation);
  deployer.link(ExternalFuncs, NFTCatalogImplementation);
  deployer.link(ExternalFuncs, NFTOwnershipImplementation);
  deployer.link(ExternalFuncs, NFT_TransactionPool_Implementation);
  deployer.link(ExternalFuncs, ProjectCatalogImplementation);
  deployer.link(ExternalFuncs, DebtManagerImplementation);
  deployer.link(ExternalFuncs, RevenuesManagerImplementation);
  deployer.link(ExternalFuncs, StakesManagerImplementation);

  await deployer.deploy(IterableSet);
  await IterableSet.deployed();
  deployer.link(IterableSet, NFT_Helpers);
  deployer.link(IterableSet, TokenImplementation);
  deployer.link(IterableSet, NFTCatalogImplementation);
  deployer.link(IterableSet, NFTOwnershipImplementation);
  deployer.link(IterableSet, NFT_TransactionPool_Implementation);
  deployer.link(IterableSet, ProjectCatalogImplementation);
  deployer.link(IterableSet, DebtManagerImplementation);
  deployer.link(IterableSet, RevenuesManagerImplementation);
  deployer.link(IterableSet, StakesManagerImplementation);
  deployer.link(IterableSet, GovernanceTokenImplementation);

  await deployer.deploy(NFT_Helpers);
  await NFT_Helpers.deployed();
  deployer.link(NFT_Helpers, NFTCatalogImplementation);
  deployer.link(NFT_Helpers, NFT_TransactionPool_Implementation);

}
