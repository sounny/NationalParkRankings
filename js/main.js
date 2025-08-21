(function(){

//Pseudo-global variables

//My data only really has 2 attributes
var attrArray = ["scalerank", "Visited"]; 
var expressed = attrArray[0];

var chartWidth = window.innerWidth * 0.425,
    chartHeight = 550,
    leftPadding = 30,
    rightPadding = 5,
    topBottomPadding = 20,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

var yScale = d3.scaleLinear()
    .range([chartInnerHeight, 0])
    .domain([0, 110]);

// charts to cycle through

var barChart = null;
var pieChart = null;
var visitedList = null;

window.onload = setMap;


//Setting the map up

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
            worldmapData = data[2];

        setGraticule(map, path);

        var natParkpoly = topojson.feature(natparks, natparks.objects["ne_10m_parks_and_protected_lands_scale_rank"]);
        var worldmap = topojson.feature(worldmapData, worldmapData.objects["ne_10m_admin_1_states_provinces"]);

        map.selectAll(".country")
            .data(worldmap.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path);

        natParkpoly.features = joinData(natParkpoly.features, csvData);

        natParkpoly.features.forEach(f => {
//console.log(f.properties.name, "Visited:", f.properties.Visited);
        });

        var colorScale = makeColorScale(csvData);

        setEnumerationUnits(natParkpoly.features, map, path, colorScale);

//first creation of bar chart
        barChart = setChart(csvData, colorScale);

        createDropdown(csvData);
    }
};


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

function joinData(geojsonFeatures, csvData){
    for (var i = 0; i < csvData.length; i++){
        var csvRegion = csvData[i];
        var csvKey = csvRegion.name;

        for (var a = 0; a < geojsonFeatures.length; a++){
            var geojsonProps = geojsonFeatures[a].properties;
            var geojsonKey = geojsonProps.name;

            if (geojsonKey === csvKey){
                attrArray.forEach(function(attr){
                    var val;
                    if(attr === "Visited"){
                        val = csvRegion["Visited"];
                        val = (val && val.toString().trim().toUpperCase() === "Y") ? "Y" : null;
                    } else if(attr === "scalerank"){
                        val = parseFloat(csvRegion[attr]);
                    } else {
                        val = csvRegion[attr];
                    }
                    geojsonProps[attr] = val;
                });
            }
        }
    }
    return geojsonFeatures;
}


// Color scale

function makeColorScale(data){
    if(expressed === "scalerank"){
        var domainValues = data.map(function(d){ return parseFloat(d[expressed]); });
        return d3.scaleQuantize()
            .domain([d3.min(domainValues), d3.max(domainValues)])
            .range(["#85a559ff","#80b175ff","#44857eff","#1a5e80ff","#032955ff"]);
    } else if(expressed === "Visited"){
        return d3.scaleOrdinal()
            .domain(["Y", null]) 
            .range(["#1f3d28ff", "#cccccc"]);
    }
}

//Highlight, Dehighlight and the mouse labels

function setEnumerationUnits(features, map, path, colorScale){
    var polygons = map.selectAll(".regions")
        .data(features)
        .enter()
        .append("path")
        .attr("class", function(d){
    var safeName = d.properties.name
        .replace(/\s+/g, '-')    // spaces to hyphens
        .replace(/\./g, '')      // remove dots
        .replace(/'/g, '')       // remove apostrophes
        .replace(/,/g, '')       // remove commas
        .replace(/&/g, 'and');  // replace & with 'and'
    return "regions " + safeName;
})
        .attr("d", path)
        .style("fill", function(d){
            var value = d.properties[expressed];
            return value ? colorScale(value) : colorScale(null);
        })
        .on("mouseover", function(event, d){
            highlight(d.properties);
        })
        .on("mouseout", function(event, d){
            dehighlight(d.properties);
        });
        
    // Raise polygons so they stay on top for interaction
    polygons.raise();
};



function setChart(csvData, colorScale){
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

    yScale.domain([0, d3.max(csvData, function(d) { return parseFloat(d[expressed]); })]);

    // Y Axis
    var yAxis = d3.axisLeft(yScale)
        .ticks(6);

    chart.append("g")
        .attr("class", "yAxis")
        .attr("transform", translate)
        .call(yAxis);

    // Y-axis label
    chart.append("text")
        .attr("class", "yAxisLabel")
        .attr("transform", "rotate(-90)")
        .attr("y", 5)
        .attr("x", -chartHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(expressed);

    // Bars
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
        .style("fill", function(d){ return colorScale(d[expressed]); })
        // Add <desc> for original bar style
        .append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}')
        .each(function(d){
            d3.select(this.parentNode)
                .style("stroke", "none")
                .style("stroke-width", "0px");
        })
        .on("mouseover", function(event, d){
            highlight(d);
        })
        .on("mouseout", function(event, d){
            dehighlight(d);
        })
        .on("mousemove", moveLabel);

    // Park names on bars
    chart.selectAll(".barLabel")
        .data(csvData)
        .enter()
        .append("text")
        .attr("class", "barLabel")
        .attr("text-anchor", "middle")
        .attr("transform", function(d, i){
            var x = i * (chartInnerWidth / csvData.length) + leftPadding + ((chartInnerWidth / csvData.length - 1) / 2);
            var y = chartHeight - 100;
            return "translate(" + x + "," + y + ") rotate(-90)";
        })
        .text(function(d){ return d.name; });

    // Chart title
    chart.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", 40)
        //.attr("class", "chartTitle")
        .attr("font-size", "30px")
        .style("text-anchor", "middle")
        .text("National Park Rankings");

    return chart;
}
//Highlight, Remove highlight and mouse label
//Had to reword the names of the labels because of the spaces and special characters
    function highlight(props){
    var safeName = props.name
        .replace(/\s+/g, '-')    
        .replace(/\./g, '')      
        .replace(/'/g, '')       
        .replace(/,/g, '')       
        .replace(/&/g, 'and');  

    d3.selectAll(".regions." + safeName)
      .style("stroke", "blue")
      .style("stroke-width", "3px");
}

function dehighlight(props){
    var safeName = props.name
        .replace(/\s+/g, '-')    
        .replace(/\./g, '')      
        .replace(/'/g, '')       
        .replace(/,/g, '')       
        .replace(/&/g, 'and'); 

    var selected = d3.selectAll(".regions." + safeName)
        .style("stroke", function(){
            return getStyle(this, "stroke") || null;
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width") || null;
        });

    d3.select(".infolabel").remove();
}

function getStyle(element, styleName){
    var descSelection = d3.select(element).select("desc");
    var styleText = descSelection.empty() ? null : descSelection.text();

    if (!styleText) {
        return null;
    }

    try {
        var styleObject = JSON.parse(styleText);
        return styleObject[styleName];
    } catch(e) {
        console.warn("Invalid JSON in <desc>: ", styleText);
        return null;
    }
};

function setLabel(props){
    var labelAttribute = "<h1>" + props[expressed] + "</h1><b>" + expressed + "</b>";

    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.name + "_label")
        .html(labelAttribute);

    infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
}

// Move label with mouse
function moveLabel(){
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    var y = event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};


// Pie chart and visited list

function setPieChart(csvData, colorScale){

    if(barChart){
        barChart.remove();
        barChart = null;
    }

    var width = 400,
        height = 400,
        radius = Math.min(width, height) / 2;

    pieChart = d3.select("body")
        .append("svg")
        .attr("class", "pieChart")
        .attr("width", width)
        .attr("height", height)
        .style("display", "inline-block")
        .style("vertical-align", "top");

    var g = pieChart.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var counts = {
        "Visited": csvData.filter(d => d.Visited === "Y").length,
        "Not Visited": csvData.filter(d => d.Visited !== "Y").length
    };

    var pie = d3.pie()
        .value(function(d){ return d.value; });

    var data_ready = pie(Object.entries(counts).map(([key, value]) => ({key, value})));

    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    var arcs = g.selectAll("arc")
        .data(data_ready)
        .enter()
        .append("g");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", function(d){
            if(d.data.key === "Visited") return colorScale("Y");
            else return colorScale(null);
        });

    arcs.append("text")
        .attr("transform", function(d){ return "translate(" + arc.centroid(d) + ")"; })
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "white")
        .text(function(d){ return d.data.key + " (" + d.data.value + ")"; });

    if(!visitedList){
        visitedList = d3.select("body")
            .append("div")
            .attr("class", "visitedList")
            .style("display", "inline-block")
            .style("vertical-align", "top")
            .style("margin-left", "30px")
            .style("max-width", "200px")
            .style("font-family", "sans-serif");
    } else {
        visitedList.style("display", "inline-block");
        visitedList.html("");
    }

    visitedList.append("h3").text("Visited Parks:");

    var visitedParks = csvData.filter(d => d.Visited === "Y");

    visitedList.selectAll("p")
        .data(visitedParks)
        .enter()
        .append("p")
        .style("margin", "2px 0")
        .text(d => d.name);
}

//Dropdown

function createDropdown(csvData){
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .style("position", "absolute")
        .style("top", "20px")
        .style("left", "60px")
        .style("padding", "5px")
        .style("font-size", "14px")
        .on("change", function(){
            changeAttribute(this.value, csvData);
        });

    dropdown.selectAll("option")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d; })
        .text(function(d){ return d; });
}

// Attribute changer 
function changeAttribute(attribute, csvData){
    expressed = attribute;
    var colorScale = makeColorScale(csvData);

    if(expressed === "scalerank"){

        if(pieChart) pieChart.style("display", "none");
        if(visitedList) visitedList.style("display", "none");

        if(!barChart){
            barChart = setChart(csvData, colorScale);
        } else {
            barChart.style("display", "block");
        }

        yScale.domain([0, d3.max(csvData, function(d) { return parseFloat(d[expressed]); })]);

        d3.selectAll(".regions").raise()
            .transition()
            .duration(1000)
            .style("fill", function(d){
                var value = d.properties[expressed];
                return value ? colorScale(value) : colorScale(null);
            });

        var bars = d3.selectAll(".bar")
            .sort(function(a, b){ return b[expressed] - a[expressed]; });

        updateChart(bars.transition().duration(1000), csvData.length, colorScale);

    } else if(expressed === "Visited"){

        if(barChart) barChart.style("display", "none");

        if(!pieChart){
            setPieChart(csvData, colorScale);
        } else {
            pieChart.style("display", "block");
            visitedList.style("display", "block");
        }

        d3.selectAll(".regions").raise()
            .transition()
            .duration(1000)
            .style("fill", function(d){
                var value = d.properties[expressed];
                return value ? colorScale(value) : colorScale(null);
            });
    }
}

function updateChart(bars, n, colorScale){
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        .attr("height", function(d){
            if(expressed === "scalerank"){
                return chartInnerHeight - yScale(parseFloat(d[expressed]));
            } else {
                return d[expressed] === "Y" ? chartInnerHeight * 0.8 : chartInnerHeight * 0.2;
            }
        })
        .attr("y", function(d){
            if(expressed === "scalerank"){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            } else {
                return d[expressed] === "Y" ? topBottomPadding : chartInnerHeight * 0.8 + topBottomPadding;
            }
        })
        .style("fill", function(d){
            var value = d[expressed];
            return value ? colorScale(value) : colorScale(null);
        });

    d3.select(".chartTitle")
        .text("National Park " + expressed);
}

})();
