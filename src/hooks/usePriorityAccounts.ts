import SettingsStore from '@/store/SettingsStore'
import { supportedAddressPriority } from '@/utils/SmartAccountUtil'
import { allowedChains } from '@/consts/smartAccounts'
import { SessionTypes } from '@walletconnect/types'
import { useSnapshot } from 'valtio'

interface IProps {
  namespaces?: SessionTypes.Namespaces
}

export default function usePriorityAccounts({ namespaces }: IProps) {
  const { address } = useSnapshot(SettingsStore.state)
  if (!namespaces) return []

  return supportedAddressPriority(namespaces, address, allowedChains)
}
