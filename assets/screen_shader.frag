precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform float time;

float rand(float x, float y){
  return fract(sin(dot(vec2(x,y) ,vec2(12.9898,78.233))) * 43758.5453);
}

void main(void){
	float v=0.;
	vec2 uvs = vTextureCoord.xy;
	vec4 fg = texture2D(uSampler, uvs);
	fg.r*=sin(time);
	gl_FragColor = fg;
}