(function (tree) {

tree.Collection = function (item) {
	if (typeof item !== 'undefined') {
		this.add(item);
	}
}
tree.Collection.prototype = new Array();
tree.Collection.prototype.add = function (item) {
	if (item instanceof Array) {
		for (var i = 0; i < item.length; i++) {
			this.add(item[i]);
		}
	} else {
		this.push(item);
	}
}
tree.Collection.prototype.toCSS = function (env) {
	return this.map(function (i) { return i.toCSS ? i.toCSS() : i.toString(); }).join('');
}

})(require('../tree'));
