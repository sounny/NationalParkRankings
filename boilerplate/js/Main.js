//This is what makes the script run when the window/site is loaded
window.onload = function(){

  //SVG dimension variables
    var w = 900, h = 500;

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
        .attr("width", function(d){ 
            return d * 2;
        })
        .attr("height", function(d){
            return d;
        })

//Make sure to name it!
        .attr("class", "innerRect")

//How to position
        .attr("x", 50) 
        .attr("y", 50)
//In this house we use this fancy rgba
        .style("fill", "rgba(225, 155, 221, 0.93)");     

};