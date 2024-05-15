require('dotenv').config({ path: '.env.local' })
import { providers, Wallet } from 'ethers'
import {
  Address,
  createWalletClient,
  Hex,
  http,
  encodeAbiParameters,
  parseAbiParameters
} from 'viem'
import {
  createSmartAccountClient,
  createMultiChainValidationModule,
  DEFAULT_MULTICHAIN_MODULE,
  PaymasterMode
} from '@biconomy/account'
import { Chain } from '@/consts/smartAccounts'
import { createAccount } from '@turnkey/viem'
import { TurnkeyClient } from '@turnkey/http'
import { ApiKeyStamper } from '@turnkey/api-key-stamper'

type SmartAccountLibOptions = {
  chain: Chain
}

export interface WalletActions {
  getAddress(): string
  signMessage(message: string): Promise<string>
  _signTypedData(domain: any, types: any, data: any, _primaryType?: string): Promise<string>
  connect(provider: providers.JsonRpcProvider): Wallet
  signTransaction(transaction: providers.TransactionRequest): Promise<string>
}

export class SmartAccountLib implements WalletActions {
  public chain: Chain
  public address?: `0x${string}`
  protected account: any
  protected signer: any
  protected validator: any
  public client?: any
  public initialized = false

  public type: string = 'Biconomy'
  static signMessage: any

  public constructor({ chain }: SmartAccountLibOptions) {
    this.chain = chain
  }

  async init() {
    const turnkeyApiUrl = process.env.NEXT_PUBLIC_TURNKEY_API_URL
    const turnkeyApiPublicKey = process.env.NEXT_PUBLIC_TURNKEY_API_PUBLIC_KEY
    const turnkeyApiPrivateKey = process.env.NEXT_PUBLIC_TURNKEY_API_PRIVATE_KEY
    const turnkeyOrgId = process.env.NEXT_PUBLIC_TURNKEY_ORG_ID
    const turnkeyWalletAddress = process.env.NEXT_PUBLIC_TURNKEY_WALLET_ADDRESS
    const paymasterApiKey = process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY
    const biconomyBundlerUrlTestnet = `https://bundler.biconomy.io/api/v2/${this.chain.id}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`
    const biconomyBundlerUrlMainnet = `https://bundler.biconomy.io/api/v2/${this.chain.id}/dewj2189.wh1289hU-7E49-45ic-af80-6bkcJlUCW`

    if (!turnkeyApiUrl) {
      throw new Error('Turnkey API URL is expected.')
    }

    if (!turnkeyApiPublicKey) {
      throw new Error('Turnkey API public key is expected.')
    }
    if (!turnkeyApiPrivateKey) {
      throw new Error('Turnkey API private key is expected.')
    }
    if (!turnkeyOrgId) {
      throw new Error('Turnkey OrgId is expected.')
    }
    if (!turnkeyWalletAddress) {
      throw new Error('Turnkey wallet address is expected.')
    }
    if (!biconomyBundlerUrlMainnet && !biconomyBundlerUrlTestnet) {
      throw new Error('Biconomy bundler url is expected.')
    }

    const turnkeyClient = new TurnkeyClient(
      {
        baseUrl: turnkeyApiUrl
      },
      new ApiKeyStamper({
        apiPublicKey: turnkeyApiPublicKey,
        apiPrivateKey: turnkeyApiPrivateKey
      })
    )

    const account = await createAccount({
      client: turnkeyClient,
      organizationId: turnkeyOrgId,
      signWith: `0x${turnkeyWalletAddress}`
    })

    const signer = createWalletClient({
      account: account,
      chain: this.chain,
      transport: http()
    })

    const validator = await createMultiChainValidationModule({
      signer: signer,
      moduleAddress: DEFAULT_MULTICHAIN_MODULE
    })

    const bundler = [1, 137].includes(this.chain.id)
      ? biconomyBundlerUrlMainnet
      : biconomyBundlerUrlTestnet

    const client = await createSmartAccountClient({
      signer: signer,
      biconomyPaymasterApiKey: paymasterApiKey,
      bundlerUrl: bundler,
      defaultValidationModule: validator,
      activeValidationModule: validator
    })
    this.address = await client.getAccountAddress()
    this.signer = signer
    this.validator = validator
    this.client = client
    this.account = account

    if (client) {
      console.log('Smart account initialized:', {
        address: this.address,
        chain: this.chain.name,
        type: this.type
      })
      this.initialized = true
    }
  }

  getAddress(): string {
    if (!this.address) {
      throw new Error('Client not initialized')
    }
    return this.address
  }

  async getSessionProperties() {
    if (!this.signer) {
      throw new Error('Client not initialized')
    }

    const properties = {
      smartAccountAddress: this.address
    } as Record<string, string>

    return properties
  }

  async signMessage(message: string): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    console.log('Message:', message)
    const signature = await this.client.signMessage(message)
    console.log('Signature:', signature)
    return signature || ''
  }

  async _signTypedData(
    domain: any,
    types: any,
    data: any,
    _primaryType?: string | undefined
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    const primaryType = _primaryType || ''
    const signature = await this.client.account?.signTypedData({
      domain,
      types,
      primaryType,
      message: data
    })
    return signature || ''
  }
  connect(_provider: providers.JsonRpcProvider): any {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    return this
  }
  async signTransaction(transaction: any): Promise<string> {
    if (!this.client || !this.client.account) {
      throw new Error('Client not initialized')
    }
    const signature = await this.client.account.signTransaction(transaction)
    return signature || ''
  }
  async sendTransaction({ to, value, data }: { to: Address; value: bigint; data: Hex }) {
    const transaction = [
      {
        to: to,
        data: data,
        value: value
      }
    ]
    let partialUserOp = await this.client.buildUserOp(
      transaction /*, {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'
      }
    }*/
    )
    console.log('Partial userOp:', partialUserOp)
    const returnedOp = await this.validator.signUserOps([
      {
        userOp: partialUserOp,
        chainId: this.chain.id
      }
    ])
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    const userOpResponse = await this.client.sendSignedUserOp(returnedOp[0] as any)
    const transactionHash = await userOpResponse.waitForTxHash()
    console.log('Transaction hash:', transactionHash)
    return transactionHash.transactionHash
  }
}
