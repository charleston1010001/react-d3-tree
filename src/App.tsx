import * as React from 'react';
import * as d3 from 'd3';
import './App.css';

const logo = require('./logo.svg');

interface AppProps {
}

interface AppState {
    treeData: any;
}

class App extends React.Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);

        this.state = {
            treeData: {
                name: 'Top Level',
                children: [
                    {
                        name: 'Level 2: A',
                        children: [
                            { name: 'Son of A' },
                            {
                                name: 'Daughter of A',
                                children: [
                                    {
                                        name: 'Level 3: A',
                                        children: [
                                            { name: 'Son of A' },
                                            {
                                                name: 'Daughter of A'
                                            }
                                        ]
                                    },
                                    { name: 'Level 2: B' }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'Level 2: B',
                        children: [
                            {
                                name: 'Level 3: A',
                                children: [
                                    { name: 'Son of A' },
                                    { name: 'Daughter of A' }
                                ]
                            },
                        ]
                    }
                ]
            }
        };
    }

    public render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                </header>
                <div className="structure"/>
            </div>
        );
    }

    public componentDidMount() {
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;

        const svg = d3.select('.structure').append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(d3.zoom().on('zoom', () => {
                svg.attr('transform', d3.event.transform);
            }))
            .append('g')
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')');

        let i = 0;
        const duration = 750;
        let root: any;
        const treemap = d3.tree().size([height, width]);
        root = d3.hierarchy(this.state.treeData, (d) => d.children);
        root.x0 = height / 2;
        root.y0 = 0;

        root.children.forEach(collapse);

        update(root);

        function collapse(d: any) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        function update(source: any) {

            // Assigns the x and y position for the nodes
            const treeData = treemap(root);

            // Compute the new tree layout.
            const nodes = treeData.descendants();
            const links = treeData.descendants().slice(1);

            // Normalize for fixed-depth.
            nodes.forEach((d: any) => d.y = d.depth * 180);

            // ****************** Nodes section ***************************

            // Update the nodes...
            const node = svg.selectAll('g.node')
                .data(nodes, (d: any) => d.id || (d.id = ++i));

            // Enter any new modes at the parent's previous position.
            const nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr('transform', function(d: any) {
                    return 'translate(' + source.y0 + ',' + source.x0 + ')';
                })
                .on('click', click);

            // Add Circle for the nodes
            nodeEnter.append('circle')
                .attr('class', 'node')
                .attr('r', 1e-6)
                .style('fill', function(d: any) {
                    return d._children ? 'lightsteelblue' : '#fff';
                });

            // Add labels for the nodes
            nodeEnter.append('text')
                .attr('dy', '.35em')
                .attr('x', function(d: any) {
                    return d.children || d._children ? -13 : 13;
                })
                .attr('text-anchor', function(d: any) {
                    return d.children || d._children ? 'end' : 'start';
                })
                .text(function(d: any) { return d.data.name; });

            // UPDATE
            const nodeUpdate = nodeEnter.merge(node);

            // Transition to the proper position for the node
            nodeUpdate.transition()
                .duration(duration)
                .attr('transform', function(d: any) {
                    return 'translate(' + d.y + ',' + d.x + ')';
                });

            // Update the node attributes and style
            nodeUpdate.select('circle.node')
                .attr('r', 10)
                .style('fill', function(d: any) {
                    return d._children ? 'lightsteelblue' : '#fff';
                })
                .attr('cursor', 'pointer');

            // Remove any exiting nodes
            const nodeExit = node.exit().transition()
                .duration(duration)
                .attr('transform', function(d: any) {
                    return 'translate(' + source.y + ',' + source.x + ')';
                })
                .remove();

            // On exit reduce the node circles size to 0
            nodeExit.select('circle')
                .attr('r', 1e-6);

            // On exit reduce the opacity of text labels
            nodeExit.select('text')
                .style('fill-opacity', 1e-6);

            // ****************** links section ***************************

            // Update the links...
            const link = svg.selectAll('path.link')
                .data(links, function(d: any) { return d.id; });

            // Enter any new links at the parent's previous position.
            const linkEnter = link.enter().insert('path', 'g')
                .attr('class', 'link')
                .attr('d', () => {
                    const o = {x: source.x0, y: source.y0};
                    return diagonal(o, o);
                });

            // UPDATE
            let linkUpdate = linkEnter.merge(link);

            // Remove any exiting links
            link.exit().transition()
                .duration(duration)
                .attr('d', function() {
                    const o = {x: source.x, y: source.y};
                    return diagonal(o, o);
                })
                .remove();

            // Transition back to the parent element position
            linkUpdate.transition()
                .duration(duration)
                .attr('d', (d) => diagonal(d, d.parent));

            // Store the old positions for transition.
            nodes.forEach((d: any) => {
                d.x0 = d.x;
                d.y0 = d.y;
            });

            // Creates a curved (diagonal) path from parent to the child nodes
            function diagonal(s: any, d: any) {

                return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
            }

            // Toggle children on click.
            function click(d: any) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                update(d);
            }
        }
    }
}

export default App;
