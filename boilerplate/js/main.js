window.onload = setMap();

//settingup the up choropleth map Example 1.3
function setMap(){
    //use Promise.all to load all data
    var promises = [d3.csv("data/NatParkDATA.csv"),                    
                    d3.json("data/NatParkpoly.topojson")                                    
                    ];    
    Promise.all(promises).then(callback);
 
//callback funtion Example 1.4    

    function callback(data) {
        var csvData = data[0],
            natparks = data[1];
        console.log(csvData);
        console.log(natparks);
    }
}