import { Token, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { BigNumber, ethers, Wallet } from 'ethers'

import { TokenBalanceT, TokensStateT } from '../types'
import { ARBITRUM_TOKEN, USDT_TOKEN } from './constants'
import { getProvider } from './providers'
import { getCurrencyBalance } from './wallet'

export function fromReadableAmount(
  amount: number,
  decimals: number
): BigNumber {
  return ethers.utils.parseUnits(amount.toString(), decimals)
}

export function toReadableAmount(
  rawAmount: number,
  decimals: number,
  maxDecimals = 18
): string {
  return ethers.utils.formatUnits(rawAmount, decimals).slice(0, maxDecimals)
}

export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`
}

export function randomInteger(min: number, max: number) {
  const rand = min + Math.random() * (max + 1 - min)
  return Math.floor(rand)
}

export const getUserBalance = async (
  tokens: Token[],
  wallet: Wallet
): Promise<TokenBalanceT> => {
  const provider = getProvider(wallet)

  if (!provider) {
    console.error('No provider in getUserBalance')
    throw new Error('No provider')
  }
  const fns = await Promise.all(
    tokens.map((token) => getCurrencyBalance(provider, wallet.address, token))
  )
  const r: TokenBalanceT = {}
  fns.forEach((v, i) => {
    const key = tokens[i].symbol || tokens[i].address
    r[key] = +v
  })

  return r
}

export function sleep(ms: number) {
  // add ms millisecond timeout before promise resolution
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getRandomTokens = (isStable = false): TokensStateT => {
  const r = randomInteger(100, 1000)
  const tokenIn = ARBITRUM_TOKEN
  const _tokenOut = tokenIn === ARBITRUM_TOKEN ? USDT_TOKEN : ARBITRUM_TOKEN

  if (isStable) {
    return {
      tokenIn: ARBITRUM_TOKEN,
      tokenOut: USDT_TOKEN,
      amountTokensIn: 1,
    }
  }
  return {
    tokenIn,
    tokenOut: _tokenOut,
    amountTokensIn: r,
  }
}
