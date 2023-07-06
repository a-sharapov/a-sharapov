<script lang="ts">
  import { DICTIONARY } from "constants/dictionary";
  let email: string =
    "&#109;&#097;&#105;&#108;&#064;&#097;&#045;&#115;&#104;&#097;&#114;&#097;&#112;&#111;&#118;&#046;&#099;&#111;&#109;";

  import "./Contacts.style.css";
</script>

<aside class="contacts narrow">
  <a href="/" class="logo-wrapper">
    <img
      src="/i/logo.svg"
      class="logo"
      width="180px"
      alt={DICTIONARY.name}
    /></a
  >
  <div class="phone-wrapper">
    <p>
      <span class="phone-icon" /><a href="tel:+375445705702"
        >+375&nbsp;(44)&nbsp;<strong
          >570&nbsp;&middot;&nbsp;570&nbsp;&middot;&nbsp;2</strong
        ></a
      >
    </p>
    <p>
      <span class="tab" /><a href="tel:+375295705702"
        >+375&nbsp;(29)&nbsp;<strong
          >570&nbsp;&middot;&nbsp;570&nbsp;&middot;&nbsp;2</strong
        ></a
      >
    </p>
  </div>
  <br />
  <p class="icon-wrapper">
    <span class="mail-icon" />
    <a href="mailto:mail@a-sharapov.com">{@html email}</a>
  </p>
  <p class="icon-wrapper">
    <span class="skype-icon" /> <a href="skype:a-sharapov?chat">a-sharapov</a>
  </p>
  <p class="icon-wrapper">
    <span class="telegram-icon" />
    <a href="https://t.me/asharapov" target="_blank">@asharapov</a>
  </p>
  <hr class="giant" />
  <p class="icon-wrapper">
    <span class="linkedin-icon" />
    <a
      href="https://www.linkedin.com/in/alex-sharapov/"
      rel="external nofollow"
      target="_blank">Linkedin</a
    >
  </p>
  <p class="icon-wrapper">
    <span class="github-icon" />
    <a
      href="https://github.com/a-sharapov"
      rel="external nofollow"
      target="_blank">Github</a
    >
  </p>
</aside>
