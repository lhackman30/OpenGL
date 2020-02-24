uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_RotationMatrix;
uniform mat4 u_ScalarMatrix;


uniform vec3 u_LightColor;		
uniform vec3 u_LightPosition;
uniform vec3 u_EyePosition;	
uniform vec3 u_AmbientLight;
uniform float b_JSLighting;
uniform float b_GLighting;
uniform float b_PLighting;
uniform float u_Spec;
uniform vec4 u_SpecColor;

attribute float a_PointSize;
attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec4 a_Normal;

varying vec4 v_Color;
varying vec4 v_Normal;
varying vec4 v_Position;
varying float v_PLighting;
varying float v_Spec;
varying vec4 v_SpecColor;

void main() {
	if(b_GLighting > 0.0){
		vec4 position = u_ModelMatrix * u_RotationMatrix * u_ScalarMatrix * a_Position;
	    gl_Position = u_ProjMatrix * u_ViewMatrix * position;
	    vec3 normal = normalize(a_Normal.xyz);
	    vec3 lightDir = normalize(u_LightPosition - vec3(position));;
	    float d = max(dot(lightDir, normal), 0.0);
	    vec3 diffuse = u_LightColor * a_Color.rgb * d;
	    float specular = 0.0;
	    if( d > 0.0 ){
	    	vec3 R = reflect(-lightDir, normal);
	    	specular = pow(max(dot(R, u_EyePosition), 0.0), u_Spec);
	    }
	    if(d < 0.01){
	    	diffuse += u_AmbientLight;
	    }
	    vec3 spec = u_SpecColor.rgb * specular;
	    v_Color = vec4(diffuse + spec, a_Color.a);

	    gl_PointSize = a_PointSize;
    }
    if(b_JSLighting > 0.0){
    	gl_Position = a_Position;
    	gl_PointSize = a_PointSize;
    	v_Color = a_Color;
    }
    if(b_PLighting > 0.0){
    	gl_PointSize = a_PointSize;
    	vec4 position = u_ModelMatrix * u_RotationMatrix * u_ScalarMatrix * a_Position;
    	gl_Position = u_ProjMatrix * u_ViewMatrix * position;
    	v_Position = position;
    	v_Normal =  a_Normal;
    	v_Color = a_Color;
    	v_PLighting = b_PLighting;
    	v_Spec = u_Spec;
    	v_SpecColor = u_SpecColor;
    }
}
