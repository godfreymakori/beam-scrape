#!/usr/bin/env node

// Require dependencies
const fs = require('fs');
const request = require('superagent');
const trim = require('lodash.trim');
const startsWith = require('lodash.startswith');


// Make get request to fetch html content
const url = 'https://www.mcc-mnc.com/';
console.error(`Scraping... ${url}... Kindly hold...`);
request
    .get(url)
    .end(function (err, res) {
        if (err) {
            console.error(err.stack);
            process.exit(1);
        }
        if (!res.ok) {
            console.error(`Scraping exited with status: ${res.status}`);
            process.exit(2);
        }
        console.error('Data collected... Parsing initiated...');

        fs.writeFileSync('source-mcc-mnc-beem.html', res.text);
        beem_parser(res.text);
    });


// Parse method
function beem_parser(content) {


    // Regex Declaration
    const regex = new RegExp(
        '<tr>' +
        '<td>(\\d+)</td>' +  // MCC Data
        '<td>([^<]+)</td>' +  // MNC Data
        '<td>([^<]+)</td>' +  // Country code Data
        '<td>([^<]+)</td>' +  // Country Name Data
        '<td>([^<]*)</td>' +  // Calling Code for country
        '<td>([^<]*)</td>' +  // Network Line
        '</tr>'
    );

    const lines = content.split('\n');

    let result = [];
    lines.forEach(function (line) {
        line = trim(line);

        if (!startsWith(line, '<tr>') || line.length < 5)
            return;

        const matching_line = line.match(regex);
        if (!matching_line) {
            console.error(`Error while parsing line: "${line}"`);
            return;
        }

        const mcc = matching_line[1];
        const country_name = trim(matching_line[4]);
        const network_name = trim(matching_line[6]);
        const mnc = (matching_line[2] != 'n/a') ? matching_line[2] : '';
        const country_iso = (matching_line[3] != 'n/a') ? matching_line[3].toUpperCase() : null;
        let country_code = trim(matching_line[5]);

        //Prepare dataset
        result.push({
            mcc,
            mnc,
            country_iso,
            country_name,
            country_code,
            network_name
        });
    });

    console.log(JSON.stringify(result, null, 4));
    console.error(`Beem! ${Object.keys(result).length} items scraped`);
}
