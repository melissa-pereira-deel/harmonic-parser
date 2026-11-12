import type { RoomFrame } from '../contracts.ts';
import type { FieldTuning } from './tuning.ts';

const vertex = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float time, impulse, registerPosition, envelope, energy, warmth, motion, treatment;
uniform float warp, detail, edgeWidth, strike, light;
out vec4 color;
float square(float x) { return x*x; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f*f*f*(f*(f*6.0-15.0)+10.0);
  float nearLayer = mix(
    mix(hash(i), hash(i+vec3(1,0,0)), f.x),
    mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x),
    f.y
  );
  float farLayer = mix(
    mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
    mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x),
    f.y
  );
  return mix(nearLayer, farLayer, f.z);
}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (gl_FragCoord.xy - resolution*0.5) / resolution.y;
  // The two layers travel along different paths through the noise volume.
  float current = noise(vec3(p*vec2(1.5,1.7), 0.0) + vec3(4.8,2.6,1.37) + time*vec3(0.041,-0.027,0.16));
  float eddies = noise(vec3(p*3.6, 0.0) + vec3(8.2,3.1,5.72) + time*vec3(-0.065,0.037,0.24));
  float n = mix(current, eddies, detail);
  vec2 contact = vec2((registerPosition-0.5)*0.95, -0.08);
  float local = exp(-dot(p-contact,p-contact)*4.5);
  float pressure = local*(impulse*0.22 + envelope*0.08)*strike;
  float fold = p.y + 0.15*sin(p.x*1.9) + (n-0.5)*warp;
  fold += pressure * (0.35 + 0.65*motion);
  float veil = exp(-square(fold*4.4));
  float lip = exp(-square((fold-0.085)*14.0/edgeWidth));
  float basin = exp(-dot(p-vec2(-0.18,0.08),p-vec2(-0.18,0.08))*1.35);
  float body = mix(basin*(0.5+n*0.5), veil*(0.55+n*0.45), treatment);
  float tint = smoothstep(0.16,0.84,n);
  vec3 ink = mix(vec3(0.065,0.080,0.145), vec3(0.056,0.130,0.137), tint);
  vec3 mineral = mix(vec3(0.23,0.27,0.41), vec3(0.29,0.51,0.46), tint);
  vec3 pearl = mix(vec3(0.66,0.67,0.80), vec3(0.85,0.78,0.59), eddies);
  ink = mix(ink, vec3(0.125,0.075,0.20), energy*0.72);
  mineral = mix(mineral, vec3(0.48,0.31,0.65), energy*0.85);
  pearl = mix(pearl, vec3(0.78,0.62,0.94), energy*0.70);
  ink = mix(ink, vec3(0.155,0.085,0.065), warmth*0.70);
  mineral = mix(mineral, vec3(0.64,0.37,0.24), warmth*0.85);
  pearl = mix(pearl, vec3(0.96,0.73,0.46), warmth*0.88);
  vec3 rust = vec3(0.42,0.25,0.20);
  vec3 c = mix(ink, mineral, body*0.8);
  c = mix(c, pearl, lip*treatment*(0.27+envelope*0.12));
  c += rust * exp(-square((fold+0.13)*9.0))*0.20*treatment;
  c += vec3(0.30,0.32,0.22)*local*(impulse*0.29+envelope*0.12)*light;
  float vignette = 1.0-smoothstep(0.25,1.05,length((uv-0.5)*vec2(1.0,0.8)));
  c *= 0.72+0.28*vignette;
  c += (hash(gl_FragCoord.xy)-0.5)*0.018;
  color = vec4(c,1.0);
}`;

const unit = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

/** A pure frame consumer: the owner supplies the clock and gesture decay.
 * Set canvas.dataset.treatment='basin' before creation for the study alternative.
 * The default veil uses precisely the same frame and gesture uniforms.
 */
export function createRoomRenderer(canvas: HTMLCanvasElement) {
  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let disposed = false;
  let active = false;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let uploadedTuning: FieldTuning | null = null;
  const treatment = canvas.dataset.treatment === 'basin' ? 0 : 1;
  const fallback = () => { active = false; canvas.dataset.renderer = 'css'; };
  const release = () => {
    if (gl && !gl.isContextLost()) {
      if (program) gl.deleteProgram(program);
      if (vao) gl.deleteVertexArray(vao);
    }
    program = null; vao = null;
  };
  const initialize = () => {
    if (!gl || disposed) return;
    const shaders: WebGLShader[] = [];
    try {
      const compile = (type: number, source: string) => {
        const shader = gl!.createShader(type);
        if (!shader) throw new Error('Shader allocation failed');
        shaders.push(shader);
        gl!.shaderSource(shader, source); gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) throw new Error('Shader compilation failed');
        return shader;
      };
      program = gl.createProgram();
      if (!program) throw new Error('Program allocation failed');
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Program link failed');
      vao = gl.createVertexArray();
      if (!vao) throw new Error('Vertex array allocation failed');
      uniforms = Object.fromEntries([
        'resolution', 'time', 'impulse', 'registerPosition', 'envelope', 'energy', 'warmth', 'motion', 'treatment',
        'warp', 'detail', 'edgeWidth', 'strike', 'light',
      ].map(name => [name, gl!.getUniformLocation(program!, name)]));
      gl.useProgram(program);
      gl.uniform1f(uniforms.treatment, treatment);
      uploadedTuning = null;
      active = true;
      // Reveal only after a completed draw; the CSS field covers initialization.
    } catch { release(); fallback(); }
    finally { shaders.forEach(shader => gl!.deleteShader(shader)); }
  };
  const lost = (event: Event) => { event.preventDefault(); fallback(); program = null; vao = null; };
  const restored = () => initialize();
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  fallback();
  try { gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch { /* Static field remains available. */ }
  initialize();
  return {
    get kind(): 'webgl2' | 'css' { return active ? 'webgl2' : 'css'; },
    draw(frame: RoomFrame, fieldTimeMs: number, tuning: FieldTuning): void {
      if (disposed || !active || !gl || !program || gl.isContextLost()) return;
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      const scale = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2_000_000/(bounds.width*bounds.height)));
      const width = Math.max(1, Math.round(bounds.width*scale));
      const height = Math.max(1, Math.round(bounds.height*scale));
      try {
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        gl.viewport(0,0,width,height); gl.useProgram(program); gl.bindVertexArray(vao);
        if (uploadedTuning !== tuning) {
          gl.uniform1f(uniforms.warp, tuning.warp);
          gl.uniform1f(uniforms.detail, tuning.detail);
          gl.uniform1f(uniforms.edgeWidth, tuning.edgeWidth);
          gl.uniform1f(uniforms.strike, tuning.strike);
          gl.uniform1f(uniforms.light, tuning.light);
          uploadedTuning = tuning;
        }
        gl.uniform2f(uniforms.resolution,width,height);
        gl.uniform1f(uniforms.time, fieldTimeMs / 1000);
        gl.uniform1f(uniforms.impulse,unit(frame.impulse));
        // Register cannot alter the idle field when gesture influence is zero.
        gl.uniform1f(uniforms.registerPosition,unit(frame.register));
        gl.uniform1f(uniforms.envelope,unit(frame.envelope));
        gl.uniform1f(uniforms.energy, unit(frame.energy));
        gl.uniform1f(uniforms.warmth, unit(frame.warmth));
        gl.uniform1f(uniforms.motion,frame.reducedMotion ? 0 : 1);
        gl.drawArrays(gl.TRIANGLES,0,3);
        if (canvas.dataset.renderer !== 'webgl2') canvas.dataset.renderer = 'webgl2';
      } catch { release(); fallback(); }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true; release(); fallback();
      canvas.removeEventListener('webglcontextlost',lost);
      canvas.removeEventListener('webglcontextrestored',restored);
    },
  };
}
