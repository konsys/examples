import React, { useCallback } from 'react'
import './style.css'
import { CurrentConfig } from '../config'
import { quote } from '../libs/quote'
import { Controller, useForm } from 'react-hook-form'
import { Button, Col, Input, Row, Select, Typography } from 'antd'
import { TokenName, TokensAvailable } from '../libs/constants'

type SwapFormT = {
  inputAmount: number
  outputAmount?: number
  tokenName0?: TokenName
  tokenName1?: TokenName
}

export const Example = () => {
  const { watch, control, setValue } = useForm<SwapFormT>({
    values: {
      inputAmount: 1000,
      tokenName0: 'USDC',
      tokenName1: 'WETH',
    },
  })
  const inputValue = watch('inputAmount')
  const tokenName0 = watch('tokenName0')
  const tokenName1 = watch('tokenName1')

  const onQuote = useCallback(async () => {
    const value = +inputValue
    if (value > 0 && tokenName0 && tokenName1 && tokenName0 !== tokenName1) {
      const q = Number(
        await quote(
          value,
          TokensAvailable[tokenName0],
          TokensAvailable[tokenName1],
        ),
      )
      setValue('outputAmount', +q)
    }
  }, [inputValue, setValue, tokenName0, tokenName1])

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
        <Controller
          name="tokenName0"
          control={control}
          render={({ field }) => (
            <Select
              style={{ width: '150px' }}
              onChange={(v) => setValue('tokenName0', v)}
              value={field.value}>
              {tokensOptions}
            </Select>
          )}
        />
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
          {tokenName0}
        </Typography>
      </Col>
      <Col>
        <Controller
          name="tokenName1"
          control={control}
          render={({ field }) => (
            <Select
              style={{ width: '150px' }}
              onChange={(v) => setValue('tokenName1', v)}
              value={field.value}>
              {tokensOptions}
            </Select>
          )}
        />
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
          {tokenName1}
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
