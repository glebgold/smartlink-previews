(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,251376,e=>{"use strict";var t=e.i(190072),i=e.i(138671);let a={name:"GTAOShader",defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:"x",SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new t.Vector2},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new t.Matrix4},cameraProjectionMatrixInverse:{value:new t.Matrix4},cameraWorldMatrix:{value:new t.Matrix4},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new t.Vector3(-1,-1,-1)},sceneBoxMax:{value:new t.Vector3(1,1,1)}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		varying vec2 vUv;
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform mat4 cameraWorldMatrix;
		uniform float radius;
		uniform float distanceExponent;
		uniform float thickness;
		uniform float distanceFallOff;
		uniform float scale;
		#if SCENE_CLIP_BOX == 1
			uniform vec3 sceneBoxMin;
			uniform vec3 sceneBoxMax;
		#endif

		#include <common>
		#include <packing>

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(vec3(ao), 1.)
		#endif

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
			return textureLod(tDepth, uv.xy, 0.0).DEPTH_SWIZZLING;
		}

		float fetchDepth(const ivec2 uv) {
			return texelFetch(tDepth, uv.xy, 0).DEPTH_SWIZZLING;
		}

		float getViewZ(const in float depth) {
			#if PERSPECTIVE_CAMERA == 1
				return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
			#else
				return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ? ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz : -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ? ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz : -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
			#if NORMAL_VECTOR_TYPE == 2
				return normalize(textureLod(tNormal, uv, 0.).rgb);
			#elif NORMAL_VECTOR_TYPE == 1
				return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
			#else
				return computeNormalFromDepth(uv);
			#endif
		}

		vec3 getSceneUvAndDepth(vec3 sampleViewPos) {
			vec4 sampleClipPos = cameraProjectionMatrix * vec4(sampleViewPos, 1.);
			vec2 sampleUv = sampleClipPos.xy / sampleClipPos.w * 0.5 + 0.5;
			float sampleSceneDepth = getDepth(sampleUv);
			return vec3(sampleUv, sampleSceneDepth);
		}

		void main() {
			float depth = getDepth(vUv.xy);

			#ifdef USE_REVERSED_DEPTH_BUFFER
				if (depth <= 0.0) {
					discard;
					return;
				}
			#else
				if (depth >= 1.0) {
					discard;
					return;
				}
			#endif
			
			vec3 viewPos = getViewPosition(vUv, depth);
			vec3 viewNormal = getViewNormal(vUv);

			float radiusToUse = radius;
			float distanceFalloffToUse = thickness;
			#if SCREEN_SPACE_RADIUS == 1
				float radiusScale = getViewPosition(vec2(0.5 + float(SCREEN_SPACE_RADIUS_SCALE) / resolution.x, 0.0), depth).x;
				radiusToUse *= radiusScale;
				distanceFalloffToUse *= radiusScale;
			#endif

			#if SCENE_CLIP_BOX == 1
				vec3 worldPos = (cameraWorldMatrix * vec4(viewPos, 1.0)).xyz;
				float boxDistance = length(max(vec3(0.0), max(sceneBoxMin - worldPos, worldPos - sceneBoxMax)));
				if (boxDistance > radiusToUse) {
					discard;
					return;
				}
			#endif

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
			vec3 randomVec = noiseTexel.xyz * 2.0 - 1.0;
			vec3 tangent = normalize(vec3(randomVec.xy, 0.));
			vec3 bitangent = vec3(-tangent.y, tangent.x, 0.);
			mat3 kernelMatrix = mat3(tangent, bitangent, vec3(0., 0., 1.));

			const int DIRECTIONS = SAMPLES < 30 ? 3 : 5;
			const int STEPS = (SAMPLES + DIRECTIONS - 1) / DIRECTIONS;
			float ao = 0.0;
			for (int i = 0; i < DIRECTIONS; ++i) {

				float angle = float(i) / float(DIRECTIONS) * PI;
				vec4 sampleDir = vec4(cos(angle), sin(angle), 0., 0.5 + 0.5 * noiseTexel.w);
				sampleDir.xyz = normalize(kernelMatrix * sampleDir.xyz);

				vec3 viewDir = normalize(-viewPos.xyz);
				vec3 sliceBitangent = normalize(cross(sampleDir.xyz, viewDir));
				vec3 sliceTangent = cross(sliceBitangent, viewDir);
				vec3 normalInSlice = normalize(viewNormal - sliceBitangent * dot(viewNormal, sliceBitangent));

				vec3 tangentToNormalInSlice = cross(normalInSlice, sliceBitangent);
				vec2 cosHorizons = vec2(dot(viewDir, tangentToNormalInSlice), dot(viewDir, -tangentToNormalInSlice));

				for (int j = 0; j < STEPS; ++j) {
					vec3 sampleViewOffset = sampleDir.xyz * radiusToUse * sampleDir.w * pow(float(j + 1) / float(STEPS), distanceExponent);

					vec3 sampleSceneUvDepth = getSceneUvAndDepth(viewPos + sampleViewOffset);
					vec3 sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					vec3 viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.x += max(0., (sampleCosHorizon - cosHorizons.x) * mix(1., 2. / float(j + 2), distanceFallOff));
					}

					sampleSceneUvDepth = getSceneUvAndDepth(viewPos - sampleViewOffset);
					sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.y += max(0., (sampleCosHorizon - cosHorizons.y) * mix(1., 2. / float(j + 2), distanceFallOff));
					}
				}

				vec2 sinHorizons = sqrt(1. - cosHorizons * cosHorizons);
				float nx = dot(normalInSlice, sliceTangent);
				float ny = dot(normalInSlice, viewDir);
				float nxb = 1. / 2. * (acos(cosHorizons.y) - acos(cosHorizons.x) + sinHorizons.x * cosHorizons.x - sinHorizons.y * cosHorizons.y);
				float nyb = 1. / 2. * (2. - cosHorizons.x * cosHorizons.x - cosHorizons.y * cosHorizons.y);
				float occlusion = nx * nxb + ny * nyb;
				ao += occlusion;
			}

			ao = clamp(ao / float(DIRECTIONS), 0., 1.);
		#if SCENE_CLIP_BOX == 1
			ao = mix(ao, 1., smoothstep(0., radiusToUse, boxDistance));
		#endif
			ao = pow(ao, scale);

			gl_FragColor = FRAGMENT_OUTPUT;
		}`},r={name:"GTAODepthShader",defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {
			#if PERSPECTIVE_CAMERA == 1
				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			#else
				return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		void main() {
			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},o={name:"GTAOBlendShader",uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform float intensity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(mix(vec3(1.), texel.rgb, intensity), texel.a);
		}`},s={name:"PoissonDenoiseShader",defines:{SAMPLES:16,SAMPLE_VECTORS:n(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new t.Vector2},cameraProjectionMatrixInverse:{value:new t.Matrix4},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`

		varying vec2 vUv;

		uniform sampler2D tDiffuse;
		uniform sampler2D tNormal;
		uniform sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform float lumaPhi;
		uniform float depthPhi;
		uniform float normalPhi;
		uniform float radius;
		uniform int index;

		#include <common>
		#include <packing>

		#ifndef SAMPLE_LUMINANCE
		#define SAMPLE_LUMINANCE dot(vec3(0.2125, 0.7154, 0.0721), a)
		#endif

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(denoised, 1.)
		#endif

		float getLuminance(const in vec3 a) {
			return SAMPLE_LUMINANCE;
		}

		const vec3 poissonDisk[SAMPLES] = SAMPLE_VECTORS;

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
		#if DEPTH_VALUE_SOURCE == 1
			return textureLod(tDepth, uv.xy, 0.0).a;
		#else
			return textureLod(tDepth, uv.xy, 0.0).r;
		#endif
		}

		float fetchDepth(const ivec2 uv) {
			#if DEPTH_VALUE_SOURCE == 1
				return texelFetch(tDepth, uv.xy, 0).a;
			#else
				return texelFetch(tDepth, uv.xy, 0).r;
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ?  ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz
									: -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ?  ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz
									: -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
		#if NORMAL_VECTOR_TYPE == 2
			return normalize(textureLod(tNormal, uv, 0.).rgb);
		#elif NORMAL_VECTOR_TYPE == 1
			return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
		#else
			return computeNormalFromDepth(uv);
		#endif
		}

		void denoiseSample(in vec3 center, in vec3 viewNormal, in vec3 viewPos, in vec2 sampleUv, inout vec3 denoised, inout float totalWeight) {
			vec4 sampleTexel = textureLod(tDiffuse, sampleUv, 0.0);
			float sampleDepth = getDepth(sampleUv);
			vec3 sampleNormal = getViewNormal(sampleUv);
			vec3 neighborColor = sampleTexel.rgb;
			vec3 viewPosSample = getViewPosition(sampleUv, sampleDepth);

			float normalDiff = dot(viewNormal, sampleNormal);
			float normalSimilarity = pow(max(normalDiff, 0.), normalPhi);
			float lumaDiff = abs(getLuminance(neighborColor) - getLuminance(center));
			float lumaSimilarity = max(1.0 - lumaDiff / lumaPhi, 0.0);
			float depthDiff = abs(dot(viewPos - viewPosSample, viewNormal));
			float depthSimilarity = max(1. - depthDiff / depthPhi, 0.);
			float w = lumaSimilarity * depthSimilarity * normalSimilarity;

			denoised += w * neighborColor;
			totalWeight += w;
		}

		void main() {
			float depth = getDepth(vUv.xy);
			vec3 viewNormal = getViewNormal(vUv);
			if (depth == 1. || dot(viewNormal, viewNormal) == 0.) {
				discard;
				return;
			}
			vec4 texel = textureLod(tDiffuse, vUv, 0.0);
			vec3 center = texel.rgb;
			vec3 viewPos = getViewPosition(vUv, depth);

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
      		vec2 noiseVec = vec2(sin(noiseTexel[index % 4] * 2. * PI), cos(noiseTexel[index % 4] * 2. * PI));
    		mat2 rotationMatrix = mat2(noiseVec.x, -noiseVec.y, noiseVec.x, noiseVec.y);

			float totalWeight = 1.0;
			vec3 denoised = texel.rgb;
			for (int i = 0; i < SAMPLES; i++) {
				vec3 sampleDir = poissonDisk[i];
				vec2 offset = rotationMatrix * (sampleDir.xy * (1. + sampleDir.z * (radius - 1.)) / resolution);
				vec2 sampleUv = vUv + offset;
				denoiseSample(center, viewNormal, viewPos, sampleUv, denoised, totalWeight);
			}

			if (totalWeight > 0.) {
				denoised /= totalWeight;
			}
			gl_FragColor = FRAGMENT_OUTPUT;
		}`};function n(e,i,a){let r=function(e,i,a){let r=[];for(let o=0;o<e;o++){let s=2*Math.PI*i*o/e,n=Math.pow(o/(e-1),a);r.push(new t.Vector3(Math.cos(s),Math.sin(s),n))}return r}(e,i,a),o="vec3[SAMPLES](";for(let t=0;t<e;t++){let i=r[t];o+=`vec3(${i.x}, ${i.y}, ${i.z})${t<e-1?",":")"}`}return o}var l=e.i(499062);class h{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(256*e.random());this.perm=[];for(let e=0;e<512;e++)this.perm[e]=this.p[255&e];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let i,a,r,o,s,n=.5*(Math.sqrt(3)-1)*(e+t),l=Math.floor(e+n),h=Math.floor(t+n),c=(3-Math.sqrt(3))/6,d=(l+h)*c,u=e-(l-d),p=t-(h-d);u>p?(o=1,s=0):(o=0,s=1);let v=u-o+c,f=p-s+c,m=u-1+2*c,g=p-1+2*c,x=255&l,M=255&h,S=this.perm[x+this.perm[M]]%12,P=this.perm[x+o+this.perm[M+s]]%12,T=this.perm[x+1+this.perm[M+1]]%12,D=.5-u*u-p*p;D<0?i=0:(D*=D,i=D*D*this._dot(this.grad3[S],u,p));let E=.5-v*v-f*f;E<0?a=0:(E*=E,a=E*E*this._dot(this.grad3[P],v,f));let w=.5-m*m-g*g;return w<0?r=0:(w*=w,r=w*w*this._dot(this.grad3[T],m,g)),70*(i+a+r)}noise3d(e,t,i){let a,r,o,s,n,l,h,c,d,u,p=1/3*(e+t+i),v=Math.floor(e+p),f=Math.floor(t+p),m=Math.floor(i+p),g=1/6*(v+f+m),x=e-(v-g),M=t-(f-g),S=i-(m-g);x>=M?M>=S?(n=1,l=0,h=0,c=1,d=1,u=0):(x>=S?(n=1,l=0,h=0):(n=0,l=0,h=1),c=1,d=0,u=1):M<S?(n=0,l=0,h=1,c=0,d=1,u=1):x<S?(n=0,l=1,h=0,c=0,d=1,u=1):(n=0,l=1,h=0,c=1,d=1,u=0);let P=x-n+1/6,T=M-l+1/6,D=S-h+1/6,E=x-c+1/6*2,w=M-d+1/6*2,_=S-u+1/6*2,y=x-1+1/6*3,C=M-1+1/6*3,U=S-1+1/6*3,N=255&v,R=255&f,b=255&m,A=this.perm[N+this.perm[R+this.perm[b]]]%12,z=this.perm[N+n+this.perm[R+l+this.perm[b+h]]]%12,V=this.perm[N+c+this.perm[R+d+this.perm[b+u]]]%12,O=this.perm[N+1+this.perm[R+1+this.perm[b+1]]]%12,I=.6-x*x-M*M-S*S;I<0?a=0:(I*=I,a=I*I*this._dot3(this.grad3[A],x,M,S));let F=.6-P*P-T*T-D*D;F<0?r=0:(F*=F,r=F*F*this._dot3(this.grad3[z],P,T,D));let L=.6-E*E-w*w-_*_;L<0?o=0:(L*=L,o=L*L*this._dot3(this.grad3[V],E,w,_));let B=.6-y*y-C*C-U*U;return B<0?s=0:(B*=B,s=B*B*this._dot3(this.grad3[O],y,C,U)),32*(a+r+o+s)}noise4d(e,t,i,a){let r,o,s,n,l,h=this.grad4,c=this.simplex,d=this.perm,u=(5-Math.sqrt(5))/20,p=(Math.sqrt(5)-1)/4*(e+t+i+a),v=Math.floor(e+p),f=Math.floor(t+p),m=Math.floor(i+p),g=Math.floor(a+p),x=(v+f+m+g)*u,M=e-(v-x),S=t-(f-x),P=i-(m-x),T=a-(g-x),D=32*(M>S)+16*(M>P)+8*(S>P)+4*(M>T)+2*(S>T)+ +(P>T),E=+(c[D][0]>=3),w=+(c[D][1]>=3),_=+(c[D][2]>=3),y=+(c[D][3]>=3),C=+(c[D][0]>=2),U=+(c[D][1]>=2),N=+(c[D][2]>=2),R=+(c[D][3]>=2),b=+(c[D][0]>=1),A=+(c[D][1]>=1),z=+(c[D][2]>=1),V=+(c[D][3]>=1),O=M-E+u,I=S-w+u,F=P-_+u,L=T-y+u,B=M-C+2*u,H=S-U+2*u,j=P-N+2*u,G=T-R+2*u,W=M-b+3*u,k=S-A+3*u,Z=P-z+3*u,q=T-V+3*u,X=M-1+4*u,Y=S-1+4*u,Q=P-1+4*u,$=T-1+4*u,K=255&v,J=255&f,ee=255&m,et=255&g,ei=d[K+d[J+d[ee+d[et]]]]%32,ea=d[K+E+d[J+w+d[ee+_+d[et+y]]]]%32,er=d[K+C+d[J+U+d[ee+N+d[et+R]]]]%32,eo=d[K+b+d[J+A+d[ee+z+d[et+V]]]]%32,es=d[K+1+d[J+1+d[ee+1+d[et+1]]]]%32,en=.6-M*M-S*S-P*P-T*T;en<0?r=0:(en*=en,r=en*en*this._dot4(h[ei],M,S,P,T));let el=.6-O*O-I*I-F*F-L*L;el<0?o=0:(el*=el,o=el*el*this._dot4(h[ea],O,I,F,L));let eh=.6-B*B-H*H-j*j-G*G;eh<0?s=0:(eh*=eh,s=eh*eh*this._dot4(h[er],B,H,j,G));let ec=.6-W*W-k*k-Z*Z-q*q;ec<0?n=0:(ec*=ec,n=ec*ec*this._dot4(h[eo],W,k,Z,q));let ed=.6-X*X-Y*Y-Q*Q-$*$;return ed<0?l=0:(ed*=ed,l=ed*ed*this._dot4(h[es],X,Y,Q,$)),27*(r+o+s+n+l)}_dot(e,t,i){return e[0]*t+e[1]*i}_dot3(e,t,i,a){return e[0]*t+e[1]*i+e[2]*a}_dot4(e,t,i,a,r){return e[0]*t+e[1]*i+e[2]*a+e[3]*r}}class c extends i.Pass{constructor(e,n,h=512,c=512,d,u,p){super(),this.width=h,this.height=c,this.clear=!0,this.camera=n,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=function(e=5){let i=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),a=function(e){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),i=t*t,a=Array(i).fill(0),r=Math.floor(t/2),o=t-1;for(let e=1;e<=i;){if(-1===r&&o===t?(o=t-2,r=0):(o===t&&(o=0),r<0&&(r=t-1)),0!==a[r*t+o]){o-=2,r++;continue}a[r*t+o]=e++,o++,r--}return a}(i),r=a.length,o=new Uint8Array(4*r);for(let e=0;e<r;++e){let i=2*Math.PI*a[e]/r,s=new t.Vector3(Math.cos(i),Math.sin(i),0).normalize();o[4*e]=(.5*s.x+.5)*255,o[4*e+1]=(.5*s.y+.5)*255,o[4*e+2]=127,o[4*e+3]=255}let s=new t.DataTexture(o,i,i);return s.wrapS=t.RepeatWrapping,s.wrapT=t.RepeatWrapping,s.needsUpdate=!0,s}(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new t.WebGLRenderTarget(this.width,this.height,{type:t.HalfFloatType}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new t.ShaderMaterial({defines:Object.assign({},a.defines),uniforms:t.UniformsUtils.clone(a.uniforms),vertexShader:a.vertexShader,fragmentShader:a.fragmentShader,blending:t.NoBlending,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=+!!this.camera.isPerspectiveCamera,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new t.MeshNormalMaterial,this.normalMaterial.blending=t.NoBlending,this.pdMaterial=new t.ShaderMaterial({defines:Object.assign({},s.defines),uniforms:t.UniformsUtils.clone(s.uniforms),vertexShader:s.vertexShader,fragmentShader:s.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new t.ShaderMaterial({defines:Object.assign({},r.defines),uniforms:t.UniformsUtils.clone(r.uniforms),vertexShader:r.vertexShader,fragmentShader:r.fragmentShader,blending:t.NoBlending}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new t.ShaderMaterial({uniforms:t.UniformsUtils.clone(l.CopyShader.uniforms),vertexShader:l.CopyShader.vertexShader,fragmentShader:l.CopyShader.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:t.DstColorFactor,blendDst:t.ZeroFactor,blendEquation:t.AddEquation,blendSrcAlpha:t.DstAlphaFactor,blendDstAlpha:t.ZeroFactor,blendEquationAlpha:t.AddEquation}),this.blendMaterial=new t.ShaderMaterial({uniforms:t.UniformsUtils.clone(o.uniforms),vertexShader:o.vertexShader,fragmentShader:o.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:t.CustomBlending,blendSrc:t.DstColorFactor,blendDst:t.ZeroFactor,blendEquation:t.AddEquation,blendSrcAlpha:t.DstAlphaFactor,blendDstAlpha:t.ZeroFactor,blendEquationAlpha:t.AddEquation}),this._fsQuad=new i.FullScreenQuad(null),this._originalClearColor=new t.Color,this.setGBuffer(d?d.depthTexture:void 0,d?d.normalTexture:void 0),void 0!==u&&this.updateGtaoMaterial(u),void 0!==p&&this.updatePdMaterial(p)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,i){void 0!==e?(this.depthTexture=e,this.normalTexture=i,this._renderGBuffer=!1):(this.depthTexture=new t.DepthTexture,this.depthTexture.format=t.DepthStencilFormat,this.depthTexture.type=t.UnsignedInt248Type,this.normalRenderTarget=new t.WebGLRenderTarget(this.width,this.height,{minFilter:t.NearestFilter,magFilter:t.NearestFilter,type:t.HalfFloatType,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0);let a=+!!this.normalTexture,r=this.depthTexture===this.normalTexture?"w":"x";this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=a,this.gtaoMaterial.defines.DEPTH_SWIZZLING=r,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=a,this.pdMaterial.defines.DEPTH_SWIZZLING=r,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=1!==this.gtaoMaterial.defines.SCENE_CLIP_BOX,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=0===this.gtaoMaterial.defines.SCENE_CLIP_BOX,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){void 0!==e.radius&&(this.gtaoMaterial.uniforms.radius.value=e.radius),void 0!==e.distanceExponent&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),void 0!==e.thickness&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),void 0!==e.distanceFallOff&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),void 0!==e.scale&&(this.gtaoMaterial.uniforms.scale.value=e.scale),void 0!==e.samples&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),void 0!==e.screenSpaceRadius&&+!!e.screenSpaceRadius!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=+!!e.screenSpaceRadius,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;void 0!==e.lumaPhi&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),void 0!==e.depthPhi&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),void 0!==e.normalPhi&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),void 0!==e.radius&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),void 0!==e.radiusExponent&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),void 0!==e.rings&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),void 0!==e.samples&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=n(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(e,i,a){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(e,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(e,this.gtaoMaterial,this.gtaoRenderTarget,0xffffff,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(e,this.pdMaterial,this.pdRenderTarget,0xffffff,1),this.output){case c.OUTPUT.Off:break;case c.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=a.texture,this.copyMaterial.blending=t.NoBlending,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:i);break;case c.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=t.NoBlending,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:i);break;case c.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=t.NoBlending,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:i);break;case c.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(e,this.depthRenderMaterial,this.renderToScreen?null:i);break;case c.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=t.NoBlending,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:i);break;case c.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=a.texture,this.copyMaterial.blending=t.NoBlending,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:i),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(e,this.blendMaterial,this.renderToScreen?null:i);break;default:console.warn("THREE.GTAOPass: Unknown output type.")}}_renderPass(e,t,i,a,r){e.getClearColor(this._originalClearColor);let o=e.getClearAlpha(),s=e.autoClear;e.setRenderTarget(i),e.autoClear=!1,null!=a&&(e.setClearColor(a),e.setClearAlpha(r||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=s,e.setClearColor(this._originalClearColor),e.setClearAlpha(o)}_renderOverride(e,t,i,a,r){e.getClearColor(this._originalClearColor);let o=e.getClearAlpha(),s=e.autoClear;e.setRenderTarget(i),e.autoClear=!1,a=t.clearColor||a,r=t.clearAlpha||r,null!=a&&(e.setClearColor(a),e.setClearAlpha(r||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=s,e.setClearColor(this._originalClearColor),e.setClearAlpha(o)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(e){(e.isPoints||e.isLine||e.isLine2)&&e.visible&&(e.visible=!1,t.push(e))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let i=new h,a=new Uint8Array(e*e*4);for(let t=0;t<e;t++)for(let r=0;r<e;r++){let o=t,s=r;a[(t*e+r)*4]=(.5*i.noise(o,s)+.5)*255,a[(t*e+r)*4+1]=(.5*i.noise(o+e,s)+.5)*255,a[(t*e+r)*4+2]=(.5*i.noise(o,s+e)+.5)*255,a[(t*e+r)*4+3]=(.5*i.noise(o+e,s+e)+.5)*255}let r=new t.DataTexture(a,e,e,t.RGBAFormat,t.UnsignedByteType);return r.wrapS=t.RepeatWrapping,r.wrapT=t.RepeatWrapping,r.needsUpdate=!0,r}}c.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5},e.s(["GTAOPass",0,c],251376)},138671,e=>{"use strict";var t=e.i(190072);let i=new t.OrthographicCamera(-1,1,1,-1,0,1);class a extends t.BufferGeometry{constructor(){super(),this.setAttribute("position",new t.Float32BufferAttribute([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new t.Float32BufferAttribute([0,2,0,0,2,0],2))}}let r=new a;e.s(["FullScreenQuad",0,class{constructor(e){this._mesh=new t.Mesh(r,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,i)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},"Pass",0,class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}])},499062,e=>{"use strict";let t={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};e.s(["CopyShader",0,t])}]);