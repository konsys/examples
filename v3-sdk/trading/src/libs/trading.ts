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

import {
  AddressT,
  TokensStateT,
  TokenTrade,
  TradeStateT,
  TransactionState,
} from '../types'
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

export async function createTrade(
  tokensState: TokensStateT,
  wallet: Wallet
): Promise<TokenTrade> {
  const { amountOut, swapRoute } = await getOutputQuote(tokensState, wallet)

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      tokensState.tokenIn,
      fromReadableAmount(
        tokensState.amountTokensIn,
        tokensState.tokenIn.decimals
      ).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      tokensState.tokenOut,
      JSBI.BigInt(amountOut)
    ),
    tradeType: TradeType.EXACT_INPUT,
  })
  return uncheckedTrade
}

export async function executeTrade(
  trade: TradeStateT
): Promise<TransactionState | undefined> {
  if (!trade.wallet || !trade.trade) {
    console.error('No data in executeTrade')
    throw new Error('no wallet')
  }

  const provider = getProvider(trade.wallet)

  if (!provider) {
    console.error('No provider in executeTrade')
    throw new Error('Cannot execute a trade without a provider')
  }

  // Give approval to the router to spend the token
  const tokenApproval = await getTokenTransferApproval(
    trade,
    trade.tokensState.tokenIn.address
  )

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: trade.wallet.address,
  }

  const methodParameters = SwapRouter.swapCallParameters([trade.trade], options)

  const tx: ethers.providers.TransactionRequest = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: trade.wallet.address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  try {
    const res = await sendTransaction(tx, trade.wallet)

    return res
  } catch (e) {
    // console.error('Transaction error', e)
    // throw new Error('Transaction error')
    // NOP
  }
}

// Helper Quoting and Pool Functions

export async function getOutputQuote(
  tokensState: TokensStateT,
  wallet: Wallet
): Promise<{
  amountOut: Result
  swapRoute: Route<Token, Token>
}> {
  if (!wallet) {
    console.error('No wallet in getOutputQuote')
    throw new Error('no wallet')
  }

  const poolInfo = await getPoolInfo(tokensState, wallet)

  const pool = new Pool(
    tokensState.tokenIn,
    tokensState.tokenOut,
    feeAmount,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  const swapRoute = new Route([pool], tokensState.tokenIn, tokensState.tokenOut)

  const provider = getProvider(wallet)

  if (!provider) {
    console.error('No provider in getOutputQuote')
    throw new Error('Provider required to get pool state')
  }

  const { calldata } = SwapQuoter.quoteCallParameters(
    swapRoute,
    CurrencyAmount.fromRawAmount(
      tokensState.tokenIn,
      fromReadableAmount(
        tokensState.amountTokensIn,
        tokensState.tokenIn.decimals
      ).toString()
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
  { tokensState, wallet }: TradeStateT,
  tokenAddress: AddressT
): Promise<TransactionState> {
  if (!wallet) {
    console.error('No wallet in getTokenTransferApproval')
    throw new Error('No wallet')
  }
  const provider = getProvider(wallet)
  if (!provider) {
    console.error('No Provider or address in getTokenTransferApproval')
    return TransactionState.Failed
  }

  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    const transaction = await tokenContract.populateTransaction.approve(
      SWAP_ROUTER_ADDRESS,
      fromReadableAmount(
        tokensState.amountTokensIn,
        tokensState.tokenIn.decimals
      ).toString()
    )

    return sendTransaction(
      {
        ...transaction,
        from: wallet.address,
      },
      wallet
    )
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}
