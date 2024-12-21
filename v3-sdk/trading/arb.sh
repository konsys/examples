
export ALICE=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
export USDT=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9
export USDC=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
export WETH=0x82aF49447D8a07e3bd95BD0d56f35241523fBab1
export BINANCE=0xB38e8c17e38363aF6EbdCb3dAE12e0243582891D
export USDT_HOLDER=0xF977814e90dA44bFA03b6295A0616a897441aceC

cast rpc anvil_impersonateAccount $BINANCE
cast rpc anvil_impersonateAccount $ALICE

cast call $USDC 'balanceOf(address)(uint256)' $BINANCE
cast call $USDT 'balanceOf(address)(uint256)' $BINANCE
cast call $WETH 'balanceOf(address)(uint256)' $BINANCE


cast send $USDC \
--from $BINANCE \
  "transfer(address,uint256)(bool)" --unlocked \
  $ALICE 1000000000000

cast send $USDT \
--from $BINANCE \
  "transfer(address,uint256)(bool)" --unlocked \
  $ALICE 1000000000000

cast send $WETH \
--from $BINANCE \
  "transfer(address,uint256)(bool)" --unlocked \
  $ALICE 1000000000000

cast call $USDC 'balanceOf(address)(uint256)' $ALICE
cast call $USDT 'balanceOf(address)(uint256)' $ALICE
cast call $WETH 'balanceOf(address)(uint256)' $ALICE

# cast send $USDT \
# --from $BINANCE \
#   "transfer(address,uint256)(bool)" --unlocked \
#   $BOB \
#   226599884181196

# cast send $WETH \
# --from $BINANCE \
#   "transfer(address,uint256)(bool)" --unlocked \
#   $BOB \
#   153680243755305382625

# cast send $USDC \
# --from $BINANCE \
#   "transfer(address,uint256)(bool)" --unlocked \
#   $ALICE 10000000



# # cast send $USDT \
# # --from $BINANCE \
# #   "transfer(address,uint256)(bool)" --unlocked \
# #   $ALICE \
# #   1

# # cast send $WETH \
# # --from $BINANCE \
# #   "transfer(address,uint256)(bool)" --unlocked \
# #   $ALICE \
# #   1

# cast call $USDC 'balanceOf(address)(uint256)' $ALICE
# cast call $USDC 'balanceOf(address)(uint256)' $BOB