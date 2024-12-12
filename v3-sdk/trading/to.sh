
export ALICE=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
export BOB=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
export USDT=0xdAC17F958D2ee523a2206206994597C13D831ec7
export USDC=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
export BINANCE=0x28C6c06298d514Db089934071355E5743bf21d60
export WETH=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

cast rpc anvil_impersonateAccount $BINANCE
cast rpc anvil_impersonateAccount $ALICE
cast rpc anvil_impersonateAccount $BOB

cast call $USDC 'balanceOf(address)(uint256)' $BINANCE
cast call $USDT 'balanceOf(address)(uint256)' $BINANCE
cast call $WETH 'balanceOf(address)(uint256)' $BINANCE


cast send $USDC \
--from $BINANCE \
  "transfer(address,uint256)(bool)" --unlocked \
  $BOB 103532538883331

cast send $USDT \
--from $BINANCE \
  "transfer(address,uint256)(bool)" --unlocked \
  $BOB \
  226599884181196

cast send $WETH \
--from $BINANCE \
  "transfer(address,uint256)(bool)" --unlocked \
  $BOB \
  153680243755305382625

cast send $USDC \
--from $BINANCE \
  "transfer(address,uint256)(bool)" --unlocked \
  $ALICE 10000000



# cast send $USDT \
# --from $BINANCE \
#   "transfer(address,uint256)(bool)" --unlocked \
#   $ALICE \
#   1

# cast send $WETH \
# --from $BINANCE \
#   "transfer(address,uint256)(bool)" --unlocked \
#   $ALICE \
#   1

cast call $USDC 'balanceOf(address)(uint256)' $ALICE
cast call $USDC 'balanceOf(address)(uint256)' $BOB