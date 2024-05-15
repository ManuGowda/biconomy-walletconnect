import { createOrRestoreSmartAccounts, smartAccountWallets } from '@/utils/SmartAccountUtil'
import { useSnapshot } from 'valtio'
import SettingsStore from '@/store/SettingsStore'

export default function useSmartAccounts() {
  const {} = useSnapshot(SettingsStore.state)

  const initializeSmartAccounts = async () => {
    const { address } = await createOrRestoreSmartAccounts()
    SettingsStore.setAddress(address)
  }

  const getAvailableSmartAccounts = () => {
    const accounts = []
    for (const [key, lib] of Object.entries(smartAccountWallets)) {
      accounts.push({
        address: key.split(':')[1],
        type: lib.type,
        chain: lib.chain
      })
    }
    return accounts
  }

  return {
    initializeSmartAccounts,
    getAvailableSmartAccounts
  }
}
