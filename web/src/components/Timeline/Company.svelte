<script>
  import { LOCALES } from '@lib/l18n'
  import store from '@lib/shared/store'

  export let start = new Date().getFullYear()
  export let end = LOCALES[$store.locale].PRESENT
  export let role
  export let companyName
  export let timetable
  export let logoPath = '/images/companies/'

  let ttTextDescription = timetable
    .split(',')
    .map((tt) => LOCALES[$store.locale].TIMETABLE[tt.trim()])
    .filter(Boolean)
    .join(', ')
</script>

<article class="company">
  <dis class="dates">
    {start}&nbsp;&ndash;&nbsp;{end}
  </dis>
  <div class="roleDescription">
    <span class="title">{role}</span><span class="timetable">,&nbsp;{ttTextDescription} </span>
    {#if companyName}
      {#await import(/* @vite-ignore */ `${logoPath}${companyName}.svg?raw`) then { default: logo }}
        <span class="at">&commat;</span>
        {@html logo}
      {/await}
    {/if}
  </div>
  <slot />
</article>
