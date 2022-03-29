<script>
    let email = "&#109;&#097;&#105;&#108;&#064;&#097;&#045;&#115;&#104;&#097;&#114;&#097;&#112;&#111;&#118;&#046;&#099;&#111;&#109;"    
</script>

<div class="contacts narrow">
  <div class="phone-wrapper">
    <p><span class="phone-icon"></span><a href="tel:+375445705702">+375&nbsp;(44)&nbsp;<strong>570&nbsp;&middot;&nbsp;570&nbsp;&middot;&nbsp;2</strong></a></p>
    <p><span class="tab"></span><a href="tel:+375295705702">+375&nbsp;(29)&nbsp;<strong>570&nbsp;&middot;&nbsp;570&nbsp;&middot;&nbsp;2</strong></a></p>
  </div>
  <br>
  <p class="mail-wrapper"><span class="mail-icon"></span> <a href="mailto:mail@a-sharapov.com">{@html email}</a></p>
  <p class="skype-wrapper"><span class="skype-icon"></span> <a href="skype:a-sharapov?chat">a-sharapov</a></p>
  <p class="telegram-wrapper"><span class="telegram-icon"></span> <a href="https://t.me/asharapov" target="_blank">@asharapov</a></p>
</div>

<style>
  .contacts {
    text-align: left;
    padding: 0 40px;
  }
  .contacts a {
    text-decoration: none;
    color: #111;
    border-bottom: 1px dotted #555;
  }
  .contacts a:hover {
    border-bottom-style: solid;
    border-bottom-color: var(--sh-hv);
  }
  span.mail-icon, 
  span.skype-icon, 
  span.phone-icon, 
  span.telegram-icon, 
  span.tab {
      display: inline-block;
      margin: 5px 10px -5px 0px;
      width: 20px;
      height: 20px;
      padding: 0;
      filter: grayscale(100%) brightness(30%) drop-shadow(0 1px 0 rgba(255, 255, 255, .7));
      transition: all .25s linear;
  }

  span.phone-icon {
      background: url(../i/phone.svg) no-repeat center center;
      background-size: 80%;
  }

  span.mail-icon {
      background: url(../i/letter.svg) no-repeat center center;
      background-size: 115%;
  }

  span.skype-icon {
      background: url(../i/skype.svg) no-repeat center center;
      background-size: contain;
  }

  span.telegram-icon {
      background: url(../i/telegram.svg) no-repeat center center;
      background-size: contain;
  }

  .phone-wrapper:hover span.phone-icon {
    animation: phone-bell 3s ease infinite;
    filter: drop-shadow(0 2px 5px rgba(255,255,255,.75));
  }

  @keyframes phone-bell {
    0% {
        transform: rotate(0);
    }
    3% {
        transform: rotate(10deg) scale(1.2, 1.2);
    }
    9% {
        transform: rotate(-10deg) scale(.9, .9);
    }
    12% {
        transform: rotate(0);
    }
    15% {
        transform: rotate(20deg) scale(1.1, 1.1);
    }
    21% {
        transform: rotate(-20deg) scale(.8, .8);
    }
    24% {
        transform: rotate(0);
    }
    27% {
        transform: rotate(10deg) scale(1.2, 1.2);
    }
    33% {
        transform: rotate(-10deg) scale(.9, .9);
    }
    36% {
        transform: rotate(0);
    }
  }

  .mail-wrapper:hover span.mail-icon {
      animation: ico-pulse 1s ease-in infinite;
      filter: grayscale(0) brightness(1) drop-shadow(0 2px 5px rgba(255,255,255,.75));
  }

  .skype-wrapper:hover span.skype-icon {
      animation: ico-pulse 1s ease-in infinite;
      filter: grayscale(0) brightness(1) drop-shadow(0 2px 5px rgba(255,255,255,.75));
  }

  .telegram-wrapper:hover span.telegram-icon {
      animation: ico-pulse 1s ease-in infinite;
      filter: grayscale(0) brightness(1) drop-shadow(0 2px 5px rgba(255,255,255,.75));
  }

  @keyframes ico-pulse {
      0% {
          transform: scale(1);
      }
      20% {
          transform: scale(1.1);
      }
      0% {
          transform: scale(1);
      }
  }
</style>