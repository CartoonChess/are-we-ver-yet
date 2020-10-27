//
// Utilities related to configuration changes
//
// The `file` argument in setJSONValue is a string.
// When passing, make sure it's absolute to avoid errors!
//
// const path = require('path');
// const jsonFilePath = path.join(__dirname, '../path/to/foo.json');
//

const fs = require('fs').promises;
const print = require('./print.js');

module.exports = {
    // Update json files
    // https://stackoverflow.com/a/64094106/141032
    setJSONValue(file, key, value) {
        fs.readFile(file)
            .then(json => JSON.parse(json))
            .then(obj => {
                // Creates or overwrites
                obj[key] = value;
                return obj;
            })
            .then(obj => JSON.stringify(obj, null, 4)) // 4 is the superior number of spaces
            .then(json => fs.writeFile(file, json))
            .catch(error => print.error(`Failed to update JSON file: ${error}`))
    }
}