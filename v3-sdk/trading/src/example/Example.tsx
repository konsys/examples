import './Example.css'

import { useQuery } from '@tanstack/react-query'
import React, { useCallback, useEffect, useState } from 'react'

import { CurrentConfig, Environment } from '../config'
import { useOnBlockUpdated } from '../hooks/useOnBlockUpdated'
import {
  AliceAddress,
  AliceWallet,
  BobAddress,
  BobWallet,
  MAIN_SWAP_ADDRESS,
  TRADE_INTERVAL,
  USDC_TOKEN,
  WETH_TOKEN,
} from '../libs/constants'
import { getProvider } from '../libs/providers'
import {
  createTrade,
  executeTrade,
  getOutputQuote,
  TokenTrade,
} from '../libs/trading'
import { displayTrade, getRandomTokens, getUserBalance } from '../libs/utils'
import { TokensStateT, UserBalanceT } from '../types'

const Example = () => {
  const [trade, setTrade] = useState<TokenTrade>()
  const [tokensState, setTokensState] = useState<TokensStateT>()
  const [tokenBalance, setTokenBalance] = useState<UserBalanceT>()
  const [blockNumber, setBlockNumber] = useState<number>(0)

  useOnBlockUpdated(async (blockNumber: number) => {
    refreshBalances()
    setBlockNumber(blockNumber)
  }, BobWallet)

  // Update wallet state given a block number
  const refreshBalances = useCallback(async () => {
    const tokens = [USDC_TOKEN, WETH_TOKEN]
    const ALICE = await getUserBalance(AliceAddress, tokens, AliceWallet)
    const BOB = await getUserBalance(BobAddress, tokens, BobWallet)
    setTokenBalance({
      ALICE,
      BOB,
    })
  }, [])

  const showBalance = useCallback(() => {
    return (
      <>
        <div>{`Balance ALICE USDC: ${
          tokenBalance && tokenBalance['ALICE'].USDC
        }`}</div>
        <div>{`Balance ALICE WETH: ${
          tokenBalance && tokenBalance['ALICE'].WETH
        }`}</div>
        <br />
        <div>{`Balance BOB USDC: ${
          tokenBalance && tokenBalance['BOB'].USDC
        }`}</div>
        <div>{`Balance BOB WETH: ${
          tokenBalance && tokenBalance['BOB'].WETH
        }`}</div>
      </>
    )
  }, [tokenBalance])

  const q = useCallback(
    async () =>
      await getOutputQuote({
        amountTokensIn: 1,
        tokenIn: USDC_TOKEN,
        tokenOut: WETH_TOKEN,
        wallet: BobWallet,
      }),
    []
  )

  const { data } = useQuery({
    queryKey: [blockNumber],
    queryFn: q,
  })
  const amount = data?.amountOut
    ? +data?.amountOut.toString() / 100000000000
    : 0

  const onTrade = useCallback(async () => {
    await refreshBalances()
    const tState = getRandomTokens(amount, BobWallet)
    setTokensState(tState)
    const trade = await createTrade(tState)
    setTrade(trade)
    return true
  }, [refreshBalances, amount])

  const makeTrade = useCallback(
    async (trade: TokenTrade, tokensData: TokensStateT, address: string) => {
      await executeTrade(trade, tokensData, address, BobWallet)
    },
    []
  )

  useEffect(() => {
    if (trade && tokensState) {
      makeTrade(trade, tokensState, MAIN_SWAP_ADDRESS)
    }
  }, [trade, tokensState, makeTrade])

  useQuery({
    queryKey: ['onTrade'],
    queryFn: onTrade,
    refetchInterval: TRADE_INTERVAL,
  })
  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        getProvider(BobWallet) === null && (
          <h2 className="error">
            Please install a wallet to use this example configuration
          </h2>
        )}

      <h3>{trade && ` ${displayTrade(trade)}`}</h3>

      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      {showBalance()}

      <br />
      <div>{`1 ETH =  ${amount}`}</div>
    </div>
  )
}

export default Example

// index.ts:269 Uncaught (in promise) Error: from address mismatch (argument="transaction",
//    value={"data":"0x095ea7b3000000000000000000000000e592427a0aece92de3edee1f18e0157c0586156400000000000000000000000000000000000000000000000000cb1d2e25430040",
//     "to":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","from":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8"},
//     code=INVALID_ARGUMENT, version=abstract-signer/5.7.0)
//     at Logger.makeError (index.ts:269:1)
//     at Logger.throwError (index.ts:281:1)
//     at Logger.throwArgumentError (index.ts:285:1)
//     at index.ts:181:1
//     at async Promise.all (:3000/index 2)
