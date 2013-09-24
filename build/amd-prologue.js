/*
   AMD prologue: when you are loading this file in a AMD compliant 
   environment, LESS will be an AMD module.
 */
 
(function ( root, factory ) {
    /* global module define */
    if ( typeof module === "object" && module.exports ) {
        // Node, or CommonJS-Like environments
        module.exports = function () {
            return factory(root);
        };
    } else if ( typeof define === "function" && define.amd ) {
        // AMD. Register as a named module.
        define("less", [], function () {
            return factory(root);
        });
    } else {
        // Browser globals
        root.less = factory(root);
    }
}( this, function (window, undefined) {

