import React, { useCallback } from 'react'
import './Example.css'
import { CurrentConfig } from '../config'
import { quote } from '../libs/quote'
import { Controller, useForm } from 'react-hook-form'
import { Button, Input, Typography } from 'antd'

type SwapFormT = {
  inputAmount: number
  outputAmount?: number
}
export const Example = () => {
  const { watch, control, setValue } = useForm<SwapFormT>({})
  const inputValue = watch('inputAmount')

  const onQuote = useCallback(async () => {
    const value = +inputValue
    if (value > 0) {
      const q = Number(await quote(value))
      setValue('outputAmount', +q)
    }
  }, [inputValue, setValue])

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <Typography>Please set your mainnet RPC URL in config.ts</Typography>
      )}
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
        {CurrentConfig.tokens.in.symbol}
      </Typography>
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
        {CurrentConfig.tokens.out.symbol}
      </Typography>
      <Button onClick={onQuote} variant="solid">
        Quote
      </Button>
    </div>
  )
}
