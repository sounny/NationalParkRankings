//lesson 9
//this places everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["varA", "varB", "varC", "varD", "varE"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

window.onload = setMap();

//settingup the up choropleth map Example 1.3
function setMap(){
//map dimensions
    var width = 1170,
        height = 800;

//create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height)

//Albers equal area conic projection centered on the us Example 2.1

/*    var projection = d3.geoAlbers()
        .center([0, 50])
        .rotate([96, 0])
        .parallels([29.5, 45.5])
        .scale(400)
        .translate([width / 2, height / 2]); */

//Trying new projection 
var projection = d3.geoConicEqualArea()
    .parallels([29.5, 45.5])
    .rotate([100, 0])
    .center([0, 50])
    .scale(700)
    .translate([width / 2, height / 2]);

//Example 2.2
    var path = d3.geoPath().projection(projection);

//use Promise.all to load all data Example 2.1
    var promises = [];   
    promises.push(d3.csv("data/NatParkDATA.csv"));                    
    promises.push(d3.json("data/NatParkpoly.topojson"));
    promises.push(d3.json("data/worldmap.topojson"));                                      
    Promise.all(promises).then(callback);

//callback funtion Example 1.4 2.3 2.5 2.6
    function callback(data) {
        var csvData = data[0],
            natparks = data[1];
            worldmap = data[2];

//graticule generator - create graticule lines 2.6
        setGraticule(map, path);

//console.log(csvData);
        //console.log(natparks);

//console.log("Available TopoJSON objects:", Object.keys(natparks.objects));
//console.log("Worldmap keys:", Object.keys(worldmap.objects));

 //translate the natparks TopoJSON Example 1.5
        var natParkpoly = topojson.feature(natparks, natparks.objects["ne_10m_parks_and_protected_lands_area"]);
        var worldmap = topojson.feature(worldmap, worldmap.objects["ne_10m_admin_1_states_provinces"]);

//console.log("Feature count:", natParkpoly.features.length);
//console.log("Feature count:", worldmap.features.length);

//Example 2.3
        map.selectAll(".country")
            .data(worldmap.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path);

        //join csv data to GeoJSON enumeration units
        natParkpoly.features = joinData(natParkpoly.features, csvData);

        //create the color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units to the map
        setEnumerationUnits(natParkpoly.features, map, path, colorScale);

        //examine the results
        //console.log(natParkpoly);
        //console.log("SVG path count:", document.querySelectorAll("path").length);
        //console.log("First path 'd' attribute:", document.querySelector("path")?.getAttribute("d"));
    }
}; //end of setMap()

function setGraticule(map, path){
//graticule generator - create graticule lines 2.6

    var graticule = d3.geoGraticule()
//places graticule lines every 5 degrees of longitude and latitude
        .step([5, 5]);

    var gratBackground = map.append("path")
//bind graticule background
        .datum(graticule.outline()) 
//assign class for styling
        .attr("class", "gratBackground") 
//project graticule
        .attr("d", path) 

//select graticule elements that will be created
    var gratLines = map.selectAll(".gratLines") 
//Attach graticule lines to each element to be created
        .data(graticule.lines()) 
//create an element for each datum
        .enter() 
//append each element to the svg as a path element
        .append("path") 
//assign class for styling
        .attr("class", "gratLines") 
//project graticule lines
        .attr("d", path); 
};

function joinData(natParkFeatures, csvData){
//placeholder for join logic if needed later
    return natParkFeatures;
};

function setEnumerationUnits(natParkFeatures, map, path, colorScale){
    var regions = map.selectAll(".regions")
        .data(natParkFeatures)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.adm1_code;
        })
        .attr("d", path)
        .style("fill", function(d){
            var value = d.properties[expressed];
            if (!isNaN(value)) {
                return colorScale(value);
            } else {
                return "#ccc";
            }
        });
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

})();
