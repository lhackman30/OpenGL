
function normalize( vec ){

	var v_len = 1/Math.sqrt( Math.pow(vec[0], 2) + Math.pow(vec[1], 2) + Math.pow(vec[2], 2) );
	var n_vec = [vec[0] * v_len, vec[1] * v_len, vec[2] * v_len, 0 ];
	return n_vec;
}
function dot( vec_a, vec_b ){
	return( vec_a[0]*vec_b[0] + vec_a[1]*vec_b[1] + vec_a[2]*vec_b[2] + vec_a[3]*vec_b[3] );
}
function magnitude(vec_a, vec_b){
	//sqrt((x2-x1)^2 + (y2-y1)^2 + (z2-z1)^2)
 	var t_mag = Math.sqrt(  Math.pow(vec_a[0], 2) + 
		                    Math.pow(vec_a[1], 2) + 
		                    Math.pow(vec_a[2], 2)   );
	return( t_mag );
}
//finds the angle between two vectors(3 points)
function angleBetween(vec_a, vec_b, vec_c){

	if(vec_a.length == 3 ) vec_a.push(0);
	if(vec_b.length == 3 ) vec_b.push(0);
	if(vec_c.length == 3 ) vec_c.push(0);

	var mag_a = magnitude(vec_a);//magnitude of the first line
	var mag_b = magnitude(vec_c);//magnitude of the second line
	var v_dot = dot(vec_a, vec_c);//dot product of the the two
	var rad = Math.acos(v_dot/(mag_a*mag_b));//angle between two lines in radians
	var deg = rad * RAD2DEG //degree angle
	if(DEBUG){
		console.log(" A : [" + vec_a + "] B : [" + vec_b + "] C : [" + vec_c + "]");
		console.log(" A_mag : " + mag_a + "  B_mag : " + mag_b);
		console.log("Dot : " + v_dot + "  Radians : " + rad + "  Degrees : " + deg);
	}

	return deg;
}
function roundVector( vec_a ){
	var len = vec_a.length;
	for(i = 0; i < len; ++i){
		vec_a[i] = roundFloat(vec_a[i]); 
	}
	return vec_a;
}

function roundFloat( a_in ){
	a_in *= 1000;
	a_in = Math.round(a_in);
	a_in /= 1000;
	return a_in;
}

//Vector a - Vector b = Vector c
function subVector(vec_a, vec_b){
	return ( [ vec_a[0]-vec_b[0], 
		       vec_a[1]-vec_b[1], 
		       vec_a[2]-vec_b[2],
		       vec_a[3]-vec_b[3] ] );
}

//reverse the direction of a vector
function inverseVector( vec_a ){
	return( [ vec_a[0] * -1, 
		      vec_a[1] * -1, 
		      vec_a[2] * -1,
		      vec_a[3] * -1  ] );
}

//vector a + vector b = vector c
function addVectors(vec_a, vec_b){
	return ( [ vec_b[0]+vec_a[0], 
		       vec_b[1]+vec_a[1], 
		       vec_b[2]+vec_a[2],
		       vec_b[3]+vec_a[3]  ] );
}

//Set triangle indices for tow lines of length len
function getIndArray( len ){
	var j = len;
	var ind = [];
	for( i = 0; i < len; ++i ){
		ind.push(i   );
		ind.push(i+1 );
		ind.push(j   );
		ind.push(j   );
		ind.push(j+1 );
		ind.push(i+1 );
		j++;
	}
	ind.pop();
	ind.pop();
	ind.pop();
	ind.push( len -1 );
	ind.push( len );
	ind.push( 0 );

	return ind;
}

//
function crossProduct4F(vec_a, vec_b){
	return [ (vec_a[1]*vec_b[2] - vec_a[2]*vec_b[1]), 
	         (vec_a[2]*vec_b[0] - vec_a[0]*vec_b[2]), 
	         (vec_a[0]*vec_b[1] - vec_a[1]*vec_b[0]), 
	      	 ( 0 )                                     ];
}

function getIdentityM(){
	return[1.0, 0.0, 0.0, 0.0,
	       0.0, 1.0, 0.0, 0.0, 
	       0.0, 0.0, 1.0, 0.0,
	       0.0, 0.0, 0.0, 1.0 ];
}

//Create a translation matrix
function getTranslationMatrix(x, y, z){
	return [ 1, 0, 0, 0,
	         0, 1, 0, 0,
	         0, 0, 1, 0, 
	         x, y, z, 1  ];
}

//Create a scalar matrix
function getScalarMatrix(x, y, z){
	return [ x, 0, 0, 0,
	         0, y, 0, 0,
	         0, 0, z, 0, 
	         0, 0, 0, 1  ];
}

//rotate about the z axis
function getRz(a){
	return [ Math.cos(a), -Math.sin(a), 0, 0,
             Math.sin(a),  Math.cos(a), 0, 0,
                       0,            0, 1, 0, 
                       0,            0, 0, 1  ];
}

//rotate about the y axis
function getRy(a){
	return[  Math.cos(a), 0, Math.sin(a), 0,
	         0          , 1, 0          , 0,
	        -Math.sin(a), 0, Math.cos(a), 0,
	         0,           0,           0, 1  ];
}

//Rotate about the X axis
function getRx(a){
	return[ 1,           0,            0, 0,
	        0, Math.cos(a), -Math.sin(a), 0,
	        0, Math.sin(a),  Math.cos(a), 0,
	        0,           0,            0, 1  ];
}

//Multiply two vectors together
function matMult( mat1, mat2){
	var result = [];

	if(mat1.length%4 != 0 || mat2.length%4 != 0){
		console.log("Incorrect nunmber of elements in matrix");
		console.log("Matrix1 : " + mat1);
		console.log("Matrix2 : " + mat2);
		return;
	}

	var len = mat1.length;

	for(i = 0; i < len; i+=4 ){
		var r = vecMult( [mat1[i], mat1[i+1], mat1[i+2], mat1[i+3]], mat2);
		result.push(r[0]);
		result.push(r[1]);
		result.push(r[2]);
		result.push(r[3]);
	}

	return result;
}
//Multiple a vector and a matrix
function vecMult( vec, mat ){
	var v = vec;
	var m = mat;
    var result = [];

    result[0] = dot(vec, [ mat[0], mat[4], mat[8],  mat[12] ]);
    result[1] = dot(vec, [ mat[1], mat[5], mat[9],  mat[13] ]);
    result[2] = dot(vec, [ mat[2], mat[6], mat[10], mat[14] ]);
    result[3] = dot(vec, [ mat[3], mat[7], mat[11], mat[15] ]);

    if(DEBUG) console.log("vec : " + vec + " Mult : " + result);

  return result;
}
