import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core'
import {
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} from '@uniswap/v3-sdk'
import { ethers } from 'ethers'
import JSBI from 'jsbi'

import { CurrentConfig } from '../config'
import { TokensStateT } from '../example/types'
import {
  ERC20_ABI,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
} from './constants'
import { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } from './constants'
import { getPoolInfo } from './pool'
import {
  getProvider,
  getWalletAddress,
  sendTransaction,
  TransactionState,
} from './providers'
import { fromReadableAmount } from './utils'

export type TokenTrade = Trade<Token, Token, TradeType>

export async function createTrade({
  tokenIn,
  tokenOut,
  amountTokensIn,
}: TokensStateT): Promise<TokenTrade> {
  const { amountOut, swapRoute } = await getOutputQuote({
    tokenIn,
    tokenOut,
    amountTokensIn,
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
  tokensData: TokensStateT
): Promise<TransactionState> {
  const walletAddress = getWalletAddress()
  const provider = getProvider()

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  // Give approval to the router to spend the token
  const tokenApproval = await getTokenTransferApproval(tokensData)

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress,
  }

  const methodParameters = SwapRouter.swapCallParameters([trade], options)

  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  const res = await sendTransaction(tx)

  return res
}

// Helper Quoting and Pool Functions

export async function getOutputQuote({
  tokenIn,
  tokenOut,
  amountTokensIn,
}: TokensStateT) {
  const poolInfo = await getPoolInfo()

  const pool = new Pool(
    tokenIn,
    tokenOut,
    CurrentConfig.tokens.poolFee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  const swapRoute = new Route([pool], tokenIn, tokenOut)

  const provider = getProvider()

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
  tokensData: TokensStateT
): Promise<TransactionState> {
  const provider = getProvider()
  const address = getWalletAddress()
  if (!provider || !address) {
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

    return sendTransaction({
      ...transaction,
      from: address,
    })
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}
