// THREE = require('three');

/**
 * Constructor for UVProjector
 * @param {object} options
 */
function UVProjector(options)
{
	options = options || {};

	var debug = options.debug;

	var fov 	 = options.fov || 30;
	var aspect = options.aspect || 1;
	var near = options.near || 0.5;
	var far = options.far || 3.0;

	// Top left 0, 0 and bottom right 1, 1
	this.left = (options.left !== undefined) ? options.left : 0.0;
	this.right = (options.right !== undefined) ? options.right : 1.0;
	this.bottom = (options.bottom !== undefined) ? options.bottom : 1.0;
	this.top = (options.top !== undefined) ? options.top : 0.0;

	this.width = this.right - this.left;
	this.height = this.bottom - this.top;

	this.flipX = options.flipX;

	aspect *= this.width / this.height;

	THREE.PerspectiveCamera.call(this, fov, aspect, near, far);

	if (debug)
	{
		this.debugView = new THREE.CameraHelper(this); 
	}
}

UVProjector.prototype = Object.create(THREE.PerspectiveCamera.prototype);

/**
 * (Internal) Create UV Coordinates for mesh given finalMatrix (projection*modelview)
 * @param  {THREE.Mesh} mesh
 * @param  {THREE.Matrix4} finalMatrix
 */
UVProjector.prototype.createUVs = function(mesh, finalMatrix) {

	if (mesh.geometry.faceVertexUvs !== undefined)
	{
		var numFaces = mesh.geometry.faces.length;

		for (var i = 0; i < numFaces; i++)
		{
			var face = mesh.geometry.faces[i];
			var indices = [face.a, face.b, face.c];

			var anyVerticesInside = false;

			for (var j = 0; j < 3; j++)
			{
				var index = indices[j];
				var vert3 = mesh.geometry.vertices[index];

				var vert = new THREE.Vector4(vert3.x, vert3.y, vert3.z, 1.0); 

				var newVert = vert.clone();
				newVert.applyMatrix4(finalMatrix);

				newVert.x /= newVert.w;
				newVert.y /= newVert.w;
				newVert.z /= newVert.w;

				// Filter vertices
				if ( 
					(newVert.x > -1 && newVert.x < 1) &&
					(newVert.y > -1 && newVert.y < 1) &&
					(newVert.z > -1 && newVert.z < 1) 
					)
				{
					anyVerticesInside = true;
					break;
				}
			}

			if (anyVerticesInside)
			{
				for (var j = 0; j < 3; j++)
				{
					var index = indices[j];
					var vert3 = mesh.geometry.vertices[index];

					var newVert = new THREE.Vector4(vert3.x, vert3.y, vert3.z, 1.0); 

					//var newVert = vert.clone();
					newVert.applyMatrix4(finalMatrix);

					//console.log(newVert);
					newVert.x /= newVert.w;
					newVert.y /= newVert.w;
					newVert.z /= newVert.w;


					mesh.geometry.faceVertexUvs[0][i][j] = 
					new THREE.Vector2(
						newVert.x * 0.5 + 0.5, 
						newVert.y * 0.5 + 0.5
					);
				}
			}
		}
	}
	else if (mesh.geometry.attributes.uv !== undefined)
	{
		var positionarray = mesh.geometry.attributes.position.array;
		var uvarray = mesh.geometry.attributes.uv.array;
		var decalsMaskArray = mesh.geometry.attributes.decalsMask.array;

		var position_floats = positionarray.length;
		var vertices = position_floats / 3;

		//var uv_floats = uvarray.length;
		//var uvs = uv_floats / 2;		

		var newVert = new THREE.Vector4(0.0, 0.0, 0.0, 1.0); 
		var e = finalMatrix.elements;

		var width = this.width;
		var height = this.height;
		var left = this.left;
		var top = this.top;
		var flipX = this.flipX;

		for (var index = 0; 
			 index < vertices; 
			 index++)
		{
			var x = positionarray[index * 3];
			var y = positionarray[index * 3 + 1];
			var z = positionarray[index * 3 + 2];

			//newVert.set(x, y, z, 1.0);
			//newVert.applyMatrix4(finalMatrix);

			//newVert.x /= newVert.w;
			//newVert.y /= newVert.w;
			//newVert.z /= newVert.w;
			
			var newX = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] * 1.0;
			var newY = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] * 1.0;
			var newZ = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] * 1.0;
			var newW = e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] * 1.0;

			newVert.set(newX / newW, newY / newW, newZ / newW, newW);

			// Filter vertices
			if ( 
				(newVert.x > -1.1 && newVert.x < 1.1) &&
				(newVert.y > -1.1 && newVert.y < 1.1) &&
				(newVert.z > -1 && newVert.z < 1) 
				)
			{
				var u = newVert.x * 0.5 + 0.5;
				var v = 1 - (newVert.y * 0.5 + 0.5);

				u = u * width + left;
				v = 1 - (v * height + top);

				if (flipX) u = 1-u;

				uvarray[index * 2] = u;
				uvarray[index * 2 + 1] = v;

				decalsMaskArray[index] = 1.0;
			}
		}
		mesh.geometry.attributes.decalsMask.needsUpdate = true;		
	}
};

/**
 * Update this UVProjector's UV coordinates
 * @param  {THREE.Mesh} meshes
 */
UVProjector.prototype.updateProjector = function(meshes) {
    
    // Compute UVProjector camera's matrices
	this.updateMatrix();
	this.updateMatrixWorld();
	this.updateProjectionMatrix();

	this.matrixAutoUpdate = true;

	var viewWorldInverse = new THREE.Matrix4();
	viewWorldInverse.getInverse(this.matrixWorld);

	var projection = this.projectionMatrix;

	for (var k = 0; k < meshes.length; k++)
	{
		var mesh = meshes[k];	

		//----------- Modify UV coordinates
		mesh.updateMatrix();
		mesh.updateMatrixWorld();

		mesh.matrixAutoUpdate = true;

		var finalMatrix = new THREE.Matrix4();
		var objWorld = mesh.matrixWorld;

		finalMatrix.multiplyMatrices( projection, viewWorldInverse);
		finalMatrix.multiplyMatrices( finalMatrix, objWorld);

		this.createUVs(mesh, finalMatrix);
	}	
};

module.exports = UVProjector;

