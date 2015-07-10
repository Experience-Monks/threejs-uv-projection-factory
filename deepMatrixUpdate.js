function deepMatrixUpdate(object) {
	var temp = [];
	while(object.parent) {
		temp.push(object);
		object = object.parent;
	}
	for (var i = temp.length - 1; i >= 0; i--) {
		temp[i].updateMatrix();
	};
	for (var i = temp.length - 1; i >= 0; i--) {
		temp[i].updateMatrixWorld();
	};
}

module.exports = deepMatrixUpdate;