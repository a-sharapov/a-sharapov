export var vertexShader = `
    uniform float time;
    varying vec3 vPosition;

    void main() {
      vPosition = position;
      vec3 pos = position;

      float moveFactor = 0.1;
      pos.x += sin(time + position.y * 10.0) * moveFactor;
      pos.y += cos(time + position.z * 10.0) * moveFactor;
      pos.z += sin(time + position.x * 10.0) * moveFactor;

      gl_PointSize = 2.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `

export var fragmentShader = `
    varying vec3 vPosition;

    void main() {
      float alpha = 0.8;
      gl_FragColor = vec4(vec3(0.6), alpha);
    }
  `
