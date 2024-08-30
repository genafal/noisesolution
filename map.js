document.addEventListener("DOMContentLoaded", function () {
    
    function createChoroplethMap() {
        
        Promise.all([
            
            d3.json("uk_outcode_regions.geojson"), // Load GeoJSON
            d3.csv("data_for_map.csv") // Load CSV data with outcode_alpha and score_change columns
        ]).then(function([geojsonData, csvData]) {

            geojsonData.features.forEach(feature => {
                console.log(feature.properties); // Check the available property names
            });
            

            geojsonData.features.forEach((feature, index) => {
                console.log(`Feature ${index}:`, feature.geometry.coordinates);
            });

            /*
            // Calculate average score change for each outcode_alpha
            const aggregatedData = d3.rollups(
                csvData,
                v => d3.mean(v, d => +d.score_change), // Calculate average
                d => d.outcode_alpha.trim().toUpperCase()
            );
            */

            // Calculate average score change and count for each outcode_alpha
            const aggregatedData = d3.rollups(
                csvData,
                v => ({
                    average_score_change: d3.mean(v, d => +d.score_change),
                    count: v.length, // number of participants per region; for use in tooltip
                    area: v[0].area, // for use in tooltip
                    region: v[0].region, // for use in tooltip
                    average_age: d3.mean(v, d => +d.start_age) // for use in tooltip
                }),
                d => d.outcode_alpha.trim().toUpperCase()
            );

            // Convert the aggregated data into a Map for easier lookup
            const dataMap = new Map(aggregatedData);
            console.log("Data Map:", dataMap);

            // Attach the calculated data to the GeoJSON features
            geojsonData.features.forEach(feature => {
                const outcode_alpha = feature.properties.outcode_alpha ? feature.properties.outcode_alpha.trim().toUpperCase() : null;
                if (outcode_alpha) {
                    const data = dataMap.get(outcode_alpha) || { average_score_change: 0, count: 0 }; // Fallback to zero if not found
                    feature.properties.average_score_change = data.average_score_change;
                    feature.properties.count = data.count;
                    feature.properties.area = data.area;
                    feature.properties.region = data.region;
                    feature.properties.average_age = data.average_age;
                    console.log(outcode_alpha, data.average_score_change, data.count); // Log to verify it's working
                } else {
                    console.warn(`Missing or undefined 'outcode_alpha' property in feature:`, feature);
                }
            });
            
            /*
            geojsonData.features.forEach(feature => {
                const outcode_alpha = feature.properties.outcode_alpha.trim().toUpperCase(); 
                const average_score_change = dataMap.get(outcode_alpha) || 0; // Get the average score from the map or default to 0
                feature.properties.average_score_change = average_score_change;
                console.log(outcode_alpha, average_score_change); // Log to verify it's working
            });
            */

            
            // Create the choropleth map
            const width = 1200;
            const height = 1200;

            const svg = d3.select("#map")  // Make sure your HTML has a <div id="map"></div>
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            // Set up the color scale based on the range of your data
            const minScore = d3.min(geojsonData.features, d => d.properties.average_score_change);
            const maxScore = d3.max(geojsonData.features, d => d.properties.average_score_change);
            
            // Initialize the color scale after calculating the domain
            const colorScale = d3.scaleDiverging()
                .domain([minScore, 0, maxScore])
                .interpolator(d3.interpolateRgbBasis(["#8755FF", "#E1E1E1", "#beff00"]));

            // Log values to verify correct initialization (AFTER colorScale is defined)
            geojsonData.features.forEach(feature => {
                const outcode_alpha = feature.properties.outcode_alpha;
                console.log(outcode_alpha, feature.properties.average_score_change, colorScale(feature.properties.average_score_change));
            });

            /*
            // Use fitSize to automatically adjust projection for your data
            const projection = d3.geoMercator()
                .fitSize([width, height], geojsonData); // adjusts projection to fit specified width and height
            */
            
            const projection = d3.geoMercator()
                .fitExtent([[50, 50], [width - 50, height - 50]], {
                    type: "FeatureCollection",
                    features: geojsonData.features
                });
            
            // Initialize the path generator using the projection
            const path = d3.geoPath().projection(projection);

            // Initialize the tooltip
            const tooltip = d3.select("#tooltip");

            // projection bounds test
            const bounds = d3.geoBounds(geojsonData);
            console.log("Bounds:", bounds);


            // Draw the map with colored regions based on average score change
            svg.selectAll("path")
                .data(geojsonData.features)
                .enter().append("path")
                .attr("d", path)
                //.attr("fill", d => colorScale(d.properties.average_score_change))
                .attr("fill", d => {
                    if (d.properties.count === 0) {
                        return "#333333"; // Dark gray for count = 0
                    } else if (d.properties.count > 0 && d.properties.average_score_change === 0) {
                        return "#E1E1E1"; // Light gray for count > 0 but average_score_change = 0
                    } else {
                        return colorScale(d.properties.average_score_change); // Color based on score change
                    }
                })
                .attr("stroke", "#000")
                .attr("stroke-width", "1.0px")
                .on("mouseover", function(event, d) {
                    if (d.properties.count > 0) { // Only show tooltip if count > 0
                        tooltip.style("opacity", 1); // Show the tooltip
                        tooltip.html(`
                            <strong>Area:</strong> ${d.properties.area}, ${d.properties.region}<br>
                            <strong>Avg Score Change:</strong> ${d.properties.average_score_change !== null ? d.properties.average_score_change.toFixed(2) : "N/A"}<br>
                            <strong>Avg Age:</strong> ${d.properties.average_age !== null ? d.properties.average_age.toFixed(2) : "N/A"}<br>
                            <strong>Count:</strong> ${d.properties.count}
                        `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    }
                })
                .on("mousemove", function(event) {
                    tooltip.style("left", (event.pageX + 10) + "px")
                           .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0); // Hide the tooltip
                });

        }).catch(function(error) {
            console.error("Error loading the files: ", error);
        });
    }

    createChoroplethMap(); // Call the function to create the map
});
