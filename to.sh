export ALICE=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
export USDT=0xdAC17F958D2ee523a2206206994597C13D831ec7
export USDC=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
export BINANCE=0x28C6c06298d514Db089934071355E5743bf21d60
export WETH=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

cast call $USDC \
  "balanceOf(address)(uint256)" \
  $BINANCE

cast rpc anvil_impersonateAccount $BINANCE

cast send $USDC \
--from $BINANCE \
  "transfer(address,uint256)(bool)" --unlocked \
  $ALICE \
  1234567891231230

cast send $WETH \
--from $BINANCE \
  "transfer(address,uint256)(bool)" --unlocked \
  $ALICE \
  923456789123456789121

cast call $USDC \
  "balanceOf(address)(uint256)" \
  $ALICE

