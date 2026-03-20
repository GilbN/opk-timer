<script>
  import { get } from 'svelte/store'
  import { currentView, roomState, timerState } from '../lib/stores.js'
  import { t } from '../lib/i18n.js'
  import { TimerScheduler } from '../lib/timer/TimerScheduler.js'
  import { saveRoomState, clearRoomState, addRoomToHistory } from '../lib/storage.js'
  import RoomCode from '../components/RoomCode.svelte'
  import ConnectionStatus from '../components/ConnectionStatus.svelte'
  import ProgramPicker from '../components/ProgramPicker.svelte'
  import ProgramEditor from '../components/ProgramEditor.svelte'
  import LangToggle from '../components/LangToggle.svelte'

  let showEditor = $state(false)

  function selectProgram(programId) {
    const scheduler = new TimerScheduler()
    window.__opkScheduler = scheduler

    const host = window.__opkHost
    if (host) {
      scheduler.onStateChange((state) => {
        host.broadcastState(state)
      })
    }

    scheduler.loadProgram(programId)

    saveRoomState({ code: $roomState.code, isHost: true, programId })
    currentView.set('timer')
  }

  function handleCustomSave(program) {
    showEditor = false
    selectProgram(program.id)
  }

  function disconnect() {
    if (!confirm(get(t)('confirmDisconnect'))) return
    if ($roomState.code) {
      addRoomToHistory({ code: $roomState.code, isHost: true })
    }
    if (window.__opkHost) {
      window.__opkHost.destroy()
      window.__opkHost = null
    }
    clearRoomState()
    currentView.set('home')
  }
</script>

<div class="view lobby-view">
  <div class="top-bar">
    <RoomCode code={$roomState.code} />
    <div class="top-bar-right">
      <ConnectionStatus status="connected" />
      <LangToggle />
    </div>
  </div>

  {#if $roomState.connectedPeers.length > 0}
    <div class="peer-pill">
      <span class="peer-dot"></span>
      {$roomState.connectedPeers.length} {$t('peers')}
    </div>
  {/if}

  <div class="content">
    {#if showEditor}
      <ProgramEditor onSave={handleCustomSave} onCancel={() => (showEditor = false)} />
    {:else}
      <ProgramPicker onSelect={selectProgram} onCustom={() => (showEditor = true)} />
    {/if}
  </div>

  <button class="btn-leave" onclick={disconnect}>
    {$t('disconnect')}
  </button>
</div>

<style>
  .lobby-view {
    gap: 0.75rem;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .top-bar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .peer-pill {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: 0.04em;
    align-self: flex-start;
  }

  .peer-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
  }

  .content {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .btn-leave {
    align-self: center;
    background: transparent;
    color: var(--danger);
    border: 1px solid rgba(244, 67, 54, 0.2);
    border-radius: var(--radius);
    padding: 0.45rem 1.25rem;
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.75;
    transition: opacity 0.15s, border-color 0.15s;
  }

  .btn-leave:hover {
    opacity: 1;
    border-color: rgba(244, 67, 54, 0.5);
  }
</style>
