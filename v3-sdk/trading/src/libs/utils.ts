import { Token, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { BigNumber, ethers } from 'ethers'

import { getProvider, getWalletAddress } from './providers'
import { getCurrencyBalance } from './wallet'

const MAX_DECIMALS = 18

export function fromReadableAmount(
  amount: number,
  decimals: number
): BigNumber {
  return ethers.utils.parseUnits(amount.toString(), decimals)
}

export function toReadableAmount(rawAmount: number, decimals: number): string {
  return ethers.utils.formatUnits(rawAmount, decimals).slice(0, MAX_DECIMALS)
}

export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`
}

export function randomInteger(min: number, max: number) {
  // случайное число от min до (max+1)
  const rand = min + Math.random() * (max + 1 - min)
  return Math.floor(rand)
  // console.log(Math.floor(rand))
  // return 2000
}

export const getUserBalance = async (_tokenIn: Token, _tokenOut: Token) => {
  const provider = getProvider()

  const address = getWalletAddress()

  if (!address || !provider) {
    return { inBalance: '0', outBalance: '0' }
  }

  const inBalance = await getCurrencyBalance(provider, address, _tokenIn)
  const outBalance = await getCurrencyBalance(provider, address, _tokenOut)
  return { inBalance, outBalance }
}

export function sleep(ms: number) {
  // add ms millisecond timeout before promise resolution
  return new Promise((resolve) => setTimeout(resolve, ms))
}
