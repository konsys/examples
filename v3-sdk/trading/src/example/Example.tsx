import './style.css'

import { useQuery } from '@tanstack/react-query'
import { Button, Table } from 'antd'
import { Wallet } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'

import { useOnBlockUpdated } from '../hooks/useOnBlockUpdated'
import {
  AliceAddress,
  AliceWallet,
  AMOUNR_USDC_TO_SELL,
  BobAddress,
  BobWallet,
  PERCENT_TO_WON,
  TRADE_INTERVAL,
  USDC_TOKEN,
  WETH_TOKEN,
} from '../libs/constants'
import { createTrade, executeTrade, getOutputQuote } from '../libs/trading'
import { getRandomTokens, getUserBalance } from '../libs/utils'
import { AddressT, TokensStateT, TradeStateT, UserBalanceT } from '../types'

const Example = () => {
  const [tradeList, setTradeList] = useState<Record<AddressT, TradeStateT>>()
  const [tokenBalance, setTokenBalance] = useState<UserBalanceT>()
  const [aliceUsdc, setAliceUsdc] = useState<number>(0)
  const [percentWon, setPercentWon] = useState<number>(0)
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

  const getQuote = useCallback(async (tokens: TokensStateT, wallet: Wallet) => {
    return await getOutputQuote(tokens, wallet)
  }, [])

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
  const aliceUSDCBalance = tokenBalance ? tokenBalance['ALICE'].USDC : 0
  const bobUSDCBalance = tokenBalance ? tokenBalance['BOB'].USDC : 0
  const bobWethBalance = tokenBalance ? tokenBalance['BOB'].WETH : 0

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
        amountTokensIn: AMOUNR_USDC_TO_SELL,
        tokenIn: USDC_TOKEN,
        tokenOut: WETH_TOKEN,
      },
      AliceWallet
    )
    const usdcPrice = +amountOut.toString() / 10e17

    const percentGr = ((aliceWethBalance - usdcPrice) / aliceWethBalance) * 100
    setPercentWon(percentGr)
    if (aliceWethBalance === 0) {
      setAliceUsdc(tokenBalance ? tokenBalance['ALICE'].USDC : 0)
    }

    if (!aliceWethBalance) {
      await prepareTrade(AliceWallet, {
        amountTokensIn: AMOUNR_USDC_TO_SELL,
        tokenOut: WETH_TOKEN,
        tokenIn: USDC_TOKEN,
      })
    } else if (percentGr > PERCENT_TO_WON) {
      await prepareTrade(AliceWallet, {
        amountTokensIn: aliceWethBalance,
        tokenOut: USDC_TOKEN,
        tokenIn: WETH_TOKEN,
      })
    }
    return true
  }, [prepareTrade, getQuote, aliceWethBalance, tokenBalance])

  // useQuery({
  //   queryKey: ['alicePrepare'],
  //   queryFn: () => alicePrepare(),
  //   refetchInterval: TRADE_INTERVAL,
  // })

  const dataSource = [
    {
      id: 1,
      aliceWethBalance,
      aliceUSDCBalance,
      bobWethBalance,
      bobUSDCBalance,
      aliceUsdc,
      usdcPrice,
      percentWon,
      ethPrice,
    },
  ]

  return (
    <div className="App">
      <Table
        size="middle"
        rowKey={'id'}
        style={{ width: '500 px' }}
        columns={[
          {
            dataIndex: 'aliceWethBalance',
            title: 'Alice balance ETH',
            width: 200,
          },
          {
            dataIndex: 'aliceUSDCBalance',
            title: 'Alice balance USDC',
            width: 200,
          },
          { dataIndex: 'aliceUsdc', title: 'Alice USDC won', width: 200 },
          { dataIndex: 'usdcPrice', title: 'USDC price', width: 200 },
          { dataIndex: 'percentWon', title: 'Percent won', width: 200 },
          { dataIndex: 'ethPrice', title: 'ETH price', width: 200 },
          { dataIndex: 'bobWethBalance', title: 'Bob ETH', width: 200 },
          { dataIndex: 'bobUSDCBalance', title: 'Bob USDC', width: 200 },
        ]}
        dataSource={dataSource}
      />

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
