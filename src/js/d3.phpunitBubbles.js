exports.d3 = null;
exports.phpunitBubbles = function (options) {

    var width = 600;
    var height = 450;
    var padding = 1;
    var className = "bubbles";
    var tooltip_visible = null;

    var sort = function (a, b) {
        return Math.random() < 0.5;
    };

    var onClick = function (data) {
        if (tooltip_visible == exports.d3.event.target) {
            exports.d3.select(".tooltip").html("");
            exports.d3.select(".tooltip").style("opacity", 0);
            tooltip_visible = null;
        } else {
            // Update tooltip content
            var content = "<h2>" + data.suite + "</h2>";
            content += "<h3>" + data.name + "</h3>";
            content += "<p><strong>Time:</strong> " + convertDuration(data.value * 1000);

            if (data.error) {
                content += "<div class='error'>";
                content += "    <h5>" + data.error.type + "</h5>";
                content += "    <pre>" + data.error.message + "</pre>";
                content += "</div>";
            } else if (data.failure) {
                content += "<div class='failure'>";
                content += "    <h5>" + data.failure.type + "</h5>";
                content += "    <pre>" + data.failure.message + "</pre>";
                content += "</div>";
            }

            exports.d3.select(".tooltip").html(content);

            // Display tooltip
            exports.d3.select(".tooltip")
                .style("left", (exports.d3.event.pageX + 5) + "px")
                .style("top", (exports.d3.event.pageY + 5) + "px")
                .transition()
                .duration(200)
                .style("opacity", 1);
            tooltip_visible = exports.d3.event.target;
        }
    }

    var onMouseMove = function () {
        exports.d3.select(".tooltip")
            .style("left", (exports.d3.event.pageX + 5) + "px")
            .style("top", (exports.d3.event.pageY + 5) + "px");
    }

    var onMouseOver = function (data) {
        // Update tooltip content
        var content = "<h3>" + data.name + "</h3>";
        content += "<p><strong>Time:</strong> " + convertDuration(data.value * 1000);

        if (data.error) {
            content += "<div class='error'>";
            content += "    <h5>" + data.error.type + "</h5>";
            content += "    <pre>" + data.error.message + "</pre>";
            content += "</div>";
        } else if (data.failure) {
            content += "<div class='failure'>";
            content += "    <h5>" + data.failure.type + "</h5>";
            content += "    <pre>" + data.failure.message + "</pre>";
            content += "</div>";
        }

        exports.d3.select(".tooltip").html(content);

        // Display tooltip
        exports.d3.select(".tooltip")
            .transition()
            .duration(200)
            .style("opacity", 1);
    }

    var onMouseOut = function () {
        exports.d3.select(".tooltip").style("opacity", 0);
    }

    function hierarchizeData(data) {
        var children = [];
        for (var i = 0, c = data.length; i < c; i++) {
            var datum = data[i];
            if (datum.time < 0.005) {
                continue;
            }

            children.push({
                suite: datum.suite,
                name: datum.name,
                value: datum.time,
                type: datum.type,
                error: datum.error,
                failure: datum.failure
            });
        }

        return { children: children };
    }

    function convertDuration(milliseconds) {
        if (milliseconds < 1000) {
            return Math.round(milliseconds) + "ms";
        }

        var duration = moment.duration(milliseconds);
        var seconds = duration.get("seconds");
        if (seconds < 10) {
            seconds = "0" + seconds;
        }

        return duration.get("minutes") + ":" + seconds;
    }

    function getNodeClass(d) {
        if (d.error) {
            return "errored";
        }

        if (d.failure) {
            return "failed";
        }

        return "success";
    }

    function chart(selection) {
        selection.each(function (data) {
            var bubbles = exports.d3.layout.pack()
                .size([width, height])
                .sort(sort)
                .padding(padding);

            exports.d3.select(this).select("svg").remove();

            var svg = exports.d3.select(this)
                .html('')
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", className);

            var node = svg
                .selectAll(".bubble")
                .data(bubbles.nodes(hierarchizeData(data)).filter(function (d) {
                    return d.depth == 1;
                }));

            node.enter()
                .append("g")
                .attr("class", "bubbles")
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

            node
                .append("circle")
                .attr("r", function (d) { return d.r; })
                .attr("class", getNodeClass)
                .attr("test-name", function (d) { return d.name; });

            node
                .on("click", onClick);
            // .on("mouseover", onMouseOver)
            // .on("mousemove", onMouseMove)
            // .on("mouseout", onMouseOut);
        });

        exports.d3.select("body").on("click", function (data) {
            if ((selection.node().contains(exports.d3.event.target) && tooltip_visible == exports.d3.event.target) || (exports.d3.select(".tooltip").node().contains(exports.d3.event.target))) {
                return;
            }
            exports.d3.select(".tooltip").html("");
            exports.d3.select(".tooltip").style("opacity", 0);
            tooltip_visible = null;
        });
    }

    chart.width = function (value) {
        if (!arguments.length) return width;
        width = value;

        return chart;
    };

    chart.height = function (value) {
        if (!arguments.length) return height;
        height = value;

        return chart;
    };

    chart.padding = function (value) {
        if (!arguments.length) return padding;
        padding = value;

        return chart;
    };

    chart.className = function (value) {
        if (!arguments.length) return className;
        className = value;

        return chart;
    };

    chart.sort = function (value) {
        if (!arguments.length) return sort;
        sort = value;

        return chart;
    };

    chart.onMouseOver = function (value) {
        if (!arguments.length) return onMouseOver;
        onMouseOver = value;

        return chart;
    };

    chart.onMouseMove = function (value) {
        if (!arguments.length) return onMouseMove;
        onMouseMove = value;

        return chart;
    };

    chart.onMouseOut = function (value) {
        if (!arguments.length) return onMouseOut;
        onMouseOut = value;

        return chart;
    };

    return chart;
}

module.exports = function (d3) {
    exports.d3 = d3;
    exports.d3.chart = exports.d3.chart || {};
    exports.d3.chart.phpunitBubbles = exports.phpunitBubbles;
    return exports.d3;
}