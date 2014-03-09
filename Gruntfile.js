'use strict';

module.exports = function(grunt) {

  /*
     We strive to erase all require() statements inside the LESS code.
     Therefor ditch these code snippets as they are unused in the browser:

          if(less.mode !== 'browser' && less.mode !== 'rhino') {
              filename = require('path').resolve(filename);
          }

      ---

      //* global environment, process, window *
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

  function stripfilter(src, filepath) {
    var a = src.split("\n");
    var i, l, s;
    var state = 0;
    var wrapper_state = 0;
    var keep;

    for (l = a.length, i = 0; i < l; i++) {
      s = a[i];
      keep = false;


      if (state === 0 && s.indexOf("(less.mode !== 'browser' && less.mode !== 'rhino')") > 0) {
        state = 1;
      } else if (state === 1 && s.indexOf("}") > 0) {
        state = -1;
      }


      if (state === 0 && s.indexOf("/* global environment, process, window */") === 0) {
        s = "";
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


/*
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
*/

      // kill '(function (tree) { ... })(require('./tree'));' wrapper:
      if (state === 0 && wrapper_state === 0 && s.indexOf("(function (tree) {") === 0) {
        wrapper_state = 1;

        // ditch line
        s = "";
      } else if (wrapper_state === 1 && s.indexOf("})(require('./tree'));") === 0) {
        wrapper_state = 0;

        // ditch line
        s = "";
      } else if (wrapper_state === 1 && s.indexOf("})(require('../tree'));") === 0) {
        wrapper_state = 0;

        // ditch line
        s = "";
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
    return '// Source: ' + filepath + '\n\n\n' +
            a.join("\n");
  }


  // Report the elapsed execution time of tasks.
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({

    // Metadata required for build.
    build: grunt.file.readYAML('build/build.yml'),
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      license: '<%= _.pluck(pkg.licenses, "type").join(", ") %>',
      copyright: 'Copyright (c) 2009-<%= grunt.template.today("yyyy") %>',
      banner:
        '/*! \n' +
        ' * LESS - <%= pkg.description %> v<%= pkg.version %> \n' +
        ' * http://lesscss.org \n' +
        ' * \n' +
        ' * <%= meta.copyright %>, <%= pkg.author.name %> <<%= pkg.author.email %>> \n' +
        ' * Licensed under the <%= meta.license %> License. \n' +
        ' * \n' +
        ' */ \n\n' +
        ' /**' +
        ' * @license <%= meta.license %>\n' +
        ' */ \n\n'
    },

    shell: {
      options: {stdout: true, failOnError: true},
      test: {
        command: 'node test'
      },
      benchmark: {
        command: 'node benchmark/less-benchmark.js'
      },
      "browsertest-server": {
          command: 'node node_modules/http-server/bin/http-server . -p 8088'
      },
      "sourcemap-test": {
        command: [
            'node bin/lessc --source-map --source-map-map-inline test/less/import.less test/sourcemaps/import.css',
            'node bin/lessc --source-map --source-map-map-inline test/less/sourcemaps/basic.less test/sourcemaps/basic.css',
            'node node_modules/http-server/bin/http-server test/sourcemaps -p 8084'].join('&&')
      }
    },
    concat: {
      options: {
        stripBanners: false,
        banner: '<%= meta.banner %>\n\n\n//==========================================================\n',
        footer: '\n',
        separator: '\n\n\n\n//==========================================================\n',
        process: stripfilter
      },
      // Browser versions
      browsertest: {
        src: ['<%= build.browser %>'],
        dest: 'test/browser/less.js'
      },
      stable: {
        files: {
          'dist/less-<%= pkg.version %>.js': ['<%= build.browser %>'],
          'dist/less.js':                    ['<%= build.browser %>']
        }
      },
      // Rhino
      rhino: {
        options: {
          banner: '/* LESS.js v<%= pkg.version %> RHINO | <%= meta.copyright %>, <%= pkg.author.name %> <<%= pkg.author.email %>> */\n\n',
          footer: '' // override task-level footer
        },
        src: ['<%= build.rhino %>'],
        dest: 'dist/less-rhino-<%= pkg.version %>.js'
      },
      // lessc for Rhino
      rhinolessc: {
        options: {
          banner: '/* LESS.js v<%= pkg.version %> RHINO | <%= meta.copyright %>, <%= pkg.author.name %> <<%= pkg.author.email %>> */\n\n',
          footer: '' // override task-level footer
        },
        src: ['<%= build.rhinolessc %>'],
        dest: 'dist/lessc-rhino-<%= pkg.version %>.js'
      },
      // Generate readme
      readme: {
        // override task-level banner and footer
        options: {process: true, banner: '', footer: ''},
        src: ['build/README.md'],
        dest: 'README.md'
      }
    },

    uglify: {
      options: {
        banner: '<%= meta.banner %>',
        mangle: true
      },
      stable: {
        src: ['<%= concat.stable.dest %>'],
        dest: 'dist/less-<%= pkg.version %>.min.js'
      }
    },

    jshint: {
      options: {jshintrc: '.jshintrc'},
      files: {
        src: [
          'Gruntfile.js',
          'lib/less/**/*.js'
        ]
      }
    },

    connect: {
      server: {
        options: {
          port: 8081
        }
      }
    },

    jasmine: {
      options: {
        // version: '2.0.0-rc2',
        keepRunner: true,
        host: 'http://localhost:8081/',
        vendor: ['test/browser/common.js', 'test/browser/less.js'],
        template: 'test/browser/test-runner-template.tmpl'
      },
      main: {
        // src is used to build list of less files to compile
        src: ['test/less/*.less', '!test/less/javascript.less', '!test/less/urls.less', '!test/less/empty.less'],
        options: {
          helpers: 'test/browser/runner-main-options.js',
          specs: 'test/browser/runner-main-spec.js',
          outfile: 'tmp/browser/test-runner-main.html'
        }
      },
      legacy: {
        src: ['test/less/legacy/*.less'],
        options: {
          helpers: 'test/browser/runner-legacy-options.js',
          specs: 'test/browser/runner-legacy-spec.js',
          outfile: 'tmp/browser/test-runner-legacy.html'
        }
      },
      errors: {
        src: ['test/less/errors/*.less', '!test/less/errors/javascript-error.less'],
        options: {
          timeout: 20000,
          helpers: 'test/browser/runner-errors-options.js',
          specs: 'test/browser/runner-errors-spec.js',
          outfile: 'tmp/browser/test-runner-errors.html'
        }
      },
      noJsErrors: {
        src: ['test/less/no-js-errors/*.less'],
        options: {
          helpers: 'test/browser/runner-no-js-errors-options.js',
          specs: 'test/browser/runner-no-js-errors-spec.js',
          outfile: 'tmp/browser/test-runner-no-js-errors.html'
        }
      },
      browser: {
        src: ['test/browser/less/*.less'],
        options: {
          helpers: 'test/browser/runner-browser-options.js',
          specs: 'test/browser/runner-browser-spec.js',
          outfile: 'tmp/browser/test-runner-browser.html'
        }
      },
      relativeUrls: {
        src: ['test/browser/less/relative-urls/*.less'],
        options: {
          helpers: 'test/browser/runner-relative-urls-options.js',
          specs: 'test/browser/runner-relative-urls-spec.js',
          outfile: 'tmp/browser/test-runner-relative-urls.html'
        }
      },
      rootpath: {
        src: ['test/browser/less/rootpath/*.less'],
        options: {
          helpers: 'test/browser/runner-rootpath-options.js',
          specs: 'test/browser/runner-rootpath-spec.js',
          outfile: 'tmp/browser/test-runner-rootpath.html'
        }
      },
      rootpathRelative: {
        src: ['test/browser/less/rootpath-relative/*.less'],
        options: {
          helpers: 'test/browser/runner-rootpath-relative-options.js',
          specs: 'test/browser/runner-rootpath-relative-spec.js',
          outfile: 'tmp/browser/test-runner-rootpath-relative.html'
        }
      },
      production: {
        src: ['test/browser/less/production/*.less'],
        options: {
          helpers: 'test/browser/runner-production-options.js',
          specs: 'test/browser/runner-production-spec.js',
          outfile: 'tmp/browser/test-runner-production.html'
        }
      },
      modifyVars: {
        src: ['test/browser/less/modify-vars/*.less'],
        options: {
          helpers: 'test/browser/runner-modify-vars-options.js',
          specs: 'test/browser/runner-modify-vars-spec.js',
          outfile: 'tmp/browser/test-runner-modify-vars.html'
        }
      },
      globalVars: {
        src: ['test/browser/less/global-vars/*.less'],
        options: {
          helpers: 'test/browser/runner-global-vars-options.js',
          specs: 'test/browser/runner-global-vars-spec.js',
          outfile: 'tmp/browser/test-runner-global-vars.html'
        }
      },
      postProcessor: {
        src: ['test/browser/less/postProcessor/*.less'],
        options: {
          helpers: 'test/browser/runner-postProcessor-options.js',
          specs: 'test/browser/runner-postProcessor.js',
          outfile: 'tmp/browser/test-postProcessor.html'
        }
      }
    },

    // Clean the version of less built for the tests
    clean: {
      test: ['test/browser/less.js', 'tmp'],
      "sourcemap-test": ['test/sourcemaps/*.css', 'test/sourcemaps/*.map']
    }
  });

  // Load these plugins to provide the necessary tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Actually load this plugin's task(s).
  grunt.loadTasks('build/tasks');

  // by default, run tests
  grunt.registerTask('default', [
    'test'
  ]);

  // Release
  grunt.registerTask('stable', [
    'concat:stable',
    'uglify:stable'
  ]);

  // Release Rhino Version
  grunt.registerTask('rhino', [
    'concat:rhino',
    'concat:rhinolessc'
  ]);
  
  // Run all browser tests
  grunt.registerTask('browsertest', [
    'browser',
    'connect',
    'jasmine'
  ]);

  // setup a web server to run the browser tests in a browser rather than phantom
  grunt.registerTask('browsertest-server', [
    'shell:browsertest-server'
  ]);

  // Create the browser version of less.js
  grunt.registerTask('browser', [
    'concat:browsertest'
  ]);

  // Run all tests
  grunt.registerTask('test', [
    'clean',
    'jshint',
    'shell:test',
    'browsertest'
  ]);

  // generate a good test environment for testing sourcemaps
  grunt.registerTask('sourcemap-test', [
    'clean:sourcemap-test',
    'shell:sourcemap-test'
  ]);

  // Run benchmark
  grunt.registerTask('benchmark', [
    'shell:benchmark'
  ]);

  // Readme.
  grunt.registerTask('readme', [
    'concat:readme'
  ]);
};
