export var vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

export var fragmentShader = `
    varying vec2 vUv;
    uniform float time;
    uniform vec3 color;

    vec3 permute(vec3 x) {
      return mod((34.0 * x + 1.0) * x, 289.0);
    }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.21, 0.36, -0.57, 0.024);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);

      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec2 x1 = x0.xy + C.xx - i1;
      vec2 x2 = x0.xy + C.zz;

      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));

      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
      m = m*m;
      m = m*m;

      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;

      m *= 1.8 - 0.85 * ( a0 * a0 + h * h );

      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x1.xy + h.yz * x1.yx;
      g.z  = a0.z  * x2.x  + h.z  * x2.y;

      return 130.0 * dot(m, g);
    }

    void main() {
      vec3 paperColor = color;

      float noiseValue = snoise(vUv * 150.0 + vec2(time * 0.1));
      vec3 grain = vec3(noiseValue);

      vec3 finalColor = mix(paperColor, grain, 0.04);
      gl_FragColor = vec4(finalColor, 1.0);
    }
`
