import { ethers, Provider } from 'ethers'
import { CurrentConfig } from '../config'

// Provider Functions

export function getProvider(): Provider {
  return new ethers.JsonRpcProvider(CurrentConfig.rpc.local)
}
