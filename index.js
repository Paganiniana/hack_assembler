const fs = require('fs');
require('./parse_tools.js')();

// NOTE: See contents of parse_tools.js,
//  all methods and properties are now available in this file

// read teh contents of Add.asm and print to console


/** Function to turn text from a file into a simple array of lines
 * 
 * INTERFACE
 * 
 * EXPECTS: A file with \n and \r demarcations
 * RETURNS: array of lines, free from escaped formatting
 */

const cleanFile = function(file) {
    return file.map((line) => {
        line = line.split('\r');
        return line[0];
    })
} 


const assembleFile = function(file_name) {
    // Read the file, separated by line 
    let f = fs.readFileSync('./' + file_name, 'utf8').split('\n');

    // create a clean version, parsing jump symbols
    // f = removeWhiteSpace(
    //         parseJumpSymbols(
    //             cleanFile(f)
    //         )
    //     );


    f = cleanFile(f);
    console.log("Cleaned file");

    f = removeWhiteSpace(f);
    console.log("Removed White Space");

    f = parseJumpSymbols(f);
    console.log("Parsed Jump symbols.");

    let assembled_code = parseAllCommands(f);
    console.log("Assembled code");

    console.log(this.MEM_SYMBOLS);


    return assembled_code;
}




// MAIN

if (process.argv.length == 2) {
    console.log("Please specify a filename in the fashion 'filename.asm' to assemble it.")
}

process.argv.forEach(arg => {
    // skip 'node' argument
    if (arg.includes("node")) {
        return;
    } else if (arg.includes('index.js')) {
        return;
    } else {
        try {
            // where the magic happens
            let asm = assembleFile(arg);
            let new_file_name = './' + arg.split('.')[0] + '.hack';
            fs.writeFileSync('./' + new_file_name, "");

            // TMP FILE
            let tmp = "";
            asm.forEach((line) => {
                tmp = tmp + ('./' + new_file_name, line+"\n");
            })
             
            // write the file
            fs.writeFileSync('./' + new_file_name, tmp);
            console.log("Finished writing to file.")
        } catch (err) {
            console.log(err);
            throw new Error(`Sorry, ${arg} is not in this directory.`)
        }
    }
})