const d3 = require('d3')

const defaultData = require('./defaultData.json')

const createDefaultMouseEventHandler = (contextKey) => (contextData) => {
    console.info(`techflow ${contextKey} event`, contextData)
}

const formatData = (unformattedData) => {
    console.info(unformattedData)
    console.info('unformattedData.employers',unformattedData.employers)
    console.info('unformattedData[employers]',unformattedData['employers'])
    if(!unformattedData){
        return defaultData;
    }
    else{
        const results = {links:[],nodes:[]}
        Object.keys(unformattedData.employers).forEach((employerKey)=>{
            const employer = unformattedData.employers[employerKey]
            results.nodes.push({
                id: employerKey,
                alias: employer.alias,
                monthCount : employer.months,
                typeKey :  "employer"
            })
            Object.keys(employer.projectMonths).forEach((projectKey)=>{
                const projectMonths = employer.projectMonths[projectKey]
                const project = unformattedData.projects[projectKey]
                results.nodes.push({
                    id: projectKey,
                    alias: project.alias,
                    monthCount : projectMonths,
                    typeKey :  "project"
                });
                results.links.push({
                    source: employerKey,
                    target: projectKey,
                    value: 1
                });
                project.tech.forEach((techKey)=>{
                    const projectTech = unformattedData.tech[techKey]
                    const previousTechNode = results.nodes.find(node => node.id === techKey)
                    if(previousTechNode){
                        previousTechNode.monthCount+=projectMonths;
                    }
                    else{
                        results.nodes.push({
                            id: techKey,
                            alias: projectTech.alias,
                            monthCount : projectMonths,
                            typeKey :  "tech"
                        });
                    }
                    results.links.push({
                        source: projectKey,
                        target: techKey,
                        value: 1
                    });

                })
            })
        })
        return results;
    }
}

const drag = simulation => {

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}


const scale = d3.scaleOrdinal(d3.schemeCategory10);
const color = (typeArray) => (d) => {
    const typeIndex = typeArray.indexOf(d.typeKey);
    console.info('colorCheck', typeArray, d.typeKey, typeIndex)
    console.info(scale(1),scale(2),scale(3))
    return scale(typeIndex);
}

const getChart = (data, onClick, onHover, height = 250, width = 500) => {

    const links = data.links.map(d => Object.create(d));
    const nodes = data.nodes.map(d => Object.create(d));

    const nodeTypes = [...new Set(nodes.map(node => node.typeKey))];

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height]);

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => d.monthCount)
        .attr("fill", color(nodeTypes))
        .call(drag(simulation));

    node.append("title")
        .text(d => d.alias);

    node.on("click",(node)=>{
        onClick({id:node.id, type:node.typeKey})
    });

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    //invalidation.then(() => simulation.stop());

    return svg.node();
}

const techflow = {
    go: (element, unformattedData, onNodeClick = createDefaultMouseEventHandler('click'), onNodeHover = createDefaultMouseEventHandler('hover'))=>{
        if(element){
            const formattedData = formatData(unformattedData)

            const chart = getChart(formattedData, onNodeClick, onNodeHover)

            console.info(chart)

            element.appendChild(chart)
        }
        else{
            throw new Error('techflow requires html element to render data')
        }
    }
}

module.exports = techflow;