import anyTest, { TestFn } from 'ava'
import { AptosClient, AptosAccount, FaucetClient, BCS, TxnBuilderTypes, HexString } from 'aptos'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import waitPort from 'wait-port'
import { readFileSync } from 'fs'
import YAML from 'yaml'

// devnet is used here for testing
const NODE_URL = 'http://0.0.0.0:8080'
const FAUCET_URL = 'http://0.0.0.0:8000'

const client = new AptosClient(NODE_URL)
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL)

/** Publish a new module to the blockchain within the specified account */
export async function publishModule (accountFrom: AptosAccount, moduleHex: string): Promise<string> {
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

const test = anyTest as TestFn<{
  account: string
}>

export default test

let validator: ChildProcessWithoutNullStreams
let faucet: ChildProcessWithoutNullStreams

test.before(async t => {
  // Start validator and faucet
  validator = spawn('aptos-node', ['--test', '--test-dir', '.validator'], { detached: true })
  await waitPort({
    host: '0.0.0.0',
    port: 8080,
    output: 'silent'
  })

  faucet = spawn('aptos-faucet', [
    '--chain-id', 'TESTING',
    '--mint-key-file-path', '.validator/mint.key',
    '--address', '0.0.0.0',
    '--port', '8000',
    '--server-url', 'http://127.0.0.1:8080'
  ], { detached: true })

  await waitPort({
    host: '0.0.0.0',
    port: 8000,
    output: 'silent'
  })

  // Read address and airdrop
  const config = YAML.parse(readFileSync('.aptos/config.yaml', 'utf8'))
  const account = config.profiles.default.account as string
  await faucetClient.fundAccount(account, 1000)

  // Publish contract

  // Setup context variables
  t.context = { account }
})

test.after(async t => {
  validator.kill()
  faucet.kill()
})
