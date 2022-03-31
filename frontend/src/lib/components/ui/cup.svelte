<script>
  import { writable } from 'svelte/store'
  import { browser } from '$app/env'

  export let left = 0
  let steams = writable([])
  if (browser) {
    let i = 1
    while (i <= 200) {
      $steams.push(i)
      i++
    }
  }
</script>

<div class="cup" style="margin-left: {left}px;">
  <span class="cup-steam">
    {#each $steams as steam}
      <i class="s{steam}"></i>
    {/each}
  </span>
</div>

<style>
.cup {
  display: block;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 500px;
  height: 450px;
  background: url(/i/coffee-cup.png) no-repeat center center;
  background-size: contain;
  margin: 0;
  z-index: 11;
  transform: perspective(50em);
  transition: left,bottom,transform .3s linear;
  clip-path: polygon(30% 0%, 70% 0%, 70% 33%, 75% 35%, 77% 45%, 75% 49%, 85% 55%, 88% 63%, 80% 100%, 20% 100%, 15% 75%, 12% 60%, 22% 52%, 32% 48%, 30% 30%, 32% 0%);
}

.cup .cup-steam {
  position: absolute;
  left: 50%;
  top: 0;
  width: 200px;
  margin: 0 0 0 -100px;
  height: 175px;
  overflow: hidden;
  border-radius: 0 0 300% 300%;
  transform: scale(2, 1);
}

.cup-steam > i {
  display: block;
  position: absolute;
  bottom: -50px;
  left: 50%;
  margin: 0 -30px;
  background: #fff;
  background-size: contain;
  border-radius: 0;
  height: 60px;
  width: 60px;
  transform: scale(0.4);
  opacity: 0;
}

@keyframes smokeL {
    0% {
        opacity: 0;
        transform: scale(0.4) translate(0, 0);
        filter: blur(0px);
    }

    10% {
        opacity: 1;
        transform: scale(0.4) translate(0, -5px);
        filter: blur(8px);
    }

    100% {
        opacity: 0;
        transform: scale(1) translate(-20px, -140px);
        filter: blur(15px);
    }
}

@keyframes smokeR {
    0% {
        opacity: 0;
        transform: scale(0.4) translate(0, 0);
        filter: blur(0px);
    }

    10% {
        opacity: 1;
        transform: scale(0.4) translate(0, -5px);
        filter: blur(8px);
    }

    100% {
        opacity: 0;
        transform: scale(1) translate(20px, -140px);
        filter: blur(15px);
    }
}

.cup-steam > i.s1 {
    animation: smokeR 10s 1s infinite
}

.cup-steam > i.s2 {
    animation: smokeL 10s 2s infinite
}

.cup-steam > i.s3 {
    animation: smokeR 10s 3s infinite
}

.cup-steam > i.s4 {
    animation: smokeL 10s 4s infinite
}

.cup-steam > i.s5 {
    animation: smokeR 10s 5s infinite
}

.cup-steam > i.s6 {
    animation: smokeL 10s 6s infinite
}

.cup-steam > i.s7 {
    animation: smokeR 10s 7s infinite
}

.cup-steam > i.s8 {
    animation: smokeL 10s 8s infinite
}

.cup-steam > i.s9 {
    animation: smokeR 10s 9s infinite
}

.cup-steam > i.s10 {
    animation: smokeL 10s 10s infinite
}
</style>