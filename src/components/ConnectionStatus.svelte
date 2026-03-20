<script>
  import { roomState } from '../lib/stores.js'
  import { t } from '../lib/i18n.js'

  let { status = 'connected' } = $props()
</script>

<div class="connection-status" class:connected={status === 'connected'} class:reconnecting={status === 'reconnecting'} class:disconnected={status === 'disconnected'}>
  <span class="dot"></span>
  {#if status === 'reconnecting'}
    <span class="label">{$t('reconnecting')}…</span>
  {:else if status === 'disconnected'}
    <span class="label">{$t('disconnected')}</span>
  {/if}
</div>

<style>
  .connection-status {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
  }

  .reconnecting .dot {
    background: var(--warning);
    animation: pulse 1s ease-in-out infinite;
  }

  .disconnected .dot {
    background: var(--danger);
  }

  .label {
    font-size: 0.7rem;
    font-weight: 500;
  }

  .reconnecting .label { color: var(--warning); }
  .disconnected .label { color: var(--danger); }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }
</style>
