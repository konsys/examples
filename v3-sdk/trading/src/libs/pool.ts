import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { computePoolAddress } from '@uniswap/v3-sdk'
import { ethers, Wallet } from 'ethers'

import { TokensStateT } from '../types'
import { feeAmount, POOL_FACTORY_CONTRACT_ADDRESS } from './constants'
import { getProvider } from './providers'

interface PoolInfo {
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  sqrtPriceX96: ethers.BigNumber
  liquidity: ethers.BigNumber
  tick: number
}

export async function getPoolInfo(
  tokensState: TokensStateT,
  wallet: Wallet
): Promise<PoolInfo> {
  if (!wallet) {
    console.error('No wallet in getPoolInfo')
    throw new Error('Cannot execute a trade without a provider')
  }

  const provider = getProvider(wallet)

  if (!provider) {
    console.error('No provider in getPoolInfo')
    throw new Error('No provider')
  }

  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: tokensState.tokenIn,
    tokenB: tokensState.tokenOut,
    fee: feeAmount,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  )

  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ])

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  }
}
