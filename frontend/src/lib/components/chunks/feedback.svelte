<script>
  import { message } from '$lib/components/utils'
  import { browser } from '$app/env'
  import { writable } from 'svelte/store'
  import FeedbackForm from "$lib/components/forms/feedback-form.svelte"
  import Notifier from '$lib/components/forms/notifier.svelte'

  let loaded = writable(false)
  let sended = writable("undefined")

  browser && setTimeout(() => {
    loaded.set(true)
  }, 1e2)
</script>

<Notifier {message} />
<section id="feedback-wrapper" data-loaded="{$loaded}" data-sendend="{$sended}">
  <slot></slot>
  <FeedbackForm {sended} {message} />
</section>
<span class="letter-overlay" data-sendend="{$sended}"></span>

<style>
  #feedback-wrapper {
    position: relative;
    background: linear-gradient(to top, #eaeaea99, #fefefe);
    min-height: 400px;
    padding: 40px 40px 50px;
    width: 100%;
    max-width: 800px;
    backdrop-filter: blur(7px);
    box-shadow: 0 2px 15px #00000010, 0 -5px 75px #00000020;
    border-top: 2px solid #fff;
    z-index: 2;
    margin-bottom: -40%;
    transition: margin .5s linear;
  }
  #feedback-wrapper[data-loaded="true"] {
    margin-bottom: 0;
  }
  #feedback-wrapper[data-sendend="completed"] {
    margin-bottom: -100%;
  }
  :global(#feedback-wrapper[data-sendend="uncompleted"]) {
    animation: .15s ease-in-out 0s 4 send_failed;
  }
  :global(#feedback-wrapper > hr) {
    width: calc(100% + 80px);
    margin: 30px -40px;
  }
  .letter-overlay {
    width: 900px;
    position: absolute;
    bottom: -70px;
    transition: bottom .5s linear;
  }
  :global(.letter-overlay[data-sendend="completed"]) {
    animation: .7s linear .55s 1 letter_hide;
    animation-fill-mode: forwards;
  }
  .letter-overlay:before,
  .letter-overlay:after {
    position: absolute;
    transition: all .5s linear;
    content: "";
  }
  .letter-overlay:before {
    bottom: 0;
    width: 900px;
    height: 380px;
    background: url(/i/letter-back.svg) no-repeat center top;
    z-index: 1;
  }
  .letter-overlay:after {
    bottom: 0;
    width: 900px;
    height: 380px;
    background: url(/i/letter-front.svg) no-repeat center bottom;
    z-index: 3;
    clip-path: polygon(50% 86%, 96% 54%, 99% 52%, 99% 100%, 1% 100%, 1% 52%, 8% 57%)
  }
  .letter-overlay[data-sendend="completed"] {
    bottom: 0;
  }
  :global(.letter-overlay[data-sendend="completed"]:before) {
    animation: .1s linear .55s 1 letter_presend;
    animation-fill-mode: forwards;
  }

  @keyframes letter_hide {
    0% {
      bottom: 0;
    }
    70% {
      bottom: -20%;
    }
    100% {
      bottom: -100%;
    }
  }

  @keyframes letter_presend {
    0% {
      height: 380px;
      bottom: 0;
      transform: scaleY(1);
      z-index: 1;
    }
    1% {
      z-index: 4;
    }
    99% {
      height: 200px;
      bottom: -17px;
      transform: scaleY(-1);
      z-index: 4;
    }
    100% {
      height: 200px;
      bottom: -17px;
      transform: scaleY(-1);
      z-index: 4;
    }
  }

  @keyframes send_failed {
    0% {
      margin-left: -10px;
    }
    50% {
      margin-left: 0;
    }
    100% {
      margin-left: 10px;
    }
  }
</style>