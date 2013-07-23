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


function filter(src) {
	return src
		.replace(/}\)\(require\('\.+\/tree'\)\);/g, "")
		.replace(/\(function \(tree\) {/g, "")
		;
}
