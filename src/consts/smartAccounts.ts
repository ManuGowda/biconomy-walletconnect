import { SmartAccountLib } from '@/utils/SmartAccountLib'
import { polygon, mainnet, optimism } from 'viem/chains'

export const allowedChains = [polygon, mainnet, optimism]
export const chains = allowedChains.reduce((acc, chain) => {
  acc[chain.id] = chain
  return acc
}, {} as Record<Chain['id'], Chain>)
export type Chain = typeof allowedChains[number]

export const availableSmartAccounts = {
  SmartAccountLib
}
