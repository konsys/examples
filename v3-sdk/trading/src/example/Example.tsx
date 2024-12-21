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
import { createTrade, executeTrade } from '../libs/trading'
import { getRandomTokens, getUserBalance } from '../libs/utils'
import { AddressT, TokensStateT, TradeStateT, UserBalanceT } from '../types'

const Example = () => {
  const [tradeList, setTradeList] = useState<Record<AddressT, TradeStateT>>()
  const [tokenBalance, setTokenBalance] = useState<UserBalanceT>()
  const BobTrade = tradeList ? tradeList[BobAddress] : null

  useOnBlockUpdated(async () => {
    refreshBalances()
  }, BobWallet)

  // Update wallet state given a block number
  const refreshBalances = useCallback(async () => {
    const tokens = [ARBITRUM_TOKEN, UNISWAP_TOKEN]
    const BOB = await getUserBalance(tokens, BobWallet)

    setTokenBalance({
      BOB,
    })
  }, [])

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

  const bobARBITRUMBalance = tokenBalance ? tokenBalance['BOB'].ARBITRUM : 0
  const bobUNISWAPBalance = tokenBalance ? tokenBalance['BOB'].UNISWAP : 0
  const bobUSDTBalance = tokenBalance ? tokenBalance['BOB'].USDT : 0

  const dataSource = [
    {
      id: 1,
      bobARBITRUMBalance,
      bobUNISWAPBalance,
      bobUSDTBalance,
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
            dataIndex: 'bobARBITRUMBalance',
            title: 'ARBITRUM balance',
            width: 200,
          },
          {
            dataIndex: 'bobUNISWAPBalance',
            title: 'UNISWAP balance',
            width: 200,
          },
          { dataIndex: 'bobUSDTBalance', title: 'USDT balance', width: 200 },
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
