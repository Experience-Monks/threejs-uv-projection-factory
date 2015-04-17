var THREE = require('three');

var UVProjector = require('./UVProjector.js');

/**
* Constructor for UVProjectorFactory
* @param {THREE.Scene} scene
*/
function UVProjectorFactory(scene)
{
	this.meshes = [];
	this.uvprojectors = [];
	this.scene = scene;
}

/**
* (Internal) Reset UV coordinates for all meshes to (0, 0)
* @param {THREE.Mesh} mesh 
*/
UVProjectorFactory.prototype.resetUVs = function(mesh){

	if (mesh.geometry.faceVertexUvs !== undefined)
	{
		var numFaces = mesh.geometry.faces.length;

		for (var j = 0; j < numFaces; j++)
		{
			mesh.geometry.faceVertexUvs[0][j] = [
			new THREE.Vector2(0, 0),
			new THREE.Vector2(0, 0),
			new THREE.Vector2(0, 0)
			];	
		}
	}
	else if (mesh.geometry.attributes.uv !== undefined)
	{
		var numUVs = mesh.geometry.attributes.uv.array.length;
		for (var i = 0; i < numUVs ; i++)
		{
			mesh.geometry.attributes.uv.array[i] = 0.0;			
		}
		mesh.geometry.attributes.uv.needsUpdate = true;

		// Also reset decal mask
		var numDecalMask = mesh.geometry.attributes.decalmask.array.length;
		for (var k = 0; k < numDecalMask ; k++)
		{
			mesh.geometry.attributes.decalmask.array[k] = 0;			
		}
		mesh.geometry.attributes.decalmask.needsUpdate = true;
	}
};

/**
 * Add Mesh to list of meshes to project onto
 * @param {THREE.Mesh} mesh
 */
UVProjectorFactory.prototype.addMesh = function(mesh){

	if (this.meshes.indexOf(mesh) === -1)
	{
		// Add decalmask attribute to mesh (if it doesn't exist)
		if ( mesh.geometry.getAttribute('decalmask') === undefined)
		{
			var num_vertices = mesh.geometry.attributes.position.array.length / 3;
			var decalmask = new Float32Array(num_vertices);

			for ( var i = 0; i < num_vertices; i++ )
			{
				decalmask[i] = 0;
			}

			mesh.geometry.addAttribute( 'decalmask', new THREE.BufferAttribute(decalmask, 1) );
		}

		// then add mesh
		this.meshes.push(mesh);
	}
};

/**
 * Remove Mesh from list of meshes to project onto
 * @param  {THREE.Mesh} mesh
 */
UVProjectorFactory.prototype.removeMesh = function(mesh){

	var index = this.meshes.indexOf(mesh);
	if (index > -1)
	{
		this.meshes.splice(index, 1);	
	}
};

/**
 * Create a UVProjector using this factory (add to list of projectors) and returns it
 * @param  {object} options
 */
UVProjectorFactory.prototype.createProjector = function(options){

	var uvprojector = new UVProjector(options);
	this.uvprojectors.push(uvprojector);
	
	this.scene.add(uvprojector);
	this.scene.add(uvprojector.debugView);

	return uvprojector;
};

/**
 * Remove UVProjector from list of projectors
 * @param  {UVProjector} uvprojector
 */
UVProjectorFactory.prototype.destroyProjector = function(uvprojector){

	var index = this.uvprojectors.indexOf(uvprojector);
	if (index > -1)
	{
		this.uvprojectors.splice(index, 1);
	}
	this.scene.remove(uvprojector.debugView);
	this.scene.remove(uvprojector);
};

/**
 * Update all UVProjectors' UVs on meshes
 */
UVProjectorFactory.prototype.update = function(){

	// Reset all UVs for all meshes before updating
	for (var i = 0; i < this.meshes.length; i++)
	{
		this.resetUVs(this.meshes[i]);
	}

	// Update each UV projector (onto all meshes)
	for (var j = 0; j < this.uvprojectors.length; j++)
	{
		this.uvprojectors[j].updateProjector(this.meshes);
	}
};

module.exports = UVProjectorFactory;


