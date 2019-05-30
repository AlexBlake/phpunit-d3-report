import { ReportTransformer } from './reportTransformer';

const d3 = require("d3");
require('./d3.phpunitBubbles')(d3);

// Compatibility tweaks
window.URL = window.URL || window.webkitURL;

// Global variables
var chart = d3.chart.phpunitBubbles().padding(2);
var file = null;
var jsonReport = null;
var parsingInput = document.getElementById('node-callback');

var reader = new FileReader();
reader.onload = function () {
    loadReport(reader.result);
};

window.openFile = function (event) {
    file = event.target.files[0];
    reader.readAsText(file);
};

parsingInput.value = `/*
* Add your logic to group/mutate the output for yourself here
* example symfony grouping of test suites
*/
node.suite = node.suite[1].split('\\\\Tests\\\\')[0];
`;
function nodeCallback(node) {
    const parsing = parsingInput.value;
    eval(parsing);
    // To any mutations to the node here
    return node;
};


function loadReport(data) {
    jsonReport = ReportTransformer.transform(data, nodeCallback);

    d3.select("#bubbles")
        .datum(jsonReport)
        .call(chart);
    addTotals();
};

d3.json("symfony.json", function (err, data) {
    jsonReport = data;

    d3.select("#bubbles")
        .datum(data)
        .call(chart);
    addTotals();
});

function loadExample() {
    d3.xml("symfony.xml", function (err, data) {
        data = (new XMLSerializer()).serializeToString(data);
        jsonReport = ReportTransformer.transform(data, nodeCallback);

        d3.select("#bubbles")
            .datum(data)
            .call(chart);
        addTotals();
    });
}

function addTotals() {
    const tally = {
        total: 0,
        passing: 0,
        failing: 0,
        errors: 0,
        suites: {},
    };
    for (let i = 0, node; node = jsonReport[i]; i++) {
        if (typeof tally.suites[node.suite] === 'undefined') {
            tally.suites[node.suite] = {
                passing: 0,
                failing: 0,
                errors: 0
            };
        }
        if (node.error || node.failure) {
            if (node.error) {
                tally.errors++;
                tally.suites[node.suite].errors++;
            } else {
                tally.failing++;
                tally.suites[node.suite].failing++;
            }
        } else {
            tally.passing++;
            tally.suites[node.suite].passing++;
        }
    }
    document.getElementById("totals").innerHTML = `
        <table class="tally_table">
        <tr>
            <td><strong>Total:</strong></td>
            <td class="t-t">${formatValue(jsonReport.length)}</td>
            <td class="text-right"></td>
        </tr>
        <tr>
            <td><strong>Passing:</strong></td>
            <td class="t-p">${formatValue(tally.passing)}</td>
            <td class="text-right">${Math.round(tally.passing / jsonReport.length * 10000) / 100}%</td>
            </tr>
        <tr>
            <td><strong>Failing:</strong></td>
            <td class="t-f">${formatValue(tally.failing)}</td>
            <td class="text-right">${Math.round(tally.failing / jsonReport.length * 10000) / 100}%</td>
        </tr>
        <tr>
            <td><strong>Errors:</strong></td>
            <td class="t-e">${formatValue(tally.errors)}</td>
            <td class="text-right">${Math.round(tally.errors / jsonReport.length * 10000) / 100}%</td>
        </tr>
        </table>`;

    document.getElementById('suite-totals').innerHTML = `<table class="tally_table">
        <tr>
            <td><strong>Test Suites</strong></td>
            <td class="t-p"><strong>P</strong></td>
            <td class="t-f"><strong>F</strong></td>
            <td class="t-e"><strong>E</strong></td>
        </tr>
        `+ Object.keys(tally.suites).map(suite => {
        return `<tr>
                    <td>${suite}</td>
                    <td class="t-p">${formatValue(tally.suites[suite].passing)}</td>
                    <td class="t-f">${formatValue(tally.suites[suite].failing)}</td>
                    <td class="t-e">${formatValue(tally.suites[suite].errors)}</td>
                </tr>`;
    }).join('') + `</table>`;
}

function formatValue(val) {
    if (val === 0) {
        return '-';
    }
    return val;
}

// Add tooltip details on hover
d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Authorize JSON report download (for external embedding)
document.getElementById("json_report_download_link").addEventListener("click", function (e) {
    this.href = window.URL.createObjectURL(new Blob([JSON.stringify(jsonReport)]));
    this.download = 'phpunit-d3-report.json';
});

// reload xml result file
document.getElementById("refresh_file_link").addEventListener("click", function (e) {
    reader.readAsText(file);
});

// load example
document.getElementById("load_example").addEventListener("click", function (e) {
    loadExample();
});

// Authorize JSON report download (for external embedding)
document.getElementById("json_report_download_link").addEventListener("click", function (e) {
    var blob = new Blob([JSON.stringify(jsonReport)]);
    var url = window.URL.createObjectURL(blob);

    this.href = url;
    this.download = 'phpunit-d3-report.json';
});
