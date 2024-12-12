import { Token, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { BigNumber, ethers, Wallet } from 'ethers'

import { AddressT, TokenBalanceT, TokensStateT } from '../types'
import { USDC_TOKEN, WETH_TOKEN } from './constants'
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
  address: AddressT,
  tokens: Token[],
  wallet: Wallet
): Promise<TokenBalanceT> => {
  const provider = getProvider(wallet)

  if (!provider) {
    throw new Error('No provider')
  }
  const fns = await Promise.all(
    tokens.map((token) => getCurrencyBalance(provider, address, token))
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

export const getRandomTokens = (
  ethValue: number,
  wallet: Wallet
): TokensStateT => {
  const r = randomInteger(0, 100)
  let r1 = randomInteger(1, 1000)
  const tokenIn = r > 50 ? USDC_TOKEN : WETH_TOKEN
  const tokenOut = tokenIn === WETH_TOKEN ? USDC_TOKEN : WETH_TOKEN
  if (tokenIn === WETH_TOKEN) {
    r1 = r1 / ethValue
  }

  return { tokenIn, tokenOut, amountTokensIn: r1, wallet }
}
