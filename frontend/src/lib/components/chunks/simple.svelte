<section id="mobile-view">
  <p>
    <img src="/images/profile.svg" class="profile-photo" height="200px" alt="" />
  </p>
  <hr />
  <h1 class="narrow">Александр Шарапов</h1>
  <p><strong>Веб-разработчик полного цикла</strong></p>
  <p>IT-консультант</p>
  <p>&nbsp;</p>
  <p class="action-links">
    <a href="mailto:mail@a-sharapov.com" class="action-link"></a>
    <a href="tel:+375445705702" class="action-link"><span>A1</span></a>
    <a href="tel:+375295705702" class="action-link"><span>МТС</span></a>
  </p>
</section>

<style>
  #mobile-view {
    display: block;
    padding: 50px;
    height: 100vh;
    text-align: center;
  }
  #mobile-view h1 {
    font-size: 40px;
    line-height: 40px;
    font-weight: bold;
  }
  :global(#mobile-view > hr) {
    width: calc(100% + 100px);
    margin: 50px -50px;
  }
  img.profile-photo {
    display: block;
    float: none;
    margin: 0 auto;
    clip-path: circle(50% at 50% 50%);
    filter: grayscale(1);
  }
  .action-links {
    position: absolute;
    bottom: 50px;
    width: calc(100% - 100px);
    text-align: center;
  }
  .action-link {
    position: relative;
    display: inline-block;
    height: 80px;
    width: 80px;
    background-color: #bbb;
    vertical-align: bottom;
    border-radius: 50%;
    margin: 10px;
    box-shadow: 0 2px 10px #00000010, 0 1px 15px #00000005, inset 0 -2px 0 #00000050;
    filter: grayscale(1);
  }
  .action-link > span {
    position: absolute;
    bottom: 5px;
    right: 0;
    font-size: 11px;
    background: #fff;
    color: #333;
    padding: 0 10px;
    border-radius: 3px;
    font-weight: bold;
  }
  .action-link[href^="mailto"] {
    background-image: url(/i/letter.svg);
    background-repeat: no-repeat;
    background-position: center 30%;
    background-size: 50px;
  }
  .action-link[href^="tel"] {
    background-image: url(/i/phone.svg);
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 30px;
  }
</style>