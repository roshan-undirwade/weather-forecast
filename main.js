  function initAutocomplete() {
    var map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -33.8688, lng: 151.2195},
      zoom: 10,
      mapTypeId: 'roadmap'
    });

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
      
      
    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
      searchBox.setBounds(map.getBounds());
    });

    var markers = [];
    document.getElementById("lower-container").style.display="none"; //hide graph container by default
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }
    
      $.ajax({
        url:'http://api.openweathermap.org/data/2.5/forecast?q=' + document.getElementById("pac-input").value   + '&APPID=21345c48a0f3571e854dbb0a58c11c00',
        type:"GET",
        dataType:'jsonp',
        success:function(data){
          document.getElementById("lower-container").style.display="block"; //show chart container when data loaded
          document.getElementById("map").style.height="50%"; // reduce gragh height after loading
          var temp = [];
          var pressure = [];
          var humidity = [];
          var avgtemp = [];
          var avgpressure = [];
          var avghumidity = [];
          var count = 0;
          var totTemp = 0;
          var totHumidity = 0;
          var totPressure = 0;
          var list = data["list"]; //parse list from the response
          
          //parse humidity, pressure, temprature from response and populate array
          list.forEach(listItem=>{ 
            if(count < 40){
              count += 1;              
              let main = listItem["main"];  
              totHumidity += main["humidity"];
              totTemp += main["temp"];
              totPressure += main["pressure"];
              let tempObj = {value: main["temp"], count: count};           
              let humObj = {value: main["pressure"], count: count};
              let pressObj = {value: main["humidity"], count: count};
              pressure.push(humObj);
              humidity.push(pressObj);
              temp.push(tempObj);
            }
          })
              
            count = 0;
            // calculate average and populate array
            list.forEach(listItem=>{
              if(count < 40){
                count += 1;                
                
                let tempObj = {value: totTemp/data["cnt"], count: count};           
                let humObj = {value: totHumidity/data["cnt"] , count: count};
                let pressObj = {value: totPressure/data["cnt"] , count: count};
                avgpressure.push(pressObj);
                avghumidity.push(humObj);
                avgtemp.push(tempObj);
              }

                            
            }) 

            // set view element to display average
            document.getElementById('avgTemp').innerHTML = (Math.floor(avgtemp[0]["value"]) + "K"); 
            document.getElementById('avgPressure').innerHTML = (Math.floor(avgpressure[0]["value"]) + "hPa");
            document.getElementById('avgHumidity').innerHTML = (Math.floor(avghumidity[0]["value"]) + "%");


            drawchart("#temp" , temp, "#fef6e9", "Temprature(K)", avgtemp); // for temprature 
            drawchart("#pressure", pressure, "#e7f1e6", "Pressure(hPa)", avgpressure);// for pressure
            drawchart("#humidity", humidity, "#e5e5e5", "Humidity(%)", avghumidity);  // for humidity    
          },
          error:function(){
            alert("Can not fetch forecast Data try again with different location");
            //reset page layout to default
            document.getElementById("lower-container").style.display="none";
            document.getElementById("map").style.height="100%";
          }
    });
    
      
      // Clear out the old markers.
      markers.forEach(function(marker) {
        marker.setMap(null);
      });
      markers = [];

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function(place) {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }
        var icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        // Create a marker for each place.
        markers.push(new google.maps.Marker({
          map: map,
          icon: icon,
          title: place.name,
          position: place.geometry.location
        }));

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);
    });
  }

  //draws d3 chart for temprature, pressure, humidity
  function drawchart(id, temp, color, text, avg){
    d3.select(id).selectAll("*").remove();
    var svgWidth = 430, svgHeight = 400;
    var margin = { top: 20, right: 20, bottom: 30, left: 50 };
    var width = svgWidth - margin.left - margin.right;
    var height = svgHeight - margin.top - margin.bottom;

    //select SVG element by Id and provide it with some styling.
    var svg = d3.select(id)
        .attr("width", svgWidth)
        .attr("height", svgHeight);

      
        
    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //x axis
    var x = d3.scaleTime()
        .rangeRound([0, width]);
        // y axis
    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

      //line for values
    var line = d3.line()
        .x(function(d) { return x(d.count)})
        .y(function(d) { return y(d.value)})
        x.domain(d3.extent(temp, function(d) { return d.count }));
        y.domain(d3.extent(temp, function(d) { return d.value }));

        //line for average
    var line2 = d3.line()
      .x(function(d) { return x(d.count)})
      .y(function(d) { return y(d.value)})
      x.domain(d3.extent(temp, function(d) { return d.count }));
      y.domain(d3.extent(temp, function(d) { return d.value }));
    
    //fill area
    var area = d3.area()
      .x(function(d) { return x(d.count); })
      .y0(height)
      .y1(function(d) { return y(d.value); });
    
    //append value parameter line to group tag
    g.append("path")
        .datum(temp)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);   

    //append fill area to group tag 
    g.append("path")
    .datum(temp)                
    .attr("fill", color)                
    .attr("d", area);

    //append average line to group tag
    g.append("path")
      .datum(avg)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line2)
      .style("stroke-dasharray", ("3, 3"));

    //append y axis
    g.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text(text);
      
  }



   