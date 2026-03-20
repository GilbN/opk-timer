<script>
  import { preferences } from '../lib/stores.js'
  import { savePreferences } from '../lib/storage.js'

  function toggle() {
    preferences.update((p) => {
      const updated = { ...p, lang: p.lang === 'no' ? 'en' : 'no' }
      savePreferences(updated)
      return updated
    })
  }
</script>

<button class="lang-toggle" onclick={toggle}>
  {$preferences.lang === 'no' ? 'EN' : 'NO'}
</button>

<style>
  .lang-toggle {
    background: var(--bg-surface);
    color: var(--text-secondary);
    border: 1px solid rgba(255,255,255,0.06);
    padding: 0.3rem 0.6rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    border-radius: var(--radius);
    min-width: 40px;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, border-color 0.15s;
  }

  .lang-toggle:hover {
    color: var(--text-primary);
    border-color: rgba(255,255,255,0.15);
  }
</style>
