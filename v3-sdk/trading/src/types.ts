import { Token } from '@uniswap/sdk-core'
import { Wallet } from 'ethers'

import { TokenTrade } from './libs/trading'

export type TokensStateT = {
  tokenIn: Token
  tokenOut: Token
  amountTokensIn: number
}

export type TokensAvailableT = Record<TokenName, Token>

export type TokenName = 'WETH' | 'USDC' | 'USDT'

export type AddressT = string
export type PrivateKeyT = string

export type TokenBalanceT = Record<AddressT, number>
export type UserBalanceT = Record<AddressT, TokenBalanceT>

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent',
}

export type TradeStateT = {
  trade: TokenTrade
  wallet: Wallet
  tokensState: TokensStateT
}
