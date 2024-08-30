document.addEventListener("DOMContentLoaded", function () {
    // Declare scales in the global scope
    let xScale, yScale;

    // Load data and initialize all three visualizations
    d3.csv("data.csv").then(function (data) {
        console.log("Loaded Data:", data); // Confirm data loading
        averageScoreVisualization(data);   // Initialize Average Score Change visualization
        plotBeeswarm(data);                // Initialize Beeswarm Plot
        scatterPlotVisualization(data);    // Initialize Scatter Plot for Participant Demographics
    });

    // Custom orders for dropdowns
    const orders = {
        "age_group": ["Age 4-9", "Age 10-12", "Age 13-15", "Age 16-19", "Age 20-24", "Age 25+", "Unknown"],
        "location": ["St. Albans", "Bath", "Cambridge", "Chelmsford", "Colchester", "Ipswich", "Milton Keynes", "London", "Norwich", "Peterborough", "Romford", "Stevenage"],
        "ethnicity": ["Asian", "Black", "White", "Mixed", "Declined to say", "Unknown"],
        "gender": ["Female", "Male", "Other", "Unknown"],
        "participant_industry": ["Education", "Local Government", "Mental Health", "Other", "Unknown"],
        "has_external_interaction": ["Yes", "No"]
    };

    // Tooltips
    const mapTooltip = d3.select("#map-tooltip");
    const beeswarmTooltip = d3.select("#beeswarm-tooltip");

    // Clear Button Event Listener
    d3.select("#clear-button").on("click", function () {
        clearSelections();
        clearHighlight();
        hideResult();
    });

    // Function for the average score visualization
    function averageScoreVisualization(data) {
        const ageGroups = [...new Set(data.map(d => d.age_group))];
        const locations = [...new Set(data.map(d => d.location))];
        const ethnicities = [...new Set(data.map(d => d.ethnicity))];
        const genders = [...new Set(data.map(d => d.gender))];

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

            const filteredData = data.filter(d =>
                d.age_group === selectedAgeGroup &&
                d.location === selectedLocation &&
                d.ethnicity === selectedEthnicity &&
                d.gender === selectedGender
            );

            const avgScoreChange = d3.mean(filteredData, d => d.score_change);
            if (avgScoreChange !== null && !isNaN(avgScoreChange)) {
                d3.select("#avg-score").text(avgScoreChange.toFixed(2));
                d3.select("#result").style("display", "block");
                highlightPointInBeeswarm({
                    age_group: selectedAgeGroup,
                    score_change: avgScoreChange
                });
            } else {
                d3.select("#avg-score").text("No data");
                d3.select("#result").style("display", "none");
                clearHighlight();
            }
        }

        d3.selectAll("select").on("change", updateAverageScore);

        updateAverageScore();
    }

    // Function to populate dropdowns
    function updateDropdown(selector, options) {
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
    }

    // Function to plot Beeswarm
    function plotBeeswarm(data) {
        const margin = { top: 20, right: 30, bottom: 50, left: 50 },
              width = 1000 - margin.left - margin.right,
              height = 600 - margin.top - margin.bottom;

        const svg = d3.select("#beeswarm-chart-container svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scalePoint()
            .domain(orders.age_group)
            .range([0, width])
            .padding(0.5);

        const yScale = d3.scaleLinear()
            .domain([d3.min(data, d => +d.score_change), d3.max(data, d => +d.score_change)])
            .nice()
            .range([height, 0]);

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));

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

    // Function to highlight a point in the beeswarm
    function highlightPointInBeeswarm(matchingPoint) {
        clearHighlight();

        const xPos = xScale(matchingPoint.age_group);
        const yPos = yScale(matchingPoint.score_change);

        const starPath = "M 0,-10 L 3,-3 L 10,-3 L 4,2 L 6,9 L 0,5 L -6,9 L -4,2 L -10,-3 L -3,-3 Z";

        d3.select("#beeswarm-chart-container svg")
            .append("path")
            .attr("id", "star-highlight")
            .attr("d", starPath)
            .attr("transform", `translate(${xPos},${yPos}) scale(1.2)`)
            .attr("fill", "#beff00")
            .attr("stroke", "none");
    }

    // Function to clear selections in the dropdowns
    function clearSelections() {
        d3.select("#age-group").property("value", "");
        d3.select("#location").property("value", "");
        d3.select("#ethnicity").property("value", "");
        d3.select("#gender").property("value", "");
        hideResult();
    }

    // Function to hide the result
    function hideResult() {
        d3.select("#result").style("display", "none");
    }

    // Function to clear the highlight in the beeswarm
    function clearHighlight() {
        d3.select("#star-highlight").remove();
    }

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
