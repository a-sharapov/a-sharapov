<script>
  import { LOCALES } from '@lib/l18n'
  import { T } from '@threlte/core'
  import { Align, Text3DGeometry } from '@threlte/extras'
  import { CUSTOM_TEXT } from './assets'

  export let modifier
  export let locale
  export let y = 1
</script>

<Align let:align {y} precise>
  <T.Group>
    <T.Mesh
      position={CUSTOM_TEXT.POSITION}
      rotation={CUSTOM_TEXT.ROTATION}
      scale={CUSTOM_TEXT.SCALE}
    >
      <Text3DGeometry text={LOCALES[locale][modifier]} on:create={align} />
      <T.MeshStandardMaterial />
    </T.Mesh>
  </T.Group>
</Align>
