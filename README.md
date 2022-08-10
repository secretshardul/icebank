# IceBank token vesting

```sh
# Generate keypair for package
aptos init

# Run tests
aptos move test

# Compile
aptos move compile

# Deploy on chain
aptos move publish

# Modify resource by calling a script function
aptos move run --function-id 0x0DD05C79F73E77E4D6D8218A08074829865018020A1CD93B3AEDF8E0D2B30766::UserInfo::set_username --args string:greedyman

# Aptos lacks view functions similar to Solana. We need to read the resource from RPC, and do any calculations client side. get_username() is for CPIs.
curl 'https://fullnode.devnet.aptoslabs.com/accounts/0x0DD05C79F73E77E4D6D8218A08074829865018020A1CD93B3AEDF8E0D2B30766/resource/0x0DD05C79F73E77E4D6D8218A08074829865018020A1CD93B3AEDF8E0D2B30766::UserInfo::UserProfile'

curl '0.0.0.0:8080/accounts/0x0DD05C79F73E77E4D6D8218A08074829865018020A1CD93B3AEDF8E0D2B30766/resource/0x0DD05C79F73E77E4D6D8218A08074829865018020A1CD93B3AEDF8E0D2B30766::UserInfo::UserProfile'
```

## Localnet setup

```sh
aptos node run-local-testnet --with-faucet

# Read tx- transactions/by_hash in new update
curl 'http://0.0.0.0:8080/transactions/0x19ab66e5545305d24af15f678b8f75b8e8d25f2b6a496e3ea82c7e142123481d'
```

## Useful tools

### Standard library

Modules are located at 0x1 address.

## move-stdlib

String, signer, error, vector, unit test, access control list, hash etc

https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/framework/move-stdlib/sources

## aptos-stdlib

Event, table, guid etc.
https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/framework/aptos-stdlib/sources


### Aptosis

1. aptos-toolkit: Redundant as official CLI provides functionality.
2. aptos-framework: Types for move-stdlib, aptos-stdlib