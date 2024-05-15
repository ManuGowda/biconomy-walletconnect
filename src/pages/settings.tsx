import PageHeader from '@/components/PageHeader'
import RelayRegionPicker from '@/components/RelayRegionPicker'
import { Divider, Row, Text } from '@nextui-org/react'
import { Fragment } from 'react'
import packageJSON from '../../package.json'

export default function SettingsPage() {
  return (
    <Fragment>
      <PageHeader title="Settings" />

      <Text h4 css={{ marginBottom: '$5' }}>
        Packages
      </Text>
      <Row justify="space-between" align="center">
        <Text color="$gray400">@walletconnect/sign-client</Text>
        <Text color="$gray400">{packageJSON.dependencies['@walletconnect/web3wallet']}</Text>
      </Row>

      <Divider y={2} />

      <Row justify="space-between" align="center">
        <Text h4 css={{ marginBottom: '$5' }}>
          Relayer Region
        </Text>
        <RelayRegionPicker />
      </Row>

      <Divider y={2} />
      <Text h4 css={{ marginTop: '$10', marginBottom: '$5' }}></Text>
    </Fragment>
  )
}
