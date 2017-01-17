
var assert = require('assert');
var carto = require('../lib/carto');
var tree = require('../lib/carto/tree');

describe('RenderingJS', function() {
  var shader;
  var style = [
  '#world {', 
    'line-width: 2;', 
    'line-color: #f00;', 
    '[frame-offset = 1] {', 
      'line-width: 3;', 
    '}', 
    '[frame-offset = 2] {', 
      'line-width: 3;', 
    '}', 
  '}', 
  '', 
  '#worls[frame-offset = 10] {', 
      'line-width: 4;', 
  '}'
  ].join('\n');

  beforeEach(function() {
    shader = (new carto.RendererJS({ debug: true })).render(style);
  });

  it ("shold render layers", function() {
    assert(shader.getLayers().length === 2);
  });

  it ("shold report frames used in the layer", function() {
    var layer = shader.getLayers()[0];
    assert( layer.frames()[0] === 0);
    assert( layer.frames()[1] === 1);

    layer = shader.getLayers()[1];
    assert( layer.frames()[0] === 10);
  });

  it ("shold render with frames var", function() {
    var layer = shader.getLayers()[1];
    var props = layer.getStyle({}, { 'zoom': 0, 'frame-offset': 10 });
    assert( props['line-width'] === 4);
  });

  it ("shold render variables", function() {
    var style = '#test { marker-width: [testing]; }';
    shader = (new carto.RendererJS({ debug: true })).render(style);
    var layer = shader.getLayers()[0];
    var props = layer.getStyle({testing: 2}, { 'zoom': 0, 'frame-offset': 10 });
    assert( props['marker-width'] === 2);
  });

  it ("should allow filter based rendering", function() {
    var style = '#test { marker-width: 10; [zoom = 1] { marker-width: 1; } }';
    shader = (new carto.RendererJS({ debug: true })).render(style);
    var layer = shader.getLayers()[0];
    var props = layer.getStyle({}, { 'zoom': 0, 'frame-offset': 10 });
    assert( props['marker-width'] ===  10);
    props = layer.getStyle({}, { 'zoom': 1, 'frame-offset': 10 });
    assert( props['marker-width'] ===  1);
  });

  it ("symbolizers should be in rendering order", function() {
    var style = '#test { polygon-fill: red; line-color: red; }';
    style += '#test2 { line-color: red;polygon-fill: red; line-width: 10; }';
    var shader = (new carto.RendererJS({ debug: true })).render(style);
    var layer0 = shader.getLayers()[0];
    assert(layer0.getSymbolizers()[0] === 'polygon');
    assert(layer0.getSymbolizers()[1] === 'line');

    var layer1 = shader.getLayers()[1];
    assert(layer0.getSymbolizers()[0] === 'polygon');
    assert(layer0.getSymbolizers()[1] === 'line');
  });

  it ("colorize should return a list of colours in same order", function() {
    var style = '#test { image-filters: colorize-alpha(blue, cyan, green, yellow, orange, red); }';
    var shader = (new carto.RendererJS({ debug: true })).render(style);
    var layer0 = shader.getLayers()[0];
    var st = layer0.getStyle({ value: 1 }, {"frame-offset": 0, "zoom": 3});
    var expectedColours = [[0, 0, 255], [0, 255, 255], [0, 128, 0], [255, 255, 0], [255, 165, 0], [255, 0, 0]];
    for (var i = 0; i < st["image-filters"].args; i++){
      assert (st["image-filters"].args[i].rgb === expectedColours[i]);
    }
  });

  it ("should return list of marker-files", function(){
    var css = [
          'Map {',
            '-torque-time-attribute: "date";',
            '-torque-aggregation-function: "count(cartodb_id)";',
            '-torque-frame-count: 760.0;',
            '-torque-animation-duration: 15.0;',
            '-torque-resolution: 2.0;',
          '}',
          '#layer {',
          '  marker-width: 3;',
          '  marker-fill-opacity: 0.8;',
          '  marker-fill: #FEE391; ',
          '  marker-file: url(http://localhost:8081/gal.svg); ',
          '  comp-op: "lighten";',
          '  [value > 2] { marker-file: url(http://upload.wikimedia.org/wikipedia/commons/4/43/Flag_of_the_Galactic_Empire.svg); }',
          '  [value > 3] { marker-file: url(http://upload.wikimedia.org/wikipedia/commons/c/c9/Flag_of_Syldavia.svg); }',
          '  [frame-offset = 1] { marker-width: 10; marker-fill-opacity: 0.05;}',
          '  [frame-offset = 2] { marker-width: 15; marker-fill-opacity: 0.02;}',
          '}'
      ].join('\n');
      var shader = (new carto.RendererJS({ debug: true })).render(css);
      var markerURLs = shader.getImageURLs();
      var against = ["http://localhost:8081/gal.svg", "http://upload.wikimedia.org/wikipedia/commons/4/43/Flag_of_the_Galactic_Empire.svg", "http://upload.wikimedia.org/wikipedia/commons/c/c9/Flag_of_Syldavia.svg"];
      for(var i = 0; i<against.length; i++){
        assert(against[i] == markerURLs[i])
      }
  })

  it ("should return variable for styles that change", function() {
    var style = '#test { marker-width: [prop]; }';
    var shader = (new carto.RendererJS({ debug: true })).render(style);
    var layer0 = shader.getLayers()[0];
    assert(layer0.isVariable());

    style = '#test { marker-width: 1; }';
    shader = (new carto.RendererJS({ debug: true })).render(style);
    layer0 = shader.getLayers()[0];
    assert(!layer0.isVariable());

    style = '#test { marker-width: [prop]; marker-fill: red;  }';
    shader = (new carto.RendererJS({ debug: true })).render(style);
    layer0 = shader.getLayers()[0];
    assert(layer0.isVariable());
  });

  it("should parse styles with string", function() {
    var style = '#test { [column = "test\'ing"] { marker-width: 10; } }';
    var shader = (new carto.RendererJS({ debug: true })).render(style);
    var layer = shader.getLayers()[0];
    var props = layer.getStyle({column: 'test\'ing'}, {  'zoom': 0, 'frame-offset': 10 });
    assert(props['marker-width'] ===  10);
  });

  it("should parse styles with filters not supported by dot notation", function() {
    var style = '#test["mapnik::geometry_type"=1] { marker-width: 10; }';
    var shader = (new carto.RendererJS({ debug: true })).render(style);
    var layer = shader.getLayers()[0];
    var props = layer.getStyle({"mapnik::geometry_type": 1}, { 'zoom': 0 });
    assert.equal(props['marker-width'], 10);
    var emptyFilterProps = layer.getStyle({"mapnik::geometry_type": 2}, { 'zoom': 0 });
    assert.equal(emptyFilterProps['marker-width'], null);
  });

  it ("should parse turbocarto", function(){
    var css = [
          '#layer {',
          '  marker-width: ramp([cartodb_id], (#fff, #bbb), jenks);',
          '}'
      ].join('\n');
      var shader = (new carto.RendererJS({ debug: true })).render(css);
      var layer = shader.getLayers()[0];
      var st = layer.shader['marker-width'].style({}, {zoom: 1})
      assert.equal(st.name, "ramp")
      assert.equal(st.args.length, 3);
      assert.equal(st.args[1].value[0].rgb[0], 255);
      assert.equal(st.args[1].value[0].rgb[1], 255);
      assert.equal(st.args[1].value[0].rgb[2], 255);
      assert.equal(st.args[2].value, 'jenks');
  })

  it("should parse turbocarto with inner functions", function(){
    var css = [
      '#layer {',
      '  marker-width: ramp([cartodb_id], cartocolor(Bold), category(10));',
      '}'
    ].join('\n');
    var shader = (new carto.RendererJS({ debug: true })).render(css);
    var layer = shader.getLayers()[0];
    var st = layer.shader['marker-width'].style({}, {zoom: 1});
    assert.equal(st.name, "ramp");
    assert.equal(st.args.length, 3);
    assert.equal(st.args[1].name, 'cartocolor');
    assert.equal(st.args[1].args[0].value, 'Bold');
    assert.equal(st.args[2].name, 'category');
    assert.equal(st.args[2].args[0].value, 10);
  });

  describe('Change reference', function () {
    var style = [
      '#world {', 
        'polygon-fill: red;',
        'line-width: 2;', 
        'line-color: #f00;', 
        '[frame-offset = 1] {', 
          'line-width: 3;', 
        '}', 
        '[frame-offset = 2] {', 
          'line-width: 3;', 
        '}', 
      '}', 
      '', 
      '#worls[frame-offset = 10] {', 
          'line-width: 4;', 
      '}'
    ].join('\n');
    
    var reference = {
      version: '1.0.0',
      symbolizers: {
        line: {
          "stroke": {
                "css": "line-color",
                "default-value": "rgba(0,0,0,1)",
                "type": "color",
                "default-meaning": "black and fully opaque (alpha = 1), same as rgb(0,0,0)",
                "doc": "The color of a drawn line"
            },
            "stroke-width": {
                "css": "line-width",
                "default-value": 1,
                "type": "float",
                "doc": "The width of a line in pixels"
            },
            "stroke-opacity": {
                "css": "line-opacity",
                "default-value": 1,
                "type": "float",
                "default-meaning": "opaque",
                "doc": "The opacity of a line"
            },
            "stroke-linejoin": {
                "css": "line-join",
                "default-value": "miter",
                "type": [
                    "miter",
                    "miter-revert",
                    "round",
                    "bevel"
                ],
                "expression": true,
                "doc": "The behavior of lines when joining.",
                "default-meaning": "The line joins will be rendered using a miter look."
            },
            "stroke-linecap": {
                "css": "line-cap",
                "default-value": "butt",
                "type": [
                    "butt",
                    "round",
                    "square"
                ],
                "expression": true,
                "doc": "The display of line endings.",
                "default-meaning": "The line endings will be rendered using a butt look."
            },
            "comp-op": {
                "css": "line-comp-op",
                "default-value": "overlay",
                "default-meaning": "Add the current symbolizer on top of other symbolizer.",
                "doc": "Composite operation. This defines how this symbolizer should behave relative to symbolizers atop or below it.",
                "type": [
                    "multiply",
                    "add",
                    "overlay"
                ],
                "expression": true
            },
            "stroke-dasharray": {
                "css": "line-dasharray",
                "type": "numbers",
                "expression": true,
                "doc": "A pair of length values [a,b], where (a) is the dash length and (b) is the gap length respectively. More than two values are supported for more complex patterns.",
                "default-value": "none",
                "default-meaning": "The line will be drawn without dashes."
            }
        }
      }
    };

    describe('cartocss reference in options', function() {

      before(function() {
        this.referenceData = tree.Reference.data;
      });

      after(function() {
        tree.Reference.setData(this.referenceData);
      });

      it('should fail if a feature is not supported', function () {
        assert.throws(function () {
          var RendererJS = new carto.RendererJS({reference: reference, mapnik_version: '1.0.0'});
          var shader = RendererJS.render(style);
        }, Error);
      });

    });

  });

});
