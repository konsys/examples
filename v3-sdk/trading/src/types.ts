import { Token, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { Wallet } from 'ethers'

export type TokensStateT = {
  tokenIn: Token
  tokenOut: Token
  amountTokensIn: number
}
export type TokenTrade = Trade<Token, Token, TradeType>

export type TokensAvailableT = Record<TokenName, Token>

export type TokenName = 'UNISWAP' | 'ARBITRUM' | 'USDT'

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
