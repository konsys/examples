import './style.css'

import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import { Wallet } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'

import { CurrentConfig, Environment } from '../config'
import { useOnBlockUpdated } from '../hooks/useOnBlockUpdated'
import {
  AliceWallet,
  BobAddress,
  BobWallet,
  TRADE_INTERVAL,
  USDC_TOKEN,
  WETH_TOKEN,
} from '../libs/constants'
import { getProvider } from '../libs/providers'
import { createTrade, executeTrade, getOutputQuote } from '../libs/trading'
import { displayTrade, getRandomTokens, getUserBalance } from '../libs/utils'
import { AddressT, TokensStateT, TradeStateT, UserBalanceT } from '../types'

const Example = () => {
  const [tradeList, setTradeList] = useState<Record<AddressT, TradeStateT>>()
  const [tokenBalance, setTokenBalance] = useState<UserBalanceT>()
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const BobTrade = tradeList ? tradeList[BobAddress] : null

  // const AliceTrade = trade ? trade[AliceAddress] : null

  useOnBlockUpdated(async (blockNumber: number) => {
    refreshBalances()
    setBlockNumber(blockNumber)
  }, BobWallet)

  // Update wallet state given a block number
  const refreshBalances = useCallback(async () => {
    const tokens = [USDC_TOKEN, WETH_TOKEN]
    const ALICE = await getUserBalance(tokens, AliceWallet)
    const BOB = await getUserBalance(tokens, BobWallet)

    setTokenBalance({
      ALICE,
      BOB,
    })
  }, [])

  const showBalance = useCallback(() => {
    return tokenBalance ? (
      <>
        <div>{`Balance ALICE USDC: ${tokenBalance['ALICE'].USDC}`}</div>
        <div>{`Balance ALICE WETH: ${tokenBalance['ALICE'].WETH}`}</div>
        <br />
        <div>{`Balance BOB USDC: ${tokenBalance['BOB'].USDC}`}</div>
        <div>{`Balance BOB WETH: ${tokenBalance['BOB'].WETH}`}</div>
      </>
    ) : (
      <span />
    )
  }, [tokenBalance])

  const getQuote = useCallback(async () => {
    if (BobTrade?.trade) {
      return await getOutputQuote(
        {
          amountTokensIn: 1,
          tokenIn: USDC_TOKEN,
          tokenOut: WETH_TOKEN,
        },
        BobWallet
      )
    }
    return { amountOut: 0 }
  }, [BobTrade?.trade])

  const { data } = useQuery({
    queryKey: [blockNumber],
    queryFn: getQuote,
  })
  const ethPrice = data?.amountOut
    ? +data?.amountOut.toString() / 100000000000
    : 0

  const prepareTrade = useCallback(
    async (wallet: Wallet, tokensState: TokensStateT) => {
      await refreshBalances()

      const trade = await createTrade(tokensState, wallet)
      setTradeList({
        [wallet.address]: {
          trade,
          wallet,
          tokensState,
        },
      })
      return true
    },
    [refreshBalances]
  )

  const makeTrade = useCallback(async (trade: TradeStateT) => {
    await executeTrade(trade)
  }, [])

  useEffect(() => {
    if (BobTrade) {
      makeTrade(BobTrade)
    }
  }, [BobTrade, makeTrade])

  // useQuery({
  //   queryKey: ['prepareBobTrade', BobTrade?.wallet?.address],
  //   queryFn: () => prepareTrade(BobWallet, getRandomTokens(ethPrice)),
  //   refetchInterval: TRADE_INTERVAL,
  // })

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

      <h3>{BobTrade?.trade && ` ${displayTrade(BobTrade.trade)}`}</h3>

      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      {showBalance()}

      <br />
      <div>{`1 ETH =  ${ethPrice}`}</div>
      <Button
        onClick={() =>
          prepareTrade(BobWallet, getRandomTokens(ethPrice || undefined))
        }>
        Trade
      </Button>
    </div>
  )
}

export default Example
