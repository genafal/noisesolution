document.addEventListener("DOMContentLoaded", function () {

    function createChoroplethMap() {

        Promise.all([
            d3.json("uk_outcode_regions.geojson"),
            d3.csv("data_for_map.csv")
        ]).then(function([geojsonData, csvData]) {

            // Calculate the global maximum count across all age groups in the entire dataset
            const globalMax = d3.max(
                d3.rollups(
                    csvData,
                    v => v.length,
                    d => d.age_group
                ).map(([key, value]) => value)
            );

            console.log("Calculated globalMax:", globalMax);  // Debugging: Log the globalMax value

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
                }
            });

            const svg = d3.select("#map")
                .append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", `0 0 850 1250`)  // Ensure the viewBox uses the full intended size
                .attr("preserveAspectRatio", "xMidYMid meet");

            const minScore = d3.min(geojsonData.features, d => d.properties.average_score_change);
            const maxScore = d3.max(geojsonData.features, d => d.properties.average_score_change);

            const colorScale = d3.scaleDiverging()
                .domain([minScore, 0, maxScore])
                .interpolator(d3.interpolateRgbBasis(["#8755FF", "#E1E1E1", "#beff00"]));

            const projection = d3.geoMercator()
                .fitSize([850, 1250], {  // Adjust the fitExtent values to match the viewBox
                    type: "FeatureCollection",
                    features: geojsonData.features
                });

            const path = d3.geoPath().projection(projection);

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

                .on("click", function(event, d) {
                    console.log("Clicked region:", d.properties);  // Debugging: Log clicked region's properties
                    if (d.properties.count > 0) {
                        const area = d.properties.area;
                        const averageScoreChange = d.properties.average_score_change;
                        const count = d.properties.count;
                        const filteredData = csvData.filter(row => row.outcode_alpha.trim().toUpperCase() === d.properties.outcode_alpha.trim().toUpperCase());

                        // Update the info-box with the new data
                        d3.select("#info-box").html(`
                            <p><strong>${count}</strong> participants in <strong>${area}</strong> reported an average SWEMWBS score change of <strong>${averageScoreChange.toFixed(2)}</strong>.</p>
                        `);

                        const ageGroupData = d3.rollups(
                            filteredData,
                            v => v.length,
                            d => d.age_group
                        ).map(([key, value]) => ({ age_group: key, count: value }));

                        createBarChart(ageGroupData, "#bar-chart", globalMax);

                        // PIE CHART CODE
                        const ethnicityData = d3.rollups(
                            filteredData,
                            v => v.length,
                            d => d.ethnicity
                        ).map(([key, value]) => ({ ethnicity: key, count: value }));

                        createPieChart(ethnicityData, "#pie-chart-ethnicity", "Ethnicity");

                        const genderData = d3.rollups(
                            filteredData,
                            v => v.length,
                            d => d.gender
                        ).map(([key, value]) => ({ gender: key, count: value }));

                        createPieChart(genderData, "#pie-chart-gender", "Gender");

                        const industryData = d3.rollups(
                            filteredData,
                            v => v.length,
                            d => d.participant_industry
                        ).map(([key, value]) => ({ participant_industry: key, count: value }));

                        createPieChart(industryData, "#pie-chart-industry", "Participant Industry");
                      
                    }
                });
        }).catch(function(error) {
            console.error("Error loading the files: ", error);
        });
    }

    function createBarChart(data, selector, globalMax) {
        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 70, left: 40 }; // Increased bottom margin


        console.log("globalMax:", globalMax);  // Debugging: Log the globalMax value

        // Check if globalMax is valid
        if (isNaN(globalMax) || globalMax <= 0) {
            console.error("Invalid globalMax:", globalMax);
            globalMax = 10;  // Temporarily set to 10 for debugging
        }

        // Define the order and ensure all categories are present
        const categories = ["Age 4-9", "Age 10-12", "Age 13-15", "Age 16-19", "Age 20-24", "Age 25+"];
        const categoryData = categories.map(cat => {
            const found = data.find(d => d.age_group === cat);
            const count = found ? found.count : 0;
            console.log(`Category: ${cat}, Count: ${count}`);  // Debugging: Log the category and count
            return { age_group: cat, count: count };
        });

        const svg = d3.select(selector)
            .html("")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom) // Increase SVG height
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    

        /*
        const svg = d3.select(selector)
            .html("")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        */

        const x = d3.scaleBand()
            .domain(categories)
            .range([0, width])
            .padding(0.1);

        // Use the global maximum for the y-axis domain
        const y = d3.scaleLinear()
            .domain([0, globalMax])
            .nice()
            .range([height, 0]);

        svg.append("g")
            .selectAll("rect")
            .data(categoryData)
            .enter().append("rect")
            .attr("x", d => x(d.age_group))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.count))
            .attr("fill", "#BEFF00");

        // X-axis with labels only (no lines or ticks)
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickSize(0)  // Remove tick marks
            )
            .call(g => g.selectAll(".domain").remove())  // Remove axis line
            .call(g => g.selectAll("text")
                .attr("y", 20)  // Increase y to push labels further below the bars   
                .style("fill", "white")
                .style("font-size", "14px")
                .style("text-anchor", "middle")); // Center the labels below the bars
               
    }

    /* STACKED BAR CHARTS
    function createStackedBarChart(data, selector, title) {
        const width = 400; // Adjust width as needed
        const height = 200; // Adjust height as needed
        const margin = { top: 40, right: 30, bottom: 40, left: 50 };
    
        const svg = d3.select(selector)
            .html("")  // Clear previous content
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Process data for stacking
        const categories = Object.keys(data[0]).filter(key => key !== "category");

        // Define a custom color scale using the colors from the choropleth map
        const customColors = ["#8755FF", "#E1E1E1", "#beff00"];
        const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(customColors.concat(d3.schemeCategory10));  // Fallback to d3 scheme if more colors are needed
    
        const stack = d3.stack()
            .keys(categories)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);
    
        const series = stack(data);
    
        const x = d3.scaleBand()
            .domain(data.map(d => d.category))
            .range([0, width])
            .padding(0.1);
    
        const y = d3.scaleLinear()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
            .nice()
            .range([height, 0]);
    
        const color = d3.scaleOrdinal(d3.schemeCategory10);
    
        // Create bars
        svg.selectAll(".serie")
            .data(series)
            .enter().append("g")
            .attr("class", "serie")
            .attr("fill", d => colorScale(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => x(d.data.category))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());
    
        // X-axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
    
        // Y-axis
        svg.append("g")
            .call(d3.axisLeft(y));
    
        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .style("fill", "white")
            .text(title);
    
        // Legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 10}, 0)`);
    
        legend.selectAll("rect")
            .data(categories)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", colorScale);
    
        legend.selectAll("text")
            .data(categories)
            .enter().append("text")
            .attr("x", 24)
            .attr("y", (d, i) => i * 20 + 9)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("fill", "white")
            .text(d => d);
    }
    */

    function createPieChart(data, selector, title) {
        const width = d3.select(selector).node().getBoundingClientRect().width; // Use the container's width
        const height = d3.select(selector).node().getBoundingClientRect().height; // Use the container's height
        const radius = Math.min(width, height) / 2 - 100; // Reduce radius to create space

        const svg = d3.select(selector)
            .html("")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        // Sort data by count in descending order
        const sortedData = data.sort((a, b) => b.count - a.count);

        const pie = d3.pie()
            .value(d => d.count);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const customColors = ["#beff00", "#0C79D5", "#513399", "#084B84", "#6AA84F", "#E27C00"];
        const colorScale = d3.scaleOrdinal()
            .domain(sortedData.map(d => d.ethnicity || d.gender || d.participant_industry))
            .range(customColors);  

        const arcs = svg.selectAll("arc")
            .data(pie(sortedData))
            .enter().append("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => colorScale(d.data.ethnicity || d.data.gender || d.data.participant_industry));

        // Move the title above the plot
        svg.append("text")
        .attr("x", 0)
        .attr("y", -radius - 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .style("fill", "white")
        .text(title);

        // Add legend to the outside right of the pie chart
        const legend = svg.append("g")
            .attr("transform", `translate(${radius + 20}, ${-radius + 20})`);  // Position the legend to the right of the chart

        legend.selectAll("rect")
            .data(sortedData)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => colorScale(d.ethnicity || d.gender || d.participant_industry)); // Use the data to assign colors

        legend.selectAll("text")
            .data(sortedData)
            .enter().append("text")
            .attr("x", 24)
            .attr("y", (d, i) => i * 20 + 9)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("fill", "white")
            .text(d => d.ethnicity || d.gender || d.participant_industry);
    }

    createChoroplethMap();
});
