<script>
  import { imask } from '@imask/svelte'
  import './PhoneInput.scss'

  export let placeholder = ''
  export let title = ''
  export let width = 'full'
  let value

  const maskOptions = {
    mask: [
      {
        mask: '{+381} (00) 000-00-00',
        startsWith: '3',
        lazy: false,
        country: 'RS'
      }
      // {
      //   mask: '{+7} (000) 000-00-00',
      //   startsWith: '7',
      //   lazy: false,
      //   country: 'RU'
      // },
      // {
      //   mask: '+0000000000000',
      //   startsWith: '',
      //   lazy: true,
      //   country: 'unknown'
      // }
    ]
    // dispatch: (appended, dynamicMasked) => {
    //   const number = (dynamicMasked.value + appended).replace(/\D/g, '')
    //   return dynamicMasked.compiledMasks.find((m) => number.indexOf(m.startsWith) === 0)
    // }
  }

  const acceptInputMask = ({ detail: maskRef }) => void (value = maskRef.value)
</script>

<label data-width={width}>
  {#if title}
    <span>{@html title}</span>
  {/if}
  <input
    {value}
    type="tel"
    name="phone"
    required
    {placeholder}
    use:imask={maskOptions}
    on:accept={acceptInputMask}
  />
</label>
