<script context="module">
  export function load({error, status}) {
    return {
      props: { error, status }
    }
  }
</script>

<script>
  export let error
  export let status
</script>

<article id="error-page">
  <img src="/i/piano.png" class="piano" width="400px" alt="Рояль в кустах" />
  <section class="error-page-content">
    <h1 class="narrow">Ошибка {status}</h1>
    <hr />
    <p>Что-то пошло не по плану:</p>
    <p class="error-message"><strong>{error.message}</strong></p>
  </section>
</article>

<style>
  #error-page {
    position: absolute;
    background: none;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    font-size: 18px;
    background: linear-gradient(to top, #e4e0e1, #fff);
  }

  #error-page img {
    user-select: none;
  }

  #error-page h1 {
    letter-spacing: 1px;
    font-size: 40px;
    color: var(--ash-red);
  }

  #error-page h1 + hr {
    display: block;
    width: 30px;
    height: 2px;
    outline: none;
    border: none;
    background: var(--ash-red);
  }

  .error-message {
    display: inline-block;
    line-height: 32px;
    padding: 0 15px;
    border: 1px solid #00000025;
  }

  .piano {
    opacity: 1;
  }
</style>
