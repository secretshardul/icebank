import { AptosAccount, TxnBuilderTypes, HexString, AptosClient } from 'aptos'

/** Publish a new module to the blockchain within the specified account */
export async function publishModule (client: AptosClient, accountFrom: AptosAccount, moduleHex: string): Promise<string> {
  const moudleBundlePayload = new TxnBuilderTypes.TransactionPayloadModuleBundle(
    new TxnBuilderTypes.ModuleBundle([new TxnBuilderTypes.Module(new HexString(moduleHex).toUint8Array())])
  )

  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(accountFrom.address()),
    client.getChainId()
  ])

  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(accountFrom.address()),
    BigInt(sequenceNumber),
    moudleBundlePayload,
    1000n,
    1n,
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId)
  )

  const bcsTxn = AptosClient.generateBCSTransaction(accountFrom, rawTxn)
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn)

  return transactionRes.hash
}

// Wallet and connection details read from .aptos/config.yaml
export interface WalletProfile {
    private_key: string,
    public_key: string,
    account: string,
    rest_url: string,
    faucet_url: string,
  }
