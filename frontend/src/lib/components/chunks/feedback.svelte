<script>
  import FeedbackForm from "$lib/components/forms/feedback-form.svelte"
</script>

<section id="feedback-wrapper">
  <slot></slot>
  <FeedbackForm />
</section>
<span class="letter-overlay"></span>

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
  }
  :global(#feedback-wrapper > hr) {
    width: calc(100% + 80px);
    margin: 30px -40px;
  }
  .letter-overlay {
    width: 900px;
    position: absolute;
    bottom: -70px;
  }
  .letter-overlay:before,
  .letter-overlay:after {
    position: absolute;
    content: "";
  }
  .letter-overlay:before {
    bottom: 0;
    width: 900px;
    height: 380px;
    background: url(/i/letter-back.svg) no-repeat center bottom;
    background-size: cover;
    z-index: 1;
  }
  .letter-overlay:after {
    bottom: 0;
    width: 900px;
    height: 380px;
    background: url(/i/letter-front.svg) no-repeat center bottom;
    background-size: cover;
    z-index: 3;
    clip-path: polygon(50% 86%, 96% 54%, 99% 52%, 99% 100%, 1% 100%, 1% 52%, 8% 57%)
  }
</style>