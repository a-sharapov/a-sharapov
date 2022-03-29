<script>
  export let left = 0
</script>

<div class="pencils" style="margin-left: {left}px;"></div>

<style>
.pencils {
  position: absolute;
  bottom: 0;
  left: calc(100% - 700px);
  display: block;
  width: 600px;
  height: 700px;
  background: url(/i/pencil-paper.png) no-repeat center top;
  background-size: contain;
  margin: 0 0 50px;
  z-index: 2;
  transform: perspective(50em);
}
</style>