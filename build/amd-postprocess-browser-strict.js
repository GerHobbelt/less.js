/*
   Postprocess the generated LESS file:

   we want to clean it up and thus remove all unnecessary and otherwise
   cluttering wrapper code, which is only making things harder when we 
   create LESS as a pure AMD module.
   
	   The old way was a hack in that less was always a global and 
	   a little 'define()' at the end turned the entire thing into 
	   a 'also works as AMD module' code chunk, thus allowing people
	   to circumnavigate the require('less') bit in their own code, 
	   which opens the barn doors to one more spaghetti western.
 */
 
process.stdin.resume();
process.stdin.setEncoding('utf8');

var input = "";
process.stdin.on('data', function(chunk) {
  	input += chunk;
});

process.stdin.on('end', function() {
	process.stdout.write(filter(input));
});

/*
   We strive to erase all require() statements inside the LESS code.
   Therefor ditch these code snippets as they are unused in the browser:

        if(less.mode !== 'browser' && less.mode !== 'rhino') {
            filename = require('path').resolve(filename);
        }

   	---

		if (typeof environment === "object" && ({}).toString.call(environment) === "[object Environment]") {
		    // Rhino
		    // Details on how to detect Rhino: https://github.com/ringo/ringojs/issues/88
		    if (typeof(window) === 'undefined') { less = {}; }
		    else                                { less = window.less = {}; }
		    tree = less.tree = {};
		    less.mode = 'rhino';
		} else if (typeof(window) === 'undefined') {
		    // Node.js
		    less = exports;
		    tree = require('./tree');
		    less.mode = 'node';
		} else {
		    // Browser
		    if (typeof(window.less) === 'undefined') { window.less = {}; }
		    less = window.less;
		    tree = window.less.tree = {};
		    less.mode = 'browser';
		}
	
	should become

	    less = {
			tree: {},
			mode: 'browser'
		};
		tree = less.tree;

	---

        if (options.yuicompress && less.mode === 'node') {
            return require('ycssmin').cssmin(css, options.maxLineLen);
        } else if (options.compress) {

	-->

        if (options.compress) {

    i.e. ditch the options.yuicompress option.

	---

		    "data-uri": function(mimetypeNode, filePathNode) {

		        if (typeof window !== 'undefined') {
		            return new tree.URL(filePathNode || mimetypeNode, this.currentFileInfo).eval(this.env);
		        }

		        var mimetype = mimetypeNode.value;
		        var filePath = (filePathNode && filePathNode.value);

		        var fs = require("fs"),
		            path = require("path"),
		            useBase64 = false;

		        if (arguments.length < 2) {
		            filePath = mimetype;
		        }

		        if (this.env.isPathRelative(filePath)) {
		            if (this.currentFileInfo.relativeUrls) {
		                filePath = path.join(this.currentFileInfo.currentDirectory, filePath);
		            } else {
		                filePath = path.join(this.currentFileInfo.entryPath, filePath);
		            }
		        }

		        // detect the mimetype if not given
		        if (arguments.length < 2) {
		            var mime;
		            try {
		                mime = require('mime');
		            } catch (ex) {
		                mime = tree._mime;
		            }

		            mimetype = mime.lookup(filePath);

		            // use base 64 unless it's an ASCII or UTF-8 format
		            var charset = mime.charsets.lookup(mimetype);
		            useBase64 = ['US-ASCII', 'UTF-8'].indexOf(charset) < 0;
		            if (useBase64) mimetype += ';base64';
		        }
		        else {
		            useBase64 = /;base64$/.test(mimetype)
		        }

		        var buf = fs.readFileSync(filePath);

		        // IE8 cannot handle a data-uri larger than 32KB. If this is exceeded
		        // and the --ieCompat flag is enabled, return a normal url() instead.
		        var DATA_URI_MAX_KB = 32,
		            fileSizeInKB = parseInt((buf.length / 1024), 10);
		        if (fileSizeInKB >= DATA_URI_MAX_KB) {

		            if (this.env.ieCompat !== false) {
		                if (!this.env.silent) {
		                    console.warn("Skipped data-uri embedding of %s because its size (%dKB) exceeds IE8-safe %dKB!", filePath, fileSizeInKB, DATA_URI_MAX_KB);
		                }

		                return new tree.URL(filePathNode || mimetypeNode, this.currentFileInfo).eval(this.env);
		            } else if (!this.env.silent) {
		                // if explicitly disabled (via --no-ie-compat on CLI, or env.ieCompat === false), merely warn
		                console.warn("WARNING: Embedding %s (%dKB) exceeds IE8's data-uri size limit of %dKB!", filePath, fileSizeInKB, DATA_URI_MAX_KB);
		            }
		        }

		        buf = useBase64 ? buf.toString('base64')
		                        : encodeURIComponent(buf);

		        var uri = "'data:" + mimetype + ',' + buf + "'";
		        return new(tree.URL)(new(tree.Anonymous)(uri));
		    }
		};

		// these static methods are used as a fallback when the optional 'mime' dependency is missing
		tree._mime = {
		    // this map is intentionally incomplete
		    // if you want more, install 'mime' dep
		    _types: {
		        '.htm' : 'text/html',
		        '.html': 'text/html',
		        '.gif' : 'image/gif',
		        '.jpg' : 'image/jpeg',
		        '.jpeg': 'image/jpeg',
		        '.png' : 'image/png'
		    },
		    lookup: function (filepath) {
		        var ext = require('path').extname(filepath),
		            type = tree._mime._types[ext];
		        if (type === undefined) {
		            throw new Error('Optional dependency "mime" is required for ' + ext);
		        }
		        return type;
		    },
		    charsets: {
		        lookup: function (type) {
		            // assumes all text types are UTF-8
		            return type && (/^text\//).test(type) ? 'UTF-8' : '';
		        }
		    }
		};

	-->

		    "data-uri": function(mimetypeNode, filePathNode) {
	            return new tree.URL(filePathNode || mimetypeNode, this.currentFileInfo).eval(this.env);
		    }
		};

 */

function filter(src) {
	var a = src.split("\n");
	var i, l, s;
	var state = 0;
	var keep;

	for (l = a.length, i = 0; i < l; i++) {
		s = a[i];
		keep = false;

		if (state === 0 && s.indexOf("(less.mode !== 'browser' && less.mode !== 'rhino')") > 0) {
			state = 1;
		} else if (state === 1 && s.indexOf("}") > 0) {
			state = -1;
		}

		if (state === 0 && s.indexOf("(typeof environment === \"object\" &&") > 0) {
			state = 2;

			a.splice(i, 0, 
					 "less = {",
					 "    tree: {},",
					 "    mode: 'browser'",
					 "};",
					 "tree = less.tree;");
			l += 5;
			i += 5;
		} else if (state === 2 && s.indexOf("'browser'") > 0) {
			state = -2;
		}

		if (state === 0 && s.indexOf("(options.yuicompress &&") > 0) {
			state = 3;
		} else if (state === 3 && s.indexOf("} else if (options.compress)") >= 0) {
			state = 0;

			s = s.replace('} else ', '');
		}

		if (state === 0 && s.indexOf("\"data-uri\": function(") >= 0) {
			state = 4;

			keep = true;
		} else if (state === 4 && s.indexOf("if (typeof window !== 'undefined')") >= 0) {
			state++;
			// keep next line(s) until closing brace '}':
		} else if (state === 5 && s.indexOf("}") < 0) {
			keep = true;
		} else if (state === 5) {
			keep = true;
			state++;
		} else if (state === 6 && s.indexOf("charsets:") >= 0) {
			state++;
		} else if (state === 7 && s.indexOf("};") >= 0) {
			state = 0;
		}




		if (state < 0) {
			if (!keep) {
				// ditch line
				s = "";
			}

			state++;
		} else if (state > 0) {
			if (!keep) {
				// ditch line
				s = "";
			}
		} 
		// else: keep line

		a[i] = s;
	}
	return a.join("\n");
}
