import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Arbcheck } from "../target/types/arbcheck";
import { createSyncNativeInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { assert } from "chai";

describe("arbcheck", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.arbcheck as Program<Arbcheck>;
  const provider = anchor.getProvider();
  const connection = provider.connection;
  const user = provider.wallet;

  let wsolMint = new anchor.web3.PublicKey("So11111111111111111111111111111111111111112");
  let wsolAccount;
  let statePda;

  // Helper to wrap SOL (send SOL to the WSOL ATA)
  async function wrapSol(amountLamports: number) {
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: user.publicKey,
        toPubkey: wsolAccount.address,
        lamports: amountLamports,
      })
    );
    await anchor.web3.sendAndConfirmTransaction(connection, tx, [user.payer]);

    // Sync the native WSOL account
    const tx2 = new anchor.web3.Transaction().add(
      createSyncNativeInstruction(wsolAccount.address)
    );
    await anchor.web3.sendAndConfirmTransaction(connection, tx2, [user.payer]);
  }

  before(async () => {
    wsolAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      user.payer,
      wsolMint,
      user.publicKey
    );
    [statePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("state"), user.publicKey.toBuffer()],
      program.programId
    );
  });

  it("saves balance and checks profit (success case)", async () => {
    // Wrap 1 SOL
    await wrapSol(1_000_000_000);

    await program.methods.saveBalance().accounts({
      user: user.publicKey,
      wsolAccount: wsolAccount.address,
      wsolMint: wsolMint,
      state: statePda,
      systemProgram: anchor.web3.SystemProgram.programId,
    } as any).rpc();

    // Get balance before profit
    let before = (await connection.getTokenAccountBalance(wsolAccount.address)).value.amount;
    console.log("Before balance:", before);

    // Wrap 0.1 SOL more to simulate profit
    await wrapSol(100_000_000);

    // Get balance after profit
    let after = (await connection.getTokenAccountBalance(wsolAccount.address)).value.amount;
    console.log("After balance:", after);

    let profit = BigInt(after) - BigInt(before);
    console.log("Profit (lamports):", profit.toString());

    // Use the actual profit as the threshold
    await program.methods.checkProfit(new anchor.BN(profit.toString())).accounts({
      user: user.publicKey,
      wsolAccount: wsolAccount.address,
      wsolMint: wsolMint,
      state: statePda,
    } as any).rpc();
  });

  it("fails if profit is not enough", async () => {
    // Save balance again (current balance is 1.1 SOL)
    await program.methods.saveBalance().accounts({
      user: user.publicKey,
      wsolAccount: wsolAccount.address,
      wsolMint: wsolMint,
      state: statePda,
      systemProgram: anchor.web3.SystemProgram.programId,
    } as any).rpc();

    // Try to check profit with a higher threshold (should fail)
    try {
      await program.methods.checkProfit(new anchor.BN(1_000_000_000)).accounts({
        user: user.publicKey,
        wsolAccount: wsolAccount.address,
        wsolMint: wsolMint,
        state: statePda,
      } as any).rpc();
      assert.fail("Should have failed due to insufficient profit");
    } catch (err) {
      assert.include(err.toString(), "NotProfitable");
    }
  });
});
