import './Example.css'

import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'

import { CurrentConfig, Environment } from '../config'
import { USDC_TOKEN, WETH_TOKEN } from '../libs/constants'
import {
  connectBrowserExtensionWallet,
  getProvider,
  getWalletAddress,
} from '../libs/providers'
import {
  createTrade,
  executeTrade,
  getOutputQuote,
  TokenTrade,
} from '../libs/trading'
import {
  displayTrade,
  getUserBalance,
  randomInteger,
  sleep,
} from '../libs/utils'
import { wrapETH } from '../libs/wallet'
import { TokensStateT } from './types'

const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  useEffect(() => {
    const subscription = getProvider()?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
    }
  })
}

const getTokens = (): TokensStateT => {
  const r = randomInteger(0, 100)
  let r1 = randomInteger(1, 10)
  const tokenIn = r > 50 ? USDC_TOKEN : WETH_TOKEN
  const tokenOut = tokenIn === WETH_TOKEN ? USDC_TOKEN : WETH_TOKEN
  if (tokenIn === WETH_TOKEN) {
    r1 = r1 / 3900
  }

  return { tokenIn, tokenOut, amountTokensIn: r1 }
}

const Example = () => {
  const [tokensState, setTokensState] = useState<TokensStateT>()
  const [trade, setTrade] = useState<TokenTrade>()

  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState<string>()
  const [blockNumber, setBlockNumber] = useState<number>(0)

  useOnBlockUpdated(async (blockNumber: number) => {
    if (tokensState) {
      refreshBalances(tokensState)
    }

    setBlockNumber(blockNumber)
  })

  // Update wallet state given a block number
  const refreshBalances = useCallback(
    async ({ tokenIn, tokenOut }: TokensStateT) => {
      const { inBalance, outBalance } = await getUserBalance(tokenIn, tokenOut)
      setTokenInBalance(inBalance)
      setTokenOutBalance(outBalance)
    },
    []
  )

  const onConnectWallet = useCallback(async () => {
    if ((await connectBrowserExtensionWallet()) && tokensState) {
      refreshBalances(tokensState)
    }
  }, [refreshBalances, tokensState])

  const onTrade = useCallback(async () => {
    const tState = getTokens()
    setTokensState(tState)
    await refreshBalances(tState)
    const trade = await createTrade(tState)
    setTrade(trade)
    await sleep(500)

    if (trade) {
      return await executeTrade(trade, tState)
    }
    return false
  }, [refreshBalances])

  useQuery({
    queryKey: ['onTrade'],
    queryFn: onTrade,
    refetchInterval: 2000,
  })

  const showBalance = useCallback(() => {
    if (trade?.inputAmount.currency === USDC_TOKEN) {
      return (
        <>
          <div>{`${trade?.inputAmount.currency.symbol} Balance: ${tokenInBalance}`}</div>
          <div>{`${trade?.outputAmount.currency.symbol} Balance: ${tokenOutBalance}`}</div>
        </>
      )
    }
    return (
      <>
        <div>{`${trade?.outputAmount.currency.symbol} Balance: ${tokenOutBalance}`}</div>
        <div>{`${trade?.inputAmount.currency.symbol} Balance: ${tokenInBalance}`}</div>
      </>
    )
  }, [
    tokenInBalance,
    tokenOutBalance,
    trade?.inputAmount.currency,
    trade?.outputAmount.currency.symbol,
  ])

  const q = useCallback(
    async () =>
      await getOutputQuote({
        amountTokensIn: 1,
        tokenIn: USDC_TOKEN,
        tokenOut: WETH_TOKEN,
      }),
    []
  )

  const { data } = useQuery({
    queryKey: ['onTrade1'],
    queryFn: q,
    refetchInterval: 2000,
  })
  console.log(32323, data?.amountOut?.toString())

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        getProvider() === null && (
          <h2 className="error">
            Please install a wallet to use this example configuration
          </h2>
        )}

      <h3>{trade && ` ${displayTrade(trade)}`}</h3>
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        !getWalletAddress() && (
          <button onClick={onConnectWallet}>Connect Wallet</button>
        )}
      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      {showBalance()}
      <Button
        onClick={() => wrapETH(1)}
        disabled={getProvider() === null || CurrentConfig.rpc.mainnet === ''}>
        <p>Wrap ETH</p>
      </Button>
      <br />
      <Button
        onClick={() => onTrade()}
        disabled={getProvider() === null || CurrentConfig.rpc.mainnet === ''}>
        Trade
      </Button>
    </div>
  )
}

export default Example
