d3.csv("data.csv").then(function(data) {
    // Debug: Check if the data is loaded properly
    console.log(data);

    // Rest of your existing code
    data.forEach(d => d.score_change = +d.score_change); // Convert score_change to numeric

    const ageGroups = [...new Set(data.map(d => d.age_group))];
    const locations = [...new Set(data.map(d => d.location))];
    const ethnicities = [...new Set(data.map(d => d.ethnicity))];
    const genders = [...new Set(data.map(d => d.gender))];

    // Debug: Check the unique values
    console.log("Age Groups:", ageGroups);
    console.log("Locations:", locations);
    console.log("Ethnicities:", ethnicities);
    console.log("Genders:", genders);

    // Initialize dropdowns
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

        d3.select("#avg-score").text(avgScoreChange ? avgScoreChange.toFixed(2) : "No data");
    }

    d3.selectAll("select").on("change", updateAverageScore);

    updateAverageScore();
});
