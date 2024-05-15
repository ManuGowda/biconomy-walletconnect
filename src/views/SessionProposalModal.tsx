import { Col, Grid, Row, Text, styled } from '@nextui-org/react'
import { useCallback, useMemo, useState } from 'react'
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils'
import { SignClientTypes } from '@walletconnect/types'
import ModalStore from '@/store/ModalStore'
import { styledToast } from '@/utils/HelperUtil'
import { web3wallet } from '@/utils/WalletConnectUtil'
import { EIP155_CHAINS, EIP155_SIGNING_METHODS } from '@/data/EIP155Data'
import ChainDataMini from '@/components/ChainDataMini'
import { getChainData } from '@/data/chainsUtil'
import RequestModal from './RequestModal'
import ChainSmartAddressMini from '@/components/ChainSmartAddressMini'
import { useSnapshot } from 'valtio'
import SettingsStore from '@/store/SettingsStore'
import usePriorityAccounts from '@/hooks/usePriorityAccounts'
import useSmartAccounts from '@/hooks/useSmartAccounts'
import { smartAccountWallets } from '@/utils/SmartAccountUtil'
import { SmartAccountLib } from '@/utils/SmartAccountLib'

const StyledText = styled(Text, {
  fontWeight: 400
} as any)

const StyledSpan = styled('span', {
  fontWeight: 400
} as any)

export default function SessionProposalModal() {
  // Get proposal data and wallet address from store
  const data = useSnapshot(ModalStore.state)
  const proposal = data?.data?.proposal as SignClientTypes.EventArguments['session_proposal']
  const [isLoadingApprove, setIsLoadingApprove] = useState(false)
  const [isLoadingReject, setIsLoadingReject] = useState(false)
  const { getAvailableSmartAccounts } = useSmartAccounts()

  const { address } = useSnapshot(SettingsStore.state)

  const supportedNamespaces = useMemo(() => {
    // eip155
    const eip155Chains = Object.keys(EIP155_CHAINS)
    const eip155Methods = Object.values(EIP155_SIGNING_METHODS)
    return {
      eip155: {
        chains: eip155Chains,
        methods: eip155Methods,
        events: ['accountsChanged', 'chainChanged'],
        accounts: eip155Chains.map(chain => `${chain}:${address}`).flat()
      }
    }
  }, [])

  const requestedChains = useMemo(() => {
    if (!proposal) return []
    const required = []
    for (const [key, values] of Object.entries(proposal.params.requiredNamespaces)) {
      const chains = key.includes(':') ? key : values.chains
      required.push(chains)
    }

    const optional = []
    for (const [key, values] of Object.entries(proposal.params.optionalNamespaces)) {
      const chains = key.includes(':') ? key : values.chains
      optional.push(chains)
    }
    console.log('Requested chains:', [...new Set([...required.flat(), ...optional.flat()])])

    return [...new Set([...required.flat(), ...optional.flat()])]
  }, [proposal])

  // the chains that are supported by the wallet from the proposal
  const supportedChains = useMemo(
    () =>
      requestedChains.map(chain => {
        const chainData = getChainData(chain!)

        if (!chainData) return null

        return chainData
      }),
    [requestedChains]
  )

  // get required chains that are not supported by the wallet
  const notSupportedChains = useMemo(() => {
    if (!proposal) return []
    const required = []
    for (const [key, values] of Object.entries(proposal.params.requiredNamespaces)) {
      const chains = key.includes(':') ? key : values.chains
      required.push(chains)
    }
    return required
      .flat()
      .filter(
        chain =>
          !supportedChains
            .map(supportedChain => `${supportedChain?.namespace}:${supportedChain?.chainId}`)
            .includes(chain!)
      )
  }, [proposal, supportedChains])
  console.log('Not supported chains:', notSupportedChains)
  const getAddress = useCallback((namespace?: string) => {
    if (!namespace) return 'N/A'
    switch (namespace) {
      case 'eip155':
        return address
    }
  }, [])

  const namespaces = useMemo(() => {
    try {
      // the builder throws an exception if required namespaces are not supported
      return buildApprovedNamespaces({
        proposal: proposal.params,
        supportedNamespaces
      })
    } catch (e) {}
  }, [proposal.params, supportedNamespaces])

  const reorderedEip155Accounts = usePriorityAccounts({ namespaces })

  // Hanlde approve action, construct session namespace
  const onApprove = useCallback(async () => {
    if (proposal && namespaces) {
      setIsLoadingApprove(true)

      try {
        const sessionParams = {
          id: proposal.id,
          namespaces,
          sessionProperties: {}
        }
        if (reorderedEip155Accounts.length > 0) {
          namespaces.eip155.accounts = reorderedEip155Accounts
          const [smartAccountCaipAddress] = reorderedEip155Accounts
          const [_, chainId, address] = smartAccountCaipAddress.split(':')
          const smartAccount = Object.values(smartAccountWallets).find(
            acc => acc.getAddress() === address && acc.chain.id === parseInt(chainId)
          ) as SmartAccountLib
          const sessionProperties = await smartAccount?.getSessionProperties()
          sessionParams.sessionProperties = sessionProperties
        }
        await web3wallet.engine.signClient.approve(sessionParams)
        SettingsStore.setSessions(Object.values(web3wallet.getActiveSessions()))
      } catch (e) {
        setIsLoadingApprove(false)
        styledToast((e as Error).message, 'error')
        return
      }
    }
    setIsLoadingApprove(false)
    ModalStore.close()
  }, [namespaces, proposal, reorderedEip155Accounts])

  // Hanlde reject action
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const onReject = useCallback(async () => {
    if (proposal) {
      try {
        setIsLoadingReject(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        await web3wallet.rejectSession({
          id: proposal.id,
          reason: getSdkError('USER_REJECTED_METHODS')
        })
      } catch (e) {
        setIsLoadingReject(false)
        styledToast((e as Error).message, 'error')
        return
      }
    }
    setIsLoadingReject(false)
    ModalStore.close()
  }, [proposal])

  return (
    <RequestModal
      metadata={proposal.params.proposer.metadata}
      onApprove={onApprove}
      onReject={onReject}
      approveLoader={{ active: isLoadingApprove }}
      rejectLoader={{ active: isLoadingReject }}
      infoBoxCondition={notSupportedChains.length > 0}
      infoBoxText={`Networks not supported by your wallet: ${notSupportedChains.toString()}`}
    >
      <Row align="center">
        <Col>
          <Text h4> Accounts to be connected</Text>
        </Col>
      </Row>

      <Grid.Container style={{ marginBottom: '10px', marginTop: '10px' }} justify={'space-between'}>
        {getAvailableSmartAccounts().map((account, i) => {
          if (!account || !account.chain) {
            return null
          }
          return (
            <Grid key={i} xs={12}>
              {' '}
              <Row justify="space-between" align="center">
                <ChainSmartAddressMini account={account} />
                <ChainDataMini chainId={`eip155:${account.chain.id}`} />
              </Row>
            </Grid>
          )
        })}
      </Grid.Container>
    </RequestModal>
  )
}
