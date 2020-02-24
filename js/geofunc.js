///////////////////////////////////////////////////////////
//
//GEO METRIC FUNCTIONS
//
/////////////////////////////////////////////////////////////

var DEG2RAD = Math.PI/180;
var RAD2DEG = 180/Math.PI;
var ALPHA_DELTA = .003921568627451;

function getEllipse( x, z, points ){
	var lim = 360/points
	var ellipseArray = [];
	for( var i = 0; i < 360; i+=lim){
		var radians = i * DEG2RAD;
		var x_d = Math.cos(radians) * x;
		var z_d = Math.sin(radians) * z;
		ellipseArray.push(x_d);
		ellipseArray.push(0);
		ellipseArray.push(z_d);
		ellipseArray.push(0);
	}
	
	//console.log("GetEllpse() length: " + ellipseArray.length);
	//console.log("e_array : " + ellipseArray);
	return ellipseArray;
}

//Get two orthogonal ellipses for building cylinder
function getOrthoEllipse(d_obj, inda, indb){

	var len = d_obj.v_array.length/7;
	var k = inda*7;//index of vector a
	var j = indb*7;
	var v = d_obj.v_array;

	//Two vectors that make our line
	var vec_a = [ v[k], v[k+1], v[k+2], 0 ];
	var vec_b = [ v[j], v[j+1], v[j+2], 0 ];

	//c = b - a;
	var vec_c = normalize(subVector(vec_b, vec_a));//move vector to origin and normailze
	var n_vec = [-vec_c[1], vec_c[0], 0, 0];//normal vector 

	var angle_c = angleBetween([-1,0,0,0], [0,0,0,0], vec_c);//angle between the x-axis and the our vector
	var angle_b = angleBetween([-1,0,0,0], [0,0,0,0], n_vec);//angle between the x-axis and the new vector
	//console.log(" Ortho : angle: " + angle_b + " n_vec : " + n_vec + "  angle_c : " + angle_c);
	if(angle_c <= 90){
		angle_b *= -1;
	}
	angle_b = roundFloat(angle_b);
	var rot = getRz(angle_b * DEG2RAD);//rotation vector to rotate the ellipse about the z axis


	//get the vectors that make the ellipse on the origin in xz plane
	var e_a = getEllipse(d_obj.radius, d_obj.radius, d_obj.e_ind );
	var e_b = getEllipse(d_obj.radius, d_obj.radius, d_obj.e_ind );

	//rotate the ellipses
	e_a = matMult(e_a, rot);
	e_b = matMult(e_b, rot);

	d_obj.vn_array.push(getVectorNormals(e_a, e_b));

	/* Translate the cylinder
	//move the ellipses
	e_a = moveEllipse(e_a, vec_a[0], vec_a[1], vec_a[2]);
	e_b = moveEllipse(e_b, vec_b[0], vec_b[1], vec_b[2]);
	*/
	
	//center of the cylinder
	var tx = (vec_a[0] + vec_b[0])/2;
	var ty = (vec_a[1]+ vec_b[1])/2;
	var tz =  (vec_a[2]+ vec_b[2])/2;
	var centerpoint = [ tx, ty, tz];

	//move the vector to the origin
	var vec_d = subVector(vec_a, centerpoint);
	var vec_e = subVector(vec_b, centerpoint);
	//build cylinder around theorigin
	e_a = moveEllipse(e_a, vec_d[0], vec_d[1], vec_d[2]);
	e_b = moveEllipse(e_b, vec_e[0], vec_e[1], vec_e[2]);

	//Set up vertex array for finind normals and colors
	var cylinder = [];//array of ellipse vertices
	buildCylinderArray(cylinder, e_a);
	buildCylinderArray(cylinder, e_b);
	//e_array is a set of ellipse arrays that define each cylinder
	//[[cylinder1],[cylinder2],...]
	d_obj.e_array.push(cylinder);

	//translation matrix
	var trans = [1.0, 0.0, 0.0, 0.0,
				 0.0, 1.0, 0.0, 0.0,
				 0.0, 0.0, 1.0, 0.0,
				  tx,  ty,  tz, 1.0];
	var iden = getIdentityM();
	d_obj.c_translate.push(trans);
	d_obj.c_rotate.push(iden);
	d_obj.c_scale.push(iden);


	/* Code For finding the surface normals of the cylinder
	//get surface normals for cylinder
	//var normals = getSurfaceNormals(cylinder, d_obj.i_array, d_obj);
	n_array os a set of surface normals for each cooresponding ellipse array
	//[[normal array1], [normal_array2], ...]
	d_obj.n_array.push(normals[0]);//normals for calculations
	d_obj.nd_array.push(normals[1]);//normals for drawing
	*/
}

function buildCylinderArray(array, ellipse){
	var len = ellipse.length;
	for(var i = 0; i < len; i+=4){
		array.push(ellipse[i]);
		array.push(ellipse[i+1]);
		array.push(ellipse[i+2]);
	}
}
function moveEllipse(e_array, x, y, z){
	for( var i = 0; i < e_array.length; i+=4){
		e_array[i] += x;
		e_array[i+1] += y;
		e_array[i+2] += z;
	}
	return e_array;
}

function buildCylinders( d_obj ){
	var len = d_obj.v_array.length/7;
	for(var i = 0; i < len - 1; ++i){
		getOrthoEllipse(d_obj, i, i+1);
	}

}


//Cylinder object
//[0] = vertex array
//[1] = index array
//[2] = color array
//[3] = number of indexes
//[4] = radius of cylinder
//[5] = array of surface normals for calc
//[6] = array of normals for draw
function storeCylinder(d_obj){

	//console.log("storeCylinder() : d_obj : ", d_obj);
	var e_a = [];
	for(var i = 0; i < d_obj.e_array.length; ++i){
		e_a.push(d_obj.e_array[i]);
	}
	var i_a = d_obj.i_array;	//[ind1. ind2, ind3,...
	var c_c = d_obj.c_color.slice();	//[r,g,b,a]
	var e_p = d_obj.e_ind;		//float indices
	var e_w = d_obj.radius;		//float radius
	var s_n = [];				//[[normal array1], [normal_array2], ...]
	for(var i = 0; i < d_obj.n_array.length; ++i){
		s_n.push(d_obj.n_array[i]);
	}
	//normal array for drawing
	var s_nd = [];
	for(var i = 0; i < d_obj.nd_array.length; ++i){
		s_nd.push(d_obj.nd_array[i]);
	}
	//vertex normals for smooth shading
	var s_vn = [];
	for(var i = 0; i < d_obj.vn_array.length; ++i){
		s_vn.push(d_obj.vn_array[i]);
	}
	//translation matrix
	var s_tm = [];
	var s_rm = [];
	var s_sm = [];

	for(var i = 0; i < d_obj.c_translate.length; ++i){
		s_tm.push(d_obj.c_translate[i]);
		s_rm.push(d_obj.c_rotate[i]);
		s_sm.push(d_obj.c_scale[i]);
	}
	

	//reset the working arrays
	dustArray(d_obj.e_array)
	dustArray(d_obj.n_array);
	dustArray(d_obj.nd_array);
	dustArray(d_obj.vn_array);
	dustArray(d_obj.c_translate);
	dustArray(d_obj.c_rotate);
	dustArray(d_obj.c_scale);

	d_obj.e_arrays.push([e_a, i_a, c_c, e_p, e_w, s_n, s_nd, s_vn, s_tm, s_rm, s_sm ]);
}

//Draws a single Cylinder object
function drawCylinder( d_obj, cylinder ){
	//console.log("drawCylinder()!", cylinder);
	var count = 0;
	var c_a = cylinder[0];//cylinder array
	var i_a = cylinder[1];//index array for the cylinders
	var c_c = cylinder[2];//cylinder color
	var e_i = cylinder[3];//number of points in each ellipse
	var s_n = cylinder[5];//set of surface normals for calculations
	var s_nd = cylinder[6];//set of normals for drawing
	//console.log("drawCylinder() s_nd :", s_nd);
	var len = c_a.length;
	//iterate through each cylinder and find surface colors, then draw
	for(var i = 0; i < len; ++i){
		var c_d = findSurfaceColor(c_a[i], s_n[i], i_a, c_c, d_obj.l_array);
		//console.log("cylinder for draw : ", c_d);
		drawWithIndices(d_obj.webgl, c_d[0], c_d[1], d_obj.a_position, 
						d_obj.a_color, d_obj.webgl.TRIANGLES );
		if(showNormals){
			drawArray(d_obj.webgl, s_nd[i], d_obj.a_position, 
				      d_obj.a_color, d_obj.webgl.LINES);
		}

	}count++;

}
//iterate through the cylinder object using the index array and surface normals to find each
//surface color
function findSurfaceColor(cylinder, normals, index, cyl_color, light_array){
	var d_cyl = [];//array for drawing cylinder with shaded colors
	var d_ind = [];//indices for drawing new cylinder
	var len = normals.length;
	var l_len = light_array.length;
	//console.log("findSurfaceColor() : ", cylinder);
	//cycle through normal array to find color of surface
	for(var i = 0; i < len; i+=3){
		//cycle through all light sources for each normal
		var normal  = [ normals[i], normals[i+1], normals[i+2] ];//normal direction
		var surface = [ index[i]*3, index[i+1]*3, index[i+2]*3 ];//indicies of the triangle

		//get the color of the specific surface
		var shaded_color = calculateSurfaceColor(normal, light_array[0], cyl_color);

		//vectors of the triangle
		vec_a = [cylinder[surface[0]], cylinder[surface[0] + 1], cylinder[surface[0] + 2] ];
		vec_b = [cylinder[surface[1]], cylinder[surface[1] + 1], cylinder[surface[1] + 2] ];
		vec_c = [cylinder[surface[2]], cylinder[surface[2] + 1], cylinder[surface[2] + 2] ];

		//store vertex and color in drawing array
		storeVertexAndColor(d_cyl, vec_a, shaded_color);
		storeVertexAndColor(d_cyl, vec_b, shaded_color);
		storeVertexAndColor(d_cyl, vec_c, shaded_color);
		//create index array for drawing
		d_ind.push(i);
		d_ind.push(i+1);
		d_ind.push(i+2);
		//console.log("Cylinder : ", cylinder, "");
	}
	return[d_cyl, d_ind];
}


function drawVCylinder(d_obj, cylinder, alpha_Delta, selected_object){
	//console.log("DrawvCylinder() : ", cylinder);
	var cylinders = cylinder[0];//array of cylinder arrays
	var colors = getColorArray( cylinders[0], alpha_Delta );//array of color
	var normals = cylinder[7];//array of normals
	var indices = cylinder[1];//array of indices
	var translate = cylinder[8];//tranlation matrix
	var rotation = cylinder[9];//rotation Matrix
	var scale = cylinder[10];//scale Matrix
	var len = cylinders.length;
	var select_color = d_obj.webgl.getUniformLocation(d_obj.webgl.program, 's_Color');
	if( selected_object ){
		d_obj.webgl.uniform3f(select_color, 0.1, 0.1, 0.1);
	} else {
		d_obj.webgl.uniform3f(select_color, 0.0, 0.0, 0.0);
	}
	//parse through each individual cylinder
	for(var i = 0; i < len; ++i){
		var c = cylinders[i];
		var n = normals[i];
		var t = translate[i];
		var r = rotation[i];
		var s = scale[i];
		drawSmooth(c, n, colors, indices, t, r, s, d_obj.a_position,
				   d_obj.a_normal, d_obj.a_color, d_obj.u_modelMatrix, 
				   d_obj.u_rotMat, d_obj.scaMat, d_obj.webgl);
	}

}
function buildButton(sizeX, sizeY, centerX, centerY, color, d_obj){
	var vert = [centerX + sizeX/2, centerY + sizeY/2, 0.0,
	            centerX + sizeX/2, centerY - sizeY/2, 0.0,
	            centerX - sizeX/2, centerY - sizeY/2, 0.0,
	            centerX - sizeX/2, centerY + sizeY/2, 0.0 ];
	var ind = [ 0, 1, 2,
	            2, 3, 0  ];
	var norm = [0, 0, 1,
	            0, 0, 1,
	            0, 0, 1,
	            0, 0, 1 ];
	var col = [color[0], color[1], color[2], color[3],
	           color[0], color[1], color[2], color[3],
	           color[0], color[1], color[2], color[3],
	           color[0], color[1], color[2], color[3] ];
	d_obj.buttons.push([vert, ind, norm, col]);

}
//get an array of colors for each vertex
function getColorArray( cylinder, alpha_Delta ){
	var a_d =  1 - (alpha_Delta * ALPHA_DELTA);
	var c_array = [];
	for(var i = 0; i < cylinder.length/3; ++i){
		c_array.push(1.0);
		c_array.push(0.0);
		c_array.push(0.0);
		c_array.push(a_d);
	}
	return c_array;
}
function getVectorNormals(ellipse1, ellipse2){
	var vna  = [];
	for(var i = 0; i < ellipse1.length; i+=4){
		vna.push(ellipse1[i]);
		vna.push(ellipse1[i+1]);
		vna.push(ellipse1[i+2]);
	}
	for(var i = 0; i < ellipse2.length; i+=4){
		vna.push(ellipse2[i]);
		vna.push(ellipse2[i+1]);
		vna.push(ellipse2[i+2]);
	}
	return vna;
}
//store vector as v3
function storeVertex(array, vertex){
	for(var i = 0; i < 3; ++i){
		array.push(vertex[i]);
	}
}
//push vertex and color into array for drawing
function storeVertexAndColor(array, vertex, color){
	for(var i = 0; i < 3; ++i){
		array.push(vertex[i]);
	}
	for(var i = 0; i < 4; ++i){
		array.push(color[i]);
	}
}

//find the centerpoint of a triangle
function findCenter(v_a, v_b, v_c){
	return[ (v_a[0] + v_b[0] + v_c[0])/3,
			(v_a[1] + v_b[1] + v_c[1])/3,
			(v_a[2] + v_b[2] + v_c[2])/3  ];
}
//get the volume of all the cylinders plus the area between
function printCylinderVolume(array, r){
	var area = 0;
	var len = array.length
	var rad = Math.pow(r, 2);//radius squared
	for(var j = 0; j < len; j+=3){
		var a = [array[j], array[j+1], array[j+2]];
		var b = [array[j+3], array[j+4], array[j+5]];
		var h = magnitude(a, b);//height of the cylinder
		area += (Math.PI * rad * h);
	}
	console.log("Volume of the Cylinder: " + area);
}

function printCylinderArea(array, r){
	var area = 0;
	var len = array.length
	var rad = Math.pow(r, 2);//radius squared
	for(var j = 0; j < len; j+=3){
		var a = [array[j], array[j+1], array[j+2]];
		var b = [array[j+3], array[j+4], array[j+5]];
		var h = magnitude(a, b);//height of the cylinder
		area += ((2 * Math.PI * h * r) + (2 * Math.PI * rad));
	}
	console.log("Surface Area of the cylinder : " + area);
}
//Get the normals of each surface of the ellipse
//@params
//e_array - array containing two ellipses
//i_a - index array for cylinder
//d_obj - drawing object
function getSurfaceNormals(e_array, i_a, d_obj){
	var normal_dir = [];
	var normal_draw = [];
	var n_color = [1, 0, 0, 1];//[r,g,b,a]
	var g_color = [0, 0, 1, 1];
	var q_color = [0, 1, 1, 0];
	for(var i = 0; i < i_a.length; i+=6){

		//indices of vertices in ellipse array
		var index_a = i_a[i] * 3;
		var index_b = i_a[i+1] * 3;
		var index_c = i_a[i+2] * 3;
		var index_d = i_a[i+3] * 3;
		var index_e = i_a[i+4] * 3;
		var index_f = i_a[i+5] * 3;

		//Triangle
		var v_a = [e_array[index_a], e_array[index_a + 1], e_array[index_a + 2]];//A
		var v_b = [e_array[index_b], e_array[index_b + 1], e_array[index_b + 2]];//B
		var v_c = [e_array[index_c], e_array[index_c + 1], e_array[index_c + 2]];//C
		var v_d = [e_array[index_d], e_array[index_d + 1], e_array[index_d + 2]];//D
		var v_e = [e_array[index_e], e_array[index_e + 1], e_array[index_e + 2]];//E
		var v_f = [e_array[index_f], e_array[index_f + 1], e_array[index_f + 2]];//F

		//triangle moved to origin
		var v_u = subVector(v_c, v_a);//U
		var v_v = subVector(v_b, v_a);//V
		var v_q = subVector(v_f, v_e);
		var v_w = subVector(v_d, v_e);
		

		//Normal with a magnitude of one
		var n_v = normalize( [v_u[1] * v_v[2] - v_u[2] * v_v[1],
				   v_u[2] * v_v[0] - v_u[0] * v_v[2], 
				   v_u[0] * v_v[1] - v_u[1] * v_v[0]  ]);
		var n_q = normalize([v_q[1] * v_w[2] - v_q[2] * v_w[1],
				   v_q[2] * v_w[0] - v_q[0] * v_w[2],
		           v_q[0] * v_w[1] - v_q[1] * v_w[0]  ]);

		n_v = [n_v[0] * .3, n_v[1] * .3, n_v[2] * .3];
		n_q = [n_q[0] * .3, n_q[1] * .3, n_q[2] * .3];

		//store normal direction for calculations
		storeVertex(normal_dir, n_v);
		storeVertex(normal_dir, n_q);

		//center point of the triangle
		var c_v = findCenter(v_a, v_b, v_c);
		var c_q = findCenter(v_d, v_e, v_f);
		//move normal
		n_v = addVectors(n_v, c_v);
		n_q = addVectors(n_q, c_q);
		//console.log("n_v : ", n_v, "  c_v : ", c_v);

		//store normals for drawing
		/*
		storeVertexAndColor(normal_draw, n_v, n_color);
		storeVertexAndColor(normal_draw, v_a, n_color);
		storeVertexAndColor(normal_draw, n_v, n_color);
		storeVertexAndColor(normal_draw, v_b, n_color);
		storeVertexAndColor(normal_draw, n_v, n_color);
		storeVertexAndColor(normal_draw, v_c, n_color);
		*/
		storeVertexAndColor(normal_draw, n_v, n_color);
		storeVertexAndColor(normal_draw, c_v, n_color);
		/*
		storeVertexAndColor(normal_draw, n_q, n_color);
		storeVertexAndColor(normal_draw, v_d, n_color);
		storeVertexAndColor(normal_draw, n_q, n_color);
		storeVertexAndColor(normal_draw, v_e, n_color);
		storeVertexAndColor(normal_draw, n_q, n_color);
		storeVertexAndColor(normal_draw, v_f, n_color);
		*/
		storeVertexAndColor(normal_draw, n_q, n_color);
		storeVertexAndColor(normal_draw, c_q, n_color);
		

	}
}

function calculateSurfaceColor(normal, light, color){
	//console.log("CalculateSurfaceNormal: Normal : ", normal, "  light : ", light, "  color : ", color);
	var shaded_color = color.slice();
	var light_dir = [light[0], light[1], light[2]];
	light_dir = normalize(light_dir);
	var normal_dir = [normal[0], normal[1], normal[2]];
	normal_dir = normalize(normal_dir);
	var ratio = (normal_dir[0]*light_dir[0]) + (normal_dir[1]*light_dir[1]) + (normal_dir[2]*light_dir[2]);
	ratio = Math.max(0, ratio);
	ratio = Math.min(ratio, 1);
	shaded_color[0] *= ratio;
	shaded_color[1] *= ratio;
	shaded_color[2] *= ratio;
	//console.log("CalculateSurfaceNormal: Shaded_Color : ", shaded_color, "  ratio: " + ratio + "  light_dir : ", light_dir);

	return shaded_color;
}
