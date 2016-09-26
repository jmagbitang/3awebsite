/*jslint browser: true, indent: 3, white: true */
/*globals d3 */

d3.sample_dots = function(config) {
   "use strict";
   /* Sample D3 Application
    *
    * Usage: create a dots function, which is suitable to use in a
    * selection.call():
    *
    *    dots = d3.sample_dots()
    *    d3.select('#mydiv')
    *       .call(dots)
    *
    * This will start painting dots inside a 500x500 SVG element,
    * within the specified div.
    *
    * Public functions:
    *
    *   dots.stop() - stop painting dots
    *   dots.paint() - paint once, then stop
    *   dots.go() - paint forever
    */

   var width,   // svg width
       height,  // svg height
       radius,  // dot radius
       to_id,   // timeout timer id
       crayola, // json crayola color data
       vis,     // main visualization element

   // d3-tip, see: https://github.com/Caged/d3-tip
       tip = d3.tip()
         .attr('class', 'dot-tip')
         .offset(function(d) {
            var left = (d.x < 100) ? 100 : 0,
                top = (d.y < 100) ? 20 : -10;
            return  [top, left];
         })
         .direction(function(d) {
            return (d.y < 100) ? 's' : 'n';
         })
         .html(function(d) {
            var strName = "<strong>Name:</strong> " + d.c.name + "</br></br>",
                strHEX = "<strong>Hex value:</strong> " + d.c.hex + "</br></br>",
                strRGB = "<strong>RGB value:</strong> " + d.c.rgb + "</br></br>";
            return strName + strHEX + strRGB;
         });

   // initialize variables from config
   config = config || {};

   width =  config.width  || 400; // default svg width
   height = config.height || 400; // default svg height
   radius = config.radius || 10;  // dot radius

   function dots(selection) {

      selection.selectAll('*').remove();

      vis = selection.append('svg')
         .attr('width', width)
         .attr('height', height)
         .call(tip);

      // load the crayola 64+ pack, and do one paint
      d3.json("https://gist.githubusercontent.com/jjdelc/1868136/raw/c734ad88bb3b5a2b27f4e91a24716024c66da421/crayola.json", function(error, json) {
         if (error) {
            return console.warn(error);
         }
         crayola = json;
         dots.go();
      });

   }

   function random(min, max) {
      // random([[min], max])
      if (!arguments.length) {
         return Math.random();
      }
      if (arguments.length < 2) {
         max = min;
         min = 0;
      }
      return min + Math.floor(Math.random() * (max-min));
   }

   function randomRGB() {
      /* return a random crayola color */
      return crayola[random(crayola.length)];
   }

   function fetchData() {
      /* fetch a batch of data
       *
       * 8-64 random dots, each dot is:
       *   {
       *     x: <x-coor>
       *     y: <y-coor>
       *     r: <radius>
       *     c: <color obj>
       */

      // max radius will grow over iterations
      if (radius < 31) {
         radius += 1;
      }

      return d3.range(random(8,65)).map(function() {
         return {x: random(width),
                 y: random(height),
                 r: random(radius),
                 c: randomRGB()
                };
      });
   }

   function dataKey(d) {
      // create a key so each dot is unique
      return String() + d.x + d.y + d.r + d.c.hex;
   }

   dots.paint = function() {
      /* paint a new set of dots */
      var update,
          data = fetchData();

      // get an update selection (probably empty) after binding to new
      // set of data.  See: http://bost.ocks.org/mike/join/
      update = vis.selectAll('circle')
         .data(data, dataKey);

      // new dots
      update.enter()
         .append('circle')
         .attr('r', 0)
         .attr('opacity', 0.6)
         .attr('fill', function(d){return d.c.hex;})
         .on('mouseover', tip.show) // for mouse hovering over dots
         .on('mouseout', tip.hide)
         .transition()  // animate radius growing
         .duration(4500)// over 4.5 seconds
         .attr('r', function(d) {return d.r;});
      update
         // place at x,y
         .attr('cx', function(d) { return d.x; })
         .attr('cy', function(d) { return d.y; });
      update
         // for exiting dots, transition radius to zero, then remove
         // from dom
         .exit()
         .transition()
         .duration(4500)
         .attr('r', 0)
         .remove();
   };

   dots.go = function() {
      /* paint forever */

      dots.paint();
      to_id = setTimeout(function() {
         dots.go();
      }, 5000);
   };

   dots.stop = function() {
      /* no, don't paint forever */
      if (to_id) {
         clearTimeout(to_id);
         to_id = null;
      }
   };

   return dots;
};
