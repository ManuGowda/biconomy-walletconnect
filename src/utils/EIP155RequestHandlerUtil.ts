import { EIP155_CHAINS, EIP155_SIGNING_METHODS, TEIP155Chain } from '@/data/EIP155Data'
import {
  getSignParamsMessage,
  getSignTypedDataParamsData,
  getWalletAddressFromParams
} from '@/utils/HelperUtil'
import { hashMessage } from 'viem'
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils'
import { SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import SettingsStore from '@/store/SettingsStore'
import { smartAccountWallets } from './SmartAccountUtil'
type RequestEventArgs = Omit<SignClientTypes.EventArguments['session_request'], 'verifyContext'>

const getWallet = async (params: any) => {
  const chainId = params?.chainId?.split(':')[1]
  const address = getWalletAddressFromParams(
    Object.keys(smartAccountWallets)
      .filter(key => {
        const parts = key.split(':')
        return parts[0] === chainId
      })
      .map(key => {
        return key.split(':')[1]
      }),
    params
  )
  if (!address) {
    console.log('Library not initialized for requested address:', {
      address,
      values: Object.keys(smartAccountWallets)
    })
    throw new Error('Library not initialized for requested address')
  }

  const lib = smartAccountWallets[`${chainId}:${address}`]
  if (lib) {
    return lib
  }
  console.log('Library not found:', {
    target: `${chainId}:address`,
    values: Object.keys(smartAccountWallets)
  })
  throw new Error('Cannot find wallet for requested address')
}

export async function approveEIP155Request(requestEvent: RequestEventArgs) {
  const { params, id } = requestEvent
  const { chainId, request } = params
  SettingsStore.setActiveChainId(chainId)
  const wallet = await getWallet(params)
  switch (request.method) {
    case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
    case EIP155_SIGNING_METHODS.ETH_SIGN:
      try {
        const message = getSignParamsMessage(request.params)
        const hashedMessage = hashMessage(message)
        const signedMessage = await wallet.signMessage(hashedMessage)
        return formatJsonRpcResult(id, signedMessage)
      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }

    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
      try {
        const {
          domain,
          types,
          message: data,
          primaryType
        } = getSignTypedDataParamsData(request.params)

        // https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
        delete types.EIP712Domain
        const signedData = await wallet._signTypedData(domain, types, data, primaryType)
        return formatJsonRpcResult(id, signedData)
      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }

    case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
      try {
        const transactionParams = request.params[0]
        const to = transactionParams?.to
        const data = transactionParams?.data
        const value = transactionParams?.value
        const transactionHash = await wallet.sendTransaction({ to, value, data })
        const receipt =
          typeof transactionHash === 'string' ? transactionHash : transactionHash?.hash // TODO improve interface
        return formatJsonRpcResult(id, receipt)
      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }

    case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
      try {
        const signTransaction = request.params[0]
        const signature = await wallet.signTransaction(signTransaction)
        return formatJsonRpcResult(id, signature)
      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }

    default:
      throw new Error(getSdkError('INVALID_METHOD').message)
  }
}

export function rejectEIP155Request(request: RequestEventArgs) {
  const { id } = request

  return formatJsonRpcError(id, getSdkError('USER_REJECTED').message)
}
