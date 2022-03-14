import * as dotenv from 'dotenv';
dotenv.config();

import { HardhatUserConfig, subtask, task, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HypeHaus } from './typechain-types/HypeHaus';

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

const {
  ALCHEMY_API_KEY = '',
  PRIVATE_KEY = '',
  CONTRACT_ADDRESS = '',
  LOCAL_CONTRACT_ADDRESS = '',
} = process.env;

const connectToContract = async (
  hre: HardhatRuntimeEnvironment,
  contract?: string,
) => {
  const networkName = hre.network.name;
  console.log('On network:', networkName);

  const contractAddress =
    contract ||
    (networkName === 'localhost' ? LOCAL_CONTRACT_ADDRESS : CONTRACT_ADDRESS);
  console.log('Contract address:', contractAddress);

  const HypeHaus = await hre.ethers.getContractFactory('HypeHaus');
  const hypeHaus = HypeHaus.attach(contractAddress) as HypeHaus;

  return hypeHaus;
};

const logTotalMinted = async (contract: HypeHaus) => {
  const totalMinted = await contract.totalMinted();
  console.log('Total minted so far:', totalMinted.toString());
};

task('accounts', 'Prints the list of accounts', async (_, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

task(
  'hypehaus:total-minted',
  'Reports the total amount of HYPEhaus tokens minted',
)
  .addOptionalParam(
    'contract',
    'The address of the contract to connect to',
    undefined,
    types.string,
  )
  .setAction(async ({ contract }: { contract?: string }, hre) => {
    const hypeHaus = await connectToContract(hre, contract);
    await logTotalMinted(hypeHaus);
  });

task('hypehaus:mint', 'Mints a HYPEhaus token for the given address')
  .addPositionalParam(
    'receiver',
    'The address of the receiver who will get the token',
    undefined,
    types.string,
  )
  .addOptionalParam(
    'contract',
    'The address of the contract to connect to',
    undefined,
    types.string,
  )
  .setAction(async (params: { receiver: string; contract?: string }, hre) => {
    const hypeHaus = await connectToContract(hre, params.contract);
    // First log the current minted amount
    await logTotalMinted(hypeHaus);
    // Next, mint the next available token to the receiver
    await hypeHaus.mintHypeHaus(params.receiver);
    // Finally, log the total minted (note: this may report the previous total
    // minted value if the contract was not updated in time)
    await logTotalMinted(hypeHaus);
  });

const config: HardhatUserConfig = {
  solidity: '0.8.4',
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY,
  // },
};

export default config;
