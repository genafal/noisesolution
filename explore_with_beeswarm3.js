console.log("Script is running");

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");

    // this is a nice solution! :D 
    const orders = {
        "age_group": ["Age 4-9", "Age 10-12", "Age 13-15", "Age 16-19", "Age 20-24", "Age 25+", "Unknown"],
        "location": ["St. Albans", "Bath", "Cambridge", "Chelmsford", "Colchester", "Ipswich", "Milton Keynes", "London", "Norwich", "Peterborough", "Romford", "Stevenage"],
        "ethnicity": ["Asian", "Black", "White", "Mixed", "Declined to say", "Unknown"],
        "gender": ["Female", "Male", "Other", "Unknown"]
    };

    // Define scales globally
    let xScale, yScale;

    // Define a mutable holding place for filtered data indices
    let filteredData = [];

    // these things aren't data dependent and can be done once at the start
    // they only need to be dynamic if you are making this responsive
    // then they would need to be tied to the window resize event
    const margin = { top: 20, right: 30, bottom: 50, left: 50 },
        width = 1000 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#beeswarm-chart-container svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data.csv").then(function (data) {
        console.log("Loaded Data:", data);

        // these things are data dependent, but not dynamic 
        // once you have data you can set it and forget it
        // again, responsiveness would necessitate making these dynamic
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

        // averageScoreVisualization(data);
        plotBeeswarm(data);

        // since you are performing the same function with the same input
        // regardless of which dropdown is selected you don't need to apply 
        // the event listener individually. 
        d3.selectAll(".dropdown").on("change", () => cascadeDropdowns(data));
        // d3.select("#age-group").on("change", () => cascadeDropdowns(data));
        // d3.select("#location").on("change", () => cascadeDropdowns(data));
        // d3.select("#ethnicity").on("change", () => cascadeDropdowns(data));
        // d3.select("#gender").on("change", () => cascadeDropdowns(data));

        d3.select("#clear-button").on("click", function () {
            filteredData = [];
            clearSelections(data);
            // clearHighlight();
            // hideResult();
        });

        cascadeDropdowns(data);
    });

    // function averageScoreVisualization(data) {
    //     const ageGroups = [...new Set(data.map(d => d.age_group))]
    //         .sort((a, b) => orders.age_group.indexOf(a) - orders.age_group.indexOf(b));
    //     updateDropdown("#age-group", ageGroups, "");

    //     cascadeDropdowns(data);
    // }

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
        // const selectedAgeGroup = d3.select("#age-group").property("value");
        // const selectedLocation = d3.select("#location").property("value");
        // const selectedEthnicity = d3.select("#ethnicity").property("value");
        // const selectedGender = d3.select("#gender").property("value");

        // const filteredData = data.filter(d =>
        //     d.age_group === selectedAgeGroup &&
        //     d.location === selectedLocation &&
        //     d.ethnicity === selectedEthnicity &&
        //     d.gender === selectedGender
        // );

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

        // if (data.length > 0) {
        //     highlightPointInBeeswarm(data[0]);
        // }
    }

    function clearSelections(data) {
        d3.select("#age-group").property("value", "");
        d3.select("#location").property("value", "");
        d3.select("#ethnicity").property("value", "");
        d3.select("#gender").property("value", "");
        // d3.select("#avg-score").text("No data");

        // repopulate the dropdowns with all the options
        cascadeDropdowns(data);

        // replotting the dots will have the addon effect of removing the highlight
        plotBeeswarm(data);

        // updating the average score here will return it to 
        // the overall average for the entire dataset
        updateAverageScore(data);
    }

    // function clearHighlight() {
    //     d3.select("#star-highlight").remove();
    // }

    // function hideResult() {
    //     d3.select("#result").style("display", "none");
    // }

    // function highlightPointInBeeswarm(matchingPoint) {
    //     clearHighlight(); // Remove any existing highlights

    //     // Use the global xScale and yScale to position the star
    //     const xPos = xScale(matchingPoint.age_group);
    //     const yPos = yScale(matchingPoint.score_change);

    //     const starPath = "M 0,-10 L 3,-3 L 10,-3 L 4,2 L 6,9 L 0,5 L -6,9 L -4,2 L -10,-3 L -3,-3 Z";

    //     d3.select("#beeswarm-chart-container svg")
    //     .append("path")
    //     .attr("id", "star-highlight")
    //     .attr("d", starPath)
    //     .attr("transform", `translate(${xPos + 50},${yPos + 5}) scale(1.2)`) // Adjust for centering and size
    //     .attr("fill", "#beff00")
    //     .attr("stroke", "none")
    //     //.attr("opacity", 0.7); // Add transparency
    // }

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
