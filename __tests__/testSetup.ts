import anyTest, { TestFn } from 'ava'
import { AptosClient, AptosAccount, FaucetClient } from 'aptos'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import waitPort from 'wait-port'
import { readFileSync } from 'fs'
import YAML from 'yaml'
import { publishModule, WalletProfile } from './testHelpers'

// devnet is used here for testing
const NODE_URL = 'http://0.0.0.0:8080'
const FAUCET_URL = 'http://0.0.0.0:8000'

const client = new AptosClient(NODE_URL)
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL)

const test = anyTest as TestFn<{
  account: AptosAccount
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
  const { account: accountKey, private_key: privateKey, public_key: publicKey } =
    config.profiles.default as WalletProfile

  const account = AptosAccount.fromAptosAccountObject({
    address: accountKey,
    publicKeyHex: publicKey,
    privateKeyHex: privateKey
  })
  await faucetClient.fundAccount(accountKey, 1000)

  // Publish contract
  const moduleHex = readFileSync('build/Examples/bytecode_modules/UserInfo.mv').toString('hex')
  const txHash = await publishModule(client, account, moduleHex)
  await client.waitForTransaction(txHash)

  // Setup context variables
  t.context = { account }
})

test.after(async t => {
  validator.kill()
  faucet.kill()
})
