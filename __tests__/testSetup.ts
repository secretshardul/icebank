import anyTest, { TestFn } from 'ava'
import { AptosClient, AptosAccount, FaucetClient } from 'aptos'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import waitPort from 'wait-port'
import { readFileSync } from 'fs'
import YAML from 'yaml'
import { publishModule, WalletProfile } from './testHelpers'

// devnet is used here for testing
const NODE_URL = 'http://0.0.0.0:8080'
const FAUCET_URL = 'http://0.0.0.0:8081'

const client = new AptosClient(NODE_URL)
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL)

const test = anyTest as TestFn<{
  contract: AptosAccount,
  alice: AptosAccount,
  client: AptosClient,
  faucetClient: FaucetClient,
}>

export default test

let validatorProcess: ChildProcessWithoutNullStreams

test.before(async t => {
  // Start validator and faucet
  validatorProcess = spawn(
    'aptos', [
      'node',
      'run-local-testnet',
      '--with-faucet'
    ], { detached: true }
  )

  await waitPort({
    host: '0.0.0.0',
    port: 8081,
    output: 'silent'
  })

  // // Read address and airdrop
  const config = YAML.parse(readFileSync('.aptos/config.yaml', 'utf8'))
  const { account: accountKey, private_key: privateKey, public_key: publicKey } =
    config.profiles.local as WalletProfile

  const contract = AptosAccount.fromAptosAccountObject({
    address: accountKey,
    publicKeyHex: publicKey,
    privateKeyHex: privateKey
  })

  await faucetClient.fundAccount(accountKey, 10)

  // Generates key pair for Alice
  const alice = new AptosAccount()
  await faucetClient.fundAccount(alice.address(), 1000)

  // Publish contract
  const moduleHex = readFileSync('build/Examples/bytecode_modules/UserInfo.mv').toString('hex')
  const txHash = await publishModule(client, contract, moduleHex)
  await client.waitForTransaction(txHash)

  // Setup context variables
  t.context = { contract, alice, client, faucetClient }
})

test.after(async t => {
  validatorProcess.kill()
})
