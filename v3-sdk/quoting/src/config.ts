import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { USDC_TOKEN, WETH_TOKEN } from './libs/constants'

// Inputs that configure this example to run
export interface ExampleConfig {
  rpc: {
    arb: string
    local: string
    mainnet: string
  }
  tokens: {
    in: Token
    out: Token
    poolFee: number
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  rpc: {
    arb: 'https://arb1.arbitrum.io/rpc',
    local: 'http://127.0.0.1:8545/',
    mainnet:
      'https://mainnet.chainnodes.org/72ae682a-b3a9-4fea-8c42-60d08228ea26',
  },
  tokens: {
    in: USDC_TOKEN,
    out: WETH_TOKEN,
    poolFee: FeeAmount.MEDIUM,
  },
}
