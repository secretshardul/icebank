import { AptosClient, BCS, TxnBuilderTypes } from 'aptos'
import test from './testSetup'

test('update state', async t => {
  const { contract, alice, client } = t.context

  // We need to pass a token type to the `transfer` function.
  const token = new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString('0x1::aptos_coin::AptosCoin'))

  const scriptFunctionPayload = new TxnBuilderTypes.TransactionPayloadScriptFunction(
    TxnBuilderTypes.ScriptFunction.natural(
      // Fully qualified module name, `AccountAddress::ModuleName`
      '0x1::Coin',
      // Module function
      'transfer',
      // The coin type to transfer
      [token],
      // Arguments for function `transfer`: receiver account address and amount to transfer
      [BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(contract.address())), BCS.bcsSerializeUint64(100)]
    )
  )

  // Sequence number is a security measure to prevent re-play attack.
  const [{ sequence_number: sequnceNumber }, chainId] = await Promise.all([
    client.getAccount(alice.address()),
    client.getChainId()
  ])

  // See class definiton here
  // https://aptos-labs.github.io/ts-sdk-doc/classes/TxnBuilderTypes.RawTransaction.html#constructor.
  const rawTxn = new TxnBuilderTypes.RawTransaction(
    // Transaction sender account address (Alice's)
    TxnBuilderTypes.AccountAddress.fromHex(alice.address()),
    // Account sequnece number
    BigInt(sequnceNumber),
    // Payload we assembled from the previous step
    scriptFunctionPayload,
    // Max gas unit to spend
    1000n,
    // Gas price per unit
    1n,
    // Expiration timestamp. Transaction is discarded if it is not executed within 10 seconds from now.
    BigInt(Math.floor(Date.now() / 1000) + 10),
    // The chain id that this transaction is targeting
    new TxnBuilderTypes.ChainId(chainId)
  )

  // Sign the raw transaction with Alice's private key
  const bcsTxn = AptosClient.generateBCSTransaction(alice, rawTxn)
  // Submit the transaction
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn)

  // Wait for the transaction to finish
  await client.waitForTransaction(transactionRes.hash)

  const resources = await client.getAccountResources(contract.address())
  const coinResource = resources.find((r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>')
  t.log('coin', coinResource)
})
