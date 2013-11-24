(function (tree) {
var path = require('path');
tree.URL = function (val, currentFileInfo) {
    this.value = val;
    this.currentFileInfo = currentFileInfo;
};
tree.URL.prototype = {
    type: "Url",
    accept: function (visitor) {
        this.value = visitor.visit(this.value);
    },
    genCSS: function (env, output) {
        output.add("url(");
        this.value.genCSS(env, output);
        output.add(")");
    },
    toCSS: tree.toCSS,
    eval: function (ctx) {
        var val = this.value.eval(ctx), rootpath;


        if(typeof val.value === "string"){
            var resolvedPath = ctx.resolvePath(val.value, ctx, {absolute: true});

            // If there's nothing special about the path, handle as normal
            if(resolvedPath === val.value){
                // Add the base path if the URL is relative
                rootpath = this.currentFileInfo && this.currentFileInfo.rootpath;
                if (rootpath && ctx.isPathRelative(val.value)) {
                    if (!val.quote) {
                        rootpath = rootpath.replace(/[\(\)'"\s]/g, function(match) { return "\\"+match; });
                    }
                    val.value = path.normalize(rootpath + val.value);
                }
            } else {
                // Time to get busy
                var rootDir = path.dirname(ctx.inputToOutputPath(ctx.rootFileName));
                var destinationFile = ctx.inputToOutputPath(resolvedPath);

                val.value = path.normalize(path.relative(rootDir, destinationFile));
            }
        }

        val.value = ctx.normalizePath(val.value);

        return new(tree.URL)(val, null);
    }
};

})(require('../tree'));
