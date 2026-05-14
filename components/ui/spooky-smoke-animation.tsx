"use client";

import React, { useEffect, useRef } from "react";

// Multi-color fbm smoke. 3 color uniforms blended across UV + noise.
const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);

  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);

  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);

  // Build a tri-color jersey gradient that drifts with the noise.
  float bandV = smoothstep(-0.9, 0.9, uv.y + sin(uv.x*1.1 + T*0.05)*0.35);
  float bandN = fbm(uv*0.5 + n*0.6 + vec2(T*0.012, -T*0.008));
  vec3 ab = mix(u_color1, u_color2, bandV);
  vec3 jersey = mix(ab, u_color3, clamp(bandN*1.2, 0.0, 1.0));

  float luma = dot(col, vec3(.21,.71,.07));
  col = mix(col, jersey, clamp(luma*1.15, 0.0, 1.0));

  col=mix(vec3(.05),col,min(time*.1,1.));
  col=clamp(col,.05,1.);
  O=vec4(col,1);
}`;

const vertexShaderSource = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

type RGB = [number, number, number];

class Renderer {
  private vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private colors: [RGB, RGB, RGB] = [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]];

  constructor(canvas: HTMLCanvasElement, fragmentSource: string) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    this.setup(fragmentSource);
    this.init();
  }

  updateColors(c1: RGB, c2: RGB, c3: RGB) {
    this.colors = [c1, c2, c3];
  }

  updateScale() {
    const dpr = Math.max(1, window.devicePixelRatio);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private compile(shader: WebGLShader, source: string) {
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`shader compile error: ${gl.getShaderInfoLog(shader)}`);
    }
  }

  reset() {
    const { gl, program, vs, fs } = this;
    if (!program) return;
    if (vs) { gl.detachShader(program, vs); gl.deleteShader(vs); }
    if (fs) { gl.detachShader(program, fs); gl.deleteShader(fs); }
    gl.deleteProgram(program);
    this.program = null;
  }

  private setup(fragmentSource: string) {
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER);
    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!this.vs || !this.fs || !program) return;
    this.compile(this.vs, vertexShaderSource);
    this.compile(this.fs, fragmentSource);
    this.program = program;
    gl.attachShader(program, this.vs);
    gl.attachShader(program, this.fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`program link error: ${gl.getProgramInfoLog(program)}`);
    }
  }

  private init() {
    const { gl, program } = this;
    if (!program) return;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    Object.assign(program, {
      resolution: gl.getUniformLocation(program, "resolution"),
      time: gl.getUniformLocation(program, "time"),
      u_color1: gl.getUniformLocation(program, "u_color1"),
      u_color2: gl.getUniformLocation(program, "u_color2"),
      u_color3: gl.getUniformLocation(program, "u_color3"),
    });
  }

  render(now = 0) {
    const { gl, program, buffer, canvas } = this;
    if (!program || !gl.isProgram(program)) return;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const p = program as unknown as {
      resolution: WebGLUniformLocation;
      time: WebGLUniformLocation;
      u_color1: WebGLUniformLocation;
      u_color2: WebGLUniformLocation;
      u_color3: WebGLUniformLocation;
    };
    gl.uniform2f(p.resolution, canvas.width, canvas.height);
    gl.uniform1f(p.time, now * 1e-3);
    gl.uniform3fv(p.u_color1, this.colors[0]);
    gl.uniform3fv(p.u_color2, this.colors[1]);
    gl.uniform3fv(p.u_color3, this.colors[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

const hexToRgb = (hex: string): RGB | null => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255]
    : null;
};

interface SmokeBackgroundProps {
  smokeColor?: string;
  smokeColor2?: string;
  smokeColor3?: string;
  className?: string;
}

export const SmokeBackground: React.FC<SmokeBackgroundProps> = ({
  smokeColor = "#808080",
  smokeColor2,
  smokeColor3,
  className = "w-full h-full block",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new Renderer(canvas, fragmentShaderSource);
    rendererRef.current = renderer;

    const handleResize = () => renderer.updateScale();
    handleResize();
    window.addEventListener("resize", handleResize);

    const reducedMq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let paused = false;

    const start = () => {
      if (raf) return;
      const loop = (now: number) => {
        renderer.render(now);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const refresh = () => {
      const reduce = !!reducedMq?.matches;
      const hidden = document.visibilityState === "hidden";
      const shouldPause = reduce || hidden;
      if (shouldPause && !paused) {
        paused = true;
        stop();
        // paint a single frame so the canvas isn't blank under reduced-motion
        if (reduce && !hidden) renderer.render(performance.now());
      } else if (!shouldPause && paused) {
        paused = false;
        start();
      }
    };

    refresh();
    if (!paused) start();

    document.addEventListener("visibilitychange", refresh);
    reducedMq?.addEventListener?.("change", refresh);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", refresh);
      reducedMq?.removeEventListener?.("change", refresh);
      stop();
      renderer.reset();
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const c1: RGB = hexToRgb(smokeColor) ?? [0.5, 0.5, 0.5];
    const c2: RGB = (smokeColor2 ? hexToRgb(smokeColor2) : null) ?? c1;
    const c3: RGB = (smokeColor3 ? hexToRgb(smokeColor3) : null) ?? c1;
    renderer.updateColors(c1, c2, c3);
    // Force a single repaint so the new colors land even if the rAF loop is paused
    // (prefers-reduced-motion, hidden tab on return, etc.)
    renderer.render(performance.now());
  }, [smokeColor, smokeColor2, smokeColor3]);

  return <canvas ref={canvasRef} className={className} />;
};
