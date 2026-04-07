import { MSG } from './messages.js'
import { roomState, timerState } from '../stores.js'
import { WS_SERVER_URL } from '../config.js'

const RECONNECT_DELAYS = [1000, 2000, 3000, 5000, 5000]
const MAX_RECONNECT_ATTEMPTS = RECONNECT_DELAYS.length

export class SocketClient {
  constructor() {
    this.ws = null
    this.code = null
    this.name = ''
    this.lane = ''
    this._onStatusChange = null
    this._destroyed = false
    this._roomClosed = false
    this._reconnectAttempt = 0
    this._reconnectTimer = null
  }

  onStatusChange(cb) { this._onStatusChange = cb }

  async joinRoom(code, { name = '', lane = '' } = {}) {
    this.code = code.toUpperCase()
    this.name = name
    this.lane = lane
    this._destroyed = false
    this._roomClosed = false
    this._reconnectAttempt = 0

    return this._connect()
  }

  _connect() {
    return new Promise((resolve, reject) => {
      if (this.ws) {
        try { this.ws.close() } catch {}
        this.ws = null
      }

      const ws = new WebSocket(WS_SERVER_URL)
      this.ws = ws

      // Timeout if server unreachable on initial connect
      const timeout = this._reconnectAttempt === 0
        ? setTimeout(() => {
            if (!this._joined) {
              reject(new Error('Could not connect to room'))
              this.destroy()
            }
          }, 10000)
        : null

      ws.onopen = () => {
        ws.send(JSON.stringify({
          action: 'JOIN_ROOM',
          code: this.code,
          name: this.name,
          lane: this.lane,
        }))
      }

      ws.onmessage = (event) => {
        let envelope
        try { envelope = JSON.parse(event.data) } catch { return }

        if (!this._joined) {
          // Waiting for join confirmation or error
          if (envelope.action === 'ERROR') {
            clearTimeout(timeout)
            if (envelope.reason === 'lane_taken') {
              this._destroyed = true
              this._emitStatus('laneRejected')
              reject(new Error('laneRejected'))
            } else {
              reject(new Error(envelope.reason))
            }
            return
          }
          if (envelope.action === 'CACHED_STATE' || envelope.action === 'PEER_JOINED') {
            // Server confirms join by sending CACHED_STATE or PEER_JOINED (to host).
            // We treat the first non-error message as joined.
          }
          // PEER_JOINED goes to host — clients receive CACHED_STATE or just start getting RELAYEDs.
          // Mark as joined once the socket is open and no ERROR came.
          // The server sends CACHED_STATE immediately on join (if available); if not,
          // the first RELAYED confirms we're in. We resolve on first message from server.
          clearTimeout(timeout)
          this._joined = true
          this._reconnectAttempt = 0
          roomState.update((s) => ({ ...s, code: this.code, isHost: false }))
          this._emitStatus('connected')
          resolve(this.code)

          // Still process this message
          this._dispatchEnvelope(envelope)
          this._attachMessageHandler()
          return
        }
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        if (!this._joined && !this._destroyed) {
          reject(new Error('WebSocket connection failed'))
        }
      }

      ws.onclose = () => {
        clearTimeout(timeout)
        if (!this._joined && !this._destroyed) {
          if (this._reconnectAttempt === 0) {
            reject(new Error('Could not connect to room'))
          }
          return
        }
        if (!this._destroyed && !this._roomClosed) {
          this._autoReconnect()
        }
      }
    })
  }

  _attachMessageHandler() {
    if (!this.ws) return
    this.ws.onmessage = (event) => {
      let envelope
      try { envelope = JSON.parse(event.data) } catch { return }
      this._dispatchEnvelope(envelope)
    }
    this.ws.onclose = () => {
      if (!this._destroyed && !this._roomClosed) {
        this._autoReconnect()
      }
    }
  }

  _dispatchEnvelope(envelope) {
    if (envelope.action === 'RELAYED' || envelope.action === 'CACHED_STATE') {
      this._handleMessage(envelope.message)
    }
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case MSG.STATE_SYNC:
        timerState.set(msg.payload)
        break
      case MSG.TICK:
        timerState.update((s) => ({
          ...s,
          remainingMs: msg.payload.remainingMs,
          targetVisible: msg.payload.targetVisible ?? s.targetVisible,
        }))
        break
      case MSG.PHASE_CHANGE:
        timerState.update((s) => ({ ...s, ...msg.payload }))
        break
      case MSG.TARGET_TOGGLE:
        timerState.update((s) => ({
          ...s,
          targetVisible: msg.payload.targetVisible,
        }))
        break
      case MSG.PROGRAM_SET:
        timerState.update((s) => ({ ...s, ...msg.payload }))
        break
      case MSG.EXERCISE_ADVANCE:
        timerState.update((s) => ({ ...s, ...msg.payload }))
        break
      case MSG.RESHOOT_STATE:
        timerState.set({ ...msg.payload, isReshoot: true })
        break
      case MSG.ROOM_CLOSED:
        this._roomClosed = true
        this._clearReconnect()
        this._emitStatus('roomClosed')
        break
    }
  }

  _autoReconnect() {
    if (this._destroyed || this._roomClosed) return
    if (this._reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      this._emitStatus('disconnected')
      return
    }

    this._emitStatus('reconnecting')
    const delay = RECONNECT_DELAYS[this._reconnectAttempt] || 5000
    this._reconnectAttempt++

    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null
      if (this._destroyed || this._roomClosed) return
      this._joined = false
      try {
        await this._connect()
      } catch {
        if (!this._destroyed && !this._roomClosed) {
          this._autoReconnect()
        }
      }
    }, delay)
  }

  _emitStatus(status) {
    if (this._onStatusChange) this._onStatusChange(status)
  }

  _clearReconnect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
      this._reconnectTimer = null
    }
  }

  destroy() {
    this._destroyed = true
    this._clearReconnect()
    if (this.ws) {
      try { this.ws.close() } catch {}
      this.ws = null
    }
    roomState.set({ code: null, isHost: false, connectedPeers: [] })
  }
}
