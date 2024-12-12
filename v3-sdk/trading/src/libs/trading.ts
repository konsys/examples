import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import {
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} from '@uniswap/v3-sdk'
import { ethers, Wallet } from 'ethers'
import { Result } from 'ethers/lib/utils'
import JSBI from 'jsbi'

import { TokensStateT, TransactionState } from '../types'
import {
  ERC20_ABI,
  feeAmount,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
} from './constants'
import { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } from './constants'
import { getPoolInfo } from './pool'
import { getProvider, sendTransaction } from './providers'
import { fromReadableAmount } from './utils'

export type TokenTrade = Trade<Token, Token, TradeType>

export async function createTrade({
  tokenIn,
  tokenOut,
  amountTokensIn,
  wallet,
}: TokensStateT): Promise<TokenTrade> {
  const { amountOut, swapRoute } = await getOutputQuote({
    tokenIn,
    tokenOut,
    amountTokensIn,
    wallet,
  })

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      tokenIn,
      fromReadableAmount(amountTokensIn, tokenIn.decimals).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      tokenOut,
      JSBI.BigInt(amountOut)
    ),
    tradeType: TradeType.EXACT_INPUT,
  })
  return uncheckedTrade
}

export async function executeTrade(
  trade: TokenTrade,
  tokensData: TokensStateT,
  address: string,
  wallet: Wallet
): Promise<TransactionState> {
  const provider = getProvider(wallet)

  if (!provider) {
    throw new Error('Cannot execute a trade without a provider')
  }

  // Give approval to the router to spend the token
  const tokenApproval = await getTokenTransferApproval(
    tokensData,
    address,
    wallet
  )

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: address,
  }

  const methodParameters = SwapRouter.swapCallParameters([trade], options)

  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  const res = await sendTransaction(tx, wallet)

  return res
}

// Helper Quoting and Pool Functions

export async function getOutputQuote({
  tokenIn,
  tokenOut,
  amountTokensIn,
  wallet,
}: TokensStateT): Promise<{
  amountOut: Result
  swapRoute: Route<Token, Token>
}> {
  const poolInfo = await getPoolInfo({
    tokenIn,
    tokenOut,
    amountTokensIn,
    wallet,
  })

  const pool = new Pool(
    tokenIn,
    tokenOut,
    feeAmount,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  const swapRoute = new Route([pool], tokenIn, tokenOut)

  const provider = getProvider(wallet)

  if (!provider) {
    throw new Error('Provider required to get pool state')
  }

  const { calldata } = SwapQuoter.quoteCallParameters(
    swapRoute,
    CurrencyAmount.fromRawAmount(
      tokenIn,
      fromReadableAmount(amountTokensIn, tokenIn.decimals).toString()
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  )

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS,
    data: calldata,
  })

  return {
    amountOut: ethers.utils.defaultAbiCoder.decode(
      ['uint256'],
      quoteCallReturnData
    ),
    swapRoute,
  }
}

export async function getTokenTransferApproval(
  tokensData: TokensStateT,
  address: string,
  wallet: Wallet
): Promise<TransactionState> {
  const provider = getProvider(wallet)
  if (!provider) {
    console.log('No Provider Found')
    return TransactionState.Failed
  }

  try {
    const tokenContract = new ethers.Contract(
      tokensData.tokenIn.address,
      ERC20_ABI,
      provider
    )

    const transaction = await tokenContract.populateTransaction.approve(
      SWAP_ROUTER_ADDRESS,
      fromReadableAmount(
        tokensData.amountTokensIn,
        tokensData.tokenIn.decimals
      ).toString()
    )

    return sendTransaction(
      {
        ...transaction,
        from: address,
      },
      wallet
    )
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}
