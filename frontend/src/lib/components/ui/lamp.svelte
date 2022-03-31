<script>
  export let left
</script>

<div class="lamp" style="margin-left: {left}px;"></div>

<style>
.lamp {
  position: absolute;
  bottom: 270px;
  left: calc(50% - 250px);
  filter: blur(1px);
  width: 1000px;
  height: 1000px;
  user-select: none;
  background: url(/i/lamp.png) no-repeat center center;
  z-index: 1;
  transform: perspective(50em);
  transition: left,bottom,transform .3s linear;
}
</style>