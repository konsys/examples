import { FeeAmount } from '@uniswap/v3-sdk'

// Inputs that configure this example to run
export interface ExampleConfig {
  rpc: {
    arb: string
    local: string
    mainnet: string
  }
  tokens: {
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
    poolFee: FeeAmount.MEDIUM,
  },
}
