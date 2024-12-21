import './style.css'

import { useQuery } from '@tanstack/react-query'
import { Button, Table } from 'antd'
import { Wallet } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'

import { useOnBlockUpdated } from '../hooks/useOnBlockUpdated'
import {
  ARBITRUM_TOKEN,
  BobAddress,
  BobWallet,
  TRADE_INTERVAL,
  UNISWAP_TOKEN,
  USDT_TOKEN,
} from '../libs/constants'
import { createTrade, executeTrade, getOutputQuote } from '../libs/trading'
import { getRandomTokens, getUserBalance } from '../libs/utils'
import { AddressT, TokensStateT, TradeStateT, UserBalanceT } from '../types'

const Example = () => {
  const [tradeList, setTradeList] = useState<Record<AddressT, TradeStateT>>()
  const [tokenBalance, setTokenBalance] = useState<UserBalanceT>()
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const BobTrade = tradeList ? tradeList[BobAddress] : null

  useOnBlockUpdated(async (blockNumber: number) => {
    refreshBalances()
    setBlockNumber(blockNumber)
  }, BobWallet)

  // Update wallet state given a block number
  const refreshBalances = useCallback(async () => {
    const tokens = [ARBITRUM_TOKEN, UNISWAP_TOKEN]
    const BOB = await getUserBalance(tokens, BobWallet)

    setTokenBalance({
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
        { amountTokensIn: 1, tokenIn: ARBITRUM_TOKEN, tokenOut: USDT_TOKEN },
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
    if (BobTrade) {
      makeTrade(BobTrade).then()
    }
  }, [BobTrade, makeTrade])

  useQuery({
    queryKey: ['prepareBobTrade'],
    queryFn: () => prepareTrade(BobWallet, getRandomTokens()),
    refetchInterval: TRADE_INTERVAL,
  })

  const bobUSDCBalance = tokenBalance ? tokenBalance['BOB'].USDC : 0
  const bobWethBalance = tokenBalance ? tokenBalance['BOB'].WETH : 0

  const dataSource = [
    {
      id: 1,
      bobWethBalance,
      bobUSDCBalance,
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
          { dataIndex: 'arbitrumPrice', title: 'ARBITRUM price', width: 200 },
          { dataIndex: 'uniswapPrice', title: 'UNISWAP price', width: 200 },
          { dataIndex: 'bobWethBalance', title: 'Bob UNISWAP', width: 200 },
          { dataIndex: 'bobUSDCBalance', title: 'Bob ARBITRUM', width: 200 },
        ]}
        dataSource={dataSource}
      />

      <Button onClick={() => prepareTrade(BobWallet, getRandomTokens())}>
        Trade BOB
      </Button>
    </div>
  )
}

export default Example
