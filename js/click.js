
var VSHADER_SOURCE = null;
var FSHADER_SOURCE = null;
var VSIZE = 4;
var showNormals = false;
var JSLighting = 0.0;
var PLighting = 1.0;
var GLighting = 0.0;
var selection_Mode = false;
var scroll_Mode = false;
var projectionView = true;
var changeView = false;
var mouseLeft = false;
var mouseRight = false;
var mouseCenter = false;
var count = 0.0;
var prevMouseX = 0.0;
var prevMouseY = 0.0;
var prevMouseZ = 0.0;
var rotx = 0.0;
var roty = 0.0;


////////////////////////////// COLOR VALUES ////////////////////////////////
//Color Table
var COLOR_TABLE = [
	[0.545, 0.000, 0.000, 1],   //red
	[1.000, 0.647, 0.000, 1],   //orange
	[1.000, 1.000, 0.000, 1],   //yellow
	[0.678, 1.000, 0.184, 1],   //yellow-green
	[0.000, 1.000, 0.000, 1],   //green
	[0.000, 1.000, 1.000, 1],   //aqua
	[0.000, 0.000, 1.000, 1],   //blue
	[0.255, 0.412, 0.882, 1],   //blue-purple
	[0.502, 0.000, 0.502, 1],   //purple
	[0.780, 0.082, 0.522, 1],   //red-purple
	[1.000, 1.000, 1.000, 1]    //white
];

//////////////////////////////// MAIN ////////////////////////////////////
var stop_render = false;
var DEBUG = false;

main();
function main(){
	const canvas = document.getElementById("glCanvas");
	const webgl = canvas.getContext("webgl");	

	//Disable the right mouse click context menu 
	canvas.oncontextmenu = function() { return false; };

	if(!webgl) {
		alert("Unable to initialize WebGL.  Your browser or machine may not support it");
		return;
	}

	loadFile("js/shader.vert", function(fileString) { onLoadShader(webgl, canvas, webgl.VERTEX_SHADER, fileString); });
    loadFile("js/shader.frag", function(fileString) { onLoadShader(webgl, canvas, webgl.FRAGMENT_SHADER, fileString); });
    //console.log( webgl.VERTEX_SHADER + " : " + webgl.FRAGMENT_SHADER);
}
function onLoad(webgl, canvas){

	//Did the shaders build, compile and link properly?
	if (!initialize(webgl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to initialize shaders.');
		return;
	}
	//Variables
	var v_array  = [];
	var v_arrays = [];
	var ellipse_array = [];
	var surface_normals = [];
	var d_object = [];
	var radius = .1;
	var e_ind = 12;
	var s_color  = COLOR_TABLE[10];        //color starts as white
	var cursor_c = [1.000, 0.000, 0.000, 1]; //unique color for the currently selected line
	var index_array = getIndArray(e_ind);
	var e_arrays = [];
	var light_objects = [[1, 0, 0, 1, 1, 1, 1]];
	var nd_array = [];
	var specularExp = 60.0;
	var vn_array = [];
	var near_plane = -5.0;
	var far_plane = 100.0;
	var sel_obj = -1;
	var buttons = [];
	var translation = [];
	var rotation = [];
	var scale = [];
	var iden = getIdentityM();
	var eye = [0, 0, 5];
	var focus = [0, 0, -1];
	var updir = [0, 1, 0];
	var fov = 30;

	//HTML objects
	var slider = document.getElementById("ps_slider");
	var i_slider = document.getElementById("i_slider");
	var r_slider = document.getElementById("r_slider");
	var r_button = document.getElementById("r_button");
	var l_button = document.getElementById("l_button");
	var fov_slider = document.getElementById("fov_slider");
	var save = document.getElementById("saveOBJ");
	var load = document.getElementById("loadOBJ");
	var cc = document.getElementById("clearCanvas");
	var sn = document.getElementById("showNormals");
	var mll = document.getElementById("lmoveLight");
	var mlr = document.getElementById("rmoveLight");
	var mcl = document.getElementById("lmoveCylinder");
	var mcr = document.getElementById("rmoveCylinder");
	var pl = document.getElementById("PLighting");
	var gl = document.getElementById("GLighting");
	var zi = document.getElementById("zoomIn");
	var zo = document.getElementById("zoomOut");

	//Get Shader Variables

	var u_viewMatrix = webgl.getUniformLocation(webgl.program, 'u_ViewMatrix');
	var u_projMatrix = webgl.getUniformLocation(webgl.program, 'u_ProjMatrix');
	var u_lightColor = webgl.getUniformLocation(webgl.program, 'u_LightColor');
	var u_lightPosition = webgl.getUniformLocation(webgl.program, 'u_LightPosition');
	var u_eyePosition = webgl.getUniformLocation(webgl.program, 'u_EyePosition');
	var u_ambientLight = webgl.getUniformLocation(webgl.program, 'u_AmbientLight');
	var u_modelMatrix = webgl.getUniformLocation(webgl.program, 'u_ModelMatrix');
	var u_rotationMatrix = webgl.getUniformLocation(webgl.program, 'u_RotationMatrix');
	var u_scalarMatrix = webgl.getUniformLocation(webgl.program, 'u_ScalarMatrix');

	var u_flightColor = webgl.getUniformLocation(webgl.program, 'u_FLightColor');
	var u_flightPosition = webgl.getUniformLocation(webgl.program, 'u_FLightPosition');
	var u_fambientLight = webgl.getUniformLocation(webgl.program, 'u_FAmbientLight');
	var u_fEyePosition = webgl.getUniformLocation(webgl.program, 'u_FEyePosition');

	var b_jsLighting = webgl.getUniformLocation(webgl.program, 'b_JSLighting');
	var b_gLighting = webgl.getUniformLocation(webgl.program, 'b_GLighting');
	var b_pLighting = webgl.getUniformLocation(webgl.program, 'b_PLighting');

	var a_position  = webgl.getAttribLocation(webgl.program, 'a_Position');
	var a_pointsize = webgl.getAttribLocation(webgl.program, 'a_PointSize');
	var a_color = webgl.getAttribLocation(webgl.program, 'a_Color');
	var a_normal = webgl.getAttribLocation(webgl.program, 'a_Normal');
	var u_spec = webgl.getUniformLocation(webgl.program, 'u_Spec');
	var u_speccolor = webgl.getUniformLocation(webgl.program, 'u_SpecColor');
	var sel_color = webgl.getUniformLocation(webgl.program, 's_Color');



	webgl.vertexAttrib1f(a_pointsize, 10.0);
	webgl.uniform1f(b_jsLighting, JSLighting);
	webgl.uniform1f(b_gLighting, GLighting);
	webgl.uniform1f(b_pLighting, PLighting);

	var viewMatrix = new Matrix4();
	var projMatrix = new Matrix4();
	//(field of view, aspect, near, far)
	projMatrix.setPerspective(fov, canvas.width/canvas.height, 1, 100);
	//(eye position x, y, z, Center x, y, z, Up Direction x, y, z)
	viewMatrix.lookAt(eye[0],eye[1],eye[2],focus[0], focus[1], focus[2], updir[0], updir[1], updir[2]);
	//pass Model view projection to the shader
	webgl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
	webgl.uniformMatrix4fv(u_projMatrix, false, projMatrix.elements);
	webgl.uniformMatrix4fv(u_modelMatrix, false, iden);
	webgl.uniformMatrix4fv(u_rotationMatrix, false, iden);
	webgl.uniformMatrix4fv(u_scalarMatrix, false, iden);

	//Set Light color
	webgl.uniform3f(u_lightColor, 1.0, 1.0, 1.0);
	//Set the position of the light source
	var lightPos = [0.0, 1.0, -1.0];
	var specColor = [0.0, 1.0, 0.0, 1.0];
	var ambientLight = [0.0, 0.0, 0.2];
	webgl.uniform3f(u_lightPosition, lightPos[0], lightPos[1], lightPos[2]);
	webgl.uniform3f(u_flightPosition, lightPos[0], lightPos[1], lightPos[2]);
	webgl.uniform3f(sel_color, 0.0, 0.0, 0.0);

	webgl.uniform3fv(u_eyePosition, new Float32Array(eye));
	webgl.uniform3fv(u_fEyePosition, new Float32Array(eye));
	//set the ambient light
	webgl.uniform3f(u_ambientLight, ambientLight[0], ambientLight[1], ambientLight[2]);
	webgl.uniform1f(u_spec, specularExp);

	webgl.uniform4f(u_speccolor, specColor[0], specColor[1], specColor[2], specColor[3]);
	//Set Light color
	webgl.uniform3f(u_flightColor, 1.0, 1.0, 1.0);
	
	//set the ambient light
	webgl.uniform3f(u_fambientLight, ambientLight[0], ambientLight[1], ambientLight[2]);
	//webgl.vertexAttrib1f(u_spec, specularExp);


	//Set Draw Object
	setDrawObject(d_object, webgl, v_array, v_arrays, canvas, 
		          a_position, a_pointsize, a_color, cursor_c, s_color, ellipse_array,
		          radius, e_ind, index_array, e_arrays, surface_normals, nd_array, light_objects,
		          vn_array, a_normal, near_plane, far_plane, sel_obj, buttons,
		          translation, rotation, scale, u_modelMatrix, u_rotationMatrix, u_scalarMatrix );

	//aqua button
	buildButton( 75/500, 60/500, 425/500, 460/500, [0.0, 1.0, 1.0, 1.0], d_object );
	//yellow button
	buildButton( 75/500, 60/500, 425/500, 390/500, [1.0, 1.0, 0.0, 1.0], d_object );

 	//mouse events
	canvas.onmousedown = function(ev) { mouseDown(ev, d_object); };
	canvas.onmouseup   = function(ev) { mouseUp(ev, d_object);};
	canvas.onmousemove = function(ev) {	mouseMove(ev, d_object) }; 

	canvas.onwheel     = function(ev) { scaleCylinder(ev, d_object); };
	window.onwheel	   = function(){return false;};

	//Keyboard listener
	document.onkeydown = function(ev) { handleKeyDown(ev, d_object) };

	//Slider functionsa
	slider.oninput     = function(){ changeSpecularValue(this.value, u_spec, d_object); };
	i_slider.oninput   = function(){ changeAmbientColor(this.value, ambientLight, u_fambientLight,
									 u_ambientLight, d_object); };
	r_slider.oninput   = function(){ changeSpecularColor(this.value, specColor, 
		                             u_speccolor, d_object); };
	fov_slider.oninput = function(){ changeFOV(this.value, projMatrix, u_projMatrix, d_object);	}
	//buttons
	r_button.onclick   = function(){ translateVertices(d_object, 10); };
	l_button.onclick   = function(){ translateVertices(d_object, -10); };
	load.onclick       = function(){ changeLookAt(viewMatrix, u_viewMatrix, d_object); };
	sn.onclick         = function(){ toggleOtho(u_viewMatrix, viewMatrix, u_projMatrix, projMatrix, d_object); };
	cc.onclick         = function(){ clearCanvas(d_object); };
	pl.onclick 	       = function(){ setPFlag(webgl, b_jsLighting, b_gLighting, b_pLighting);
	                                 drawScene(-1, d_object); 
	                             };
	gl.onclick 	       = function(){ setGFlag(webgl, b_jsLighting, b_gLighting, b_pLighting);
	                                 drawScene(-1, d_object); 
	                             };
	mll.onclick         = function(){ var vm = new Matrix4();
									  eye[2] += -0.1;
									  focus[2] += -0.1;
									  vm.lookAt(eye[0],eye[1],eye[2],focus[0], focus[1], focus[2], updir[0], updir[1], updir[2]);
	                                  webgl.uniformMatrix4fv(u_viewMatrix, false, vm.elements);
	                                  webgl.uniform3fv(u_eyePosition, new Float32Array(eye));
	                                  webgl.uniform3fv(u_fEyePosition, new Float32Array(eye));
	                                  drawScene(-1, d_object); 
	                              };
	mlr.onclick         = function(){ var vm = new Matrix4();
									  eye[2] += 0.1;
									  focus[2] += 0.1;

									  vm.lookAt(eye[0],eye[1],eye[2],focus[0], focus[1], focus[2], updir[0], updir[1], updir[2]);
	                                  webgl.uniformMatrix4fv(u_viewMatrix, false, vm.elements);
	                                  webgl.uniform3fv(u_eyePosition, new Float32Array(eye));
	                                  webgl.uniform3fv(u_fEyePosition, new Float32Array(eye));
	                                  drawScene(-1, d_object); 
	                              };
	zi.onclick          = function(){ var pm = new Matrix4();
		                              fov += -1;
		                              pm.setPerspective(fov, canvas.width/canvas.height, 1, 100);
		                              webgl.uniformMatrix4fv(u_projMatrix, false, pm.elements);
		                              drawScene(-1, d_object); 
	                              };
	zo.onclick          = function(){ var pm = new Matrix4();
		                              fov += 1;
		                              pm.setPerspective(fov, canvas.width/canvas.height, 1, 100);
		                              webgl.uniformMatrix4fv(u_projMatrix, false, pm.elements);
		                              drawScene(-1, d_object);  
	                              };

	mcl.onclick         = function(){ var vm = new Matrix4();
									  eye[0] += -0.1;
									  focus[0] += -0.1;
									  vm.lookAt(eye[0],eye[1],eye[2],focus[0], focus[1], focus[2], updir[0], updir[1], updir[2]);
	                                  webgl.uniformMatrix4fv(u_viewMatrix, false, vm.elements);
	                                  webgl.uniform3fv(u_eyePosition, new Float32Array(eye));
	                                  webgl.uniform3fv(u_fEyePosition, new Float32Array(eye));
	                                  drawScene(-1, d_object); 
	                             };
	mcr.onclick         = function(){ var vm = new Matrix4();
		                              eye[0] += 0.1;
									  focus[0] += 0.1;
									  vm.lookAt(eye[0],eye[1],eye[2],focus[0], focus[1], focus[2], updir[0], updir[1], updir[2]);
	                                  webgl.uniformMatrix4fv(u_viewMatrix, false, vm.elements);
	                                  webgl.uniform3fv(u_eyePosition, new Float32Array(eye));
	                                  webgl.uniform3fv(u_fEyePosition, new Float32Array(eye));
	                                  drawScene(-1, d_object); 
	                             };

	//setup SOR object reading/writing
    setupIOSOR("fileinput");
	//clear canvas
	webgl.clearColor(0.0, 0.0, 0.0, 1.0);
	webgl.clear(webgl.COLOR_BUFFER_BIT);
	drawScene(-1, d_object);

}

function moveCylinder(d_object, delta){
	console.log(d_object);
	var cyl = d_object.e_arrays[0][0];
	for(var i = 0; i < cyl.length; ++i){
		var cylinder = cyl[i];
		for(var j = 0; j < cylinder.length; j+=3){
			cylinder[j] += delta;
		}
	}
}
function setJSNFlag(webgl, b_jsLighting, b_gLighting, b_pLighting){
	if(JSLighting == 1) return;
	JSLighting = 1;
	GLighting = 0;
	PLighting = 0;
	webgl.uniform1f(b_jsLighting, JSLighting);
	webgl.uniform1f(b_pLighting, PLighting);
	webgl.uniform1f(b_gLighting, GLighting);
}
function setPFlag(webgl, b_jsLighting, b_gLighting, b_pLighting){
	if(PLighting == 1) return;
	JSLighting = 0;
	PLighting = 1;
	GLighting = 0;
	webgl.uniform1f(b_pLighting, PLighting);
	webgl.uniform1f(b_jsLighting, JSLighting);
	webgl.uniform1f(b_gLighting, GLighting);

}
function setGFlag(webgl, b_jsLighting, b_gLighting, b_pLighting){
	if(GLighting == 1) return;
	JSLighting = 0;
	PLighting = 0;
	GLighting = 1;
	webgl.uniform1f(b_jsLighting, JSLighting);
	webgl.uniform1f(b_pLighting, PLighting);
	webgl.uniform1f(b_gLighting, GLighting);

}

////////////////////// DRAW OBJECT    ////////////////////////////////////
function setDrawObject(d_object, webgl, v_array, v_arrays, canvas, 
                       a_position, a_pointsize, a_color, cursor_color, 
                       c_color, e_array, radius, e_ind, i_array, e_arrays, n_array, nd_array, 
                       l_array, vn_array, a_normal, near_plane, far_plane, sel_obj, buttons,
                       c_t, c_r, c_s, u_m, u_r, u_s ){

	d_object["cursor"]       = 0;            //element of array that is currently selected
	d_object["webgl"]        = webgl;        //Current context
	d_object["v_array"]      = v_array;      //Current working line
	d_object["v_arrays"]     = v_arrays;     //Set of all lines
	d_object["canvas"]       = canvas;       //Current canvas object
	d_object["a_position"]   = a_position;   //Attribute variable for Vertex Shader
	d_object["a_pointsize"]  = a_pointsize;  //Attribute variable for Vertex Shader
	d_object["a_color"]      = a_color;      //varying variable for fragment shader
	d_object["cursor_color"] = cursor_color; //changes the color of the selected line
	d_object["c_index"]      = 0;            //Color index
	d_object["c_color"]      = c_color;      //Color of the working object
	d_object["e_array"]      = e_array;      //array of orthogonal vectors
	d_object["radius"]       = radius;       //radius of the ellipse
	d_object["e_ind"]        = e_ind;        //Number of points in the ellipse
	d_object["i_array"]      = i_array;      //array of indices for drawing
	d_object["e_arrays"]     = e_arrays;	 //array of ellipse objects
	d_object["n_array"]      = n_array;		 //array of normals for calculations
	d_object["nd_array"]     = nd_array;     //array of normals for drawing
	d_object["l_array"] 	 = l_array;		 //array of light objects
	d_object["vn_array"]     = vn_array;     //Array of vector normals for smooth shading
	d_object["a_normal"]     = a_normal;     //Shader variable
	d_object["near_plane"]   = near_plane;   //near plane in perspective
	d_object["far_plane"]    = far_plane;    //far plane in perspective
	d_object["selected_obj"] = sel_obj;		 //Selected cylinder
	d_object["buttons"]      = buttons;      //Canvas buttons
	d_object["c_translate"]  = c_t;			 //array of translation vectors
	d_object["c_rotate"]     = c_r;			 //array of rotation vectors
	d_object["c_scale"]      = c_s;			 //array of scalar vectors
	d_object["u_modelMatrix"]= u_m;
	d_object["u_rotMat"]     = u_r;
	d_object["u_scaMat"]     = u_s;
}

////////////////////// DRAW FUNCTIONS ////////////////////////////////////

//Draw all lines
function drawScene( ev, d_object ){
	

	d_object.webgl.clear(d_object.webgl.COLOR_BUFFER_BIT);
	var vlen = d_object.v_arrays.length;
	var n_c = d_object.c_color;
	var count;
	var s_c = false;

	//draw each stored line
	for( var i = 0; i < vlen; ++i){
		var t_array = d_object.v_arrays[i];
		var c_array = d_object.e_arrays[i];
		if(d_object.selected_obj == i){
			s_c = true;
		} else {
			s_c = false;
		}

		//If the cursor is enabled, change the color of v_arrays[cursor]
		if(cursor_enabled && i == d_object.cursor ){
			var t_color = t_array[1];            //Store polyline color
			var c_color = c_array[2];
			
			t_array[1] = d_object.cursor_color;  //Set polyline color to cursor color
			c_array[2] = d_object.cursor_color;
			//draw all arrays
			//drawArrays(d_object.webgl, t_array, d_object.a_position, d_object.a_color, webgl.LINE_STRIP);
			
			if(JSLighting == 1){
				drawCylinder(d_object, c_array);
			} else {
				drawVCylinder(d_object, c_array, i + 1, s_c);
			}

			t_array[1] = t_color;  //restore polyline color
			c_array[2] = c_color;
		} else{
			//draw all arrays
			//drawArrays(d_object.webgl, t_array, d_object.a_position, d_object.a_color, d_object.webgl.LINE_STRIP);
			//drawArrays(d_object.webgl, t_array, d_object.a_position, d_object.a_color, d_object.webgl.POINTS);
			
			if(JSLighting == 1){
				drawCylinder(d_object, c_array);
			} else {
				drawVCylinder(d_object, c_array, i + 1, s_c);
			}
			
		}
		
    }
    s_c = false;
    var select_color = d_object.webgl.getUniformLocation(d_object.webgl.program, 's_Color');
	d_object.webgl.uniform3f(select_color, 0.0, 0.0, 0.0);

    var b_jsLighting = d_object.webgl.getUniformLocation(d_object.webgl.program, 'b_JSLighting');
	var b_gLighting = d_object.webgl.getUniformLocation(d_object.webgl.program, 'b_GLighting');
	var b_pLighting = d_object.webgl.getUniformLocation(d_object.webgl.program, 'b_PLighting');
	
	d_object.webgl.uniform1f(b_jsLighting, 1.0);
	d_object.webgl.uniform1f(b_gLighting, 0.0);
	d_object.webgl.uniform1f(b_pLighting, 0.0);


    for(var j = 0; j < d_object.buttons.length; j++){
    	var button = d_object.buttons[j];
    	var vert = button[0];
    	var ind = button[1];
    	var norm = button[2]; 
    	var color = button[3];
    	var t = getIdentityM();
    	var r = getIdentityM();
    	var s = getIdentityM();
    	//console.log(button);
    	drawSmooth(vert, norm, color, ind, t, s, r, d_object.a_position,  
    		       d_object.a_normal, d_object.a_color, d_object.u_modelMatrix, 
    		       d_object.u_rotMat, d_object.u_scaMat, d_object.webgl);	
    }
    d_object.webgl.uniform1f(b_jsLighting, 0.0);
	d_object.webgl.uniform1f(b_gLighting, 0.0);
	d_object.webgl.uniform1f(b_pLighting, 1.0);

    /*
    if( ev != -1 ){
	    //draw current line with rubber-banding
	    var xy = getMouseCoord(d_object.canvas, ev.target.getBoundingClientRect(), ev.clientX, ev.clientY);
		d_object.v_array.push(xy[0]); //Mouse X coord
		d_object.v_array.push(xy[1]); //Mouse Y coord
		d_object.v_array.push(0);     //mouse Z coord
		d_object.v_array.push(1.0);
		d_object.v_array.push(1.0);
		d_object.v_array.push(1.0);
		d_object.v_array.push(1.0);

	    drawArrays(d_object.webgl, [new Float32Array(d_object.v_array), d_object.c_color],
	               d_object.a_position, d_object.a_color, d_object.webgl.LINE_STRIP);
	    //drawArrays(d_object.webgl, [new Float32Array(d_object.v_array), d_object.c_color],
	               //d_object.a_position, d_object.a_color, d_object.webgl.POINTS);

	    d_object.v_array.pop();
	    d_object.v_array.pop();
	    d_object.v_array.pop();
	    d_object.v_array.pop();
	    d_object.v_array.pop();
	    d_object.v_array.pop();
	    d_object.v_array.pop();
	} else {

	    drawArrays(d_object.webgl, [new Float32Array(d_object.v_array), d_object.c_color],
	               d_object.a_position, d_object.a_color, d_object.webgl.LINE_STRIP);
	   // drawArrays(d_object.webgl, [new Float32Array(d_object.v_array), d_object.c_color],
	              // d_object.a_position, d_object.a_color, d_object.webgl.POINTS);
	
	}*/

}


function drawWithIndices(webgl, e_array, i_array, a_position, a_color, type){
	var v_buffer = webgl.createBuffer();//vertex buffer
	var i_buffer = webgl.createBuffer();//index buffer
		//Was the buffer created corretly?
	if(!v_buffer){
		console.log("Failed to create vertex buffer");
		return null;
	}
		if(!i_buffer){
		console.log("Failed to create index buffer");
		return null;
	}

	//Bind the vertex buffer
	webgl.bindBuffer(webgl.ARRAY_BUFFER, v_buffer);
	webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, i_buffer);//index buffer

	var t_array = new Float32Array(e_array);
	var ti_array = new Uint16Array(i_array);

	webgl.bufferData(webgl.ARRAY_BUFFER, t_array, webgl.STATIC_DRAW);//vertex buffer
	webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, ti_array, webgl.STATIC_DRAW);

	//Set pointer for vertices
	webgl.vertexAttribPointer(a_position, 3, webgl.FLOAT, false, VSIZE * 7, 0);
	webgl.enableVertexAttribArray(a_position);
	//set pointer for colors
	webgl.vertexAttribPointer(a_color, 4, webgl.FLOAT, false, VSIZE * 7, VSIZE * 3);
	webgl.enableVertexAttribArray(a_color);

	//console.log("drawWithIndices()");
	//console.log("t_array length: " + t_array.length + "  t_array : ", t_array);
	//console.log("ti_array : ", ti_array);
	var len = ti_array.length;
	
	webgl.drawElements(type, len, webgl.UNSIGNED_SHORT, 0);
}

//Draw each line
function drawArrays(webgl, v_array, a_position, a_color, type){

	//Create buffer object
	var v_buffer = webgl.createBuffer();

	//Was the buffer created corretly?
	if(!v_buffer){
		console.log("Failed to create vertex buffer");
		return null;
	}
	//Bind the vertex buffer
	webgl.bindBuffer(webgl.ARRAY_BUFFER, v_buffer);

	var len = v_array[0].length/7;//number of vertices in set

	//Set values in the buffer
	webgl.bufferData(webgl.ARRAY_BUFFER, v_array[0], webgl.STATIC_DRAW);

	//Set pointer for Attribute array
	webgl.vertexAttribPointer(a_position, 3, webgl.FLOAT, false, VSIZE * 7, 0);

	//Enable Attribute array
	webgl.enableVertexAttribArray(a_position);

	webgl.vertexAttribPointer(a_color, 4, webgl.FLOAT, false, VSIZE * 7, VSIZE * 3);
	webgl.enableVertexAttribArray(a_color);

	//Draw vertices
	webgl.drawArrays(type, 0, len);
}
//Draw each line
function drawArray(webgl, v_array, a_position, a_color, type){

	//Create buffer object
	var v_buffer = webgl.createBuffer();

	//Was the buffer created corretly?
	if(!v_buffer){
		console.log("Failed to create vertex buffer");
		return null;
	}
	//Bind the vertex buffer
	webgl.bindBuffer(webgl.ARRAY_BUFFER, v_buffer);

	var v_a = new Float32Array(v_array);
	var len = v_array.length/7;//number of vertices in set
	//console.log("array for drawing : ", v_array);
	//Set values in the buffer
	webgl.bufferData(webgl.ARRAY_BUFFER, v_a, webgl.STATIC_DRAW);

	//Set pointer for vertex
	webgl.vertexAttribPointer(a_position, 3, webgl.FLOAT, false, VSIZE * 7, 0);
	webgl.enableVertexAttribArray(a_position);
	//set pointer for color
	webgl.vertexAttribPointer(a_color, 4, webgl.FLOAT, false, VSIZE * 7, VSIZE * 3);
	webgl.enableVertexAttribArray(a_color);

	//Draw vertices
	webgl.drawArrays(type, 0, len);
}
function drawSmooth(vertices, normals, colors, indices, t, r, s,
					a_position, a_normal, a_color, u_t, u_r, u_s, webgl){
	
	//console.log("vertices : ", vertices, "  indices : ", indices, "  normals: ", normals, "colors :", colors);
	//console.log("translation : ", translation);
	var v_buffer = webgl.createBuffer();
	var i_buffer = webgl.createBuffer();
	var c_buffer = webgl.createBuffer();
	var n_buffer = webgl.createBuffer();

	var v_a = new Float32Array(vertices);
	var i_a = new Uint16Array(indices);
	var c_a = new Float32Array(colors);
	var n_a = new Float32Array(normals);
	var f_t = new Float32Array(t);
	var f_r = new Float32Array(r);
	var f_s = new Float32Array(s);

	webgl.uniformMatrix4fv(u_t, false, f_t);
	webgl.uniformMatrix4fv(u_r, false, f_r);
	webgl.uniformMatrix4fv(u_s, false, f_s);

	webgl.bindBuffer(webgl.ARRAY_BUFFER, v_buffer);
	webgl.bufferData(webgl.ARRAY_BUFFER, v_a, webgl.STATIC_DRAW);

	webgl.vertexAttribPointer(a_position, 3, webgl.FLOAT, false, 0, 0);
	webgl.enableVertexAttribArray(a_position);

	webgl.bindBuffer(webgl.ARRAY_BUFFER, n_buffer);
	webgl.bufferData(webgl.ARRAY_BUFFER, n_a, webgl.STATIC_DRAW);

	webgl.vertexAttribPointer(a_normal, 3, webgl.FLOAT, false, 0, 0);
	webgl.enableVertexAttribArray(a_normal);

	webgl.bindBuffer(webgl.ARRAY_BUFFER, c_buffer);
	webgl.bufferData(webgl.ARRAY_BUFFER, c_a, webgl.STATIC_DRAW);

	webgl.vertexAttribPointer(a_color, 4, webgl.FLOAT, false, 0, 0);
	webgl.enableVertexAttribArray(a_color);

	webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, i_buffer);//index buffer
	webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, i_a, webgl.STATIC_DRAW);

	var len = i_a.length;

	webgl.drawElements(webgl.TRIANGLES, len, webgl.UNSIGNED_SHORT, 0);
}

////////////////////// EVENT HANDLERS ////////////////////////////////////

//Mouse button click event
function click(ev, d_object){
	switch(ev.buttons){
		case 1:
			leftClick(ev, d_object);
			break;
		case 2:
		    rightClick( d_object );
			break;
		default:
			break;
	}
}
function mouseDown(ev, d_object){
	xyz = getMouseCoord(d_object.canvas, ev.target.getBoundingClientRect(), ev.clientX, ev.clientY);
	prevMouseX = xyz[0];
	prevMouseY = xyz[1];
	//console.log(ev);
	switch(ev.buttons){
		case 1:
			mouseLeft = true;
			break;
		case 2:
		    mouseRight = true;
			break;
		case 4:
			mouseCenter = true;
		default:
			break;
	}
}
function mouseUp(ev, d_object){
	if(mouseLeft){
		leftClick(ev, d_object);
	}
	if(mouseRight){
		rightClick( d_object );
	}

	mouseLeft = false;
	mouseRight = false;
	mouseCenter = false;
}
var cursor_enabled = false;
//Keyboard key press event
function handleKeyDown(ev, d_object){

	switch(ev.key){
		case 'ArrowUp':
			changeWorkingArray(ev, d_object, 1);//cycle up through polylines
			//console.log("Cursor : " + d_object.cursor + " Length : " + d_object.v_arrays.length);
			break;
		case 'ArrowDown':
			changeWorkingArray(ev, d_object, -1);//cycle down through poly lines
			//console.log("Cursor : " + d_object.cursor + " Length : " + d_object.v_arrays.length);
			break;
		case 'p':
			console.log(d_object.v_arrays);//print all stored arrays
			break;
		case 'e':
			//enable/disable cursor for seslecting stored array
			if(cursor_enabled){ cursor_enabled = false }else{ cursor_enabled = true };
			break;
		case 'd':
			if(!cursor_enabled) return;
			//Delete v_arrays[cursor]
			deleteArray(d_object);
			break;
		case 'c':
			//Clear working array
			clearWorkingArray(d_object);
			break;
		case 'v':
			drawNormals(d_object);
			break;
		case'l':
			saveOBJ(d_object);
			break;
		case 'o':
			if(DEBUG){
				DEBUG = false;
			} else {
				DEBUG = true;
			}
			console.log(DEBUG);
			break;
		default:
			return;
			break;
	} drawScene(ev, d_object);
}

//Mouse wheel event
function scaleCylinder(ev, d_object ){

	//Normalized direction of the mouse wheel
	var inc = (ev.deltaY/Math.abs(ev.deltaY) * -1 ) *.1 ;
	if(d_object.selected_obj != -1){
		var c = d_object.e_arrays[d_object.selected_obj];
		//console.log(c);
		var sl = c[10];
		for(var i = 0; i < sl.length; ++i){
			var s = sl[i];
			s[0] += inc;
			s[5] += inc;
			s[10]+= inc;
		}
		drawScene(ev, d_object);
	}
}

//changed which line object the cursor is pointing at
function changeWorkingArray(ev, d_object, i){
	var next_cursor = i + d_object.cursor;
	var len = d_object.v_arrays.length;

	if( i > 0 && next_cursor >= len){
		d_object.cursor = 0;
	} else if( i < 0 && next_cursor < 0){
		d_object.cursor = len - 1;
	} else {
		d_object.cursor = next_cursor;
	}
}

///////////////////// BUTTON FUNCTIONALITY ///////////////////////////////
function toggleOtho(u_viewMatrix, viewMatrix, u_projMatrix, projMatrix, d_object){
	projectionView = (projectionView) ? false : true;
	if(projectionView){
		//(field of view, aspect, near, far)
		projMatrix.setPerspective(30, d_object.canvas.width/d_object.canvas.height, 1, 100);
		//(eye position x, y, z, Center x, y, z, Up Direction x, y, z)
		viewMatrix.lookAt(0,0,5,0,0,-10,0,1,0);
		//pass Model view projection to the shader
		d_object.webgl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
		d_object.webgl.uniformMatrix4fv(u_projMatrix, false, projMatrix.elements);
	} else {
		projMatrix.setIdentity();
		//(eye position x, y, z, Center x, y, z, Up Direction x, y, z)
		viewMatrix.setIdentity();
		//pass Model view projection to the shader
		d_object.webgl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);
		d_object.webgl.uniformMatrix4fv(u_projMatrix, false, projMatrix.elements);
	}
	drawScene(-1, d_object);
}
function changeLookAt(viewMatrix, u_viewMatrix, d_object){
	var vm = new Matrix4();
	changeView = (changeView) ? false : true;
	if(changeView){
		vm.lookAt(6, 5, 5, -6, -5, -10, 0, 1, 0);
		d_object.webgl.uniformMatrix4fv(u_viewMatrix, false, vm.elements);
		drawScene(-1, d_object);
	} else {
		//(eye position x, y, z, Center x, y, z, Up Direction x, y, z)
		vm.lookAt(0,0,5,0,0,-10,0,1,0);
		//pass Model view projection to the shader
		d_object.webgl.uniformMatrix4fv(u_viewMatrix, false, vm.elements);
		drawScene(-1, d_object);
	}
}
function changeFOV(value, projMatrix, u_projMatrix, d_object){

}
function translateVertices(d_object, delta){
	var t_delta = delta/d_object.canvas.width;
	var v_len = d_object.v_arrays.length;
	var len = d_object.v_array.length;
	for(i = 0; i < v_len ; ++i){
		var t_array = d_object.v_arrays[i][0];
		var t_len = t_array.length;
		for( j = 0; j < t_len; j+=2){
			t_array[j] += t_delta;
		}
	}
	for( i = 0; i < len; i += 2){
		d_object.v_array[i] += t_delta;
	}
	drawScene(-1, d_object);
}
//Slider bar
function changeSpecularValue( value, u_Spec, d_object ){
	d_object.webgl.uniform1f(u_Spec, value);
	drawScene(-1, d_object);

}
function changeAmbientColor( value, color, a_c, af_c, d_object ){
	color = COLOR_TABLE[value];

	d_object.webgl.uniform3f(a_c, color[0] * 0.2, color[1] * 0.2, color[2] * 0.2);
	d_object.webgl.uniform3f(af_c, color[0] * 0.2, color[1] * 0.2, color[2] *0.2);
	drawScene(-1, d_object);
}
function changeSpecularColor(value, color, s_c, d_object ){
	color = COLOR_TABLE[value];
	d_object.webgl.uniform4f(s_c, color[0], color[1], color[2], color[3]);
	drawScene(-1, d_object);

}
var has_rclicked = false;

//Right Mouse Button
function rightClick( d_object ){
	//echo mouse click to console
	console.log("Right mouse button has been clicked!!");

	//if right mouse button was already clicked, do nothing
	if( has_rclicked ) return;
	if(selection_Mode || scroll_Mode) return;

	has_rclicked = true;

	//Convert working array to typed array
	var temp_array = new Float32Array(d_object.v_array);
	var color = d_object.c_color;
	var len = d_object.v_array.length;
	var e_len = len/3;
	//console.log("Right Click : ", d_object);
	buildCylinders(d_object);
	storeCylinder(d_object);
	
	//Push typed array on to the v_arrays stack
	d_object.v_arrays.push([temp_array, color]);

	//printCylinderVolume(temp_array, d_object.radius);
	//printCylinderArea(temp_array, d_object.radius);

	//Print and delete all clicked vertices
	//console.log( "Clicked points : " );
	
	
	dustArray(d_object.v_array);
	drawScene(-1, d_object);
}

//Left Mouse Button
function leftClick(ev, d_object ){
	var rect =  ev.target.getBoundingClientRect();
	var s_o = new Uint8Array(4);
	var selected_color = [];
	//echo mouse click to console
	console.log("Left mouse button has been clicked!!");

	if( rect.left <= ev.clientX && ev.clientX < rect.right && 
		rect.top <= ev.clientY && ev.clientY < rect.bottom){

		drawScene(ev, d_object);
		var x = ev.clientX - rect.left;
		var y = rect.bottom - ev.clientY;
		d_object.webgl.readPixels(x, y, 1, 1, d_object.webgl.RGBA, 
								  d_object.webgl.UNSIGNED_BYTE, s_o );
		//console.log(s_o);
		for(var j = 0; j < s_o.length; ++j){
			selected_color[j] = s_o[j] / 255;
		}

		for(var j = 0; j < d_object.buttons.length; ++j){
			var button = d_object.buttons[j];
			var c = button[3];
			var color = [c[0], c[1], c[2], c[3]];
			if(selected_color[0] == color[0] && selected_color[1] == color[1] &&
			   selected_color[2] == color[2] && selected_color[3] == color[3] ){
			   console.log("Button[" + j + "] selected!");
			   buttonClick(j);
			   d_object.selected_obj = -1;
			   drawScene(ev, d_object);
			   return;
			}
		}
	}

	//Has the right mouse button been clicked?
	if(has_rclicked){
		has_rclicked = false;
		dustArray(d_object.e_array);
	}
	//console.log("Left Click : ", d_object);
	//get the normalized mouse coordinates

	var xyz = getMouseCoord(d_object.canvas, rect, ev.clientX, ev.clientY);
	//console.log("Rect : ", rect, "  Xyz : ", xyz, "  X: ", x, "  Y: ", y);
	if( selection_Mode == false){
		d_object.v_array.push(xyz[0]); //X coord
		d_object.v_array.push(xyz[1]); //y coord
		d_object.v_array.push(xyz[2]); //z coord
		d_object.v_array.push(d_object.c_color[0]);
		d_object.v_array.push(d_object.c_color[1]);
		d_object.v_array.push(d_object.c_color[3]);
		d_object.v_array.push(d_object.c_color[2]);
		drawScene(ev, d_object);
	} else {

		//if no object was selected, set flag to -1
		//otherwise convert alpha back to cylinder number
		if(selected_color[0] == 0 && selected_color[1] == 0 && selected_color[2] == 0){
			d_object.selected_obj = -1;
		} else {
			d_object.selected_obj = parseInt(((selected_color[3] - 1)/ALPHA_DELTA) * -1);
		}
		
		console.log("Color Selected : ", selected_color);
		drawScene(-1, d_object);
	}
	//Drawing pass
}

function buttonClick( button ){
	switch(button){
		case 0 :
			enableSelectMode();
			break;
		case 1 :
			enableScrollMode();
			break;
		default :
			console.log("Button doesn't exist : " + button);
			break;
	}
}
function enableSelectMode(){
	selection_Mode = (selection_Mode) ? false : true;
	scroll_Mode = false;
}
function enableScrollMode(){
	scroll_Mode = (scroll_Mode) ? false : true;
	selection_Mode = false;
}
//returns normalized mouse coordinates
function getMouseCoord(canvas, rect, x, y){
	return ([((x - rect.left) - canvas.width/2)/(canvas.width/2),
	          (canvas.height/2 - (y - rect.top))/(canvas.height/2), 0 ]);
}

//Print all current lines to console
function printArrays(d_object){
	var len = d_object.v_arrays.length;
	console.log("Number of line objects : " + len );
	for(i = 0 ; i < len ; ++i){
		console.log( i + " : " + d_object.v_arrays[i]);
	}
}

//Clear Working array
function clearWorkingArray(d_object){
	var len = d_object.v_array.length;
	for(i = 0; i < len; ++i){
		d_object.v_array.pop();
	}
}

//Delete array from list
function deleteArray(d_object){
	//Safely remove the polyline from the list
	d_object.v_arrays.splice(d_object.cursor, 1);
	d_object.e_arrays.splice(d_object.cursor, 1);
	if(d_object.cursor == d_object.v_arrays.length) --d_object.cursor;
}
function printVectorAngles(webgl, d_object){
	var t_a = d_object.v_array
	var len = t_a.length
	console.log("Length : " + len + "  Array : " + t_a );

	if(len < 9) return;
	for (i = 0; i <= (len - 9); i += 3){
		var v_one = [t_a[i], t_a[i+1], t_a[i+2]];
		var v_two = [t_a[i+3], t_a[i+4], t_a[i+5]];
		var v_three = [t_a[i+6], t_a[i+7], t_a[i+8]];
		var temp = splitVectors(v_one, v_two, v_three);
		console.log(temp + " : " + i);
	}
}
function mouseMove(ev, d_object){
	if(scroll_Mode && !mouseLeft && !mouseRight && !mouseCenter){
		console.log("scroll_Mode");
		var rect =  ev.target.getBoundingClientRect();
		var s_o = new Uint8Array(4);
		var selected_color = [];

		if( rect.left <= ev.clientX && ev.clientX < rect.right && 
		rect.top <= ev.clientY && ev.clientY < rect.bottom){

			drawScene(ev, d_object);
			var x = ev.clientX - rect.left;
			var y = rect.bottom - ev.clientY;
			d_object.webgl.readPixels(x, y, 1, 1, d_object.webgl.RGBA, 
									  d_object.webgl.UNSIGNED_BYTE, s_o );
			//console.log(s_o);
			for(var j = 0; j < s_o.length; ++j){
				selected_color[j] = s_o[j] / 255;
			}
			//if no object was selected, set flag to -1
			//otherwise convert alpha back to cylinder number
			if(selected_color[0] == 0 && selected_color[1] == 0 && selected_color[2] == 0){
				d_object.selected_obj = -1;
			} else if(selected_color[3] < 1){
				d_object.selected_obj = parseInt(((selected_color[3] - 1)/ALPHA_DELTA) * -1);
			}
		}
	} 
	if(mouseLeft || mouseRight || mouseCenter){
		var xyz = getMouseCoord(d_object.canvas, ev.target.getBoundingClientRect(), ev.clientX, ev.clientY);
		var deltaX = xyz[0] - prevMouseX;
		var deltaY = xyz[1] - prevMouseY;
		if(d_object.selected_obj != -1){
			var cylinderToTranslate = d_object.e_arrays[d_object.selected_obj];
			var t = cylinderToTranslate[8];
			var r = cylinderToTranslate[9];
			for(var i = 0; i < t.length; ++i){
				if(mouseCenter){
					if(movedVertical(deltaX, deltaY)){
						t[i][14] += deltaY;
					}

				} else if(mouseLeft){
					t[i][12] += deltaX;
					t[i][13] += deltaY;
				} else {
					console.log("rm");
					if(movedHorizontal(deltaX, deltaY)){
						rotx = (rotx + (deltaX * RAD2DEG * 0.05))%360;
						var rot = getRx(rotx);
						r[i] = rot;
						//console.log(r[i]);
					}
					if(movedVertical(deltaX, deltaY)){
						roty = (roty + (deltaY * RAD2DEG * 0.05))%360;
						var rot = getRy(roty);
						r[i] = rot;
						//console.log(r[i]);
					}
				}
			}
		}
		//console.log("Mouse Pos : ", xyz, "  prevMouseX : " + prevMouseX + "  prevMouseX : " + prevMouseX +
			//"  deltaX : " + deltaX + "deltaY : " + deltaY);
		prevMouseX = xyz[0];
		prevMouseY = xyz[1];

	}

	drawScene(-1, d_object);
	
}
function movedVertical(deltaX, deltaY){

	if( Math.abs(deltaY) > .01 && Math.abs(deltaX) < .01){ 
		console.log("movedVertical!");
		return true;
	}
	return false;
}
function movedHorizontal(deltaX, deltaY){
	if( Math.abs(deltaX) > .01 && Math.abs(deltaY) < .01){
				console.log("movedHorizontal!");
		return true;
	}
	return false;
}
///////////////////// INITIALIZE SHADERS /////////////////////////////////

//Build program from shader files
function onLoadShader(webgl, canvas, type, fileString) {
    if (type == webgl.VERTEX_SHADER) { // The vertex shader is loaded
        VSHADER_SOURCE = fileString;
    } else
    if (type == webgl.FRAGMENT_SHADER) { // The fragment shader is loaded
        FSHADER_SOURCE = fileString;
    }
    //console.log("VS : " + VSHADER_SOURCE + "  FF : " + FSHADER_SOURCE);
   
    if(VSHADER_SOURCE && FSHADER_SOURCE){
    	onLoad(webgl, canvas);
    }
    
}

function buildProg(webgl, vertex, fragment) {

 	//Build Shaders
    var VS = buildShader(webgl, webgl.VERTEX_SHADER, vertex);
    var FS = buildShader(webgl, webgl.FRAGMENT_SHADER, fragment);

    //Did the shaders build properly?
    if (!VS || !FS) {
        return null;
    }

    //Create program
    var prog = webgl.createProgram();

    //Was the program created?
    if (!prog) {
        return null;
    }

    //Attach shaders to the program
    webgl.attachShader(prog, VS);
    webgl.attachShader(prog, FS);

    //Link the program to the canvas
    webgl.linkProgram(prog);

    //Did the program link properly?
    var linkProg = webgl.getProgramParameter(prog, webgl.LINK_STATUS);
    if (!linkProg) {
    	console.log("Program did not link properly");
    	webgl.deleteShader(VS);
        webgl.deleteShader(FS);
        webgl.deleteProgram(prog);
        return null;
    }

    return prog;
}

//Initialize Program
function initialize(webgl, vertex, fragment) {

	//initialize pipeline
    var prog = buildProg(webgl, vertex, fragment);

    //did the program build properly?
    if (prog == null) {
        console.log('Could not create the program: function initialize()');
        return false;
    }

    //set program
    webgl.useProgram(prog);
    webgl.program = prog;

    return true;
}

//Build Shader Programs
function buildShader(webgl, shader_type, src) {
	//initialize shader
    var shr = webgl.createShader(shader_type);

    //was the shader initialized properly?
    if (shr == null) {
        console.log('Unable to build shader:' + shader_type);
        return null;
    }

    //Set shader source
    webgl.shaderSource(shr, src);

    //Compile shader
    webgl.compileShader(shr);

    //Did the shader compile properly?
    var comp = webgl.getShaderParameter(shr, webgl.COMPILE_STATUS);
    if (comp == false) {
        console.log('Unable to compile shader: ' + shader_type);
        webgl.deleteShader(shr);
        return null;
    }

    return shr;
}
// saves polyline displayed on canvas to file
function saveOBJ(d_obj) {
    var sor = new SOR();
    if(!cursor_enabled){
    	console.log("SaveOBJ(): No object selected.");
    	return;
    }
    var s_object = d_obj.e_arrays[d_obj.cursor];
    var e_array = s_object[0];//vertex array
    var v_array = d_obj.v_arrays[d_obj.cursor][0];
    var s_array = [];
    var s_index = s_object[1];//index array
    var s_color = s_object[2];//color
    var s_ind = s_object[3];//number of indices
    var s_rad = s_object[4];//radius of cylinder

    for( var i = 0; i < e_array.length; ++i){
    	s_array.push(e_array[i]);
    }
    for( var i = 0; i < v_array.length; ++i){
    	s_array.push(v_array[length - i]);//push on backwards so can pop off in correct order
    }
    s_array.push(v_array.length);
    //push all information needed onto the vertex array which can be extracted when loaded
    s_array.push(s_color[3]);
    s_array.push(s_color[2]);
    s_array.push(s_color[1]);
    s_array.push(s_color[0]);
    s_array.push(s_ind);
    s_array.push(s_rad);

    sor.objName = "Cylinder";
    sor.vertices = s_array;
    sor.indexes = s_index;
    saveFile(sor);
}

function loadOBJ(d_object){
	var sor = readFile();
	if(!sor) {
		console.log("File could not be read");
		return;
	}
	var l_color = [];
	var l_array = sor.vertices;
	var l_index = sor.indexes ;
	var l_rad = l_array.pop();
	var l_ind = l_array.pop();
	var lv_array = [];
	l_color.push(l_array.pop());
	l_color.push(l_array.pop());
	l_color.push(l_array.pop());
	l_color.push(l_array.pop());
	var len = l_array.pop();
	for(var i = 0; i < len; ++i){
		lv_array.push(l_array.pop());
	}

	var obj = [l_array, l_index, l_color, l_ind, l_rad];
	d_object.e_arrays.push(obj);
	d_object.v_arrays.push([lv_array, l_color]);	
}
function dustArray( arr ){
	var len = arr.length;
	for(var i = 0; i < len; ++i){
		arr.pop();
	}
}
function clearCanvas(d_o){
	dustArray(d_o.v_arrays);
	dustArray(d_o.v_array);
	dustArray(d_o.e_array);
	dustArray(d_o.e_arrays);
	drawScene(-1, d_o);
}