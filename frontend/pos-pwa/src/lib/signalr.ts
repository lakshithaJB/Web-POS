import * as signalR from '@microsoft/signalr'
import { useConnectivityStore } from '@/store/connectivityStore'

let connection: signalR.HubConnection | null = null

export function buildConnection(token: string): signalR.HubConnection {
  connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/pos', { accessTokenFactory: () => token })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  connection.onreconnecting(() => useConnectivityStore.getState().setWs(false))
  connection.onreconnected(() => useConnectivityStore.getState().setWs(true))
  connection.onclose(() => useConnectivityStore.getState().setWs(false))

  return connection
}

export function getConnection(): signalR.HubConnection | null {
  return connection
}

export async function startConnection(token: string): Promise<void> {
  const conn = buildConnection(token)
  await conn.start()
  useConnectivityStore.getState().setWs(true)
}

export async function stopConnection(): Promise<void> {
  if (connection) {
    await connection.stop()
    connection = null
  }
}