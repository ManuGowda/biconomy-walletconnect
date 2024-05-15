import { SessionTypes } from '@walletconnect/types'
import { Chain, allowedChains } from '@/consts/smartAccounts'
import { SmartAccountLib } from '@/utils/SmartAccountLib'

export type UrlConfig = {
  chain: Chain
}

export const RPC_URLS: Record<Chain['name'], string> = {
  Ethereum: 'https://rpc.ankr.com/eth',
  // Sepolia: 'https://rpc.ankr.com/eth_sepolia',
  // 'Polygon Mumbai': 'https://mumbai.rpc.thirdweb.com',
  Polygon: 'https://polygon-rpc.com'
}

export const publicRPCUrl = ({ chain }: UrlConfig) => {
  return RPC_URLS[chain?.name]
}

export function supportedAddressPriority(
  namespaces: SessionTypes.Namespaces,
  smartAccountAddress: string,
  providedAllowedChains: Partial<typeof allowedChains>
) {
  const namespaceKeys = Object.keys(namespaces)
  const [nameSpaceKey] = namespaceKeys
  // get chain ids from namespaces
  const [chainIds] = namespaceKeys.map(key => namespaces[key].chains)
  if (!chainIds) {
    return []
  }
  const allowedChainIds = chainIds.filter(id => {
    const chainId = id.replace(`${nameSpaceKey}:`, '')
    return providedAllowedChains.map(chain => chain?.id.toString()).includes(chainId)
  })
  const chainIdParsed = allowedChainIds[0].replace(`${nameSpaceKey}:`, '')
  const chain = providedAllowedChains.find(chain => chain?.id.toString() === chainIdParsed)!
  if (allowedChainIds.length > 0 && smartAccountAddress) {
    // Construct the primary account string
    const primaryAccount = `${nameSpaceKey}:${chain.id}:${smartAccountAddress}`
    const allowedAccounts = allowedChainIds
      .map(id => {
        // Find if id is part of namespaces.eip155.accounts
        const accountIsAllowed = namespaces.eip155.accounts.findIndex(account =>
          account.includes(id)
        )
        return namespaces.eip155.accounts[accountIsAllowed]
      })
      .filter(account => account !== primaryAccount) // Filter out the primary account if it's included in allowedAccounts

    return [primaryAccount, ...allowedAccounts]
  }
  return []
}

export let smartAccountWallets: Record<string, SmartAccountLib> = {}
export let address: string

export function isAllowedChain(chainId: number): boolean {
  return allowedChains.some(chain => chain.id == chainId)
}

export async function createOrRestoreSmartAccounts() {
  let accounts = []

  for (const chain of allowedChains) {
    const lib = new SmartAccountLib({ chain: chain })
    await lib.init()
    const address = lib.getAddress()
    const key = `${chain.id}:${address}`
    if (!smartAccountWallets[key]) {
      smartAccountWallets[key] = lib
    }
    accounts.push({
      chainId: chain.id,
      chainName: chain.name,
      address: address
    })
  }

  return {
    addresses: accounts,
    address: accounts.length > 0 ? accounts[0].address : ''
  }
}
