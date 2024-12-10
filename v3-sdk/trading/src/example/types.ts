import { Token } from '@uniswap/sdk-core'

export type TokensStateT = {
  tokenIn: Token
  tokenOut: Token
  amountTokensIn: number
}
