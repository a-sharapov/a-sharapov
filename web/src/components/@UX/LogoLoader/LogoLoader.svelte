<script lang="ts">
  import Logo from '/logo.svg?raw';
  import './LogoLoader.css';

  interface ILogoLoader {
    label: string;
  }

  let { label }: ILogoLoader = $props();

  const _attribute = (name: string) => Logo.match(new RegExp(`\\s${name}="([^"]+)"`))?.[1] ?? '';
  const viewBox = _attribute('viewBox');
  const d = _attribute('d');
</script>

<span class="logo-loader" role="status">
  <svg class="ink" {viewBox} aria-hidden="true">
    <path {d} fill-rule="evenodd" />
  </svg>
  <span class="veil" aria-hidden="true"></span>
  <svg class="sketch" {viewBox} aria-hidden="true">
    <path {d} fill-rule="evenodd" />
  </svg>
  <svg class="signed" {viewBox} aria-hidden="true">
    <path {d} fill-rule="evenodd" />
  </svg>
  <span class="sr-only">{label}</span>
</span>
