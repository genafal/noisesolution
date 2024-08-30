console.log("Script is running");

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");

    // Combined orders object
    const orders = {
        "age_group": ["Age 4-9", "Age 10-12", "Age 13-15", "Age 16-19", "Age 20-24", "Age 25+", "Unknown"],
        "location": ["St. Albans", "Bath", "Cambridge", "Chelmsford", "Colchester", "Ipswich", "Milton Keynes", "London", "Norwich", "Peterborough", "Romford", "Stevenage"],
        "ethnicity": ["Asian", "Black", "White", "Mixed", "Declined to say", "Unknown"],
        "gender": ["Female", "Male", "Other", "Unknown"]
    };

    // Load the CSV data and create visualizations
    d3.csv("data.csv").then(function (data) {
        console.log("Loaded Data:", data);

        averageScoreVisualization(data);
        plotBeeswarm(data);

        // Event listeners for dropdowns and buttons
        d3.select("#age-group").on("change", () => cascadeDropdowns(data));
        d3.select("#location").on("change", () => cascadeDropdowns(data));
        d3.select("#ethnicity").on("change", () => cascadeDropdowns(data));
        d3.select("#gender").on("change", () => updateAverageScore(data));
        d3.select("#clear-button").on("click", function () {
            clearSelections();
            clearHighlight();
            hideResult();
        });

        cascadeDropdowns(data);
        updateAverageScore(data);
    });

    function averageScoreVisualization(data) {
        const ageGroups = [...new Set(data.map(d => d.age_group))]
            .sort((a, b) => orders.age_group.indexOf(a) - orders.age_group.indexOf(b));
        updateDropdown("#age-group", ageGroups, "");

        cascadeDropdowns(data);
    }

    function cascadeDropdowns(data) {
        const selectedAgeGroup = d3.select("#age-group").property("value");
        const selectedLocation = d3.select("#location").property("value");
        const selectedEthnicity = d3.select("#ethnicity").property("value");

        let filteredData = data;

        if (selectedAgeGroup) {
            filteredData = filteredData.filter(d => d.age_group === selectedAgeGroup);
        }

        const locations = [...new Set(filteredData.map(d => d.location))]
            .sort((a, b) => orders.location.indexOf(a) - orders.location.indexOf(b));
        updateDropdown("#location", locations, selectedLocation);

        if (selectedLocation) {
            filteredData = filteredData.filter(d => d.location === selectedLocation);
        }

        const ethnicities = [...new Set(filteredData.map(d => d.ethnicity))]
            .sort((a, b) => orders.ethnicity.indexOf(a) - orders.ethnicity.indexOf(b));
        updateDropdown("#ethnicity", ethnicities, selectedEthnicity);

        if (selectedEthnicity) {
            filteredData = filteredData.filter(d => d.ethnicity === selectedEthnicity);
        }

        const genders = [...new Set(filteredData.map(d => d.gender))]
            .sort((a, b) => orders.gender.indexOf(a) - orders.gender.indexOf(b));
        updateDropdown("#gender", genders, "");

        console.log("Populating Gender Dropdown:", genders);
    }

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

    function updateAverageScore(data) {
        const selectedAgeGroup = d3.select("#age-group").property("value");
        const selectedLocation = d3.select("#location").property("value");
        const selectedEthnicity = d3.select("#ethnicity").property("value");
        const selectedGender = d3.select("#gender").property("value");

        const filteredData = data.filter(d =>
            d.age_group === selectedAgeGroup &&
            d.location === selectedLocation &&
            d.ethnicity === selectedEthnicity &&
            d.gender === selectedGender
        );

        /*
        const avgScoreChange = d3.mean(filteredData, d => d.score_change);
        if (avgScoreChange) {
            d3.select("#avg-score").text(avgScoreChange.toFixed(2));
            d3.select("#result").style("display", "block");
        } else {
            d3.select("#avg-score").text("No data");
        }

        if (filteredData.length > 0) {
            highlightPointInBeeswarm(filteredData[0]);
        }
        */

        const avgScoreChange = d3.mean(filteredData, d => d.score_change);
        if (avgScoreChange !== null && !isNaN(avgScoreChange)) {
            d3.select("#avg-score").text(avgScoreChange.toFixed(2));
            d3.select("#result").style("display", "block");  // Show the result line
    
            // Highlight the calculated point
            highlightPointInBeeswarm({
                age_group: selectedAgeGroup,
                score_change: avgScoreChange
            });
        } else {
            d3.select("#avg-score").text("No data");
            d3.select("#result").style("display", "none");  // Hide the result line
            clearHighlight();  // Remove any previous star highlight
        }
    }

    function clearSelections() {
        d3.select("#age-group").property("value", "");
        d3.select("#location").property("value", "");
        d3.select("#ethnicity").property("value", "");
        d3.select("#gender").property("value", "");
        d3.select("#avg-score").text("No data");
    }

    function clearHighlight() {
        d3.select("#star-highlight").remove();
    }

    function hideResult() {
        d3.select("#result").style("display", "none");
    }
    
    // Assuming you have margins defined somewhere in your code
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    function highlightPointInBeeswarm(matchingPoint) {
        // Clear any existing highlights first
        clearHighlight();

        // Calculate the position based on scales
        const xPos = xScale(matchingPoint.age_group) + margin.left;
        const yPos = yScale(matchingPoint.score_change) + margin.top;

        
        /*
        const xPos = xScale(matchingPoint.age_group);
        const yPos = yScale(matchingPoint.score_change);
        */

        // Adjust the translation based on the scales
        const starPath = "M 0,-10 L 3,-3 L 10,-3 L 4,2 L 6,9 L 0,5 L -6,9 L -4,2 L -10,-3 L -3,-3 Z";

        d3.select("#beeswarm-chart-container svg")
        .append("path")
        .attr("id", "star-highlight")
        .attr("d", starPath)
        .attr("transform", `translate(${xPos},${yPos}) scale(1.2)`)
        .attr("fill", "#beff00")
        .attr("stroke", "none");
    }


    function plotBeeswarm(data) {
        const margin = { top: 20, right: 30, bottom: 50, left: 50 },
              width = 1000 - margin.left - margin.right,
              height = 600 - margin.top - margin.bottom;

        const svg = d3.select("#beeswarm-chart-container svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        xScale = d3.scalePoint()
            .domain(orders.age_group)
            .range([0, width])
            .padding(0.5);

        yScale = d3.scaleLinear()
            .domain([d3.min(data, d => +d.score_change), d3.max(data, d => +d.score_change)])
            .nice()
            .range([height, 0]);
        
            /*
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .call(d3.axisLeft(yScale));
            */

        // Append and style X-Axis
        svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

        svg.selectAll(".x-axis line, .x-axis path")
            .attr("stroke", "#888");  // Set dark grey for axis lines

        svg.selectAll(".x-axis text")
            .attr("fill", "#888")      // Set dark grey for axis labels
            .style("font-size", "14px");  // Increase font size

        // Append and style Y-Axis
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));

        svg.selectAll(".y-axis line, .y-axis path")
            .attr("stroke", "#888");  // Set dark grey for axis lines

        svg.selectAll(".y-axis text")
            .attr("fill", "#888")      // Set dark grey for axis labels
            .style("font-size", "14px");  // Increase font size   

        const simulation = d3.forceSimulation(data)
            .force("x", d3.forceX(d => xScale(d.age_group)).strength(0.1))
            .force("y", d3.forceY(d => yScale(+d.score_change)).strength(0.8))
            .force("collide", d3.forceCollide(5))
            .stop();

        for (let i = 0; i < 300; i++) simulation.tick();

        svg.append("g")
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 5)
            .attr("fill", "#513399")
            .attr("opacity", 0.7)
            .append("title")
            .text(d => `Age Group: ${d.age_group}\nAverage Score Change: ${d.score_change}`);
    }

    function createChoroplethMap() {
        Promise.all([
            d3.json("uk_outcode_regions.geojson"),
            d3.csv("data_for_map.csv")
        ]).then(function([geojsonData, csvData]) {

            const aggregatedData = d3.rollups(
                csvData,
                v => ({
                    average_score_change: d3.mean(v, d => +d.score_change),
                    count: v.length,
                    area: v[0].area,
                    region: v[0].region,
                    average_age: d3.mean(v, d => +d.start_age)
                }),
                d => d.outcode_alpha.trim().toUpperCase()
            );

            const dataMap = new Map(aggregatedData);

            geojsonData.features.forEach(feature => {
                const outcode_alpha = feature.properties.outcode_alpha ? feature.properties.outcode_alpha.trim().toUpperCase() : null;
                if (outcode_alpha) {
                    const data = dataMap.get(outcode_alpha) || { average_score_change: 0, count: 0 };
                    feature.properties.average_score_change = data.average_score_change;
                    feature.properties.count = data.count;
                    feature.properties.area = data.area;
                    feature.properties.region = data.region;
                    feature.properties.average_age = data.average_age;
                } else {
                    console.warn(`Missing or undefined 'outcode_alpha' property in feature:`, feature);
                }
            });

            const width = 1200;
            const height = 1200;

            const svg = d3.select("#map-container") // Changed to #map-container to avoid conflicts
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            const minScore = d3.min(geojsonData.features, d => d.properties.average_score_change);
            const maxScore = d3.max(geojsonData.features, d => d.properties.average_score_change);

            const colorScale = d3.scaleDiverging()
                .domain([minScore, 0, maxScore])
                .interpolator(d3.interpolateRgbBasis(["#8755FF", "#E1E1E1", "#beff00"]));

            const projection = d3.geoMercator()
                .fitExtent([[50, 50], [width - 50, height - 50]], {
                    type: "FeatureCollection",
                    features: geojsonData.features
                });

            const path = d3.geoPath().projection(projection);

            const tooltip = d3.select("#map-tooltip"); // Changed to #map-tooltip to avoid conflicts

            svg.selectAll("path")
                .data(geojsonData.features)
                .enter().append("path")
                .attr("d", path)
                .attr("fill", d => {
                    if (d.properties.count === 0) {
                        return "#333333";
                    } else if (d.properties.count > 0 && d.properties.average_score_change === 0) {
                        return "#E1E1E1";
                    } else {
                        return colorScale(d.properties.average_score_change);
                    }
                })
                .attr("stroke", "#000")
                .attr("stroke-width", "1.0px")
                .on("mouseover", function(event, d) {
                    if (d.properties.count > 0) {
                        tooltip.style("opacity", 1);
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
                    tooltip.style("opacity", 0);
                });

        }).catch(function(error) {
            console.error("Error loading the files: ", error);
        });
    }

    // Initialize the map after DOM is loaded
    createChoroplethMap();

       // Scatter Plot Visualization for Participant Demographics
       function scatterPlotVisualization(data) {
        const svg = d3.select("#chart-container svg"),
              margin = { top: 20, right: 30, bottom: 40, left: 150 },
              width = svg.attr("width") - margin.left - margin.right,
              height = svg.attr("height") - margin.top - margin.bottom,
              g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand().range([0, width]).padding(0.1);
        const yScale = d3.scaleBand().range([height, 0]).padding(0.1);
        const colorScale = d3.scaleOrdinal()
            .domain(["Positive", "No change", "Negative"])
            .range(["#beff00", "#4F9DE0", "#6C44CC"]);
        const sizeScale = d3.scaleLinear().range([2, 10]);

        // Add a color legend based on the change_reported column
        const legendData = colorScale.domain();
        const legend = d3.select("#legend")
            .append("svg")
            .attr("width", "100%")
            .attr("height", 50)
            .selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(${i * 120}, 0)`);

        legend.append("circle")
            .attr("cx", 9)
            .attr("cy", 19)
            .attr("r", 9)
            .attr("fill", d => colorScale(d));

        legend.append("text")
            .attr("x", 25)
            .attr("y", 20)
            .attr("dy", ".35em")
            .text(d => d)
            .style("fill", "white");

        function updateScatterPlot() {
            const xAxisCategory = d3.select("#x-axis").property("value");
            const yAxisCategory = d3.select("#y-axis").property("value");

            xScale.domain(orders[xAxisCategory]);
            yScale.domain(orders[yAxisCategory]);
            sizeScale.domain([0, d3.max(data, d => d.size_of_change)]);

            const simulation = d3.forceSimulation(data)
            .force("x", d3.forceX(d => xScale(d[xAxisCategory]) + xScale.bandwidth() / 2).strength(1))
            .force("y", d3.forceY(d => yScale(d[yAxisCategory]) + yScale.bandwidth() / 2).strength(1))
            .force("collide", d3.forceCollide(d => sizeScale(d.size_of_change) + 1))
            .stop();

            for (let i = 0; i < 300; i++) simulation.tick();

            const circles = g.selectAll("circle").data(data);
        
            circles.enter().append("circle")
                .merge(circles)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", d => {
                    const radius = sizeScale(d.size_of_change);
                    return radius === 0 ? 2 : radius;
                })
                .attr("fill", d => colorScale(d.change_reported))
                .attr("stroke", "#333")
                .attr("opacity", 0.9)
                .on("mouseover", function(event, d) {
                    beeswarmTooltip.transition().duration(200).style("opacity", 0.7);
                    beeswarmTooltip.html(`
                    <strong>Size of Change:</strong> ${d.size_of_change}<br>
                    <strong>Age Group:</strong> ${d.age_group}<br>
                    <strong>Gender:</strong> ${d.gender}<br>
                    <strong>Location:</strong> ${d.location}<br>
                    <strong>Ethnicity:</strong> ${d.ethnicity}<br>
                    <strong>Industry:</strong> ${d.participant_industry}<br>
                    <strong>External Interaction:</strong> ${d.has_external_interaction}
                    `)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
                })
                .on("mousemove", function(event) {
                    beeswarmTooltip.style("left", (event.pageX + 5) + "px")
                           .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    beeswarmTooltip.transition().duration(500).style("opacity", 0);
                });

            circles.exit().remove();
        
            g.select(".x-axis").call(d3.axisBottom(xScale)).attr("transform", `translate(0,${height})`);
            g.select(".y-axis").call(d3.axisLeft(yScale));
        }

        updateScatterPlot();

        d3.select("#x-axis").on("change", updateScatterPlot);
        d3.select("#y-axis").on("change", updateScatterPlot);
    }
});
