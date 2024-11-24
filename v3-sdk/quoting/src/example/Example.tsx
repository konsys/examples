import React, { useCallback, useState } from 'react'
import './Example.css'
import { CurrentConfig } from '../config'
import { quote } from '../libs/quote'
import { Controller, useForm } from 'react-hook-form'
import { Button, Col, Input, Row, Select, Typography } from 'antd'
import { TokensAvailable } from '../libs/constants'
import { Token } from '@uniswap/sdk-core'

type SwapFormT = {
  inputAmount: number
  outputAmount?: number
}

export const Example = () => {
  const [usedTokens, setUsedTokens] = useState<{
    token0: Token
    token1: Token
  }>({ token0: TokensAvailable.WETH, token1: TokensAvailable.USDT })
  const { watch, control, setValue } = useForm<SwapFormT>({})
  const inputValue = watch('inputAmount')

  const onQuote = useCallback(async () => {
    const value = +inputValue
    if (value > 0) {
      const q = Number(
        await quote(value, TokensAvailable.WETH, TokensAvailable.USDT),
      )
      setValue('outputAmount', +q)
    }
  }, [inputValue, setValue])

  const tokensOptions = [
    ...Object.entries(TokensAvailable).map(([k, v]) => (
      <Select.Option value={k} key={k}>
        {v.name}
      </Select.Option>
    )),
  ]
  return (
    <Row gutter={[16, 16]} className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <Typography>Please set your mainnet RPC URL in config.ts</Typography>
      )}
      <Col>
        <Select
          style={{ width: '150px' }}
          onChange={(v: Token) => setUsedTokens({ ...usedTokens, token0: v })}>
          {tokensOptions}
        </Select>
      </Col>
      <Col>
        <Typography>
          Quote input amount:
          <Controller
            name="inputAmount"
            defaultValue={0}
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          {usedTokens?.token0.name}
        </Typography>
      </Col>
      <Col>
        <Select
          style={{ width: '150px' }}
          onChange={(v: Token) => setUsedTokens({ ...usedTokens, token1: v })}>
          {tokensOptions}
        </Select>
      </Col>
      <Col>
        <Typography>
          {`Quote output amount:`}
          <Controller
            name="outputAmount"
            defaultValue={0}
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          {usedTokens?.token1.name}
        </Typography>
      </Col>
      <Col>
        <Button onClick={onQuote} variant="solid">
          Quote
        </Button>
      </Col>
    </Row>
  )
}
