(function (tree) {
var path = require('path');
var getDimensions = require('image-size');
//
// A number with a unit
//
tree.ImageDimension = function (value, dim, currentFileInfo) {
    this.value = value;
    this.dim = dim;
    this.currentFileInfo = currentFileInfo;
};

tree.ImageDimension.prototype = {
    type: "ImageDimension",
    eval: function (ctx) {
        var val = this.value.eval(ctx);
        if(typeof val.value === "string"){
            var resolvedPath = ctx.resolvePath(val.value, ctx, {absolute: true});

            // If there's nothing special about the path, handle as normal
            if(resolvedPath === val.value){
                // Add the base path if the URL is relative
                var rootpath = this.currentFileInfo && this.currentFileInfo.rootpath;
                if (rootpath && ctx.isPathRelative(val.value)) {
                    if (!val.quote) {
                        rootpath = rootpath.replace(/[\(\)'"\s]/g, function(match) { return "\\"+match; });
                    }
                    val.value = path.normalize(rootpath + val.value);
                }
            } else {
                val.value = resolvedPath;
            }
        }
        val.value = ctx.normalizePath(val.value);

        var dims = getDimensions(val.value);
        return new tree.Dimension(dims[this.dim], 'px');
    }
};

})(require('../tree'));
