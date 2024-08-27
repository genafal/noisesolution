console.log("Script is running");

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");

    const orders = {
        "age_group": ["Age 4-9", "Age 10-12", "Age 13-15", "Age 16-19", "Age 20-24", "Age 25+", "Unknown"],
        "location": ["St. Albans", "Bath", "Cambridge", "Chelmsford", "Colchester", "Ipswich", "Milton Keynes", "London", "Norwich", "Peterborough", "Romford", "Stevenage"],
        "ethnicity": ["Asian", "Black", "White", "Mixed", "Declined to say", "Unknown"],
        "gender": ["Female", "Male", "Other", "Unknown"]
    };

    // Define scales globally
    let xScale, yScale;

    d3.csv("data.csv").then(function (data) {
        console.log("Loaded Data:", data);

        averageScoreVisualization(data);
        plotBeeswarm(data);

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

    function highlightPointInBeeswarm(matchingPoint) {
        clearHighlight(); // Remove any existing highlights

        // Use the global xScale and yScale to position the star
        const xPos = xScale(matchingPoint.age_group);
        const yPos = yScale(matchingPoint.score_change);

        const starPath = "M 0,-10 L 3,-3 L 10,-3 L 4,2 L 6,9 L 0,5 L -6,9 L -4,2 L -10,-3 L -3,-3 Z";

        d3.select("#beeswarm-chart-container svg")
        .append("path")
        .attr("id", "star-highlight")
        .attr("d", starPath)
        .attr("transform", `translate(${xPos + 50},${yPos + 5}) scale(1.2)`) // Adjust for centering and size
        .attr("fill", "#beff00")
        .attr("stroke", "none")
        //.attr("opacity", 0.7); // Add transparency
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

        // Define the scales globally so they can be used in other functions
        xScale = d3.scalePoint()
            .domain(orders.age_group)
            .range([0, width])
            .padding(0.5);

        yScale = d3.scaleLinear()
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
});
