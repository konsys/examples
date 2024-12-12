import { BaseProvider } from '@ethersproject/providers'
import { BigNumber, ethers, providers, Wallet } from 'ethers'

import { CurrentConfig, Environment } from '../config'
import { TransactionState } from '../types'
import { MAIN_SWAP_PRIVATE_KEY } from './constants'

// Single copies of provider and wallet
const mainnetProvider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.mainnet
)

const browserExtensionProvider = createBrowserExtensionProvider()
let walletExtensionAddress: string | null = null

export function getMainnetProvider(): BaseProvider {
  return mainnetProvider
}

export function getProvider(wallet: Wallet): providers.Provider | null {
  return CurrentConfig.env === Environment.WALLET_EXTENSION
    ? browserExtensionProvider
    : wallet.provider
}

export async function sendTransaction(
  transaction: ethers.providers.TransactionRequest,
  wallet: Wallet
): Promise<TransactionState> {
  if (CurrentConfig.env === Environment.WALLET_EXTENSION) {
    return sendTransactionViaExtension(transaction)
  } else {
    if (transaction.value) {
      transaction.value = BigNumber.from(transaction.value)
    }
    return sendTransactionViaWallet(transaction, wallet)
  }
}

export async function connectBrowserExtensionWallet() {
  if (!window.ethereum) {
    return null
  }

  const { ethereum } = window
  const provider = new ethers.providers.Web3Provider(ethereum)
  const accounts = await provider.send('eth_requestAccounts', [])

  if (accounts.length !== 1) {
    return
  }

  walletExtensionAddress = accounts[0]
  return walletExtensionAddress
}

// Internal Functionality

export function createWallet(privateKey: string): ethers.Wallet {
  let provider = mainnetProvider
  if (CurrentConfig.env == Environment.LOCAL) {
    provider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.local)
  }
  return new ethers.Wallet(privateKey, provider)
}

function createBrowserExtensionProvider(): ethers.providers.Web3Provider | null {
  try {
    return new ethers.providers.Web3Provider(window?.ethereum, 'any')
  } catch (e) {
    console.log('No Wallet Extension Found')
    return null
  }
}

async function sendTransactionViaExtension(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
  try {
    const receipt = await browserExtensionProvider?.send(
      'eth_sendTransaction',
      [transaction]
    )
    if (receipt) {
      return TransactionState.Sent
    } else {
      return TransactionState.Failed
    }
  } catch (e) {
    console.log(e)
    return TransactionState.Rejected
  }
}

async function sendTransactionViaWallet(
  transaction: ethers.providers.TransactionRequest,
  wallet: Wallet
): Promise<TransactionState> {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value)
  }
  const txRes = await wallet.sendTransaction(transaction)

  let receipt = null
  const provider = getProvider(wallet)
  if (!provider) {
    return TransactionState.Failed
  }

  while (receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash)

      if (receipt === null) {
        continue
      }
    } catch (e) {
      console.log(`Receipt error:`, e)
      break
    }
  }

  // Transaction was successful if status === 1
  if (receipt) {
    return TransactionState.Sent
  } else {
    return TransactionState.Failed
  }
}
