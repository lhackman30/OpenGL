#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 u_FLightColor;		
uniform vec3 u_FLightPosition;
uniform vec3 u_FEyePosition;	
uniform vec3 u_FAmbientLight;
uniform vec3 s_Color;

varying vec4 v_Position;
varying vec4 v_Normal;
varying vec4 v_Color;
varying float v_PLighting;
varying float v_Spec;
varying vec4 v_SpecColor;

void main() {
	if(v_PLighting > 0.0){
	   vec3 normal = normalize(v_Normal.xyz);
	   vec3 lightDir = normalize(u_FLightPosition - vec3(v_Position));
	   float d = max(dot(lightDir, normal), 0.0);
	   vec3 diffuse = u_FLightColor * v_Color.rgb * d;
	   float specular = 0.0;
	   if(d > 0.0){
	      vec3 R = reflect(-lightDir, normal);
	      vec3 eyeDir = normalize(u_FEyePosition - v_Position.xyz);
	      specular = pow(max(dot(-eyeDir, R), 0.0), v_Spec);
	   } else {
	      diffuse += u_FAmbientLight;
	   }
	   vec3 spec = v_SpecColor.rgb * specular;
	   gl_FragColor = vec4(diffuse + spec + s_Color, v_Color.a);
	} else {
		gl_FragColor = v_Color + vec4(s_Color, 0.0);
	}
}