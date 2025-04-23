
const width = 800;
const height = 800;
const margin = 120;
const radius = Math.min(width, height) / 2 - margin;

const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

const color = d3.scaleOrdinal(d3.schemeCategory10);
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("padding", "8px")
  .style("background", "#333")
  .style("color", "#fff")
  .style("border-radius", "4px");

let teamIndex = 0;
let teams = [];

d3.json("top6_teams_2014_2024.json").then(data => {
  const years = [...new Set(data.map(d => d.season_end_year))].sort();
  teams = [...new Set(data.map(d => d.team))];
  const angleSlice = (2 * Math.PI) / years.length;
  const radialScale = d3.scaleLinear()
    .domain([15, 1])
    .range([radius * 0.1, radius]);

  // Circular grid from 1 to 15
  for (let i = 1; i <= 15; i++) {
    svg.append("circle")
      .attr("r", radialScale(i))
      .attr("fill", "none")
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 0.7);

    svg.append("text")
      .attr("y", -radialScale(i) - 2)
      .attr("x", 0)
      .text(i)
      .style("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("fill", "#999");
  }

  // Axes and Year labels on outermost edge
  years.forEach((year, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const labelRadius = radialScale(1) + 25;
    const x = labelRadius * Math.cos(angle);
    const y = labelRadius * Math.sin(angle);

    svg.append("line")
      .attr("x2", radialScale(15) * Math.cos(angle))
      .attr("y2", radialScale(15) * Math.sin(angle))
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1);

    svg.append("text")
      .attr("x", x)
      .attr("y", y)
      .text(year)
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .attr("fill", "#444");
  });

  function drawRadar(teamList) {
    svg.selectAll(".team-path, .team-dot, .legend").remove();

    teamList.forEach(team => {
      const teamData = data.filter(d => d.team === team).sort((a, b) => a.season_end_year - b.season_end_year);
      const line = d3.lineRadial()
        .radius(d => radialScale(d.position))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

      svg.append("path")
        .datum(teamData)
        .attr("class", "team-path")
        .attr("fill", color(team))
        .attr("fill-opacity", 0.12)
        .attr("stroke", color(team))
        .attr("stroke-width", 2)
        .attr("d", line)
        .attr("opacity", 0)
        .transition()
        .duration(1000)
        .attr("opacity", 1);

      svg.selectAll(".dot-" + team.replace(/\s/g, ""))
        .data(teamData)
        .enter()
        .append("circle")
        .attr("class", "team-dot")
        .attr("cx", (d, i) => radialScale(d.position) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => radialScale(d.position) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("r", 4)
        .attr("fill", color(team))
        .on("mouseover", function(event, d) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`<strong>${d.team}</strong><br>Year: ${d.season_end_year}<br>Position: ${d.position}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition().duration(500).style("opacity", 0);
        });
    });

    teamList.forEach((team, i) => {
      svg.append("text")
        .attr("class", "legend")
        .attr("x", -width / 2 + 20)
        .attr("y", -height / 2 + 20 + i * 20)
        .text(team)
        .attr("fill", color(team))
        .style("font-size", "13px");
    });
  }

  function handleNext() {
    if (teamIndex < teams.length) {
      drawRadar([teams[teamIndex]]);
      teamIndex++;
    } else if (teamIndex === teams.length) {
      drawRadar(teams);
      teamIndex++;
    }
  }

  d3.select("body").on("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      handleNext();
    }
  });

  d3.select("body").on("click", () => handleNext());

  d3.select("#resetBtn").on("click", () => {
    teamIndex = 0;
    svg.selectAll(".team-path, .team-dot, .legend").remove();
  });
});
