<script>
  import { writable } from 'svelte/store'
  import { browser } from '$app/env'

  let left = writable(0)
  let ashes = writable([])
  if (browser) {
    let i = 1
    while (i <= 200) {
      $ashes.push(i)
      i++
    }

    document.addEventListener("mousemove", (e) => {
      let x = e.pageX - parseInt(window.innerWidth) / 2
      left.set(-x*3.25)
    })
  }
</script>

<div class="ashes" style="margin-left: {$left}px">
  {#each $ashes as ash}
    <i data-item="{ash}"></i>
  {/each}
</div>

<style>
  .ashes {
    position: fixed;
    bottom: 0;
    left: -200vw;
    overflow: visible;
    transform: scale(1, -1);
    z-index: 2000;
}

.ashes>i {
    position: absolute;
    width: 5px;
    height: 5px;
    background: #ffffff95;
    border-radius: 50%;
    user-select: none;
    filter: blur(2px);
}

.ashes>i:nth-child(1) {
    opacity: 0.1694;
    transform: translate(19.95vw, -10px) scale(0.5592);
    animation: fall-1 18s -13s linear infinite;
}

@keyframes fall-1 {
    50.401% {
        transform: translate(28.1658vw, 50.401vh) scale(0.5592);
    }

    to {
        transform: translate(24.0579vw, 100vh) scale(0.5592);
    }
}

.ashes>i:nth-child(2) {
    opacity: 0.7796;
    transform: translate(398.097vw, -10px) scale(0.3815);
    animation: fall-2 18s -26s linear infinite;
}

@keyframes fall-2 {
    32.21% {
        transform: translate(401.5223vw, 32.21vh) scale(0.3815);
    }

    to {
        transform: translate(399.80965vw, 100vh) scale(0.3815);
    }
}

.ashes>i:nth-child(3) {
    opacity: 0.5163;
    transform: translate(168.894vw, -10px) scale(0.1729);
    animation: fall-3 10s -8s linear infinite;
}

@keyframes fall-3 {
    70.446% {
        transform: translate(168.5114vw, 70.446vh) scale(0.1729);
    }

    to {
        transform: translate(168.7027vw, 100vh) scale(0.1729);
    }
}

.ashes>i:nth-child(4) {
    opacity: 0.7221;
    transform: translate(420.468vw, -10px) scale(0.8955);
    animation: fall-4 26s -6s linear infinite;
}

@keyframes fall-4 {
    57.781% {
        transform: translate(420.9969vw, 57.781vh) scale(0.8955);
    }

    to {
        transform: translate(420.73245vw, 100vh) scale(0.8955);
    }
}

.ashes>i:nth-child(5) {
    opacity: 0.4533;
    transform: translate(325.906vw, -10px) scale(0.6642);
    animation: fall-5 19s -20s linear infinite;
}

@keyframes fall-5 {
    37.712% {
        transform: translate(334.82vw, 37.712vh) scale(0.6642);
    }

    to {
        transform: translate(330.363vw, 100vh) scale(0.6642);
    }
}

.ashes>i:nth-child(6) {
    opacity: 0.8217;
    transform: translate(179.339vw, -10px) scale(0.328);
    animation: fall-6 15s -30s linear infinite;
}

@keyframes fall-6 {
    75.444% {
        transform: translate(173.6277vw, 75.444vh) scale(0.328);
    }

    to {
        transform: translate(176.48335vw, 100vh) scale(0.328);
    }
}

.ashes>i:nth-child(7) {
    opacity: 0.526;
    transform: translate(488.4235vw, -10px) scale(0.0731);
    animation: fall-7 18s -15s linear infinite;
}

@keyframes fall-7 {
    39.472% {
        transform: translate(479.3462vw, 39.472vh) scale(0.0731);
    }

    to {
        transform: translate(483.88485vw, 100vh) scale(0.0731);
    }
}

.ashes>i:nth-child(8) {
    opacity: 0.3592;
    transform: translate(98.937vw, -10px) scale(0.3945);
    animation: fall-8 25s -17s linear infinite;
}

@keyframes fall-8 {
    56.958% {
        transform: translate(108.66vw, 56.958vh) scale(0.3945);
    }

    to {
        transform: translate(103.7985vw, 100vh) scale(0.3945);
    }
}

.ashes>i:nth-child(9) {
    opacity: 0.9687;
    transform: translate(3.8025vw, -10px) scale(0.0884);
    animation: fall-9 11s -2s linear infinite;
}

@keyframes fall-9 {
    46.326% {
        transform: translate(-2.456vw, 46.326vh) scale(0.0884);
    }

    to {
        transform: translate(0.67325vw, 100vh) scale(0.0884);
    }
}

.ashes>i:nth-child(10) {
    opacity: 0.2014;
    transform: translate(90.268vw, -10px) scale(0.8373);
    animation: fall-10 26s -7s linear infinite;
}

@keyframes fall-10 {
    56.103% {
        transform: translate(83.8891vw, 56.103vh) scale(0.8373);
    }

    to {
        transform: translate(87.07855vw, 100vh) scale(0.8373);
    }
}

.ashes>i:nth-child(11) {
    opacity: 0.5499;
    transform: translate(50.3335vw, -10px) scale(0.1991);
    animation: fall-11 20s -11s linear infinite;
}

@keyframes fall-11 {
    67.985% {
        transform: translate(49.5753vw, 67.985vh) scale(0.1991);
    }

    to {
        transform: translate(49.9544vw, 100vh) scale(0.1991);
    }
}

.ashes>i:nth-child(12) {
    opacity: 0.4855;
    transform: translate(345.403vw, -10px) scale(0.3362);
    animation: fall-12 24s -27s linear infinite;
}

@keyframes fall-12 {
    56.48% {
        transform: translate(338.1252vw, 56.48vh) scale(0.3362);
    }

    to {
        transform: translate(341.7641vw, 100vh) scale(0.3362);
    }
}

.ashes>i:nth-child(13) {
    opacity: 0.6483;
    transform: translate(247.6875vw, -10px) scale(0.5804);
    animation: fall-13 16s -14s linear infinite;
}

@keyframes fall-13 {
    38.94% {
        transform: translate(251.9714vw, 38.94vh) scale(0.5804);
    }

    to {
        transform: translate(249.82945vw, 100vh) scale(0.5804);
    }
}

.ashes>i:nth-child(14) {
    opacity: 0.0601;
    transform: translate(129.515vw, -10px) scale(0.7648);
    animation: fall-14 19s -14s linear infinite;
}

@keyframes fall-14 {
    51.201% {
        transform: translate(129.7204vw, 51.201vh) scale(0.7648);
    }

    to {
        transform: translate(129.6177vw, 100vh) scale(0.7648);
    }
}

.ashes>i:nth-child(15) {
    opacity: 0.8432;
    transform: translate(289.7665vw, -10px) scale(0.9652);
    animation: fall-15 16s -6s linear infinite;
}

@keyframes fall-15 {
    70.718% {
        transform: translate(283.2708vw, 70.718vh) scale(0.9652);
    }

    to {
        transform: translate(286.51865vw, 100vh) scale(0.9652);
    }
}

.ashes>i:nth-child(16) {
    opacity: 0.463;
    transform: translate(235.7895vw, -10px) scale(0.3063);
    animation: fall-16 16s -3s linear infinite;
}

@keyframes fall-16 {
    74.23% {
        transform: translate(241.0828vw, 74.23vh) scale(0.3063);
    }

    to {
        transform: translate(238.43615vw, 100vh) scale(0.3063);
    }
}

.ashes>i:nth-child(17) {
    opacity: 0.4756;
    transform: translate(204.002vw, -10px) scale(0.425);
    animation: fall-17 30s -9s linear infinite;
}

@keyframes fall-17 {
    76.406% {
        transform: translate(203.1259vw, 76.406vh) scale(0.425);
    }

    to {
        transform: translate(203.56395vw, 100vh) scale(0.425);
    }
}

.ashes>i:nth-child(18) {
    opacity: 0.2953;
    transform: translate(189.6485vw, -10px) scale(0.0563);
    animation: fall-18 22s -27s linear infinite;
}

@keyframes fall-18 {
    34.623% {
        transform: translate(199.047vw, 34.623vh) scale(0.0563);
    }

    to {
        transform: translate(194.34775vw, 100vh) scale(0.0563);
    }
}

.ashes>i:nth-child(19) {
    opacity: 0.343;
    transform: translate(299.447vw, -10px) scale(0.2042);
    animation: fall-19 13s -7s linear infinite;
}

@keyframes fall-19 {
    51.635% {
        transform: translate(306.6304vw, 51.635vh) scale(0.2042);
    }

    to {
        transform: translate(303.0387vw, 100vh) scale(0.2042);
    }
}

.ashes>i:nth-child(20) {
    opacity: 0.913;
    transform: translate(210.242vw, -10px) scale(0.6451);
    animation: fall-20 17s -30s linear infinite;
}

@keyframes fall-20 {
    65.632% {
        transform: translate(205.2429vw, 65.632vh) scale(0.6451);
    }

    to {
        transform: translate(207.74245vw, 100vh) scale(0.6451);
    }
}

.ashes>i:nth-child(21) {
    opacity: 0.9872;
    transform: translate(26.7775vw, -10px) scale(0.6924);
    animation: fall-21 15s -22s linear infinite;
}

@keyframes fall-21 {
    49.614% {
        transform: translate(36.2595vw, 49.614vh) scale(0.6924);
    }

    to {
        transform: translate(31.5185vw, 100vh) scale(0.6924);
    }
}

.ashes>i:nth-child(22) {
    opacity: 0.0671;
    transform: translate(448.6205vw, -10px) scale(0.5106);
    animation: fall-22 22s -29s linear infinite;
}

@keyframes fall-22 {
    50.98% {
        transform: translate(453.3117vw, 50.98vh) scale(0.5106);
    }

    to {
        transform: translate(450.9661vw, 100vh) scale(0.5106);
    }
}

.ashes>i:nth-child(23) {
    opacity: 0.5551;
    transform: translate(260.091vw, -10px) scale(0.7827);
    animation: fall-23 10s -12s linear infinite;
}

@keyframes fall-23 {
    45.037% {
        transform: translate(251.0653vw, 45.037vh) scale(0.7827);
    }

    to {
        transform: translate(255.57815vw, 100vh) scale(0.7827);
    }
}

.ashes>i:nth-child(24) {
    opacity: 0.2241;
    transform: translate(277.2645vw, -10px) scale(0.0444);
    animation: fall-24 20s -9s linear infinite;
}

@keyframes fall-24 {
    48.148% {
        transform: translate(278.9291vw, 48.148vh) scale(0.0444);
    }

    to {
        transform: translate(278.0968vw, 100vh) scale(0.0444);
    }
}

.ashes>i:nth-child(25) {
    opacity: 0.8508;
    transform: translate(389.216vw, -10px) scale(0.5118);
    animation: fall-25 26s -19s linear infinite;
}

@keyframes fall-25 {
    68.125% {
        transform: translate(382.4278vw, 68.125vh) scale(0.5118);
    }

    to {
        transform: translate(385.8219vw, 100vh) scale(0.5118);
    }
}

.ashes>i:nth-child(26) {
    opacity: 0.0447;
    transform: translate(58.3885vw, -10px) scale(0.9021);
    animation: fall-26 12s -25s linear infinite;
}

@keyframes fall-26 {
    43.261% {
        transform: translate(62.0239vw, 43.261vh) scale(0.9021);
    }

    to {
        transform: translate(60.2062vw, 100vh) scale(0.9021);
    }
}

.ashes>i:nth-child(27) {
    opacity: 0.7243;
    transform: translate(49.026vw, -10px) scale(0.0298);
    animation: fall-27 16s -2s linear infinite;
}

@keyframes fall-27 {
    38.289% {
        transform: translate(53.8074vw, 38.289vh) scale(0.0298);
    }

    to {
        transform: translate(51.4167vw, 100vh) scale(0.0298);
    }
}

.ashes>i:nth-child(28) {
    opacity: 0.2781;
    transform: translate(425.2295vw, -10px) scale(0.1426);
    animation: fall-28 21s -29s linear infinite;
}

@keyframes fall-28 {
    74.785% {
        transform: translate(428.5457vw, 74.785vh) scale(0.1426);
    }

    to {
        transform: translate(426.8876vw, 100vh) scale(0.1426);
    }
}

.ashes>i:nth-child(29) {
    opacity: 0.3534;
    transform: translate(241.2835vw, -10px) scale(0.5093);
    animation: fall-29 14s -3s linear infinite;
}

@keyframes fall-29 {
    79.437% {
        transform: translate(242.8367vw, 79.437vh) scale(0.5093);
    }

    to {
        transform: translate(242.0601vw, 100vh) scale(0.5093);
    }
}

.ashes>i:nth-child(30) {
    opacity: 0.2233;
    transform: translate(355.09vw, -10px) scale(0.3024);
    animation: fall-30 14s -17s linear infinite;
}

@keyframes fall-30 {
    69.965% {
        transform: translate(346.1911vw, 69.965vh) scale(0.3024);
    }

    to {
        transform: translate(350.64055vw, 100vh) scale(0.3024);
    }
}

.ashes>i:nth-child(31) {
    opacity: 0.7845;
    transform: translate(410.6545vw, -10px) scale(0.2288);
    animation: fall-31 28s -27s linear infinite;
}

@keyframes fall-31 {
    57.126% {
        transform: translate(420.3437vw, 57.126vh) scale(0.2288);
    }

    to {
        transform: translate(415.4991vw, 100vh) scale(0.2288);
    }
}

.ashes>i:nth-child(32) {
    opacity: 0.6373;
    transform: translate(305.186vw, -10px) scale(0.7741);
    animation: fall-32 29s -25s linear infinite;
}

@keyframes fall-32 {
    57.696% {
        transform: translate(307.8639vw, 57.696vh) scale(0.7741);
    }

    to {
        transform: translate(306.52495vw, 100vh) scale(0.7741);
    }
}

.ashes>i:nth-child(33) {
    opacity: 0.2357;
    transform: translate(266.866vw, -10px) scale(0.5895);
    animation: fall-33 19s -20s linear infinite;
}

@keyframes fall-33 {
    54.805% {
        transform: translate(275.4889vw, 54.805vh) scale(0.5895);
    }

    to {
        transform: translate(271.17745vw, 100vh) scale(0.5895);
    }
}

.ashes>i:nth-child(34) {
    opacity: 0.1288;
    transform: translate(44.314vw, -10px) scale(0.2387);
    animation: fall-34 21s -29s linear infinite;
}

@keyframes fall-34 {
    65.858% {
        transform: translate(49.9019vw, 65.858vh) scale(0.2387);
    }

    to {
        transform: translate(47.10795vw, 100vh) scale(0.2387);
    }
}

.ashes>i:nth-child(35) {
    opacity: 0.6253;
    transform: translate(71.911vw, -10px) scale(0.8014);
    animation: fall-35 26s -22s linear infinite;
}

@keyframes fall-35 {
    31.203% {
        transform: translate(70.0788vw, 31.203vh) scale(0.8014);
    }

    to {
        transform: translate(70.9949vw, 100vh) scale(0.8014);
    }
}

.ashes>i:nth-child(36) {
    opacity: 0.8777;
    transform: translate(281.904vw, -10px) scale(0.2794);
    animation: fall-36 20s -9s linear infinite;
}

@keyframes fall-36 {
    74.266% {
        transform: translate(288.4589vw, 74.266vh) scale(0.2794);
    }

    to {
        transform: translate(285.18145vw, 100vh) scale(0.2794);
    }
}

.ashes>i:nth-child(37) {
    opacity: 0.0227;
    transform: translate(216.602vw, -10px) scale(0.6674);
    animation: fall-37 23s -26s linear infinite;
}

@keyframes fall-37 {
    68.541% {
        transform: translate(210.0605vw, 68.541vh) scale(0.6674);
    }

    to {
        transform: translate(213.33125vw, 100vh) scale(0.6674);
    }
}

.ashes>i:nth-child(38) {
    opacity: 0.623;
    transform: translate(286.5915vw, -10px) scale(0.4294);
    animation: fall-38 24s -4s linear infinite;
}

@keyframes fall-38 {
    50.209% {
        transform: translate(278.6885vw, 50.209vh) scale(0.4294);
    }

    to {
        transform: translate(282.64vw, 100vh) scale(0.4294);
    }
}

.ashes>i:nth-child(39) {
    opacity: 0.4594;
    transform: translate(271.8095vw, -10px) scale(0.3089);
    animation: fall-39 20s -13s linear infinite;
}

@keyframes fall-39 {
    36.904% {
        transform: translate(269.6209vw, 36.904vh) scale(0.3089);
    }

    to {
        transform: translate(270.7152vw, 100vh) scale(0.3089);
    }
}

.ashes>i:nth-child(40) {
    opacity: 0.042;
    transform: translate(161.322vw, -10px) scale(0.0105);
    animation: fall-40 13s -20s linear infinite;
}

@keyframes fall-40 {
    78.066% {
        transform: translate(161.6064vw, 78.066vh) scale(0.0105);
    }

    to {
        transform: translate(161.4642vw, 100vh) scale(0.0105);
    }
}

.ashes>i:nth-child(41) {
    opacity: 0.5026;
    transform: translate(194.5895vw, -10px) scale(0.1057);
    animation: fall-41 18s -9s linear infinite;
}

@keyframes fall-41 {
    79.005% {
        transform: translate(187.5674vw, 79.005vh) scale(0.1057);
    }

    to {
        transform: translate(191.07845vw, 100vh) scale(0.1057);
    }
}

.ashes>i:nth-child(42) {
    opacity: 0.9883;
    transform: translate(82.353vw, -10px) scale(0.9207);
    animation: fall-42 18s -9s linear infinite;
}

@keyframes fall-42 {
    57.698% {
        transform: translate(81.9811vw, 57.698vh) scale(0.9207);
    }

    to {
        transform: translate(82.16705vw, 100vh) scale(0.9207);
    }
}

.ashes>i:nth-child(43) {
    opacity: 0.7696;
    transform: translate(363.7935vw, -10px) scale(0.3087);
    animation: fall-43 17s -7s linear infinite;
}

@keyframes fall-43 {
    31.035% {
        transform: translate(370.7502vw, 31.035vh) scale(0.3087);
    }

    to {
        transform: translate(367.27185vw, 100vh) scale(0.3087);
    }
}

.ashes>i:nth-child(44) {
    opacity: 0.6786;
    transform: translate(333.3265vw, -10px) scale(0.2099);
    animation: fall-44 19s -27s linear infinite;
}

@keyframes fall-44 {
    40.587% {
        transform: translate(335.5289vw, 40.587vh) scale(0.2099);
    }

    to {
        transform: translate(334.4277vw, 100vh) scale(0.2099);
    }
}

.ashes>i:nth-child(45) {
    opacity: 0.3309;
    transform: translate(480.04vw, -10px) scale(0.2666);
    animation: fall-45 20s -22s linear infinite;
}

@keyframes fall-45 {
    79.897% {
        transform: translate(484.7798vw, 79.897vh) scale(0.2666);
    }

    to {
        transform: translate(482.4099vw, 100vh) scale(0.2666);
    }
}

.ashes>i:nth-child(46) {
    opacity: 0.8229;
    transform: translate(316.541vw, -10px) scale(0.771);
    animation: fall-46 15s -18s linear infinite;
}

@keyframes fall-46 {
    49.034% {
        transform: translate(320.9698vw, 49.034vh) scale(0.771);
    }

    to {
        transform: translate(318.7554vw, 100vh) scale(0.771);
    }
}

.ashes>i:nth-child(47) {
    opacity: 0.2862;
    transform: translate(49.014vw, -10px) scale(0.868);
    animation: fall-47 22s -20s linear infinite;
}

@keyframes fall-47 {
    60.098% {
        transform: translate(48.8787vw, 60.098vh) scale(0.868);
    }

    to {
        transform: translate(48.94635vw, 100vh) scale(0.868);
    }
}

.ashes>i:nth-child(48) {
    opacity: 0.2556;
    transform: translate(360.211vw, -10px) scale(0.8536);
    animation: fall-48 17s -20s linear infinite;
}

@keyframes fall-48 {
    61.134% {
        transform: translate(357.2594vw, 61.134vh) scale(0.8536);
    }

    to {
        transform: translate(358.7352vw, 100vh) scale(0.8536);
    }
}

.ashes>i:nth-child(49) {
    opacity: 0.1223;
    transform: translate(333.05vw, -10px) scale(0.7997);
    animation: fall-49 11s -11s linear infinite;
}

@keyframes fall-49 {
    31.531% {
        transform: translate(334.6249vw, 31.531vh) scale(0.7997);
    }

    to {
        transform: translate(333.83745vw, 100vh) scale(0.7997);
    }
}

.ashes>i:nth-child(50) {
    opacity: 0.1421;
    transform: translate(279.667vw, -10px) scale(0.3705);
    animation: fall-50 15s -24s linear infinite;
}

@keyframes fall-50 {
    49.742% {
        transform: translate(273.6396vw, 49.742vh) scale(0.3705);
    }

    to {
        transform: translate(276.6533vw, 100vh) scale(0.3705);
    }
}

.ashes>i:nth-child(51) {
    opacity: 0.5813;
    transform: translate(423.8935vw, -10px) scale(0.7335);
    animation: fall-51 13s -19s linear infinite;
}

@keyframes fall-51 {
    72.059% {
        transform: translate(426.3695vw, 72.059vh) scale(0.7335);
    }

    to {
        transform: translate(425.1315vw, 100vh) scale(0.7335);
    }
}

.ashes>i:nth-child(52) {
    opacity: 0.5865;
    transform: translate(130.5095vw, -10px) scale(0.5803);
    animation: fall-52 26s -26s linear infinite;
}

@keyframes fall-52 {
    50.759% {
        transform: translate(127.9567vw, 50.759vh) scale(0.5803);
    }

    to {
        transform: translate(129.2331vw, 100vh) scale(0.5803);
    }
}

.ashes>i:nth-child(53) {
    opacity: 0.4016;
    transform: translate(29.26vw, -10px) scale(0.9155);
    animation: fall-53 22s -15s linear infinite;
}

@keyframes fall-53 {
    56.58% {
        transform: translate(32.8629vw, 56.58vh) scale(0.9155);
    }

    to {
        transform: translate(31.06145vw, 100vh) scale(0.9155);
    }
}

.ashes>i:nth-child(54) {
    opacity: 0.7583;
    transform: translate(407.963vw, -10px) scale(0.2567);
    animation: fall-54 28s -18s linear infinite;
}

@keyframes fall-54 {
    76.499% {
        transform: translate(402.9212vw, 76.499vh) scale(0.2567);
    }

    to {
        transform: translate(405.4421vw, 100vh) scale(0.2567);
    }
}

.ashes>i:nth-child(55) {
    opacity: 0.5256;
    transform: translate(275.8205vw, -10px) scale(0.1289);
    animation: fall-55 22s -6s linear infinite;
}

@keyframes fall-55 {
    69.431% {
        transform: translate(276.7847vw, 69.431vh) scale(0.1289);
    }

    to {
        transform: translate(276.3026vw, 100vh) scale(0.1289);
    }
}

.ashes>i:nth-child(56) {
    opacity: 0.2282;
    transform: translate(172.323vw, -10px) scale(0.6839);
    animation: fall-56 22s -3s linear infinite;
}

@keyframes fall-56 {
    79.249% {
        transform: translate(182.1437vw, 79.249vh) scale(0.6839);
    }

    to {
        transform: translate(177.23335vw, 100vh) scale(0.6839);
    }
}

.ashes>i:nth-child(57) {
    opacity: 0.395;
    transform: translate(51.409vw, -10px) scale(0.2301);
    animation: fall-57 13s -2s linear infinite;
}

@keyframes fall-57 {
    40.12% {
        transform: translate(50.4111vw, 40.12vh) scale(0.2301);
    }

    to {
        transform: translate(50.91005vw, 100vh) scale(0.2301);
    }
}

.ashes>i:nth-child(58) {
    opacity: 0.4153;
    transform: translate(98.1545vw, -10px) scale(0.8948);
    animation: fall-58 19s -11s linear infinite;
}

@keyframes fall-58 {
    48.663% {
        transform: translate(93.124vw, 48.663vh) scale(0.8948);
    }

    to {
        transform: translate(95.63925vw, 100vh) scale(0.8948);
    }
}

.ashes>i:nth-child(59) {
    opacity: 0.805;
    transform: translate(223.861vw, -10px) scale(0.3645);
    animation: fall-59 26s -19s linear infinite;
}

@keyframes fall-59 {
    36.12% {
        transform: translate(214.7898vw, 36.12vh) scale(0.3645);
    }

    to {
        transform: translate(219.3254vw, 100vh) scale(0.3645);
    }
}

.ashes>i:nth-child(60) {
    opacity: 0.2818;
    transform: translate(209.753vw, -10px) scale(0.6195);
    animation: fall-60 30s -2s linear infinite;
}

@keyframes fall-60 {
    72.352% {
        transform: translate(203.3299vw, 72.352vh) scale(0.6195);
    }

    to {
        transform: translate(206.54145vw, 100vh) scale(0.6195);
    }
}

.ashes>i:nth-child(61) {
    opacity: 0.8095;
    transform: translate(250.903vw, -10px) scale(0.3656);
    animation: fall-61 29s -6s linear infinite;
}

@keyframes fall-61 {
    49.464% {
        transform: translate(249.2635vw, 49.464vh) scale(0.3656);
    }

    to {
        transform: translate(250.08325vw, 100vh) scale(0.3656);
    }
}

.ashes>i:nth-child(62) {
    opacity: 0.1292;
    transform: translate(207.9vw, -10px) scale(0.1973);
    animation: fall-62 27s -29s linear infinite;
}

@keyframes fall-62 {
    79.148% {
        transform: translate(215.7956vw, 79.148vh) scale(0.1973);
    }

    to {
        transform: translate(211.8478vw, 100vh) scale(0.1973);
    }
}

.ashes>i:nth-child(63) {
    opacity: 0.1799;
    transform: translate(71.3335vw, -10px) scale(0.0395);
    animation: fall-63 24s -23s linear infinite;
}

@keyframes fall-63 {
    37.692% {
        transform: translate(61.9166vw, 37.692vh) scale(0.0395);
    }

    to {
        transform: translate(66.62505vw, 100vh) scale(0.0395);
    }
}

.ashes>i:nth-child(64) {
    opacity: 0.0254;
    transform: translate(472.148vw, -10px) scale(0.005);
    animation: fall-64 14s -9s linear infinite;
}

@keyframes fall-64 {
    51.362% {
        transform: translate(476.201vw, 51.362vh) scale(0.005);
    }

    to {
        transform: translate(474.1745vw, 100vh) scale(0.005);
    }
}

.ashes>i:nth-child(65) {
    opacity: 0.3131;
    transform: translate(214.855vw, -10px) scale(0.3799);
    animation: fall-65 26s -26s linear infinite;
}

@keyframes fall-65 {
    41.627% {
        transform: translate(219.6079vw, 41.627vh) scale(0.3799);
    }

    to {
        transform: translate(217.23145vw, 100vh) scale(0.3799);
    }
}

.ashes>i:nth-child(66) {
    opacity: 0.1425;
    transform: translate(106.368vw, -10px) scale(0.1459);
    animation: fall-66 25s -29s linear infinite;
}

@keyframes fall-66 {
    62.234% {
        transform: translate(109.5295vw, 62.234vh) scale(0.1459);
    }

    to {
        transform: translate(107.94875vw, 100vh) scale(0.1459);
    }
}

.ashes>i:nth-child(67) {
    opacity: 0.5934;
    transform: translate(230.369vw, -10px) scale(0.8396);
    animation: fall-67 15s -21s linear infinite;
}

@keyframes fall-67 {
    50.774% {
        transform: translate(222.032vw, 50.774vh) scale(0.8396);
    }

    to {
        transform: translate(226.2005vw, 100vh) scale(0.8396);
    }
}

.ashes>i:nth-child(68) {
    opacity: 0.9026;
    transform: translate(453.1105vw, -10px) scale(0.5532);
    animation: fall-68 10s -19s linear infinite;
}

@keyframes fall-68 {
    62.567% {
        transform: translate(455.4652vw, 62.567vh) scale(0.5532);
    }

    to {
        transform: translate(454.28785vw, 100vh) scale(0.5532);
    }
}

.ashes>i:nth-child(69) {
    opacity: 0.0835;
    transform: translate(388.3635vw, -10px) scale(0.2137);
    animation: fall-69 29s -16s linear infinite;
}

@keyframes fall-69 {
    40.892% {
        transform: translate(384.4491vw, 40.892vh) scale(0.2137);
    }

    to {
        transform: translate(386.4063vw, 100vh) scale(0.2137);
    }
}

.ashes>i:nth-child(70) {
    opacity: 0.2234;
    transform: translate(100.74vw, -10px) scale(0.497);
    animation: fall-70 16s -7s linear infinite;
}

@keyframes fall-70 {
    47.045% {
        transform: translate(94.3211vw, 47.045vh) scale(0.497);
    }

    to {
        transform: translate(97.53055vw, 100vh) scale(0.497);
    }
}

.ashes>i:nth-child(71) {
    opacity: 0.8762;
    transform: translate(315.5195vw, -10px) scale(0.251);
    animation: fall-71 14s -22s linear infinite;
}

@keyframes fall-71 {
    71.897% {
        transform: translate(321.0279vw, 71.897vh) scale(0.251);
    }

    to {
        transform: translate(318.2737vw, 100vh) scale(0.251);
    }
}

.ashes>i:nth-child(72) {
    opacity: 0.5182;
    transform: translate(196.088vw, -10px) scale(0.7232);
    animation: fall-72 23s -15s linear infinite;
}

@keyframes fall-72 {
    76.167% {
        transform: translate(201.6868vw, 76.167vh) scale(0.7232);
    }

    to {
        transform: translate(198.8874vw, 100vh) scale(0.7232);
    }
}

.ashes>i:nth-child(73) {
    opacity: 0.9396;
    transform: translate(317.11vw, -10px) scale(0.9923);
    animation: fall-73 29s -20s linear infinite;
}

@keyframes fall-73 {
    41.998% {
        transform: translate(307.9596vw, 41.998vh) scale(0.9923);
    }

    to {
        transform: translate(312.5348vw, 100vh) scale(0.9923);
    }
}

.ashes>i:nth-child(74) {
    opacity: 0.4697;
    transform: translate(237.8445vw, -10px) scale(0.9196);
    animation: fall-74 25s -14s linear infinite;
}

@keyframes fall-74 {
    62.462% {
        transform: translate(242.1652vw, 62.462vh) scale(0.9196);
    }

    to {
        transform: translate(240.00485vw, 100vh) scale(0.9196);
    }
}

.ashes>i:nth-child(75) {
    opacity: 0.1099;
    transform: translate(334.7vw, -10px) scale(0.7273);
    animation: fall-75 24s -19s linear infinite;
}

@keyframes fall-75 {
    47.749% {
        transform: translate(331.9767vw, 47.749vh) scale(0.7273);
    }

    to {
        transform: translate(333.33835vw, 100vh) scale(0.7273);
    }
}

.ashes>i:nth-child(76) {
    opacity: 0.5398;
    transform: translate(271.1855vw, -10px) scale(0.4897);
    animation: fall-76 26s -11s linear infinite;
}

@keyframes fall-76 {
    57.376% {
        transform: translate(273.2129vw, 57.376vh) scale(0.4897);
    }

    to {
        transform: translate(272.1992vw, 100vh) scale(0.4897);
    }
}

.ashes>i:nth-child(77) {
    opacity: 0.5298;
    transform: translate(361.705vw, -10px) scale(0.4814);
    animation: fall-77 19s -1s linear infinite;
}

@keyframes fall-77 {
    44.976% {
        transform: translate(356.0552vw, 44.976vh) scale(0.4814);
    }

    to {
        transform: translate(358.8801vw, 100vh) scale(0.4814);
    }
}

.ashes>i:nth-child(78) {
    opacity: 0.1315;
    transform: translate(112.609vw, -10px) scale(0.7217);
    animation: fall-78 23s -1s linear infinite;
}

@keyframes fall-78 {
    44.572% {
        transform: translate(119.0305vw, 44.572vh) scale(0.7217);
    }

    to {
        transform: translate(115.81975vw, 100vh) scale(0.7217);
    }
}

.ashes>i:nth-child(79) {
    opacity: 0.8605;
    transform: translate(431.9725vw, -10px) scale(0.2586);
    animation: fall-79 30s -19s linear infinite;
}

@keyframes fall-79 {
    55.439% {
        transform: translate(437.6978vw, 55.439vh) scale(0.2586);
    }

    to {
        transform: translate(434.83515vw, 100vh) scale(0.2586);
    }
}

.ashes>i:nth-child(80) {
    opacity: 0.3053;
    transform: translate(268.3605vw, -10px) scale(0.8219);
    animation: fall-80 22s -20s linear infinite;
}

@keyframes fall-80 {
    46.061% {
        transform: translate(271.3617vw, 46.061vh) scale(0.8219);
    }

    to {
        transform: translate(269.8611vw, 100vh) scale(0.8219);
    }
}

.ashes>i:nth-child(81) {
    opacity: 0.3498;
    transform: translate(5.3305vw, -10px) scale(0.5313);
    animation: fall-81 17s -28s linear infinite;
}

@keyframes fall-81 {
    67.289% {
        transform: translate(8.6453vw, 67.289vh) scale(0.5313);
    }

    to {
        transform: translate(6.9879vw, 100vh) scale(0.5313);
    }
}

.ashes>i:nth-child(82) {
    opacity: 0.5134;
    transform: translate(367.546vw, -10px) scale(0.4028);
    animation: fall-82 16s -11s linear infinite;
}

@keyframes fall-82 {
    53.929% {
        transform: translate(359.1636vw, 53.929vh) scale(0.4028);
    }

    to {
        transform: translate(363.3548vw, 100vh) scale(0.4028);
    }
}

.ashes>i:nth-child(83) {
    opacity: 0.1306;
    transform: translate(486.201vw, -10px) scale(0.5803);
    animation: fall-83 17s -24s linear infinite;
}

@keyframes fall-83 {
    59.419% {
        transform: translate(482.0169vw, 59.419vh) scale(0.5803);
    }

    to {
        transform: translate(484.10895vw, 100vh) scale(0.5803);
    }
}

.ashes>i:nth-child(84) {
    opacity: 0.8263;
    transform: translate(77.5965vw, -10px) scale(0.771);
    animation: fall-84 13s -6s linear infinite;
}

@keyframes fall-84 {
    41.197% {
        transform: translate(70.0374vw, 41.197vh) scale(0.771);
    }

    to {
        transform: translate(73.81695vw, 100vh) scale(0.771);
    }
}

.ashes>i:nth-child(85) {
    opacity: 0.3019;
    transform: translate(172.712vw, -10px) scale(0.0962);
    animation: fall-85 18s -15s linear infinite;
}

@keyframes fall-85 {
    49.501% {
        transform: translate(167.0209vw, 49.501vh) scale(0.0962);
    }

    to {
        transform: translate(169.86645vw, 100vh) scale(0.0962);
    }
}

.ashes>i:nth-child(86) {
    opacity: 0.8919;
    transform: translate(348.264vw, -10px) scale(0.026);
    animation: fall-86 16s -4s linear infinite;
}

@keyframes fall-86 {
    67.892% {
        transform: translate(343.7988vw, 67.892vh) scale(0.026);
    }

    to {
        transform: translate(346.0314vw, 100vh) scale(0.026);
    }
}

.ashes>i:nth-child(87) {
    opacity: 0.4289;
    transform: translate(309.0425vw, -10px) scale(0.8285);
    animation: fall-87 10s -26s linear infinite;
}

@keyframes fall-87 {
    66.861% {
        transform: translate(306.0476vw, 66.861vh) scale(0.8285);
    }

    to {
        transform: translate(307.54505vw, 100vh) scale(0.8285);
    }
}

.ashes>i:nth-child(88) {
    opacity: 0.2687;
    transform: translate(464.1885vw, -10px) scale(0.4653);
    animation: fall-88 17s -10s linear infinite;
}

@keyframes fall-88 {
    62.498% {
        transform: translate(457.3531vw, 62.498vh) scale(0.4653);
    }

    to {
        transform: translate(460.7708vw, 100vh) scale(0.4653);
    }
}

.ashes>i:nth-child(89) {
    opacity: 0.5089;
    transform: translate(156.6925vw, -10px) scale(0.836);
    animation: fall-89 19s -15s linear infinite;
}

@keyframes fall-89 {
    34.576% {
        transform: translate(161.3867vw, 34.576vh) scale(0.836);
    }

    to {
        transform: translate(159.0396vw, 100vh) scale(0.836);
    }
}

.ashes>i:nth-child(90) {
    opacity: 0.5561;
    transform: translate(346.245vw, -10px) scale(0.2972);
    animation: fall-90 10s -29s linear infinite;
}

@keyframes fall-90 {
    70.665% {
        transform: translate(347.3293vw, 70.665vh) scale(0.2972);
    }

    to {
        transform: translate(346.78715vw, 100vh) scale(0.2972);
    }
}

.ashes>i:nth-child(91) {
    opacity: 0.4756;
    transform: translate(451.8625vw, -10px) scale(0.632);
    animation: fall-91 13s -10s linear infinite;
}

@keyframes fall-91 {
    79.87% {
        transform: translate(456.9092vw, 79.87vh) scale(0.632);
    }

    to {
        transform: translate(454.38585vw, 100vh) scale(0.632);
    }
}

.ashes>i:nth-child(92) {
    opacity: 0.3907;
    transform: translate(407.508vw, -10px) scale(0.1993);
    animation: fall-92 18s -8s linear infinite;
}

@keyframes fall-92 {
    76.416% {
        transform: translate(415.8882vw, 76.416vh) scale(0.1993);
    }

    to {
        transform: translate(411.6981vw, 100vh) scale(0.1993);
    }
}

.ashes>i:nth-child(93) {
    opacity: 0.1365;
    transform: translate(337.8715vw, -10px) scale(0.1207);
    animation: fall-93 12s -28s linear infinite;
}

@keyframes fall-93 {
    34.369% {
        transform: translate(341.121vw, 34.369vh) scale(0.1207);
    }

    to {
        transform: translate(339.49625vw, 100vh) scale(0.1207);
    }
}

.ashes>i:nth-child(94) {
    opacity: 0.1527;
    transform: translate(64.558vw, -10px) scale(0.9738);
    animation: fall-94 16s -14s linear infinite;
}

@keyframes fall-94 {
    40.323% {
        transform: translate(73.1124vw, 40.323vh) scale(0.9738);
    }

    to {
        transform: translate(68.8352vw, 100vh) scale(0.9738);
    }
}

.ashes>i:nth-child(95) {
    opacity: 0.7462;
    transform: translate(398.4885vw, -10px) scale(0.1719);
    animation: fall-95 11s -14s linear infinite;
}

@keyframes fall-95 {
    44.531% {
        transform: translate(393.6662vw, 44.531vh) scale(0.1719);
    }

    to {
        transform: translate(396.07735vw, 100vh) scale(0.1719);
    }
}

.ashes>i:nth-child(96) {
    opacity: 0.3134;
    transform: translate(177.4225vw, -10px) scale(0.6495);
    animation: fall-96 20s -19s linear infinite;
}

@keyframes fall-96 {
    72.818% {
        transform: translate(177.1808vw, 72.818vh) scale(0.6495);
    }

    to {
        transform: translate(177.30165vw, 100vh) scale(0.6495);
    }
}

.ashes>i:nth-child(97) {
    opacity: 0.774;
    transform: translate(161.8vw, -10px) scale(0.0539);
    animation: fall-97 11s -3s linear infinite;
}

@keyframes fall-97 {
    61.705% {
        transform: translate(154.0078vw, 61.705vh) scale(0.0539);
    }

    to {
        transform: translate(157.9039vw, 100vh) scale(0.0539);
    }
}

.ashes>i:nth-child(98) {
    opacity: 0.8276;
    transform: translate(137.8995vw, -10px) scale(0.9752);
    animation: fall-98 25s -29s linear infinite;
}

@keyframes fall-98 {
    52.663% {
        transform: translate(142.8082vw, 52.663vh) scale(0.9752);
    }

    to {
        transform: translate(140.35385vw, 100vh) scale(0.9752);
    }
}

.ashes>i:nth-child(99) {
    opacity: 0.6253;
    transform: translate(448.2385vw, -10px) scale(0.8333);
    animation: fall-99 30s -8s linear infinite;
}

@keyframes fall-99 {
    38.662% {
        transform: translate(450.2116vw, 38.662vh) scale(0.8333);
    }

    to {
        transform: translate(449.22505vw, 100vh) scale(0.8333);
    }
}

.ashes>i:nth-child(100) {
    opacity: 0.0504;
    transform: translate(443.611vw, -10px) scale(0.311);
    animation: fall-100 22s -14s linear infinite;
}

@keyframes fall-100 {
    67.518% {
        transform: translate(449.6002vw, 67.518vh) scale(0.311);
    }

    to {
        transform: translate(446.6056vw, 100vh) scale(0.311);
    }
}

.ashes>i:nth-child(101) {
    opacity: 0.1793;
    transform: translate(240.1485vw, -10px) scale(0.4559);
    animation: fall-101 19s -22s linear infinite;
}

@keyframes fall-101 {
    62.427% {
        transform: translate(238.8156vw, 62.427vh) scale(0.4559);
    }

    to {
        transform: translate(239.48205vw, 100vh) scale(0.4559);
    }
}

.ashes>i:nth-child(102) {
    opacity: 0.1321;
    transform: translate(83.276vw, -10px) scale(0.7386);
    animation: fall-102 11s -9s linear infinite;
}

@keyframes fall-102 {
    39.054% {
        transform: translate(75.9107vw, 39.054vh) scale(0.7386);
    }

    to {
        transform: translate(79.59335vw, 100vh) scale(0.7386);
    }
}

.ashes>i:nth-child(103) {
    opacity: 0.2268;
    transform: translate(189.931vw, -10px) scale(0.3551);
    animation: fall-103 25s -18s linear infinite;
}

@keyframes fall-103 {
    78.144% {
        transform: translate(181.6103vw, 78.144vh) scale(0.3551);
    }

    to {
        transform: translate(185.77065vw, 100vh) scale(0.3551);
    }
}

.ashes>i:nth-child(104) {
    opacity: 0.2717;
    transform: translate(174.5415vw, -10px) scale(0.4307);
    animation: fall-104 16s -27s linear infinite;
}

@keyframes fall-104 {
    38.91% {
        transform: translate(179.332vw, 38.91vh) scale(0.4307);
    }

    to {
        transform: translate(176.93675vw, 100vh) scale(0.4307);
    }
}

.ashes>i:nth-child(105) {
    opacity: 0.2042;
    transform: translate(88.3325vw, -10px) scale(0.3726);
    animation: fall-105 30s -10s linear infinite;
}

@keyframes fall-105 {
    61.549% {
        transform: translate(79.5444vw, 61.549vh) scale(0.3726);
    }

    to {
        transform: translate(83.93845vw, 100vh) scale(0.3726);
    }
}

.ashes>i:nth-child(106) {
    opacity: 0.2165;
    transform: translate(351.744vw, -10px) scale(0.7566);
    animation: fall-106 29s -12s linear infinite;
}

@keyframes fall-106 {
    79.453% {
        transform: translate(360.5272vw, 79.453vh) scale(0.7566);
    }

    to {
        transform: translate(356.1356vw, 100vh) scale(0.7566);
    }
}

.ashes>i:nth-child(107) {
    opacity: 0.3405;
    transform: translate(24.866vw, -10px) scale(0.5635);
    animation: fall-107 26s -28s linear infinite;
}

@keyframes fall-107 {
    34.83% {
        transform: translate(19.4421vw, 34.83vh) scale(0.5635);
    }

    to {
        transform: translate(22.15405vw, 100vh) scale(0.5635);
    }
}

.ashes>i:nth-child(108) {
    opacity: 0.5772;
    transform: translate(310.354vw, -10px) scale(0.4245);
    animation: fall-108 26s -12s linear infinite;
}

@keyframes fall-108 {
    35.284% {
        transform: translate(303.781vw, 35.284vh) scale(0.4245);
    }

    to {
        transform: translate(307.0675vw, 100vh) scale(0.4245);
    }
}

.ashes>i:nth-child(109) {
    opacity: 0.0179;
    transform: translate(172.564vw, -10px) scale(0.8928);
    animation: fall-109 27s -21s linear infinite;
}

@keyframes fall-109 {
    50.421% {
        transform: translate(181.4369vw, 50.421vh) scale(0.8928);
    }

    to {
        transform: translate(177.00045vw, 100vh) scale(0.8928);
    }
}

.ashes>i:nth-child(110) {
    opacity: 0.2041;
    transform: translate(475.384vw, -10px) scale(0.0828);
    animation: fall-110 20s -5s linear infinite;
}

@keyframes fall-110 {
    78.281% {
        transform: translate(480.7507vw, 78.281vh) scale(0.0828);
    }

    to {
        transform: translate(478.06735vw, 100vh) scale(0.0828);
    }
}

.ashes>i:nth-child(111) {
    opacity: 0.547;
    transform: translate(459.383vw, -10px) scale(0.9926);
    animation: fall-111 12s -24s linear infinite;
}

@keyframes fall-111 {
    30.125% {
        transform: translate(455.7745vw, 30.125vh) scale(0.9926);
    }

    to {
        transform: translate(457.57875vw, 100vh) scale(0.9926);
    }
}

.ashes>i:nth-child(112) {
    opacity: 0.2311;
    transform: translate(136.0055vw, -10px) scale(0.5801);
    animation: fall-112 13s -13s linear infinite;
}

@keyframes fall-112 {
    56.347% {
        transform: translate(127.4489vw, 56.347vh) scale(0.5801);
    }

    to {
        transform: translate(131.7272vw, 100vh) scale(0.5801);
    }
}

.ashes>i:nth-child(113) {
    opacity: 0.1805;
    transform: translate(31.617vw, -10px) scale(0.1457);
    animation: fall-113 25s -26s linear infinite;
}

@keyframes fall-113 {
    61.228% {
        transform: translate(26.766vw, 61.228vh) scale(0.1457);
    }

    to {
        transform: translate(29.1915vw, 100vh) scale(0.1457);
    }
}

.ashes>i:nth-child(114) {
    opacity: 0.3481;
    transform: translate(318.736vw, -10px) scale(0.3724);
    animation: fall-114 25s -2s linear infinite;
}

@keyframes fall-114 {
    35.153% {
        transform: translate(318.2802vw, 35.153vh) scale(0.3724);
    }

    to {
        transform: translate(318.5081vw, 100vh) scale(0.3724);
    }
}

.ashes>i:nth-child(115) {
    opacity: 0.9024;
    transform: translate(457.26vw, -10px) scale(0.1872);
    animation: fall-115 29s -6s linear infinite;
}

@keyframes fall-115 {
    60.059% {
        transform: translate(460.1052vw, 60.059vh) scale(0.1872);
    }

    to {
        transform: translate(458.6826vw, 100vh) scale(0.1872);
    }
}

.ashes>i:nth-child(116) {
    opacity: 0.8273;
    transform: translate(164.7925vw, -10px) scale(0.8272);
    animation: fall-116 12s -14s linear infinite;
}

@keyframes fall-116 {
    58.104% {
        transform: translate(169.0806vw, 58.104vh) scale(0.8272);
    }

    to {
        transform: translate(166.93655vw, 100vh) scale(0.8272);
    }
}

.ashes>i:nth-child(117) {
    opacity: 0.6391;
    transform: translate(34.4955vw, -10px) scale(0.3703);
    animation: fall-117 29s -11s linear infinite;
}

@keyframes fall-117 {
    62.937% {
        transform: translate(40.3083vw, 62.937vh) scale(0.3703);
    }

    to {
        transform: translate(37.4019vw, 100vh) scale(0.3703);
    }
}

.ashes>i:nth-child(118) {
    opacity: 0.4618;
    transform: translate(189.914vw, -10px) scale(0.0967);
    animation: fall-118 14s -1s linear infinite;
}

@keyframes fall-118 {
    58.921% {
        transform: translate(189.1421vw, 58.921vh) scale(0.0967);
    }

    to {
        transform: translate(189.52805vw, 100vh) scale(0.0967);
    }
}

.ashes>i:nth-child(119) {
    opacity: 0.7347;
    transform: translate(365.0795vw, -10px) scale(0.4211);
    animation: fall-119 24s -2s linear infinite;
}

@keyframes fall-119 {
    40.979% {
        transform: translate(357.6014vw, 40.979vh) scale(0.4211);
    }

    to {
        transform: translate(361.34045vw, 100vh) scale(0.4211);
    }
}

.ashes>i:nth-child(120) {
    opacity: 0.9102;
    transform: translate(272.56vw, -10px) scale(0.5954);
    animation: fall-120 12s -16s linear infinite;
}

@keyframes fall-120 {
    64.093% {
        transform: translate(273.3769vw, 64.093vh) scale(0.5954);
    }

    to {
        transform: translate(272.96845vw, 100vh) scale(0.5954);
    }
}

.ashes>i:nth-child(121) {
    opacity: 0.3099;
    transform: translate(495.2205vw, -10px) scale(0.4548);
    animation: fall-121 15s -18s linear infinite;
}

@keyframes fall-121 {
    37.838% {
        transform: translate(494.5682vw, 37.838vh) scale(0.4548);
    }

    to {
        transform: translate(494.89435vw, 100vh) scale(0.4548);
    }
}

.ashes>i:nth-child(122) {
    opacity: 0.3712;
    transform: translate(36.5025vw, -10px) scale(0.6574);
    animation: fall-122 24s -30s linear infinite;
}

@keyframes fall-122 {
    69.822% {
        transform: translate(34.2059vw, 69.822vh) scale(0.6574);
    }

    to {
        transform: translate(35.3542vw, 100vh) scale(0.6574);
    }
}

.ashes>i:nth-child(123) {
    opacity: 0.2575;
    transform: translate(218.9135vw, -10px) scale(0.0113);
    animation: fall-123 24s -8s linear infinite;
}

@keyframes fall-123 {
    47.72% {
        transform: translate(226.9283vw, 47.72vh) scale(0.0113);
    }

    to {
        transform: translate(222.9209vw, 100vh) scale(0.0113);
    }
}

.ashes>i:nth-child(124) {
    opacity: 0.1049;
    transform: translate(426.8975vw, -10px) scale(0.1048);
    animation: fall-124 23s -11s linear infinite;
}

@keyframes fall-124 {
    56.418% {
        transform: translate(420.6725vw, 56.418vh) scale(0.1048);
    }

    to {
        transform: translate(423.785vw, 100vh) scale(0.1048);
    }
}

.ashes>i:nth-child(125) {
    opacity: 0.8269;
    transform: translate(10.2245vw, -10px) scale(0.0575);
    animation: fall-125 29s -3s linear infinite;
}

@keyframes fall-125 {
    33.67% {
        transform: translate(3.8327vw, 33.67vh) scale(0.0575);
    }

    to {
        transform: translate(7.0286vw, 100vh) scale(0.0575);
    }
}

.ashes>i:nth-child(126) {
    opacity: 0.2297;
    transform: translate(335.4775vw, -10px) scale(0.7616);
    animation: fall-126 13s -15s linear infinite;
}

@keyframes fall-126 {
    68.167% {
        transform: translate(327.7345vw, 68.167vh) scale(0.7616);
    }

    to {
        transform: translate(331.606vw, 100vh) scale(0.7616);
    }
}

.ashes>i:nth-child(127) {
    opacity: 0.47;
    transform: translate(240.9815vw, -10px) scale(0.159);
    animation: fall-127 13s -16s linear infinite;
}

@keyframes fall-127 {
    43.947% {
        transform: translate(243.931vw, 43.947vh) scale(0.159);
    }

    to {
        transform: translate(242.45625vw, 100vh) scale(0.159);
    }
}

.ashes>i:nth-child(128) {
    opacity: 0.8491;
    transform: translate(237.03vw, -10px) scale(0.1056);
    animation: fall-128 17s -22s linear infinite;
}

@keyframes fall-128 {
    77.55% {
        transform: translate(244.9064vw, 77.55vh) scale(0.1056);
    }

    to {
        transform: translate(240.9682vw, 100vh) scale(0.1056);
    }
}

.ashes>i:nth-child(129) {
    opacity: 0.5288;
    transform: translate(162.508vw, -10px) scale(0.854);
    animation: fall-129 22s -3s linear infinite;
}

@keyframes fall-129 {
    76.107% {
        transform: translate(163.318vw, 76.107vh) scale(0.854);
    }

    to {
        transform: translate(162.913vw, 100vh) scale(0.854);
    }
}

.ashes>i:nth-child(130) {
    opacity: 0.2942;
    transform: translate(302.2405vw, -10px) scale(0.3708);
    animation: fall-130 29s -3s linear infinite;
}

@keyframes fall-130 {
    53.918% {
        transform: translate(311.1962vw, 53.918vh) scale(0.3708);
    }

    to {
        transform: translate(306.71835vw, 100vh) scale(0.3708);
    }
}

.ashes>i:nth-child(131) {
    opacity: 0.2443;
    transform: translate(429.428vw, -10px) scale(0.6217);
    animation: fall-131 21s -16s linear infinite;
}

@keyframes fall-131 {
    61.394% {
        transform: translate(424.8052vw, 61.394vh) scale(0.6217);
    }

    to {
        transform: translate(427.1166vw, 100vh) scale(0.6217);
    }
}

.ashes>i:nth-child(132) {
    opacity: 0.7215;
    transform: translate(468.59vw, -10px) scale(0.3503);
    animation: fall-132 12s -29s linear infinite;
}

@keyframes fall-132 {
    74.907% {
        transform: translate(464.1779vw, 74.907vh) scale(0.3503);
    }

    to {
        transform: translate(466.38395vw, 100vh) scale(0.3503);
    }
}

.ashes>i:nth-child(133) {
    opacity: 0.2489;
    transform: translate(322.585vw, -10px) scale(0.1871);
    animation: fall-133 11s -12s linear infinite;
}

@keyframes fall-133 {
    34.934% {
        transform: translate(315.4984vw, 34.934vh) scale(0.1871);
    }

    to {
        transform: translate(319.0417vw, 100vh) scale(0.1871);
    }
}

.ashes>i:nth-child(134) {
    opacity: 0.8579;
    transform: translate(281.4085vw, -10px) scale(0.3902);
    animation: fall-134 26s -6s linear infinite;
}

@keyframes fall-134 {
    72.555% {
        transform: translate(285.5571vw, 72.555vh) scale(0.3902);
    }

    to {
        transform: translate(283.4828vw, 100vh) scale(0.3902);
    }
}

.ashes>i:nth-child(135) {
    opacity: 0.3415;
    transform: translate(497.1825vw, -10px) scale(0.4046);
    animation: fall-135 18s -22s linear infinite;
}

@keyframes fall-135 {
    48.424% {
        transform: translate(500.4861vw, 48.424vh) scale(0.4046);
    }

    to {
        transform: translate(498.8343vw, 100vh) scale(0.4046);
    }
}

.ashes>i:nth-child(136) {
    opacity: 0.2528;
    transform: translate(313.923vw, -10px) scale(0.9857);
    animation: fall-136 18s -20s linear infinite;
}

@keyframes fall-136 {
    38.595% {
        transform: translate(316.5172vw, 38.595vh) scale(0.9857);
    }

    to {
        transform: translate(315.2201vw, 100vh) scale(0.9857);
    }
}

.ashes>i:nth-child(137) {
    opacity: 0.209;
    transform: translate(351.3975vw, -10px) scale(0.4755);
    animation: fall-137 11s -2s linear infinite;
}

@keyframes fall-137 {
    47.788% {
        transform: translate(348.5861vw, 47.788vh) scale(0.4755);
    }

    to {
        transform: translate(349.9918vw, 100vh) scale(0.4755);
    }
}

.ashes>i:nth-child(138) {
    opacity: 0.657;
    transform: translate(1.9385vw, -10px) scale(0.5235);
    animation: fall-138 18s -26s linear infinite;
}

@keyframes fall-138 {
    55.993% {
        transform: translate(5.4528vw, 55.993vh) scale(0.5235);
    }

    to {
        transform: translate(3.69565vw, 100vh) scale(0.5235);
    }
}

.ashes>i:nth-child(139) {
    opacity: 0.8839;
    transform: translate(149.9925vw, -10px) scale(0.1628);
    animation: fall-139 18s -6s linear infinite;
}

@keyframes fall-139 {
    31.367% {
        transform: translate(156.7016vw, 31.367vh) scale(0.1628);
    }

    to {
        transform: translate(153.34705vw, 100vh) scale(0.1628);
    }
}

.ashes>i:nth-child(140) {
    opacity: 0.0351;
    transform: translate(476.9585vw, -10px) scale(0.6958);
    animation: fall-140 22s -20s linear infinite;
}

@keyframes fall-140 {
    38.7% {
        transform: translate(473.2125vw, 38.7vh) scale(0.6958);
    }

    to {
        transform: translate(475.0855vw, 100vh) scale(0.6958);
    }
}

.ashes>i:nth-child(141) {
    opacity: 0.7427;
    transform: translate(187.416vw, -10px) scale(0.5552);
    animation: fall-141 10s -2s linear infinite;
}

@keyframes fall-141 {
    67.349% {
        transform: translate(188.5194vw, 67.349vh) scale(0.5552);
    }

    to {
        transform: translate(187.9677vw, 100vh) scale(0.5552);
    }
}

.ashes>i:nth-child(142) {
    opacity: 0.6567;
    transform: translate(491.2555vw, -10px) scale(0.0677);
    animation: fall-142 13s -27s linear infinite;
}

@keyframes fall-142 {
    54.081% {
        transform: translate(491.1437vw, 54.081vh) scale(0.0677);
    }

    to {
        transform: translate(491.1996vw, 100vh) scale(0.0677);
    }
}

.ashes>i:nth-child(143) {
    opacity: 0.1715;
    transform: translate(200.993vw, -10px) scale(0.3795);
    animation: fall-143 14s -9s linear infinite;
}

@keyframes fall-143 {
    74.4% {
        transform: translate(197.5939vw, 74.4vh) scale(0.3795);
    }

    to {
        transform: translate(199.29345vw, 100vh) scale(0.3795);
    }
}

.ashes>i:nth-child(144) {
    opacity: 0.503;
    transform: translate(485.963vw, -10px) scale(0.9882);
    animation: fall-144 11s -14s linear infinite;
}

@keyframes fall-144 {
    75.426% {
        transform: translate(479.1928vw, 75.426vh) scale(0.9882);
    }

    to {
        transform: translate(482.5779vw, 100vh) scale(0.9882);
    }
}

.ashes>i:nth-child(145) {
    opacity: 0.4237;
    transform: translate(185.877vw, -10px) scale(0.1604);
    animation: fall-145 27s -30s linear infinite;
}

@keyframes fall-145 {
    66.002% {
        transform: translate(180.9751vw, 66.002vh) scale(0.1604);
    }

    to {
        transform: translate(183.42605vw, 100vh) scale(0.1604);
    }
}

.ashes>i:nth-child(146) {
    opacity: 0.0998;
    transform: translate(62.314vw, -10px) scale(0.2496);
    animation: fall-146 28s -10s linear infinite;
}

@keyframes fall-146 {
    44.135% {
        transform: translate(64.5153vw, 44.135vh) scale(0.2496);
    }

    to {
        transform: translate(63.41465vw, 100vh) scale(0.2496);
    }
}

.ashes>i:nth-child(147) {
    opacity: 0.8994;
    transform: translate(89.6505vw, -10px) scale(0.7725);
    animation: fall-147 29s -29s linear infinite;
}

@keyframes fall-147 {
    66.975% {
        transform: translate(91.575vw, 66.975vh) scale(0.7725);
    }

    to {
        transform: translate(90.61275vw, 100vh) scale(0.7725);
    }
}

.ashes>i:nth-child(148) {
    opacity: 0.0518;
    transform: translate(192.5675vw, -10px) scale(0.3958);
    animation: fall-148 16s -26s linear infinite;
}

@keyframes fall-148 {
    72.458% {
        transform: translate(184.7082vw, 72.458vh) scale(0.3958);
    }

    to {
        transform: translate(188.63785vw, 100vh) scale(0.3958);
    }
}

.ashes>i:nth-child(149) {
    opacity: 0.8914;
    transform: translate(112.3925vw, -10px) scale(0.1657);
    animation: fall-149 20s -4s linear infinite;
}

@keyframes fall-149 {
    32.582% {
        transform: translate(120.8077vw, 32.582vh) scale(0.1657);
    }

    to {
        transform: translate(116.6001vw, 100vh) scale(0.1657);
    }
}

.ashes>i:nth-child(150) {
    opacity: 0.0547;
    transform: translate(312.6045vw, -10px) scale(0.8057);
    animation: fall-150 17s -24s linear infinite;
}

@keyframes fall-150 {
    60.002% {
        transform: translate(306.911vw, 60.002vh) scale(0.8057);
    }

    to {
        transform: translate(309.75775vw, 100vh) scale(0.8057);
    }
}

.ashes>i:nth-child(151) {
    opacity: 0.633;
    transform: translate(9.108vw, -10px) scale(0.3339);
    animation: fall-151 25s -18s linear infinite;
}

@keyframes fall-151 {
    65.56% {
        transform: translate(9.1462vw, 65.56vh) scale(0.3339);
    }

    to {
        transform: translate(9.1271vw, 100vh) scale(0.3339);
    }
}

.ashes>i:nth-child(152) {
    opacity: 0.2613;
    transform: translate(414.317vw, -10px) scale(0.4199);
    animation: fall-152 22s -15s linear infinite;
}

@keyframes fall-152 {
    43.37% {
        transform: translate(409.5099vw, 43.37vh) scale(0.4199);
    }

    to {
        transform: translate(411.91345vw, 100vh) scale(0.4199);
    }
}

.ashes>i:nth-child(153) {
    opacity: 0.2259;
    transform: translate(94.8vw, -10px) scale(0.6037);
    animation: fall-153 19s -12s linear infinite;
}

@keyframes fall-153 {
    50.972% {
        transform: translate(88.4373vw, 50.972vh) scale(0.6037);
    }

    to {
        transform: translate(91.61865vw, 100vh) scale(0.6037);
    }
}

.ashes>i:nth-child(154) {
    opacity: 0.2995;
    transform: translate(388.6305vw, -10px) scale(0.7543);
    animation: fall-154 29s -8s linear infinite;
}

@keyframes fall-154 {
    66.323% {
        transform: translate(397.4545vw, 66.323vh) scale(0.7543);
    }

    to {
        transform: translate(393.0425vw, 100vh) scale(0.7543);
    }
}

.ashes>i:nth-child(155) {
    opacity: 0.7538;
    transform: translate(469.158vw, -10px) scale(0.474);
    animation: fall-155 29s -28s linear infinite;
}

@keyframes fall-155 {
    39.409% {
        transform: translate(471.5128vw, 39.409vh) scale(0.474);
    }

    to {
        transform: translate(470.3354vw, 100vh) scale(0.474);
    }
}

.ashes>i:nth-child(156) {
    opacity: 0.1022;
    transform: translate(387.9105vw, -10px) scale(0.2377);
    animation: fall-156 18s -29s linear infinite;
}

@keyframes fall-156 {
    68.365% {
        transform: translate(383.7634vw, 68.365vh) scale(0.2377);
    }

    to {
        transform: translate(385.83695vw, 100vh) scale(0.2377);
    }
}

.ashes>i:nth-child(157) {
    opacity: 0.159;
    transform: translate(169.5175vw, -10px) scale(0.2591);
    animation: fall-157 20s -12s linear infinite;
}

@keyframes fall-157 {
    31.736% {
        transform: translate(166.4324vw, 31.736vh) scale(0.2591);
    }

    to {
        transform: translate(167.97495vw, 100vh) scale(0.2591);
    }
}

.ashes>i:nth-child(158) {
    opacity: 0.4328;
    transform: translate(358.1385vw, -10px) scale(0.5414);
    animation: fall-158 24s -20s linear infinite;
}

@keyframes fall-158 {
    63.799% {
        transform: translate(364.3476vw, 63.799vh) scale(0.5414);
    }

    to {
        transform: translate(361.24305vw, 100vh) scale(0.5414);
    }
}

.ashes>i:nth-child(159) {
    opacity: 0.8536;
    transform: translate(39.986vw, -10px) scale(0.7276);
    animation: fall-159 10s -23s linear infinite;
}

@keyframes fall-159 {
    38.236% {
        transform: translate(31.8935vw, 38.236vh) scale(0.7276);
    }

    to {
        transform: translate(35.93975vw, 100vh) scale(0.7276);
    }
}

.ashes>i:nth-child(160) {
    opacity: 0.9147;
    transform: translate(25.0415vw, -10px) scale(0.8182);
    animation: fall-160 11s -25s linear infinite;
}

@keyframes fall-160 {
    63.75% {
        transform: translate(32.561vw, 63.75vh) scale(0.8182);
    }

    to {
        transform: translate(28.80125vw, 100vh) scale(0.8182);
    }
}

.ashes>i:nth-child(161) {
    opacity: 0.7091;
    transform: translate(433.8465vw, -10px) scale(0.477);
    animation: fall-161 17s -12s linear infinite;
}

@keyframes fall-161 {
    65.764% {
        transform: translate(424.783vw, 65.764vh) scale(0.477);
    }

    to {
        transform: translate(429.31475vw, 100vh) scale(0.477);
    }
}

.ashes>i:nth-child(162) {
    opacity: 0.6937;
    transform: translate(115.6445vw, -10px) scale(0.2894);
    animation: fall-162 26s -20s linear infinite;
}

@keyframes fall-162 {
    42.009% {
        transform: translate(124.7365vw, 42.009vh) scale(0.2894);
    }

    to {
        transform: translate(120.1905vw, 100vh) scale(0.2894);
    }
}

.ashes>i:nth-child(163) {
    opacity: 0.017;
    transform: translate(389.6385vw, -10px) scale(0.8645);
    animation: fall-163 27s -19s linear infinite;
}

@keyframes fall-163 {
    32.504% {
        transform: translate(392.9085vw, 32.504vh) scale(0.8645);
    }

    to {
        transform: translate(391.2735vw, 100vh) scale(0.8645);
    }
}

.ashes>i:nth-child(164) {
    opacity: 0.689;
    transform: translate(331.7815vw, -10px) scale(0.8441);
    animation: fall-164 15s -12s linear infinite;
}

@keyframes fall-164 {
    42.506% {
        transform: translate(327.2001vw, 42.506vh) scale(0.8441);
    }

    to {
        transform: translate(329.4908vw, 100vh) scale(0.8441);
    }
}

.ashes>i:nth-child(165) {
    opacity: 0.6354;
    transform: translate(113.963vw, -10px) scale(0.2066);
    animation: fall-165 10s -25s linear infinite;
}

@keyframes fall-165 {
    62.029% {
        transform: translate(111.4648vw, 62.029vh) scale(0.2066);
    }

    to {
        transform: translate(112.7139vw, 100vh) scale(0.2066);
    }
}

.ashes>i:nth-child(166) {
    opacity: 0.3748;
    transform: translate(25.0845vw, -10px) scale(0.036);
    animation: fall-166 17s -18s linear infinite;
}

@keyframes fall-166 {
    37.981% {
        transform: translate(18.9353vw, 37.981vh) scale(0.036);
    }

    to {
        transform: translate(22.0099vw, 100vh) scale(0.036);
    }
}

.ashes>i:nth-child(167) {
    opacity: 0.1094;
    transform: translate(146.979vw, -10px) scale(0.8074);
    animation: fall-167 24s -16s linear infinite;
}

@keyframes fall-167 {
    44.04% {
        transform: translate(151.3109vw, 44.04vh) scale(0.8074);
    }

    to {
        transform: translate(149.14495vw, 100vh) scale(0.8074);
    }
}

.ashes>i:nth-child(168) {
    opacity: 0.2601;
    transform: translate(470.032vw, -10px) scale(0.0736);
    animation: fall-168 19s -18s linear infinite;
}

@keyframes fall-168 {
    33.956% {
        transform: translate(463.1419vw, 33.956vh) scale(0.0736);
    }

    to {
        transform: translate(466.58695vw, 100vh) scale(0.0736);
    }
}

.ashes>i:nth-child(169) {
    opacity: 0.7716;
    transform: translate(491.8515vw, -10px) scale(0.1398);
    animation: fall-169 27s -25s linear infinite;
}

@keyframes fall-169 {
    69.041% {
        transform: translate(494.3118vw, 69.041vh) scale(0.1398);
    }

    to {
        transform: translate(493.08165vw, 100vh) scale(0.1398);
    }
}

.ashes>i:nth-child(170) {
    opacity: 0.5033;
    transform: translate(434.7295vw, -10px) scale(0.7615);
    animation: fall-170 24s -30s linear infinite;
}

@keyframes fall-170 {
    70.829% {
        transform: translate(430.3989vw, 70.829vh) scale(0.7615);
    }

    to {
        transform: translate(432.5642vw, 100vh) scale(0.7615);
    }
}

.ashes>i:nth-child(171) {
    opacity: 0.5031;
    transform: translate(243.0775vw, -10px) scale(0.5918);
    animation: fall-171 15s -17s linear infinite;
}

@keyframes fall-171 {
    50.768% {
        transform: translate(237.2988vw, 50.768vh) scale(0.5918);
    }

    to {
        transform: translate(240.18815vw, 100vh) scale(0.5918);
    }
}

.ashes>i:nth-child(172) {
    opacity: 0.8091;
    transform: translate(317.4645vw, -10px) scale(0.7074);
    animation: fall-172 22s -14s linear infinite;
}

@keyframes fall-172 {
    61.063% {
        transform: translate(316.598vw, 61.063vh) scale(0.7074);
    }

    to {
        transform: translate(317.03125vw, 100vh) scale(0.7074);
    }
}

.ashes>i:nth-child(173) {
    opacity: 0.6989;
    transform: translate(86.5135vw, -10px) scale(0.1015);
    animation: fall-173 21s -27s linear infinite;
}

@keyframes fall-173 {
    30.051% {
        transform: translate(94.7469vw, 30.051vh) scale(0.1015);
    }

    to {
        transform: translate(90.6302vw, 100vh) scale(0.1015);
    }
}

.ashes>i:nth-child(174) {
    opacity: 0.3142;
    transform: translate(13.1315vw, -10px) scale(0.7796);
    animation: fall-174 26s -23s linear infinite;
}

@keyframes fall-174 {
    37.218% {
        transform: translate(19.2776vw, 37.218vh) scale(0.7796);
    }

    to {
        transform: translate(16.20455vw, 100vh) scale(0.7796);
    }
}

.ashes>i:nth-child(175) {
    opacity: 0.8177;
    transform: translate(420.68vw, -10px) scale(0.3577);
    animation: fall-175 11s -27s linear infinite;
}

@keyframes fall-175 {
    30.578% {
        transform: translate(419.5967vw, 30.578vh) scale(0.3577);
    }

    to {
        transform: translate(420.13835vw, 100vh) scale(0.3577);
    }
}

.ashes>i:nth-child(176) {
    opacity: 0.9196;
    transform: translate(30.1795vw, -10px) scale(0.2133);
    animation: fall-176 29s -3s linear infinite;
}

@keyframes fall-176 {
    72.357% {
        transform: translate(36.9471vw, 72.357vh) scale(0.2133);
    }

    to {
        transform: translate(33.5633vw, 100vh) scale(0.2133);
    }
}

.ashes>i:nth-child(177) {
    opacity: 0.9859;
    transform: translate(300.3285vw, -10px) scale(0.8506);
    animation: fall-177 16s -7s linear infinite;
}

@keyframes fall-177 {
    70.939% {
        transform: translate(297.5658vw, 70.939vh) scale(0.8506);
    }

    to {
        transform: translate(298.94715vw, 100vh) scale(0.8506);
    }
}

.ashes>i:nth-child(178) {
    opacity: 0.0122;
    transform: translate(347.132vw, -10px) scale(0.6875);
    animation: fall-178 22s -3s linear infinite;
}

@keyframes fall-178 {
    44.526% {
        transform: translate(356.2904vw, 44.526vh) scale(0.6875);
    }

    to {
        transform: translate(351.7112vw, 100vh) scale(0.6875);
    }
}

.ashes>i:nth-child(179) {
    opacity: 0.1311;
    transform: translate(356.6735vw, -10px) scale(0.6678);
    animation: fall-179 10s -15s linear infinite;
}

@keyframes fall-179 {
    42.73% {
        transform: translate(353.1812vw, 42.73vh) scale(0.6678);
    }

    to {
        transform: translate(354.92735vw, 100vh) scale(0.6678);
    }
}

.ashes>i:nth-child(180) {
    opacity: 0.318;
    transform: translate(463.9155vw, -10px) scale(0.5224);
    animation: fall-180 14s -30s linear infinite;
}

@keyframes fall-180 {
    37.129% {
        transform: translate(460.6465vw, 37.129vh) scale(0.5224);
    }

    to {
        transform: translate(462.281vw, 100vh) scale(0.5224);
    }
}

.ashes>i:nth-child(181) {
    opacity: 0.2378;
    transform: translate(70.03vw, -10px) scale(0.1916);
    animation: fall-181 27s -26s linear infinite;
}

@keyframes fall-181 {
    60.616% {
        transform: translate(61.7877vw, 60.616vh) scale(0.1916);
    }

    to {
        transform: translate(65.90885vw, 100vh) scale(0.1916);
    }
}

.ashes>i:nth-child(182) {
    opacity: 0.867;
    transform: translate(405.6685vw, -10px) scale(0.848);
    animation: fall-182 29s -18s linear infinite;
}

@keyframes fall-182 {
    61.995% {
        transform: translate(398.0985vw, 61.995vh) scale(0.848);
    }

    to {
        transform: translate(401.8835vw, 100vh) scale(0.848);
    }
}

.ashes>i:nth-child(183) {
    opacity: 0.8631;
    transform: translate(323.226vw, -10px) scale(0.9708);
    animation: fall-183 16s -25s linear infinite;
}

@keyframes fall-183 {
    41.771% {
        transform: translate(329.1924vw, 41.771vh) scale(0.9708);
    }

    to {
        transform: translate(326.2092vw, 100vh) scale(0.9708);
    }
}

.ashes>i:nth-child(184) {
    opacity: 0.339;
    transform: translate(73.996vw, -10px) scale(0.7117);
    animation: fall-184 19s -16s linear infinite;
}

@keyframes fall-184 {
    64.733% {
        transform: translate(82.9923vw, 64.733vh) scale(0.7117);
    }

    to {
        transform: translate(78.49415vw, 100vh) scale(0.7117);
    }
}

.ashes>i:nth-child(185) {
    opacity: 0.1413;
    transform: translate(454.645vw, -10px) scale(0.4985);
    animation: fall-185 10s -4s linear infinite;
}

@keyframes fall-185 {
    64.596% {
        transform: translate(461.5838vw, 64.596vh) scale(0.4985);
    }

    to {
        transform: translate(458.1144vw, 100vh) scale(0.4985);
    }
}

.ashes>i:nth-child(186) {
    opacity: 0.856;
    transform: translate(407.8175vw, -10px) scale(0.5164);
    animation: fall-186 25s -10s linear infinite;
}

@keyframes fall-186 {
    36.329% {
        transform: translate(416.8387vw, 36.329vh) scale(0.5164);
    }

    to {
        transform: translate(412.3281vw, 100vh) scale(0.5164);
    }
}

.ashes>i:nth-child(187) {
    opacity: 0.9787;
    transform: translate(246.9955vw, -10px) scale(0.7924);
    animation: fall-187 16s -17s linear infinite;
}

@keyframes fall-187 {
    33.747% {
        transform: translate(256.1351vw, 33.747vh) scale(0.7924);
    }

    to {
        transform: translate(251.5653vw, 100vh) scale(0.7924);
    }
}

.ashes>i:nth-child(188) {
    opacity: 0.388;
    transform: translate(53.6395vw, -10px) scale(0.8525);
    animation: fall-188 13s -25s linear infinite;
}

@keyframes fall-188 {
    54.574% {
        transform: translate(47.9829vw, 54.574vh) scale(0.8525);
    }

    to {
        transform: translate(50.8112vw, 100vh) scale(0.8525);
    }
}

.ashes>i:nth-child(189) {
    opacity: 0.0879;
    transform: translate(465.841vw, -10px) scale(0.2661);
    animation: fall-189 26s -25s linear infinite;
}

@keyframes fall-189 {
    49.621% {
        transform: translate(460.0869vw, 49.621vh) scale(0.2661);
    }

    to {
        transform: translate(462.96395vw, 100vh) scale(0.2661);
    }
}

.ashes>i:nth-child(190) {
    opacity: 0.6167;
    transform: translate(330.812vw, -10px) scale(0.3966);
    animation: fall-190 30s -19s linear infinite;
}

@keyframes fall-190 {
    41.284% {
        transform: translate(331.4316vw, 41.284vh) scale(0.3966);
    }

    to {
        transform: translate(331.1218vw, 100vh) scale(0.3966);
    }
}

.ashes>i:nth-child(191) {
    opacity: 0.9364;
    transform: translate(64.247vw, -10px) scale(0.5825);
    animation: fall-191 17s -22s linear infinite;
}

@keyframes fall-191 {
    43.207% {
        transform: translate(68.213vw, 43.207vh) scale(0.5825);
    }

    to {
        transform: translate(66.23vw, 100vh) scale(0.5825);
    }
}

.ashes>i:nth-child(192) {
    opacity: 0.4023;
    transform: translate(486.423vw, -10px) scale(0.6751);
    animation: fall-192 14s -28s linear infinite;
}

@keyframes fall-192 {
    55.837% {
        transform: translate(486.5432vw, 55.837vh) scale(0.6751);
    }

    to {
        transform: translate(486.4831vw, 100vh) scale(0.6751);
    }
}

.ashes>i:nth-child(193) {
    opacity: 0.9669;
    transform: translate(383.412vw, -10px) scale(0.1707);
    animation: fall-193 19s -4s linear infinite;
}

@keyframes fall-193 {
    62.807% {
        transform: translate(382.0174vw, 62.807vh) scale(0.1707);
    }

    to {
        transform: translate(382.7147vw, 100vh) scale(0.1707);
    }
}

.ashes>i:nth-child(194) {
    opacity: 0.9845;
    transform: translate(42.2015vw, -10px) scale(0.4537);
    animation: fall-194 26s -10s linear infinite;
}

@keyframes fall-194 {
    78.726% {
        transform: translate(50.1347vw, 78.726vh) scale(0.4537);
    }

    to {
        transform: translate(46.1681vw, 100vh) scale(0.4537);
    }
}

.ashes>i:nth-child(195) {
    opacity: 0.0388;
    transform: translate(169.6575vw, -10px) scale(0.559);
    animation: fall-195 12s -24s linear infinite;
}

@keyframes fall-195 {
    58.729% {
        transform: translate(161.2932vw, 58.729vh) scale(0.559);
    }

    to {
        transform: translate(165.47535vw, 100vh) scale(0.559);
    }
}

.ashes>i:nth-child(196) {
    opacity: 0.2716;
    transform: translate(19.435vw, -10px) scale(0.3499);
    animation: fall-196 14s -10s linear infinite;
}

@keyframes fall-196 {
    30.613% {
        transform: translate(28.048vw, 30.613vh) scale(0.3499);
    }

    to {
        transform: translate(23.7415vw, 100vh) scale(0.3499);
    }
}

.ashes>i:nth-child(197) {
    opacity: 0.1374;
    transform: translate(246.506vw, -10px) scale(0.8789);
    animation: fall-197 17s -12s linear infinite;
}

@keyframes fall-197 {
    64.967% {
        transform: translate(241.3283vw, 64.967vh) scale(0.8789);
    }

    to {
        transform: translate(243.91715vw, 100vh) scale(0.8789);
    }
}

.ashes>i:nth-child(198) {
    opacity: 0.4186;
    transform: translate(136.851vw, -10px) scale(0.0855);
    animation: fall-198 30s -17s linear infinite;
}

@keyframes fall-198 {
    30.502% {
        transform: translate(133.4485vw, 30.502vh) scale(0.0855);
    }

    to {
        transform: translate(135.14975vw, 100vh) scale(0.0855);
    }
}

.ashes>i:nth-child(199) {
    opacity: 0.095;
    transform: translate(154.785vw, -10px) scale(0.8068);
    animation: fall-199 24s -2s linear infinite;
}

@keyframes fall-199 {
    69.489% {
        transform: translate(163.3798vw, 69.489vh) scale(0.8068);
    }

    to {
        transform: translate(159.0824vw, 100vh) scale(0.8068);
    }
}

.ashes>i:nth-child(200) {
    opacity: 0.4304;
    transform: translate(326.152vw, -10px) scale(0.032);
    animation: fall-200 11s -5s linear infinite;
}

@keyframes fall-200 {
    79.788% {
        transform: translate(335.1288vw, 79.788vh) scale(0.032);
    }

    to {
        transform: translate(330.6404vw, 100vh) scale(0.032);
    }
}
</style>