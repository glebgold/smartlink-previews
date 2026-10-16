(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,14287,e=>{"use strict";var t=e.i(190072);class r extends t.Mesh{constructor(e,a={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this.camera=new t.PerspectiveCamera;const o=this,l=new t.Color(void 0!==a.color?a.color:8355711),n=a.textureWidth||512,i=a.textureHeight||512,s=a.clipBias||0,d=a.shader||r.ReflectorShader,c=void 0!==a.multisample?a.multisample:4,u=new t.Plane,m=new t.Vector3,p=new t.Vector3,f=new t.Vector3,v=new t.Matrix4,x=new t.Vector3(0,0,-1),b=new t.Vector4,h=new t.Vector3,g=new t.Vector3,M=new t.Vector4,y=new t.Matrix4,w=this.camera,R=new t.WebGLRenderTarget(n,i,{samples:c,type:t.HalfFloatType}),U=new t.ShaderMaterial({name:void 0!==d.name?d.name:"unspecified",uniforms:t.UniformsUtils.clone(d.uniforms),fragmentShader:d.fragmentShader,vertexShader:d.vertexShader});U.uniforms.tDiffuse.value=R.texture,U.uniforms.color.value=l,U.uniforms.textureMatrix.value=y,this.material=U,this.onBeforeRender=function(e,t,r){if(p.setFromMatrixPosition(o.matrixWorld),f.setFromMatrixPosition(r.matrixWorld),v.extractRotation(o.matrixWorld),m.set(0,0,1),m.applyMatrix4(v),h.subVectors(p,f),!0==h.dot(m)>0&&!1===this.forceUpdate)return;h.reflect(m).negate(),h.add(p),v.extractRotation(r.matrixWorld),x.set(0,0,-1),x.applyMatrix4(v),x.add(f),g.subVectors(p,x),g.reflect(m).negate(),g.add(p),w.position.copy(h),w.up.set(0,1,0),w.up.applyMatrix4(v),w.up.reflect(m),w.lookAt(g),w.far=r.far,w.updateMatrixWorld(),w.projectionMatrix.copy(r.projectionMatrix),y.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),y.multiply(w.projectionMatrix),y.multiply(w.matrixWorldInverse),y.multiply(o.matrixWorld),u.setFromNormalAndCoplanarPoint(m,p),u.applyMatrix4(w.matrixWorldInverse),b.set(u.normal.x,u.normal.y,u.normal.z,u.constant);let a=w.projectionMatrix;M.x=(Math.sign(b.x)+a.elements[8])/a.elements[0],M.y=(Math.sign(b.y)+a.elements[9])/a.elements[5],M.z=-1,M.w=(1+a.elements[10])/a.elements[14],b.multiplyScalar(2/b.dot(M)),a.elements[2]=b.x,a.elements[6]=b.y,a.elements[10]=b.z+1-s,a.elements[14]=b.w,o.visible=!1;let l=e.getRenderTarget(),n=e.xr.enabled,i=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(R),e.state.buffers.depth.setMask(!0),!1===e.autoClear&&e.clear(),e.render(t,w),e.xr.enabled=n,e.shadowMap.autoUpdate=i,e.setRenderTarget(l);let d=r.viewport;void 0!==d&&e.state.viewport(d),o.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return R},this.dispose=function(){R.dispose(),o.material.dispose()}}}r.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
		uniform mat4 textureMatrix;
		varying vec4 vUv;

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			#include <logdepthbuf_vertex>

		}`,fragmentShader:`
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;

		#include <logdepthbuf_pars_fragment>

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		void main() {

			#include <logdepthbuf_fragment>

			vec4 base = texture2DProj( tDiffuse, vUv );
			gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`},e.s(["Reflector",0,r])}]);