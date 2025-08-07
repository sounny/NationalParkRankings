//Lesson 9
//self-executing anonymous function to move to local scope

(function(){

//what column the data for the choropleth is in
var attrArray = ["scalerank"];
var expressed = attrArray[0];

window.onload = setMap;

//setting the map up
function setMap(){
    var width = window.innerWidth * 0.5,
        height = 800;

    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    var projection = d3.geoConicEqualArea()
        .parallels([29.5, 45.5])
        .rotate([100, 0])
        .center([-10, 55])
        .scale(700)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);

    var promises = [];   
    promises.push(d3.csv("data/NatParkDATA.csv"));                    
    promises.push(d3.json("data/NatParkpolyRANK.topojson"));
    promises.push(d3.json("data/worldmap.topojson"));                                      
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            natparks = data[1],
            worldmap = data[2];

        setGraticule(map, path);

        var natParkpoly = topojson.feature(natparks, natparks.objects["ne_10m_parks_and_protected_lands_scale_rank"]);
        var worldmap = topojson.feature(worldmap, worldmap.objects["ne_10m_admin_1_states_provinces"]);

        map.selectAll(".country")
            .data(worldmap.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path);

//This is how we get the rank data to be a choropleth

        natParkpoly.features = joinData(natParkpoly.features, csvData);

        console.log(natParkpoly.features[0].properties);

        var colorScale = makeColorScale(csvData);

        setEnumerationUnits(natParkpoly.features, map, path, colorScale);

        setChart(csvData, colorScale);
    }
};

//This is to set up the graticules (lat,long lines)

function setGraticule(map, path){
    var graticule = d3.geoGraticule()
        .step([5, 5]);

    map.append("path")
        .datum(graticule.outline())
        .attr("class", "gratBackground")
        .attr("d", path);

    map.selectAll(".gratLines")
        .data(graticule.lines())
        .enter()
        .append("path")
        .attr("class", "gratLines")
        .attr("d", path);
};

//This is where I mainly failed and had to start over several times and I still don't think I did it right in this script

function joinData(geojsonFeatures, csvData){
    for (var i = 0; i < csvData.length; i++){
        var csvRegion = csvData[i];
        var csvKey = csvRegion.name;

        for (var a = 0; a < geojsonFeatures.length; a++){
            var geojsonProps = geojsonFeatures[a].properties;
            var geojsonKey = geojsonProps.name;

            if (geojsonKey === csvKey){
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val;
                });
            }
        }
    }
    return geojsonFeatures;
}

//This adds the features to the map (the topojson features)

function setEnumerationUnits(features, map, path, colorScale){
    map.selectAll(".regions")
        .data(features)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.name;
        })
        .attr("d", path)
        .style("fill", function(d){
            var value = d.properties[expressed];
            if (value !== undefined && value !== null && !isNaN(value)) {
                var cappedValue = value > 4 ? 4 : value;
                return colorScale(cappedValue);
    } else {
        return "#ccc";
    }
});
};

//This sets up the bar graph

function setChart(csvData, colorScale){
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 550,
        leftPadding = 30,
        rightPadding = 5,
        topBottomPadding = 20,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    var yScale = d3.scaleLinear()
        .range([chartInnerHeight, 0])
        .domain([0, d3.max(csvData, function(d) { return parseFloat(d[expressed]); })]);

    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){ return b[expressed] - a[expressed]; })
        .attr("class", function(d){ return "bar " + d.name; })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){ return i * (chartInnerWidth / csvData.length) + leftPadding; })
        .attr("height", function(d){ return chartInnerHeight - yScale(parseFloat(d[expressed])); })
        .attr("y", function(d){ return yScale(parseFloat(d[expressed])) + topBottomPadding; })
        .style("fill", function(d){ return colorScale(d[expressed]); });

    chart.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .style("text-anchor", "middle")
        .text("National Park Rankings");

        // Y-Axis Label
        chart.append("text")
            .attr("class", "yAxisLabel")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(15," + (chartHeight / 2) + ")rotate(-90)")
            .text("Rank");

        // X-Axis Label
        chart.selectAll(".barLabel")
            .data(csvData)
            .enter()
            .append("text")
            .attr("class", "barLabel")
            .attr("text-anchor", "middle")
            .attr("transform", function(d, i){
                var x = i * (chartInnerWidth / csvData.length) + leftPadding + ((chartInnerWidth / csvData.length - 1) / 2);
                var y = chartHeight -100;  
                return "translate(" + x + "," + y + ") rotate(-90)";
    })
    .text(function(d){
        return d.name;
    });

    var yAxis = d3.axisLeft().scale(yScale);

    chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};

//This is for the ranking colors for the choropleth

function makeColorScale(data){
    var colorClasses = [
        "#dcbcdaff",
        "#c292bfff",
        "#b774b3ff",
        "#81347cff",
        "#4b1148ff"
    ];

    var colorScale = d3.scaleOrdinal()
        .domain([0, 1, 2, 3, 4])
        .range(colorClasses);

    return colorScale;
}

})();
