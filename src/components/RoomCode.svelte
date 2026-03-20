<script>
  import { t } from '../lib/i18n.js'

  let { code = '' } = $props()
  let copied = $state(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch {
      // fallback: select text
    }
  }
</script>

<button class="room-code" class:copied onclick={copyCode} title={$t('copy')}>
  <span class="code">{code}</span>
  {#if copied}
    <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  {:else}
    <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  {/if}
</button>

<style>
  .room-code {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    cursor: pointer;
    padding: 0.35rem 0.7rem;
    border-radius: var(--radius);
    background: var(--bg-surface);
    border: 1px solid rgba(255,255,255,0.06);
    transition: border-color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .room-code:hover {
    border-color: rgba(0, 230, 118, 0.3);
  }

  .room-code.copied {
    border-color: rgba(0, 230, 118, 0.5);
  }

  .code {
    font-family: var(--font-mono);
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: var(--accent);
  }

  .copy-icon,
  .check-icon {
    width: 14px;
    height: 14px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .check-icon {
    color: var(--accent);
  }
</style>
