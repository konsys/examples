import { BaseProvider } from '@ethersproject/providers'
import { BigNumber, ethers, providers, Wallet } from 'ethers'

import { CurrentConfig, Environment } from '../config'
import { TransactionState } from '../types'

// Single copies of provider and wallet
const mainnetProvider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.mainnet
)

let walletExtensionAddress: string | null = null

export function getMainnetProvider(): BaseProvider {
  return mainnetProvider
}

export function getProvider(wallet: Wallet): providers.Provider | null {
  return wallet.provider
}

export async function sendTransaction(
  transaction: ethers.providers.TransactionRequest,
  wallet: Wallet
): Promise<TransactionState> {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value)
  }

  const res = await sendTransactionViaWallet(transaction, wallet)

  return res
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
      console.log('receipt ', receipt)
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
