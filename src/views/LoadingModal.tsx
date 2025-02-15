import { Col, Divider, Loading, Row, Text } from '@nextui-org/react'
import RequestModalContainer from '@/components/RequestModalContainer'
import { useSnapshot } from 'valtio'
import ModalStore from '@/store/ModalStore'

export default function LoadingModal() {
  const state = useSnapshot(ModalStore.state)
  const message = state.data?.loadingMessage

  return (
    <RequestModalContainer title="">
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Row>
          <Col>
            <Loading size="lg" />
          </Col>
        </Row>
        <Row align="center">
          <Col>
            <Text h3>Loading your request...</Text>
          </Col>
        </Row>
        {message ? (
          <div style={{ textAlign: 'center' }}>
            <Divider y={1} />
            <Text>{message}</Text>
          </div>
        ) : null}
      </div>
    </RequestModalContainer>
  )
}
