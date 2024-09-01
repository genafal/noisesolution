console.log("Script is running");

document.addEventListener("DOMContentLoaded", function () {

    console.log("DOM fully loaded and parsed");

    d3.csv("data.csv").then(function (data) {
        console.log("Loaded Data:", data); // Check if data is loaded correctly

        // Run visualization after defining it
        scatterPlotVisualization(data);
    });

    // Define custom orders for each axis category
    const orders = {
        "age_group": ["Age 4-9", "Age 10-12", "Age 13-15", "Age 16-19", "Age 20-24", "Age 25+", "Unknown"],
        "location": ["Bath", "Bournemouth", "Cambridge", "Chelmsford", "Colchester", "Ipswich", "Milton Keynes", "Lincoln", "London", "Norwich", "Peterborough", "Romford", "St. Albans", "Salisbury", "Stevenage"],
        "ethnicity": ["Asian", "Black", "White", "Mixed", "Declined to say", "Unknown"],
        "gender": ["Female", "Male", "Other", "Declined to say", "Unknown"],
        "participant_industry": ["Education", "Local Government", "Mental Health", "Other", "Unknown"],
        "has_external_interaction": ["Yes", "No"]
    };

    // Add the tooltip selection
    const tooltip = d3.select("#tooltip");

    // Function for the average score visualization
    
    function averageScoreVisualization(data) {
        // Extract unique values for dropdowns
        const ageGroups = [...new Set(data.map(d => d.age_group))];
        const locations = [...new Set(data.map(d => d.location))];
        const ethnicities = [...new Set(data.map(d => d.ethnicity))];
        const genders = [...new Set(data.map(d => d.gender))];

        // Log the unique values for debugging
        console.log("Age Groups:", ageGroups);
        console.log("Locations:", locations);
        console.log("Ethnicities:", ethnicities);
        console.log("Genders:", genders);

        // Populate the dropdown options for age-group, location, ethnicity, and gender
        d3.select("#age-group")
            .selectAll("option")
            .data(ageGroups)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        d3.select("#location")
            .selectAll("option")
            .data(locations)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        d3.select("#ethnicity")
            .selectAll("option")
            .data(ethnicities)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        d3.select("#gender")
            .selectAll("option")
            .data(genders)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        function updateAverageScore() {
            const selectedAgeGroup = d3.select("#age-group").property("value");
            const selectedLocation = d3.select("#location").property("value");
            const selectedEthnicity = d3.select("#ethnicity").property("value");
            const selectedGender = d3.select("#gender").property("value");

            // Log selected filter values
            console.log("Selected Age Group:", selectedAgeGroup);
            console.log("Selected Location:", selectedLocation);
            console.log("Selected Ethnicity:", selectedEthnicity);
            console.log("Selected Gender:", selectedGender);

            const filteredData = data.filter(d =>
                d.age_group === selectedAgeGroup &&
                d.location === selectedLocation &&
                d.ethnicity === selectedEthnicity &&
                d.gender === selectedGender
            );

            // Log filtered data for debugging
            console.log("Filtered Data:", filteredData);

            const avgScoreChange = d3.mean(filteredData, d => d.score_change);
            d3.select("#avg-score").text(avgScoreChange ? avgScoreChange.toFixed(2) : "No data");
        }

        d3.selectAll("select").on("change", updateAverageScore);

        updateAverageScore();
    } 

    // Function for the scatter plot visualization
    function scatterPlotVisualization(data) {
        const xAxisDropdown = d3.select("#x-axis").node();
        const yAxisDropdown = d3.select("#y-axis").node();

        if (!xAxisDropdown) {
            console.error("The #x-axis dropdown is not found.");
        } else {
            console.log("X-Axis Dropdown Element:", xAxisDropdown);
        }

        if (!yAxisDropdown) {
            console.error("The #y-axis dropdown is not found.");
        } else {
            console.log("Y-Axis Dropdown Element:", yAxisDropdown);
        }


        // Set up dimensions and SVG container
        const svg = d3.select("svg"),
              margin = { top: 20, right: 30, bottom: 40, left: 150 },
              width = svg.attr("width") - margin.left - margin.right,
              height = svg.attr("height") - margin.top - margin.bottom,
              g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // Log the dropdown elements to check if they exist
        console.log("X-Axis Dropdown:", d3.select("#x-axis").node());
        console.log("Y-Axis Dropdown:", d3.select("#y-axis").node());

        // Append axis groups within this function
        g.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
        g.append("g").attr("class", "y-axis");

        // Create dropdown options for scatter plot axes
        // const categoricalColumns = ["age_group", "gender", "ethnicity", "location", "participant_industry", "has_external_interaction"];
        const categoricalColumns = [
            ["Age Group", "age_group"], 
            ["Gender", "gender"], 
            ["Ethnicity", "ethnicity"], 
            ["Location", "location"], 
            ["Participant Industry", "participant_industry"], 
            ["Has External Interaction", "has_external_interaction"]
        ];


        categoricalColumns.forEach((col, index) => {
            console.log("Adding option to dropdowns:", col); // Log each column as it is added
            //d3.select("#x-axis").append("option").text(col).attr("value", col).property("selected", index === 0);
            //d3.select("#y-axis").append("option").text(col).attr("value", col).property("selected", index === 1);
            d3.select("#x-axis").append("option").text(col[0]).attr("value", col[1]).property("selected", index === 0);
            d3.select("#y-axis").append("option").text(col[0]).attr("value", col[1]).property("selected", index === 1);
        });

        let xAxisCategory = d3.select("#x-axis").property("value");
        let yAxisCategory = d3.select("#y-axis").property("value");

        // Set up scales

        //let xScale = d3.scaleBand().range([0, width]).padding(0.1);
        //let yScale = d3.scaleBand().range([height, 0]).padding(0.1);

        // force as much space as possible between the bands to minimize cluster overlap
        let xScale = d3.scaleBand().range([0, width]).paddingInner(0.3).padding(0.05);
        let yScale = d3.scaleBand().range([height, 0]).paddingInner(0.3).padding(0.05);
        const colorScale = d3.scaleOrdinal()
            .domain(["Positive", "No change", "Negative"])
            .range(["#beff00", "#4F9DE0", "#6C44CC"]);

            //.range(["#beff00", "#0c79d5", "#8755ff"]);
        //const sizeScale = d3.scaleLinear().range([2, 10]); // Scale for circle sizes
        const sizeScale = d3.scaleLinear().range([4, 12]); // Scale for circle sizes

        // Add a color legend based on the change_reported column
        const legendData = colorScale.domain(); // ["Positive", "No change", "Negative"]
        const legend = d3.select("#legend")
            .append("svg")
            .attr("width", "100%")
            .attr("height", 50) // Adjust height based on the number of legend items
            .selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(${i * 120}, 0)`);

        legend.append("circle")
            .attr("cx", 9) // Adjust the x position for the circle's center
            .attr("cy", 19) // Adjust the y position for the circle's center
            .attr("r", 9) // Set the radius of the circle
            .attr("fill", d => colorScale(d));

        legend.append("text")
            .attr("x", 25)
            .attr("y", 20)
            .attr("dy", ".35em")
            .text(d => d)
            .style("fill", "white"); // Adjust the text color as needed

        function updateScatterPlot() {
            xAxisCategory = d3.select("#x-axis").property("value");
            yAxisCategory = d3.select("#y-axis").property("value");
        
            // Apply custom order for x-axis and y-axis
            xScale.domain(orders[xAxisCategory]);
            //yScale.domain(orders[yAxisCategory]);
            yScale.domain(orders[yAxisCategory].reverse()); // reverse if you want your prescribed order to read top to bottom
            sizeScale.domain([0, d3.max(data, d => d.size_of_change)]);

            // Initialize the force simulation
            const simulation = d3.forceSimulation(data)
            .force("x", d3.forceX(d => xScale(d[xAxisCategory]) + xScale.bandwidth() / 2).strength(1))
            .force("y", d3.forceY(d => yScale(d[yAxisCategory]) + yScale.bandwidth() / 2).strength(1))
            .force("collide", d3.forceCollide(d => sizeScale(d.size_of_change) + 1)) // Fine-tune the collision radius
            .stop();

            // Run the simulation for a fixed number of iterations to ensure stability
            for (let i = 0; i < 300; i++) simulation.tick();

            // Bind data to circles
            /*const circles = g.selectAll("circle").data(data);
        
            circles.enter().append("circle")
                .merge(circles)
                */
            g.selectAll("circle")
                .data(data)
                .join("circle")    
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", d => {
                    const radius = sizeScale(d.size_of_change);
                    return radius === 0 ? 2 : radius; // Ensure a minimum radius of 2 for size_of_change = 0
                })
                .attr("fill", d => colorScale(d.change_reported))
                .attr("stroke", "#333")
                .attr("opacity", 0.9)
                .on("mouseover", function(event, d) {
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`
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
                    tooltip.style("left", (event.pageX + 5) + "px")
                           .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition().duration(500).style("opacity", 0);
                });
            // the enter/append/merge/exit methodology is old d3
            // using join is the current preferred method
            //circles.exit().remove();
        
            // Update the axis groups after creation
            if (g.select(".x-axis").node()) {
                g.select(".x-axis").call(d3.axisBottom(xScale)).attr("transform", `translate(0,${height})`);
                // use very faint gridlines to help the eye connect the intersecting categories for each group
                g.selectAll(".x-axis .tick line").attr("y2", -height).style("opacity", .5).style("stroke-width", .5);
            }
        
            if (g.select(".y-axis").node()) {
                g.select(".y-axis").call(d3.axisLeft(yScale));
                g.selectAll(".y-axis .tick line").attr("x2", width).style("opacity", .5).style("stroke-width", .5);
            }

            // remove the domain lines for both axes
            g.selectAll("path.domain").remove();    
        }
        

        // Initial render of the scatter plot
        updateScatterPlot();

        // Update plot when x-axis or y-axis changes
        d3.select("#x-axis").on("change", function () {
            xAxisCategory = this.value;
            updateScatterPlot();
        });

        d3.select("#y-axis").on("change", function () {
            yAxisCategory = this.value;
            updateScatterPlot();
        });
    }


});
