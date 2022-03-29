<script>
  let year = new Date().getFullYear();
</script>

<footer>
  <p class="footer-copyright">{year}  <span class="copyleft">&copy;</span> Работает на <strong>SvelteKit</strong></p>
  <p>Исходники этого сайта на <a href="//github.com/a-sharapov/a-sharapov" rel="external nofollow">GitHub</a></p>
</footer>

<style>
  footer {
    display: block;
    position: absolute;
    bottom: 0;
    padding: 0 0 20px;
    margin: 0 auto;
    width: 100%;
    font-size: 12px;
    color: #aaa;
    z-index: 100;
    text-align: center;
  }
  footer a {
    color: #555;
  }
  footer p {
    line-height: 16px;
    margin-bottom: 5px;
  }
  footer p.footer-copyright {
    color: #777;
  }
  footer .copyleft {
    display: inline-block;
    transform: scaleX(-1);
  }
</style>