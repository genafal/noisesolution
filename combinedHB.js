// this is a nice solution! :D 
const orders = {
    "age_group": ["Age 4-9", "Age 10-12", "Age 13-15", "Age 16-19", "Age 20-24", "Age 25+", "Unknown"],
    "location": ["St. Albans", "Bath", "Cambridge", "Chelmsford", "Colchester", "Ipswich", "Milton Keynes", "London", "Norwich", "Peterborough", "Romford", "Stevenage"],
    "ethnicity": ["Asian", "Black", "White", "Mixed", "Declined to say", "Unknown"],
    "gender": ["Female", "Male", "Other", "Unknown"]
};
Promise.all([
            
    d3.json("uk_outcode_regions.geojson"), // Load GeoJSON
    d3.csv("data_for_map.csv") // Load CSV data with outcode_alpha and score_change columns
]).then(function([geojsonData, csvData]) {

    // geojsonData.features.forEach(feature => {
    //     console.log(feature.properties); // Check the available property names
    // });
    

    // geojsonData.features.forEach((feature, index) => {
    //     console.log(`Feature ${index}:`, feature.geometry.coordinates);
    // });

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
            // console.log(outcode_alpha, data.average_score_change, data.count); // Log to verify it's working
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
    // geojsonData.features.forEach(feature => {
    //     const outcode_alpha = feature.properties.outcode_alpha;
    //     console.log(outcode_alpha, feature.properties.average_score_change, colorScale(feature.properties.average_score_change));
    // });

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

d3.csv("data.csv").then(function (data) {
    console.log("Loaded Data:", data);

    // Define a mutable holding place for filtered data indices
    let filteredData = [];

    const margin = { top: 20, right: 30, bottom: 50, left: 50 },
        width = 1000 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#beeswarm-chart-container svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // these things are data dependent, but not dynamic 
    // once you have data you can set it and forget it
    // again, responsiveness would necessitate making these dynamic
    const xScale = d3.scalePoint()
        .domain(orders.age_group)
        .range([0, width])
        .padding(0.5);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => +d.score_change), d3.max(data, d => +d.score_change)])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    const simulation = d3.forceSimulation(data)
        .force("x", d3.forceX(d => xScale(d.age_group)).strength(0.1))
        .force("y", d3.forceY(d => yScale(+d.score_change)).strength(0.8))
        .force("collide", d3.forceCollide(5))
        .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    plotBeeswarm(data);

    // since you are performing the same function with the same input
    // regardless of which dropdown is selected you don't need to apply 
    // the event listener individually. 
    d3.selectAll(".dropdown").on("change", () => cascadeDropdowns(data));

    d3.select("#clear-button").on("click", function () {
        filteredData = [];
        clearSelections(data);
    });

    cascadeDropdowns(data);

    function cascadeDropdowns(data) {

        const selectedAgeGroup = d3.select("#age-group").property("value");
        const selectedLocation = d3.select("#location").property("value");
        const selectedEthnicity = d3.select("#ethnicity").property("value");
        const selectedGender = d3.select("#gender").property("value");

        // use slice to make a copy of the data here so you don't unintentionally 
        // mutate your original data, since you'll still need the original dataset
        // to replot the beeswarm on every filter change
        let currentData = data.slice();

        if (selectedAgeGroup) {
            currentData = currentData.filter(d => d.age_group === selectedAgeGroup);
        }

        if (selectedLocation) {
            currentData = currentData.filter(d => d.location === selectedLocation);
        }

        if (selectedEthnicity) {
            currentData = currentData.filter(d => d.ethnicity === selectedEthnicity);
        }

        if (selectedGender) {
            currentData = currentData.filter(d => d.gender === selectedGender);
        }

        // apply all filters to the dataset first, then populate the dropdowns 
        // so the choices in the dropdowns reflect what's currently available. 
        // this means that some choice combos might remove all the options
        // so this is an opportunity to think through the UX and what someone
        // might need or expect to help them through that scenario
        const locations = [...new Set(currentData.map(d => d.location))]
            .sort((a, b) => orders.location.indexOf(a) - orders.location.indexOf(b));
        updateDropdown("#location", locations, selectedLocation);

        const ethnicities = [...new Set(currentData.map(d => d.ethnicity))]
            .sort((a, b) => orders.ethnicity.indexOf(a) - orders.ethnicity.indexOf(b));
        updateDropdown("#ethnicity", ethnicities, selectedEthnicity);

        const genders = [...new Set(currentData.map(d => d.gender))]
            .sort((a, b) => orders.gender.indexOf(a) - orders.gender.indexOf(b));
        updateDropdown("#gender", genders, selectedGender);

        const ages = [...new Set(currentData.map(d => d.age_group))]
            .sort((a, b) => orders.age_group.indexOf(a) - orders.age_group.indexOf(b));
        updateDropdown("#age-group", ages, selectedAgeGroup);

        // only populate the global filtered data variable if some filters have been applied
        // this keeps all the highlights off when all the dropdowns are cleared
        if (currentData.length < data.length) {
            filteredData = currentData.map(d => d.index);
        } else {
            filteredData = [];
        }
        console.log("current data", currentData);
        console.log("filtered data", filteredData);
        updateAverageScore(currentData);
        plotBeeswarm(data);
    }

    // excellent implementation! :D 
    function updateDropdown(selector, options, selectedValue) {
        const dropdown = d3.select(selector);
        dropdown.selectAll("option").remove();

        dropdown.append("option").attr("value", "").text("Select...");

        dropdown.selectAll("option.option-item")
            .data(options)
            .enter()
            .append("option")
            .classed("option-item", true)
            .text(d => d)
            .attr("value", d => d);

        if (selectedValue && options.includes(selectedValue)) {
            dropdown.property("value", selectedValue);
        } else {
            dropdown.property("value", "");
        }
    }

    // this function is now called from inside the cascadeDropdowns function
    // and receives the filtered dataset to calculate the average
    // meaning it will update on every change in any dropdown giving you 
    // the average for any combination of selected filters
    // and eliminating the need to do the costly filtering process again
    function updateAverageScore(data) {

        const avgScoreChange = d3.mean(data, d => d.score_change);
        console.log(avgScoreChange);

        // if the avgScoreChange is 0 you still want to display it
        // `if (avgScoreChange)` resolves to false if the value is 0
        if (typeof avgScoreChange === "number") {
            d3.select("#avg-score").text(avgScoreChange.toFixed(2));
            d3.select("#result").style("display", "block");
        } else {
            d3.select("#avg-score").text("No data");
        }
    }

    function clearSelections(data) {
        d3.select("#age-group").property("value", "");
        d3.select("#location").property("value", "");
        d3.select("#ethnicity").property("value", "");
        d3.select("#gender").property("value", "");

        // repopulate the dropdowns with all the options
        cascadeDropdowns(data);

        // replotting the dots will have the addon effect of removing the highlight
        plotBeeswarm(data);

        // updating the average score here will return it to 
        // the overall average for the entire dataset
        updateAverageScore(data);
    }

    function plotBeeswarm(data) {
        // the plot function can use the d3 join method to update the dots every time
        // the dropdowns change, and use the global variable filteredData to conditionally
        // apply the highlighted stroke
        svg.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 5)
            .attr("fill", "#513399")
            .attr("opacity", 0.7)
            .attr("stroke", d => filteredData.includes(d.index) ? "#beff00" : null)
            .attr("stroke-width", d => filteredData.includes(d.index) ? 1 : 0)
            .append("title")
            // the hover text should display everything about the data point, except the age group
            // which is pretty evident based on the categorical layout of the x axis
            .text(d => `Location: ${d.location}\nEthnicity: ${d.ethnicity}\nGender: ${d.gender}\nScore Change: ${d.score_change}`);
    }
});
