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
import { createTrade, executeTrade, TokenTrade } from '../libs/trading'
import {
  displayTrade,
  getUserBalance,
  randomInteger,
  sleep,
} from '../libs/utils'
import { wrapETH } from '../libs/wallet'

const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  useEffect(() => {
    const subscription = getProvider()?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
    }
  })
}

const getTokens = () => {
  const tokenIn = randomInteger(0, 100) > 50 ? USDC_TOKEN : WETH_TOKEN
  const tokenOut = tokenIn === WETH_TOKEN ? USDC_TOKEN : WETH_TOKEN
  const amountTokensIn =
    tokenIn === USDC_TOKEN ? randomInteger(1, 10) : randomInteger(1, 10) / 1000

  return { tokenIn, tokenOut, amountTokensIn }
}

const Example = () => {
  const { tokenIn, tokenOut, amountTokensIn } = getTokens()

  const [trade, setTrade] = useState<TokenTrade>()

  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState<string>()
  const [blockNumber, setBlockNumber] = useState<number>(0)

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    refreshBalances()
    setBlockNumber(blockNumber)
  })

  // Update wallet state given a block number
  const refreshBalances = useCallback(async () => {
    const { inBalance, outBalance } = await getUserBalance(tokenIn, tokenOut)
    setTokenInBalance(inBalance)
    setTokenOutBalance(outBalance)
  }, [tokenIn, tokenOut])

  const onConnectWallet = useCallback(async () => {
    if (await connectBrowserExtensionWallet()) {
      refreshBalances()
    }
  }, [refreshBalances])

  const onTrade = useCallback(async () => {
    await refreshBalances()
    const trade = await createTrade(amountTokensIn, tokenIn, tokenOut)
    setTrade(trade)
    await sleep(500)
    if (trade) {
      await executeTrade(trade, tokenIn)
    }
  }, [tokenIn, amountTokensIn, refreshBalances, tokenOut])

  useQuery({
    queryKey: ['onTrade'],
    queryFn: async () => {
      await onTrade()
    },
    refetchInterval: 20000,
  })

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
      <h3>
        Trading amount in: {trade?.inputAmount.toExact()} {tokenIn.symbol} for{' '}
        {tokenOut.symbol}
      </h3>
      <h3>{trade && `Constructed Trade: ${displayTrade(trade)}`}</h3>
      <h3>{`Wallet Address: ${getWalletAddress()}`}</h3>
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        !getWalletAddress() && (
          <button onClick={onConnectWallet}>Connect Wallet</button>
        )}
      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      <h3>{`${tokenIn.symbol} Balance: ${tokenInBalance}`}</h3>
      <h3>{`${tokenOut.symbol} Balance: ${tokenOutBalance}`}</h3>
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
