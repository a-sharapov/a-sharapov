<script>
  export let left
</script>

<div class="paperplane" style="margin-left: {left*.7}px;"></div>

<style>
.paperplane {
  position: absolute;
  bottom: 300%;
  left: 150px;
  filter: blur(0);
  width: 300px;
  height: 550px;
  user-select: none;
  background: url(/i/paperplane.png) no-repeat center center;
  z-index: 10;
  transform: perspective(50em);
  transition: left,bottom,transform .3s linear;
}
</style>