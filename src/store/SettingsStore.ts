import { Verify, SessionTypes } from '@walletconnect/types'
import { proxy } from 'valtio'

interface State {
  account: number
  address: string
  relayerRegionURL: string
  activeChainId: string
  currentRequestVerifyContext?: Verify.Context
  sessions: SessionTypes.Struct[]
}

const state = proxy<State>({
  account: 0,
  activeChainId: '1',
  address: '',
  relayerRegionURL: '',
  sessions: []
})

const SettingsStore = {
  state,

  setAccount(value: number) {
    state.account = value
  },

  setRelayerRegionURL(relayerRegionURL: string) {
    state.relayerRegionURL = relayerRegionURL
  },

  setAddress(smartAccountAddress: string) {
    state.address = smartAccountAddress
  },

  setActiveChainId(value: string) {
    state.activeChainId = value
  },

  setCurrentRequestVerifyContext(context: Verify.Context) {
    state.currentRequestVerifyContext = context
  },
  setSessions(sessions: SessionTypes.Struct[]) {
    state.sessions = sessions
  }
}

export default SettingsStore
