import { Token } from '@uniswap/sdk-core'
import { Wallet } from 'ethers'

export type TokensStateT = {
  tokenIn: Token
  tokenOut: Token
  amountTokensIn: number
  wallet: Wallet
}

export type TokensAvailableT = Record<TokenName, Token>

export type TokenName = 'WETH' | 'USDC' | 'USDT'

export type AddressT = 'string'
export type PrivateKeyT = 'string'

export type TokenBalanceT = Record<string, number>
export type UserBalanceT = Record<string, TokenBalanceT>

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent',
}
