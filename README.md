# WalletConnect - Biconomy PoC

## Getting started

This PoC is a refactored version of [WalletConnect React Wallet](https://github.com/WalletConnect/web-examples/tree/main/advanced/wallets/react-wallet-v2).

1. Install dependencies via `npm install`

2. Run `npm run dev` to start the Wallet hosted locally at `https://localhost:3001`

## Sending a transaction
The send transaction feature is showcased via swapping on Uniswap.

3. Open the [Uniswap](https://app.uniswap.org/) web app.

4. Follow the instructions: 

https://github.com/PassHQ/pass-poc/assets/47100526/b420067e-bd13-4614-a0cc-610517b1e065

## Signing a message

In order to enable message signing, `node_modules/@biconomy/account/dist/cjs/BiconomySmartAccountV2.js` was refactored to include the [1271 support](https://github.com/bcnmy/biconomy-client-sdk/pull/457). Precisely, before `return signature` the following line was added:

```
signature = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("bytes, address"), [signature, this.defaultValidationModule.getAddress()]);

```

Message signing was tested successfully on [rhino.fi](https://app.rhino.fi), but is still unsuccessful on [OpenSea](https://opensea.io/). Further investigation needs to be done in order to understand why.

Potentially useful tool for testing the validity of signatures is Ambire's [SigTool](https://sigtool.ambire.com/).

