console.log("Script is running");
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");
    d3.csv("data.csv").then(function (data) {
        console.log("Loaded Data:", data); // Check if data is loaded correctly

        // Run visualization after defining it
        averageScoreVisualization(data); 

        // Calculate and display the highest average score change
        calculateHighestAverageScoreChange(data);

        // Calculate and display the lowest average score change
        calculateLowestAverageScoreChange(data);

        // Group data by age group for the beeswarm plot
        plotBeeswarm(data);

    });

    // Define custom orders for each axis category
    const orders = {
        "age_group": ["Age 4-9", "Age 10-12", "Age 13-15", "Age 16-19", "Age 20-24", "Age 25+", "Unknown"],
        "location": ["St. Albans", "Bath", "Cambridge", "Chelmsford", "Colchester", "Ipswich", "Milton Keynes", "London", "Norwich", "Peterborough", "Romford", "Stevenage"],
        "ethnicity": ["Asian", "Black", "White", "Mixed", "Declined to say", "Unknown"],
        "gender": ["Female", "Male", "Other", "Unknown"],
        "participant_industry": ["Education", "Local Government", "Mental Health", "Other", "Unknown"],
        "has_external_interaction": ["Yes", "No"]
    };

    // Add the tooltip selection
    const tooltip = d3.select("#tooltip");

    // Function for the average score visualization
    function averageScoreVisualization(data) {

        // Extract unique values for dropdowns
        const ageGroups = [...new Set(data.map(d => d.age_group))].sort((a, b) => orders.age_group.indexOf(a) - orders.age_group.indexOf(b));
        const locations = [...new Set(data.map(d => d.location))].sort((a, b) => orders.location.indexOf(a) - orders.location.indexOf(b));
        const ethnicities = [...new Set(data.map(d => d.ethnicity))].sort((a, b) => orders.ethnicity.indexOf(a) - orders.ethnicity.indexOf(b));
        const genders = [...new Set(data.map(d => d.gender))].sort((a, b) => orders.gender.indexOf(a) - orders.gender.indexOf(b));

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

        // Set default values for dropdowns
        d3.select("#age-group").property("value", "Age 13-15");
        d3.select("#location").property("value", "Ipswich");
        d3.select("#ethnicity").property("value", "White");
        d3.select("#gender").property("value", "Male");

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

    // Function to calculate and display the highest average score change
    function calculateHighestAverageScoreChange(data) {
        // Group data by all four factors
        const groupedData = d3.group(data, d => d.age_group, d => d.location, d => d.ethnicity, d => d.gender);

        let highestAvgScore = -Infinity;
        let bestCombination = {};

        // Calculate average score change for each group
        groupedData.forEach((locationGroup, ageGroup) => {
            locationGroup.forEach((ethnicityGroup, location) => {
                ethnicityGroup.forEach((genderGroup, ethnicity) => {
                    genderGroup.forEach((dataPoints, gender) => {
                        const avgScore = d3.mean(dataPoints, d => d.score_change);
                        if (avgScore > highestAvgScore) {
                            highestAvgScore = avgScore;
                            bestCombination = { ageGroup, location, ethnicity, gender };
                        }
                    });
                });
            });
        });

        // Display the highest average score change and the combination that produced it
        // Display the highest average score change in a sentence
    d3.select("#highest-avg-score").html(`
    <p>The highest average score change, <strong>${highestAvgScore.toFixed(2)}</strong>, is observed for ${bestCombination.gender}s, ${bestCombination.ageGroup}, from ${bestCombination.location} (Ethnicity ${bestCombination.ethnicity}).</p>
    
        `);
    }

    // Function to calculate and display the lowest average score change
    function calculateLowestAverageScoreChange(data) {
        // Group data by all four factors
        const groupedData = d3.group(data, d => d.age_group, d => d.location, d => d.ethnicity, d => d.gender);

        let lowestAvgScore = Infinity;
        let worstCombination = {};

        // Calculate average score change for each group
        groupedData.forEach((locationGroup, ageGroup) => {
            locationGroup.forEach((ethnicityGroup, location) => {
                ethnicityGroup.forEach((genderGroup, ethnicity) => {
                    genderGroup.forEach((dataPoints, gender) => {
                        const avgScore = d3.mean(dataPoints, d => d.score_change);
                        if (avgScore < lowestAvgScore) {
                            lowestAvgScore = avgScore;
                            worstCombination = { ageGroup, location, ethnicity, gender };
                        }
                    });
                });
            });
        });

        // Display the lowest average score change in a sentence
        d3.select("#lowest-avg-score").html(`
            <p>The lowest average score change, <strong>${lowestAvgScore.toFixed(2)}</strong>, is observed for ${worstCombination.ageGroup} year-old young people from ${worstCombination.location}. (Ethnicity - ${worstCombination.ethnicity}, Gender - ${worstCombination.gender}).</p>
        `);
    }

    function plotBeeswarm(data) {
        // Define orders for age groups
        const ageGroupOrder = ["Age 4-9", "Age 10-12", "Age 13-15", "Age 16-19", "Age 20-24", "Age 25+", "Unknown"];

        // Set up SVG dimensions
        const margin = { top: 20, right: 30, bottom: 50, left: 50 },
              width = 1000 - margin.left - margin.right,
              height = 600 - margin.top - margin.bottom;

        const svg = d3.select("#beeswarm-chart-container svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Set up scales
        const xScale = d3.scalePoint()
            .domain(ageGroupOrder)
            .range([0, width])
            .padding(0.5);

        const yScale = d3.scaleLinear()
            .domain([d3.min(data, d => +d.score_change), d3.max(data, d => +d.score_change)])
            .nice()
            .range([height, 0]);

        // Set up axis
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        // Add the beeswarm points
        const simulation = d3.forceSimulation(data)
            .force("x", d3.forceX(d => xScale(d.age_group)).strength(1))
            .force("y", d3.forceY(d => yScale(+d.score_change)))
            .force("collide", d3.forceCollide(5)) // Adjust the radius to avoid overlaps
            .stop();

        for (let i = 0; i < 300; i++) simulation.tick(); // Run the simulation

        svg.append("g")
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 5)
            .attr("fill", "steelblue")
            .attr("opacity", 0.7)
            .append("title")
            .text(d => `Age Group: ${d.age_group}\nScore Change: ${d.score_change}`);
    }
    
});


