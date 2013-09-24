# default rule: build
all: version amd-browser-strict test benchmark

#
# Run all tests
#
test: 
	-node test/less-test.js

#
# Run benchmark
#
benchmark:
	node benchmark/less-benchmark.js

#
# Build less.js
#
SRC = lib/less
HEADER = build/header.js
VERSION = `cat package.json | grep version | sed -e 's/^[^0-9]*\([0-9]\+\.[0-9]\+\.[0-9]\+\)[^0-9].*$$/\1/'`
DIST = dist/less-${VERSION}.js
RHINO = dist/less-rhino-${VERSION}.js
DIST_MIN = dist/less-${VERSION}.min.js

browser-prepare: DIST := test/browser/less.js

amd-latest: DIST := dist/less.js
amd-browser-strict: DIST := dist/less-amd-browser-strict.js

latest: DIST := dist/less.js

alpha: DIST := dist/less-${VERSION}-alpha.js
alpha: DIST_MIN := dist/less-${VERSION}-alpha.min.js

beta: DIST := dist/less-${VERSION}-beta.js
beta: DIST_MIN := dist/less-${VERSION}-beta.min.js

version:
	@echo LESS version: ${VERSION}

less: setup-build
	@@mkdir -p dist
	@@touch ${DIST}
	@@cat ${HEADER} | sed s/@VERSION/${VERSION}/ > ${DIST}
	@@cat build/amd-prologue.js\
	      build/browser-header.js\
	      ${SRC}/parser.js\
	      ${SRC}/functions.js\
	      ${SRC}/colors.js\
	      ${SRC}/tree.js\
	      ${SRC}/tree/*.js\
	      ${SRC}/env.js\
	      ${SRC}/visitor.js\
	      ${SRC}/import-visitor.js\
	      ${SRC}/join-selector-visitor.js\
	      ${SRC}/to-css-visitor.js\
	      ${SRC}/extend-visitor.js\
	      ${SRC}/browser.js\
	      build/amd-epilogue.js \
	      | node build/amd-postprocess.js >> ${DIST}
	@@echo ${DIST} built.
	
browser-prepare: less setup-build
	node test/browser-test-prepare.js
	
browser-test: browser-prepare setup-build
	phantomjs test/browser/phantom-runner.js

browser-test-server: browser-prepare setup-build
	phantomjs test/browser/phantom-runner.js --no-tests

jshint: setup-build
	node_modules/.bin/jshint --config ./.jshintrc .

test-sourcemaps: setup-build
	node bin/lessc --source-map --source-map-inline test/less/import.less test/sourcemaps/import.css
	node bin/lessc --source-map --source-map-inline test/less/sourcemaps/basic.less test/sourcemaps/basic.css
	node node_modules/http-server/bin/http-server test/sourcemaps -p 8083

rhino:
	@@mkdir -p dist
	@@touch ${RHINO}
	@@cat build/require-rhino.js\
	      build/rhino-header.js\
	      ${SRC}/parser.js\
	      ${SRC}/env.js\
	      ${SRC}/visitor.js\
	      ${SRC}/import-visitor.js\
	      ${SRC}/join-selector-visitor.js\
	      ${SRC}/to-css-visitor.js\
	      ${SRC}/extend-visitor.js\
	      ${SRC}/functions.js\
	      ${SRC}/colors.js\
	      ${SRC}/tree/*.js\
	      ${SRC}/tree.js\
	      ${SRC}/rhino.js > ${RHINO}
	@@echo ${RHINO} built.

min: less setup-build
	@@echo minifying...
	@@uglifyjs ${DIST} > ${DIST_MIN}
	@@echo ${DIST_MIN} built.

latest: less
	
alpha: min

beta: min

amd-latest: less

amd-browser-strict: less
	@@cat ${DIST} | node build/amd-postprocess-browser-strict.js > dist/tmp.js
	@mv dist/tmp.js ${DIST}

alpha-release: alpha
	git add dist/*.js
	git commit -m "Update alpha ${VERSION}"

dist: min rhino
	git add dist/*
	git commit -a -m "(dist) build ${VERSION}"
	git archive master --prefix=less/ -o less-${VERSION}.tar.gz
	npm publish less-${VERSION}.tar.gz

stable:
	npm tag less@${VERSION} stable

setup-build: Makefile package.json
	@echo "*** Installing NodeJS packages for less ***"
	npm install



.PHONY: all alpha-release alpha amd-latest amd-browser-strict benchmark beta browser-prepare browser-test-server browser-test dist less min rhino stable test setup-build

