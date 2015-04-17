THREE = require('three');

var dat = require('dat-gui');
var Stats = require('stats-js');
var ManagedView = require('threejs-managed-view').View;
var FPS = require('threejs-camera-controller-first-person-desktop');
var Checkerboard = require('threejs-texture-checkerboard');

var UVProjectorFactory = require('./');

var basePath = './assets/';
var texturesPath = basePath + 'textures/';

var view = new ManagedView({ clearAlpha: 1 });
view.camera.position.set(0, 3, 4);
view.renderer.setClearColor(0xaaccff, 1);
view.renderer.shadowMapEnabled = true;
view.renderer.shadowMapType = THREE.PCFSoftShadowMap;
view.renderer.sortObjects = true;
view.renderer.alpha = true;

view.scene.fog = new THREE.Fog(0xaaccff, 0.1,15);

var texture = THREE.ImageUtils.loadTexture(texturesPath + "decal.png", undefined, function()
{
	var checkerboard = new Checkerboard();

	var geom = new THREE.SphereGeometry(1, 128, 64);
	var material = new THREE.MeshPhongMaterial({ map: texture });
	var mesh = new THREE.Mesh(geom,  material);
	mesh.material.side = THREE.DoubleSide;

	view.scene.add(mesh);
	view.camera.lookAt(mesh.position);

	var mesh2 = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64),
	  new THREE.MeshPhongMaterial({ map: texture }) );	
	mesh2.position.set(1, 0, 0);
	view.scene.add(mesh2);
    
	var mesh3 = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64),
	  new THREE.MeshPhongMaterial({ map: texture }) );
	mesh3.position.set(-1, 0, 0);
	view.scene.add(mesh3);

	//--------- Stats
	var stats = new Stats();
	stats.setMode(0);

	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	document.body.appendChild(stats.domElement);

	//--------- Main render loop (EnterFrame)
	var fps = new FPS(view.camera, view.canvas);
	var step = 0;

	view.renderManager.onEnterFrame.add(function(){
		
		fps.update();
		stats.update();

		//step+=0.04;
		//mesh.position.x =  1*Math.cos(step);
		//mesh.position.y =  1*Math.abs(Math.sin(step));
	});

	var factory = new UVProjectorFactory(view.scene);
	factory.addMesh(mesh);
	factory.addMesh(mesh2);
	factory.addMesh(mesh3);

	var uvprojector = factory.createProjector({debug: true, aspect: texture.image.width / texture.image.height, fov: 20});
	uvprojector.position.set(3, 2, 0);
	uvprojector.lookAt(mesh.position);

	var uvprojector2 = factory.createProjector({debug: true, aspect: texture.image.width / texture.image.height, fov: 20});
	uvprojector2.position.set(-1, 2, 0);
	uvprojector2.lookAt(mesh.position);
    
	factory.update();    
    
	//-------------------- Lights and shadows
	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set( 3, 5, 0 );
	light.target.position.set(0, 0, 0);

	var dist = 10;
	light.castShadow = true;
	light.shadowCameraNear = 0.1;
	light.shadowCameraFar = 50;
	light.shadowCameraLeft = -dist;
	light.shadowCameraRight = dist;
	light.shadowCameraTop = dist;
	light.shadowCameraBottom = -dist;
	light.shadowMapWidth = 2048;
	light.shadowMapHeight = 2048;

	view.scene.add(light);

	var ambientLight = new THREE.AmbientLight(0x555555);
	view.scene.add(ambientLight);

	//----------- Plane
	var plane = new THREE.PlaneBufferGeometry(10, 10);
	var planeMat = new THREE.MeshPhongMaterial( { map: checkerboard, color: 0xdddddd});

	var planeMesh = new THREE.Mesh(plane, planeMat);
	planeMesh.position.set(0, -1, 0 );
	planeMesh.rotation.x = 90 * Math.PI / 180;
	planeMesh.material.side = THREE.DoubleSide;

	planeMesh.receiveShadow = true;
	mesh.castShadow = true;

	view.scene.add(planeMesh);

	//---------- Getters/Setters
	var testobj = {
		_name: "david",
		_color: 0xdedede
	};

	Object.defineProperty(testobj, "name", {

		get: function() { 
			return this._name;
		},
		set: function(val) { 
			this._name = val;
		}
	});


	Object.defineProperty(testobj, "color", {

		get: function() { 
			return this._color;
		},
		set: function(val) { 
			this._color = val;
			mesh.material.color.setHex(this._color);
		}
	});


	Object.defineProperty(mesh.scale, "all", {

		get: function() { 
			return this.x;
		},
		set: function(val) { 
			this.x = val;
			this.y = val;
			this.z = val;
		}

	});

	testobj.name += "!";

	// --------------- GUI
	var gui = new dat.GUI();
	gui.add(testobj, "name");
	gui.add(mesh.scale, "all", 1, 4);

	gui.addColor(testobj, "color");	
});
