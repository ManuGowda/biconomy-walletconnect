import AccountCard from '@/components/AccountCard'
import PageHeader from '@/components/PageHeader'
import { EIP155_MAINNET_CHAINS, EIP155_TEST_CHAINS } from '@/data/EIP155Data'
import SettingsStore from '@/store/SettingsStore'
import { Fragment } from 'react'
import { useSnapshot } from 'valtio'
import { isAllowedChain } from '@/utils/SmartAccountUtil'

export default function HomePage() {
  const { address } = useSnapshot(SettingsStore.state)

  return (
    <Fragment>
      <PageHeader title="Accounts" />
      <Fragment>
        {Object.entries(EIP155_MAINNET_CHAINS).map(([caip10, { name, logo, rgb }]) => (
          <AccountCard
            key={name}
            name={name}
            logo={logo}
            rgb={rgb}
            address={address}
            chainId={caip10.toString()}
            data-testid={'chain-card-' + caip10.toString()}
          />
        ))}
        {Object.entries(EIP155_TEST_CHAINS).map(([caip10, { name, logo, rgb, chainId }]) => {
          return (
            <div key={`${name}-smart`} style={{ marginBottom: 10 }}>
              {isAllowedChain(chainId) ? (
                <AccountCard
                  key={`${name}-biconomy`}
                  name={`${name}`}
                  logo={logo}
                  rgb={rgb}
                  address={address}
                  chainId={caip10.toString()}
                  data-testid={`chain-card-${caip10.toString()}-biconomy`}
                />
              ) : null}
            </div>
          )
        })}
      </Fragment>
    </Fragment>
  )
}
