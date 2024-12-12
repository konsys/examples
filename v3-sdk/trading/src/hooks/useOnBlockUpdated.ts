import { Wallet } from 'ethers'
import { useEffect } from 'react'

import { getProvider } from '../libs/providers'

export const useOnBlockUpdated = (
  callback: (blockNumber: number) => void,
  wallet: Wallet
) => {
  useEffect(() => {
    const subscription = getProvider(wallet)?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
    }
  })
}
