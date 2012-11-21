(function (tree) {

tree.Selector = function (elements) {
    this.elements = elements;
};
tree.Selector.prototype.match = function (other) {
    var len  = this.elements.length,
        olen = other.elements.length,
        max  = Math.min(len, olen);

    if (len < olen) {
        return false;
    } else {
        for (var i = 0; i < max; i++) {
            if (this.elements[i].value !== other.elements[i].value) {
                return false;
            }
        }
    }
    return true;
};
tree.Selector.prototype.eval = function (env) {
	//TODO: explain

	var elements = new(tree.Collection)(this.elements.map(function (e) { return e.eval(env); })),
		nextSelectorElements = [],
		collection = new(tree.Collection),
		i, e;

	// Chang eto for(i loop
	for (i = 0; i < elements.length; i++) {
		e = elements[i];
		if (e.combinator.value === ',') {
			e.combinator.value = ' ';
			collection.add(new(tree.Selector)(nextSelectorElements));
			nextSelectorElements = [];
		}
		nextSelectorElements.push(e);
    }

    collection.add(new(tree.Selector)(nextSelectorElements));
    return collection;
};
tree.Selector.prototype.toCSS = function (env) {
    if (this._css) { return this._css }
    
    if (this.elements[0].combinator.value === "") {
        this._css = ' ';
    } else {
        this._css = '';
    }
    
    this._css += this.elements.map(function (e) {
        if (typeof(e) === 'string') {
            return ' ' + e.trim();
        } else {
            return e.toCSS(env);
        }
    }).join('');
    
    return this._css;
};

})(require('../tree'));
