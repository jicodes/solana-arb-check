# arbcheck: On-Chain Profit Checker for Solana Arbitrage Bots

This Solana Anchor program enables trustless, on-chain profit verification for arbitrage bots. It is designed to be used in conjunction with off-chain bots (such as those using the Jupiter SDK and Jito bundles) to ensure that only profitable arbitrage transactions are executed.

## Overview
- **Arbitrage bot** (off-chain) finds and executes arbitrage opportunities (e.g., wSOL → USDC → wSOL) using the Jupiter SDK.
- **Jito bundles** are used to ensure atomic execution and priority, protecting against MEV and reordering.
- The bot includes instructions from this program in the same bundle to:
  1. Save the pre-trade wSOL balance on-chain.
  2. Execute the arbitrage swap(s).
  3. Check post-trade wSOL balance and assert profit on-chain.

## Why On-Chain Profit Checking?
- Ensures only profitable trades are executed, even in the presence of MEV, slippage, or state changes between quote and execution.
- Makes the process trustless and verifiable on-chain.
- Prevents accidental or malicious loss due to off-chain miscalculations.

## Integration Example
Below is a simplified workflow for integrating this program with your bot:

1. **Save Pre-Trade Balance**
   - Call the `saveBalance` instruction from this program, saving the user's wSOL balance to a PDA.
2. **Execute Arbitrage**
   - Perform the swap(s) using Jupiter's swap instructions.
3. **Check Profit**
   - Call the `checkProfit` instruction from this program, which compares the current wSOL balance to the saved value and asserts that the profit meets a minimum threshold.
4. **Bundle All Instructions**
   - All instructions (save balance, swap, check profit, tip, etc.) are bundled and sent atomically using Jito.

### Example (from your bot code)
```js
// ...
const saveBalanceIx = await program.methods
  .saveBalance()
  .accounts({
    user: payer.publicKey,
    wsolAccount: wsolTokenAccount,
    state: statePda,
    systemProgram: web3.SystemProgram.programId,
  })
  .instruction();

// ... Jupiter swap instructions ...

const checkProfitIx = await program.methods
  .checkProfit(new BN(jitoTip + PROFIT_THRESHOLD))
  .accounts({
    user: payer.publicKey,
    wsolAccount: wsolTokenAccount,
    state: statePda,
  })
  .instruction();
// ...
```

## Usage
- Integrate the `saveBalance` and `checkProfit` instructions into your bot's transaction bundle before and after the arbitrage trade, respectively.
- Deploy the program to Solana and use the Anchor client or CPI as needed.
- See the `programs/arbcheck/src/` directory for implementation details.

## Security & Best Practices
- Always use the on-chain profit check in the same bundle as your swap to prevent race conditions.
- Adjust the profit threshold and tip logic to suit your risk tolerance and strategy.

---
For more details, see the program source in `programs/arbcheck/src/` and refer to your bot's integration example above.


