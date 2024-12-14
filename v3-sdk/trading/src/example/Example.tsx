import './style.css'

import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import { Wallet } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'

import { CurrentConfig, Environment } from '../config'
import { useOnBlockUpdated } from '../hooks/useOnBlockUpdated'
import {
  AliceAddress,
  AliceWallet,
  amountUSDCToSell,
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
  const [aliceUsdc, setAliceUsdc] = useState<number>(0)
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const BobTrade = tradeList ? tradeList[BobAddress] : null

  const AliceTrade = tradeList ? tradeList[AliceAddress] : null

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

  const getQuote = useCallback(
    async (tokens: TokensStateT, wallet: Wallet) => {
      if (BobTrade?.trade) {
        return await getOutputQuote(tokens, wallet)
      }
      return { amountOut: 0 }
    },
    [BobTrade?.trade]
  )

  const { data } = useQuery({
    queryKey: [blockNumber],
    queryFn: () =>
      getQuote(
        { amountTokensIn: 1, tokenIn: WETH_TOKEN, tokenOut: USDC_TOKEN },
        BobWallet
      ),
  })

  const ethPrice = data?.amountOut
    ? +data?.amountOut.toString() / 1000000
    : 3000

  const makeTrade = useCallback(async (trade: TradeStateT) => {
    await executeTrade(trade)
  }, [])

  const prepareTrade = useCallback(
    async (wallet: Wallet, tokensState: TokensStateT) => {
      await refreshBalances()

      const trade = await createTrade(tokensState, wallet)

      setTradeList({
        ...tradeList,
        [wallet.address]: {
          trade,
          wallet,
          tokensState,
        },
      })

      return true
    },
    [refreshBalances, tradeList]
  )

  useEffect(() => {
    if (AliceTrade) {
      makeTrade(AliceTrade).then()
    }
  }, [AliceTrade, makeTrade])

  useEffect(() => {
    if (BobTrade) {
      makeTrade(BobTrade).then()
    }
  }, [BobTrade, makeTrade])

  useQuery({
    queryKey: ['prepareBobTrade'],
    queryFn: () => prepareTrade(BobWallet, getRandomTokens(ethPrice || 1000)),
    refetchInterval: TRADE_INTERVAL,
  })

  const aliceWethBalance = tokenBalance ? tokenBalance['ALICE'].WETH : 0

  const { data: aliceData } = useQuery({
    queryKey: [blockNumber],
    queryFn: () =>
      getQuote(
        {
          amountTokensIn: aliceWethBalance,
          tokenIn: USDC_TOKEN,
          tokenOut: WETH_TOKEN,
        },
        AliceWallet
      ),
  })

  const usdcPrice = aliceData ? +aliceData.amountOut.toString() / 10e17 : 0

  const alicePrepare = useCallback(async () => {
    const { amountOut } = await getQuote(
      {
        amountTokensIn: amountUSDCToSell,
        tokenIn: USDC_TOKEN,
        tokenOut: WETH_TOKEN,
      },
      AliceWallet
    )
    const usdcPrice = +amountOut.toString() / 10e17

    const percentGr = ((aliceWethBalance - usdcPrice) / aliceWethBalance) * 100

    if (aliceWethBalance === 0) {
      setAliceUsdc(tokenBalance ? tokenBalance['ALICE'].USDC : 0)
    }

    if (!aliceWethBalance) {
      await prepareTrade(AliceWallet, {
        amountTokensIn: amountUSDCToSell,
        tokenOut: WETH_TOKEN,
        tokenIn: USDC_TOKEN,
      })
    } else if (aliceWethBalance > 0 && percentGr > 1) {
      await prepareTrade(AliceWallet, {
        amountTokensIn: aliceWethBalance,
        tokenOut: USDC_TOKEN,
        tokenIn: WETH_TOKEN,
      })
    }
    return true
  }, [prepareTrade, getQuote, aliceWethBalance, tokenBalance])

  useQuery({
    queryKey: ['alicePrepare'],
    queryFn: () => alicePrepare(),
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

      <h3>{BobTrade?.trade && ` ${displayTrade(BobTrade.trade)}`}</h3>

      <div>{`Block Number: ${blockNumber + 1}`}</div>
      {showBalance()}

      <br />
      <div>{`Alice has WETH: ${aliceWethBalance}`}</div>
      <br />
      <div>{`Alice won Usdc: ${aliceUsdc}`}</div>
      <br />
      <div>{`WETH price: ${usdcPrice}`}</div>

      <br />
      <div>{`1 ETH =  ${ethPrice}`}</div>
      <br />
      <Button
        onClick={() =>
          prepareTrade(BobWallet, getRandomTokens(ethPrice || 3000))
        }>
        Trade BOB
      </Button>
      <br />
      <Button onClick={alicePrepare}>Trade ALICE</Button>
    </div>
  )
}

export default Example
