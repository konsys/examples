// This file stores web3 related constants such as addresses, token definitions, ETH currency references and ABI's

import { SupportedChainId, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'

import { AddressT, PrivateKeyT, TokensAvailableT } from '../types'
import { createWallet } from './providers'

// Addresses

export const POOL_FACTORY_CONTRACT_ADDRESS =
  '0x1F98431c8aD98523631AE4a59f267346ea31F984'
export const QUOTER_CONTRACT_ADDRESS =
  '0x61fFE014bA17989E743c5F6cB21bF9697530B21e'
export const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
export const WETH_CONTRACT_ADDRESS =
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
export const USDC_CONTRACT_ADDRESS =
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
export const USDT_CONTRACT_ADDRESS =
  '0xdAC17F958D2ee523a2206206994597C13D831ec7'
export const ARBITRUM_ARBITRUM_CONTRACT_ADDRESS =
  '0x912CE59144191C1204E64559FE8253a0e49E6548'
export const ARBITRUM_UNISWAP_CONTRACT_ADDRESS =
  '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0'
export const ARBITRUM_USDT_CONTRACT_ADDRESS =
  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'

export const ARBITRUM_TOKEN = new Token(
  SupportedChainId.ARBITRUM_ONE,
  ARBITRUM_ARBITRUM_CONTRACT_ADDRESS,
  18,
  'ARBITRUM',
  'ARBITRUM'
)
export const UNISWAP_TOKEN = new Token(
  SupportedChainId.ARBITRUM_ONE,
  ARBITRUM_UNISWAP_CONTRACT_ADDRESS,
  18,
  'UNISWAP',
  'UNISWAP'
)

export const USDT_TOKEN = new Token(
  SupportedChainId.ARBITRUM_ONE,
  ARBITRUM_USDT_CONTRACT_ADDRESS,
  6,
  'USDT',
  'USDT'
)
// ABI's

export const ERC20_ABI = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address _spender, uint256 _value) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

export const WETH_ABI = [
  // Wrap ETH
  'function deposit() payable',

  // Unwrap ETH
  'function withdraw(uint wad) public',
]

// Transactions

export const MAX_FEE_PER_GAS = 100000000000
export const MAX_PRIORITY_FEE_PER_GAS = 100000000000

export const TokensAvailable: TokensAvailableT = {
  ARBITRUM: ARBITRUM_TOKEN,
  UNISWAP: UNISWAP_TOKEN,
  USDT: USDT_TOKEN,
}

const BobPK =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as PrivateKeyT

export const BobAddress =
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as AddressT

export const BobWallet = createWallet(BobPK)

export const TRADE_INTERVAL = 1500
export const AMOUNR_USDC_TO_SELL = 9
export const feeAmount = FeeAmount.MEDIUM

export const PERCENT_TO_WON = 1
