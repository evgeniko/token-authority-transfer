import * as anchor from "@coral-xyz/anchor";
import {
  AccountAddress,
  ChainContext,
  Signer,
  Wormhole,
  contracts,
} from "@wormhole-foundation/sdk";
import {
  SolanaPlatform,
  getSolanaSignAndSendSigner,
} from "@wormhole-foundation/sdk-solana";
import * as fs from "fs";
import { IdlVersion, NTT, SolanaNtt } from "@wormhole-foundation/sdk-solana-ntt";
import { SystemProgram } from "@solana/web3.js";
import * as idl from './idl.json';
import type {
  ExampleNativeTokenTransfers,
} from "./types_idl";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";


// TODO: Change to "Mainnet" for production
const NETWORK = "Testnet";

(async function () {
  // TODO: Replace with your wallet key file path
  const payerSecretKey = Uint8Array.from(
    JSON.parse(
        fs.readFileSync(`/path/to/your/wallet.json`, {
        encoding: "utf-8",
      })
    )
  );
  
  // TODO: Replace with your deployed contract addresses
  const NTT_MANAGER_ADDRESS = new anchor.web3.PublicKey("YOUR_NTT_MANAGER_ADDRESS");
  const NTT_TOKEN_ADDRESS = new anchor.web3.PublicKey("YOUR_TOKEN_ADDRESS");
  // TODO: Replace with the new authority, like your wallet for example
  const NEW_TOKEN_AUTHORITY = new anchor.web3.PublicKey("YOUR_NEW_TOKEN_AUTHORITY");

  const payer = anchor.web3.Keypair.fromSecretKey(payerSecretKey);
  const CORE_BRIDGE_ADDRESS = contracts.coreBridge(NETWORK, "Solana");

  const w = new Wormhole(NETWORK, [SolanaPlatform], {
    chains: { Solana: { contracts: { coreBridge: CORE_BRIDGE_ADDRESS } } },
  });

  // TODO: Update RPC endpoint for production
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const ctx: ChainContext<typeof NETWORK, "Solana"> = w
    .getPlatform("Solana")
    .getChain("Solana", connection);

  let ntt: SolanaNtt<typeof NETWORK, "Solana">;
  let signer: Signer;
  let sender: AccountAddress<"Solana">;

  signer = await getSolanaSignAndSendSigner(connection, payer);
  sender = Wormhole.parseAddress("Solana", signer.address());

  const VERSION: IdlVersion = "3.0.0";
  const emitter = NTT.transceiverPdas(NTT_MANAGER_ADDRESS).emitterAccount();
  ntt = new SolanaNtt(
    NETWORK,
    "Solana",
    connection,
    {
      ...ctx.config.contracts,
      ntt: {
        token: NTT_TOKEN_ADDRESS.toBase58(),
        manager: NTT_MANAGER_ADDRESS.toBase58(),
        transceiver: {
          wormhole: emitter.toBase58(),
        },
      },
    },
    VERSION
  );

  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(payer), {
		preflightCommitment: 'confirmed',
	});
  anchor.setProvider(provider);
  const program = new anchor.Program(idl as unknown as ExampleNativeTokenTransfers, NTT_MANAGER_ADDRESS.toString(), provider);

  let setTokenInstr = await program.methods.setTokenAuthority().accountsStrict({
    common: {
      config: ntt.pdas.configAccount(),
      owner: payer.publicKey,
      mint: NTT_TOKEN_ADDRESS,
      tokenAuthority: ntt.pdas.tokenAuthority(),
      newAuthority: NEW_TOKEN_AUTHORITY,
    },
    pendingTokenAuthority: ntt.pdas.pendingTokenAuthority(),
    rentPayer:  payer.publicKey,
    systemProgram: SystemProgram.programId,
  }).instruction();

   let createClaimInstr = await program.methods.claimTokenAuthority().accountsStrict({
     common: {
       config: ntt.pdas.configAccount(),
       pendingTokenAuthority: ntt.pdas.pendingTokenAuthority(),
       mint: NTT_TOKEN_ADDRESS,
       tokenProgram: TOKEN_PROGRAM_ID,
       tokenAuthority: ntt.pdas.tokenAuthority(),
       systemProgram: SystemProgram.programId,
       rentPayer: payer.publicKey,
     },
     newAuthority: NEW_TOKEN_AUTHORITY,
   }).instruction();

    const transaction = new anchor.web3.Transaction().add(setTokenInstr).add(createClaimInstr);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.feePayer = payer.publicKey;
    transaction.recentBlockhash = blockhash;

    await anchor.web3.sendAndConfirmTransaction(connection, transaction, [
      payer,
    ]);

})().catch((e) => console.error(e));
