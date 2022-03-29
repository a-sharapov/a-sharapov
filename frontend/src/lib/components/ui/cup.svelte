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
  z-index: 10;
  transform: perspective(50em);
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
        filter: blur(10px);
    }

    100% {
        opacity: 0;
        transform: scale(1) translate(-40px, -130px);
        filter: blur(20px);
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
        filter: blur(10px);
    }

    100% {
        opacity: 0;
        transform: scale(1) translate(40px, -130px);
        filter: blur(20px);
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