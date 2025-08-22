//This is what makes the script run when the window/site is loaded
// sounny: demo bubble chart showcasing population differences
window.onload = function(){

  //SVG dimension variables
    var w = 900, h = 500;

//We can add data also through arrays
//Moved array to beginning of script to make it work
        var cityPop = [
        { 
            city: 'Madison',
            population: 233209,
            citySize: 'Medium'
        },
        {
            city: 'Milwaukee',
            population: 594833,
            citySize: 'Large'
        },
        {
            city: 'Green Bay',
            population: 104057,
            citySize: 'Medium'
        },
        {
            city: 'Superior',
            population: 27244,
            citySize: 'Small'
        }
    ];

    var format = d3.format(",");

 // SVG container block

 //This grabs the <body> from the dom
    var container = d3.select("body") 
//Places a new svg in the body
        .append("svg")
//Assigns the width and height ((referenced above))
        .attr("width", w)
        .attr("height", h)
//You need to make sure that you always assign a class for styling and future selection
//The more organized that you are th easier it will be!!!!!
        .attr("class", "container")
//Make sure to place a semicolon only at the end of the block
        .style("background-color", "rgba(169, 237, 137, 0.93)")
//Now to add a rectangle to the the inner portion

//This is the correct way to add the rectangle
        var innerRect = container.append("rect")
//a single value is a DATUM **Need to read more in what this does exactly**
        .datum(400)

    var x = d3.scaleLinear() //create the scale
        .range([90, 810]) //output min and max
        .domain([0, 3]); //input min and max

//**find the minimum value of the array
    var minPop = d3.min(cityPop, function(d){
        return d.population;
    });

    //find the maximum value of the array
    var maxPop = d3.max(cityPop, function(d){
        return d.population;
    });

    var color = d3.scaleLinear()
        .range([
            "rgba(225, 155, 221, 0.93)",
            "rgba(212, 93, 125, 0.76)"
        ])
        .domain([
            minPop, 
            maxPop
        ]);

//**scale for circles center y coordinate
    var y = d3.scaleLinear()
        .range([450, 50]) 
//replaces minPop, maxPop
        .domain([0, 700000]);

//Creates empty selection
    var circles = container.selectAll(".circles")
//We add in the array
        .data(cityPop)
//I am happy that I am not the only one that is confused on why this thing works
        .enter()
//HTML check and I oop-
        .append("circle")
        .attr("class", "circles")
        .attr("id", function(d){
            return d.city;
        })
        .attr("r", function(d){
//calculate the radius based on population
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d, i){
//use the index to place each circle horizontally
            return x(i);
        })
        .attr("cy", function(d){
//subtract value from 450 to "grow" circles up from the bottom instead of down from the top of the SVG
            return y(d.population);
        })
//add a fill based on the color scale generator
        .style("fill", function(d, i){ 
            return color(d.population);
        })
         .style("stroke", "rgba(64, 160, 85, 0.76)");
//create y asis generator
        var yAxis = d3.axisLeft(y);
//create axis g element and add axis
    var axis = container.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(50, 0)")
        .call(yAxis)

     var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("City Populations")

            var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("y", function(d){
            //vertical position centered on each circle
            return y(d.population) + 5;
        });

    //first line of label
    var nameLine = labels.append("tspan")
        .attr("class", "nameLine")
        .attr("x", function(d,i){
            //horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .text(function(d){
            return d.city;
        });



//second line of label
    var popLine = labels.append("tspan")
        .attr("class", "popLine")
        .attr("x", function(d,i){
//horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
 //vertical offset
        .attr("dy", "15")
        .text(function(d){
//To format with d3.format(",");
            return "Pop. " + format(d.population);
        });

//third line of label
var sizeLine = labels.append("tspan")
    .attr("class", "sizeLine")
    .attr("x", function(d,i){
// align horizontally with the other lines
        return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
    })
    .attr("dy", "15")
    .text(function(d){
        return "Size: " + d.citySize;
    });

/*
//How to position the inner rectangle... when it was a retangle and not circles
        .attr("x", 50) 
        .attr("y", 50)

//In this house we use this fancy rgba
        .style("fill", "rgba(225, 155, 221, 0.93)"); */ 

};