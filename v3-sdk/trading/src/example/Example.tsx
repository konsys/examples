import './Example.css'

import { useQuery } from '@tanstack/react-query'
import { Wallet } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'

import { CurrentConfig, Environment } from '../config'
import { useOnBlockUpdated } from '../hooks/useOnBlockUpdated'
import {
  AliceAddress,
  AliceWallet,
  BobAddress,
  BobWallet,
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
  const [trade, setTrade] = useState<{
    trade: TokenTrade
    wallet: Wallet
    address: string
  }>()
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

  const getQuote = useCallback(
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
    queryFn: getQuote,
  })
  const ethPrice = data?.amountOut
    ? +data?.amountOut.toString() / 100000000000
    : 0

  const prepareTrade = useCallback(
    async (wallet: Wallet, address: string, tokensState: TokensStateT) => {
      await refreshBalances()

      setTokensState(tokensState)
      const trade = await createTrade(tokensState)
      setTrade({ trade, wallet, address })
      return true
    },
    [refreshBalances]
  )

  const makeTrade = useCallback(
    async (trade: TokenTrade, tokensData: TokensStateT, address: string) => {
      await executeTrade(trade, tokensData, address, BobWallet)
    },
    []
  )

  useEffect(() => {
    if (trade && tokensState) {
      makeTrade(trade.trade, tokensState, trade.address)
    }
  }, [trade, tokensState, makeTrade])

  useQuery({
    queryKey: ['prepareTrade'],
    queryFn: () =>
      prepareTrade(BobWallet, BobAddress, getRandomTokens(BobWallet, ethPrice)),
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

      <h3>{trade?.trade && ` ${displayTrade(trade.trade)}`}</h3>

      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      {showBalance()}

      <br />
      <div>{`1 ETH =  ${ethPrice}`}</div>
    </div>
  )
}

export default Example
