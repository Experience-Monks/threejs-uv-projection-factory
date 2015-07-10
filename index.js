var deepMatrixUpdate = require('./deepMatrixUpdate');
var UVProjector = require('./UVProjector.js');

/**
 * Constructor for UVProjectorFactory
 * @param {THREE.Scene} scene
 */
function UVProjectorFactory(scene, debugLevel)
{
	this.meshes = [];
	this.uvProjectors = [];
	this.scene = scene;
	this.debugLevel = debugLevel || 0;
	this.updatedCount = 0;
}

/**
 * (Internal) Reset UV coordinates for all meshes to (0, 0)
 * @param {THREE.Mesh} mesh
 */
UVProjectorFactory.prototype.resetUVs = function(mesh){
	deepMatrixUpdate(mesh);
	if (mesh.geometry.faceVertexUvs !== undefined)
	{
		if(this.debugLevel >= 1) this.log('reseting UVs (standard)', mesh.name);
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
		if(this.debugLevel >= 1) this.log('reseting UVs (special)', mesh.name);
		var numUVs = mesh.geometry.attributes.uv.array.length;
		for (var i = 0; i < numUVs ; i++)
		{
			mesh.geometry.attributes.uv.array[i] = 0.0;
		}
		mesh.geometry.attributes.uv.needsUpdate = true;

		// Also reset decal mask
		var numDecalMask = mesh.geometry.attributes.decalsMask.array.length;
		for (var k = 0; k < numDecalMask ; k++)
		{
			mesh.geometry.attributes.decalsMask.array[k] = 0;
		}
		mesh.geometry.attributes.decalsMask.needsUpdate = true;
	}
};

/**
 * Add Mesh to list of meshes to project onto
 * @param {THREE.Mesh} mesh
 */
UVProjectorFactory.prototype.addMesh = function(mesh){

	if (this.meshes.indexOf(mesh) === -1)
	{
		mesh.decalsDirty = true;
		if(this.debugLevel >= 1) this.log('adding mesh', mesh.name);
		
		// Add decalsMask attribute to mesh (if it doesn't exist)
		if ( mesh.geometry.getAttribute('decalsMask') === undefined)
		{
			var num_vertices = mesh.geometry.attributes.position.array.length / 3;
			var decalsMask = new Float32Array(num_vertices);

			for ( var i = 0; i < num_vertices; i++ )
			{
				decalsMask[i] = 0;
			}

			mesh.geometry.addAttribute( 'decalsMask', new THREE.BufferAttribute(decalsMask, 1) );
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
		if(this.debugLevel >= 1) this.log('removing mesh', mesh.name);
	}
};

/**
 * Create a UVProjector using this factory (add to list of projectors) and returns it
 * @param  {object} options
 */
UVProjectorFactory.prototype.createProjector = function(options){

	var uvProjector = new UVProjector(options);
	this.uvProjectors.push(uvProjector);

	this.scene.add(uvProjector);

	if(this.debugLevel >= 1) this.log('creating projector', options);

	if (options.debug)
		this.scene.add(uvProjector.debugView);

	return uvProjector;
};

/**
 * Remove UVProjector from list of projectors
 * @param  {UVProjector} uvProjector
 */
UVProjectorFactory.prototype.destroyProjector = function(uvProjector){

	var index = this.uvProjectors.indexOf(uvProjector);
	if (index > -1)
	{
		if(this.debugLevel >= 1) this.log('destroying projector');
		this.uvProjectors.splice(index, 1);
		this.scene.remove(uvProjector.debugView);
		this.scene.remove(uvProjector);
	}
};

/**
 * Update all UVProjectors' UVs on meshes
 */
UVProjectorFactory.prototype.update = function(force){

	/*var anyProjectorsChanged = false;

	for (var j = 0; j < this.uvProjectors.length; j++) {
		anyProjectorsChanged = this.uvProjectors[j].changed() || anyProjectorsChanged;
	}*/

	this.updatedCount++;
	if(this.updatedCount >= 28) debugMatrices = true;
	if(this.debugLevel >= 1) this.log('update counter:', this.updatedCount);
	if(this.debugLevel >= 1) this.log('meshes:', this.meshes.length);
	if(this.debugLevel >= 1) this.log('uvProjectors:', this.uvProjectors.length);
	// Reset all UVs for all meshes before updating
	var dirtyCount = 0;
	for (var i = 0; i < this.meshes.length; i++){
		if(force) this.meshes[i].decalsDirty = true;
		if (this.meshes[i].decalsDirty){
			dirtyCount++;
			this.resetUVs(this.meshes[i]);
		}
	}

	if(this.debugLevel >= 1) this.log('dirty meshes:', dirtyCount);
	// Update each UV projector (onto all meshes)
	for (var j = 0; j < this.uvProjectors.length; j++)
	{
		if(this.debugLevel >= 1) this.log('uvProjecting', j);
		this.uvProjectors[j].updateProjector(this.meshes);
	}

	// Set Decals to no longer dirty after running through all UV projectors
	// so all projectors have a chance to project on dirtied meshes (before resetting flag)
	for (var j = 0; j < this.meshes.length; j++)
	{
		this.meshes[j].decalsDirty = false;
	}
};

UVProjectorFactory.prototype.log = function() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift('UV Projector Factory:');
	console.log.apply(console, args);
}

module.exports = UVProjectorFactory;


