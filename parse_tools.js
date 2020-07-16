
const parseTools = function() {
    /** Table of values
 * 
 * STRUCTURE
 * 
 * Each of these objects represents part of the HACK specification. Each key is a HACK command or predefined value,
 *  each value is its binary representation. Binary, in this instance, is written as a string for ease of writing.
 */

this.C_DEST_SYMBOLS = {
    "null" : "000",
    "M" : "001",
    "D" : "010",
    "MD" : "011",
    "A" : "100",
    "AM" : "101",
    "AD" : "110",
    "AMD" : "111",
}

this.C_COMP_SYMBOLS = {
    // Begin instructions for a (first bit) = 0
    "0" : "0101010",
    "1" : "0111111",
    "-1" : "0111010",
    "D" : "0001100",
    "A" : "0110000",
    "!D" : "0001101",
    "!A" : "0110001",
    "-D" : "0001111",
    "-A" : "0110011",
    "D+1" : "0011111",
    "A+1" : "0110111",
    "D-1" : "0001110",
    "A-1" : "0110010",
    "D+A" : "0000010",
    "D-A" : "0010011",
    "A-D" : "0000111",
    "D&A" : "0000000",
    "D|A" : "0010101",
    // Begin instructions for a (first bit) = 1
    "M" : "1110000",
    "!M" : "1110001",
    "-M" : "1110011",
    "M+1" : "1110111",
    "M-1" : "1110010",
    "D+M" : "1000010",
    "D-M" : "1010011",
    "M-D" : "1000111",
    "D&M" : "1000000",
    "D|M" : "1010101",

}


this.C_JUMP_SYMBOLS = {
    "null" : "000",
    "JGT" : "001",
    "JEQ" : "010",
    "JGE" : "011",
    "JLT" : "100",
    "JNE" : "101",
    "JLE" : "110",
    "JMP" : "111",
}

this.MEM_SYMBOLS = {
    "SP" : 0,
    "LCL" : 1,
    "ARG" : 2,
    "THIS" : 3,
    "THAT" : 4,
    "R0" : 0,
    "R1" : 1,
    "R2" : 2,
    "R3" : 3,
    "R4" : 4,
    "R5" : 5,
    "R6" : 6,
    "R7" : 7,
    "R8" : 8,
    "R9" : 9,
    "R10" : 10,
    "R11" : 11,
    "R12" : 12,
    "R13" : 13,
    "R14" : 14,
    "R15" : 15,
    "SCREEN" : 16384,
    "KBD" : 24576,
}

this.LINE_SYMBOLS = {

}



/** Function to remove white space,
 * INTERFACE 
 * 
 * Expects: an array of lines of ASM code, unedited
 * 
 * Returns: an array of lines of ASM code, edited
 *  - no tabs/spaces at end of line

 *  - no empty lines
 */

this.removeWhiteSpace = function (line_array) {

    let comment_string = "//";
    let spaces = [" ", "    "];
    line_array = line_array
    .map((line) => { // clean spaces
        function removeSpaces(a_string) {
            a_string = a_string.replace(" ", "");
            if (a_string.includes(" ")) {
                return removeSpaces(a_string);
            } else { 
                return a_string;
            }
        }
        return removeSpaces(line);
    })
    .map((line) => { // clean comments
        if (line.includes(comment_string)) {
            line = line.split("//")[0];
            return line;
        } else {
            return line;
        }
    })
    .filter((line) => {
        if (! spaces.includes(line)) {
            return line;
        }
    })

    return line_array;
    // clean out comments
}


/** Function to parse All commands 
 * INTERFACE
 * 
 * Expects: an array of parsed asm code, one command per line
 * 
 * Returns: an array of machine code, per HACK specification one per line
 */


 this.parseAllCommands = function(commands) {
    // try changing the order in which commands are completed 
    let new_commands = [];

    for (let i=0; i<commands.length; i++) {
        if (commands[i].includes('@')) {
            new_commands.push(this.parseACommand(commands[i]));
        } else {
            new_commands.push(this.parseCCommand(commands[i]));
        }
    }   
    return new_commands;


    // return commands.map((command) => {
    //     if (command.includes('@')) {
    //         return this.parseACommand(command);
    //     } else {
    //         return this.parseCCommand(command);
    //     }
    // })
 }


/** Function to parse A commands
 * 
 * INTERFACE
 * 
 * Expects: an A command, syntax @<value>
 * 
 * Returns: parsed machine code, per HACK specs, for said A command
 * 
 * TODO: Symbol handling
 */

this.parseACommand = function(a_command) {
    let new_command = "0"; // base digit of an A command

    a_command = a_command.replace("@", ""); // get just the value

    if (Boolean(Number(a_command) + 1)) { // handles the A command if it is a number
        new_command = new_command + Number(a_command).toString(base=2);
        // the new command may not be of a width of 16
        while(new_command.length < 16) {
            // add trailing digits
            new_command = "0" + new_command;
        }
        if (new_command.length > 16) { // makes sure the number in command is less than 2^15
            throw new Error(`Parsed representation of command produces word witha  length of ${new_command.length}, which cannot be handled by a 16-bit system.`)
        } else {
            return new_command;
        }

    } else { // handles the A command if it is a symbol
        if (Object.keys(this.MEM_SYMBOLS).includes(a_command)) {
            return this.parseACommand(`@${this.MEM_SYMBOLS[a_command]}`)
        } else if (Object.keys(this.LINE_SYMBOLS).includes(a_command)) {
            return this.parseACommand(`@${this.LINE_SYMBOLS[a_command]}`);
        } 
        else { // find a new register for the symbol and assign it, if not already existent
            this.MEM_SYMBOLS[a_command] = this.getOpenRegister();
            return this.parseACommand(`@${a_command}`);
        }
    }


}

/** Function to parse C commands
* 
* INTERFACE
* 
* Expects: an C command, syntax <dest>=<comp>;<jump>
*   - dest is optional
*   - jump is optional
* 
* Returns: a string of the corresponding machine code command 
*/

this.parseCCommand = function(c_command) {
    let new_command = "111"; // base three digits of a A command

    let contains_dest = c_command.includes('=');
    let contains_jump = c_command.includes(';');

    if (contains_dest && contains_jump) { // case for <dest>=<comp>;<jmp>
        c_command = c_command.split("=") // returns [<dest>, <comp>;<jmp>]
        new_command += this.C_COMP_SYMBOLS[c_command[1].split(";")[0]]; // comp
        new_command += this.C_DEST_SYMBOLS[c_command[0]]; // dest
        new_command += this.C_JUMP_SYMBOLS[c_command[1].split(";")[1]]; // jmp
        return new_command;
    } else if (contains_dest && !contains_jump) { //case for <dest>=<comp>
        c_command = c_command.split("=") // returns [<dest>, <comp>]
        new_command += this.C_COMP_SYMBOLS[c_command[1]]; // comp
        new_command += this.C_DEST_SYMBOLS[c_command[0]]; // dest
        new_command += this.C_JUMP_SYMBOLS["null"]; // jmp is NULL
        return new_command;
    } else if (!contains_dest && contains_jump) { // case for <comp>;<jmp>
        c_command = c_command.split(";") // returns [<comp>;<jmp>]
        new_command += this.C_COMP_SYMBOLS[c_command[0]]; // comp
        new_command += this.C_DEST_SYMBOLS['null']; // destination is null
        new_command += this.C_JUMP_SYMBOLS[c_command[1]]; // jmp
        return new_command;
    } else {
        throw new Error(`The syntax of the command ${c_command} does not match the specified syntax for the HACK assembly language.`)
    }
}


/** TODO: Function to hoist symbols
 *  
 * INTERFACE:
 * 
 * Expects: An array of unparsed Assembly code, possibly including SYMBOLS
 * 
 * Returns: An array of unparsed Assembly code, assigning any symbols a value in MEM_SYMBOLS
 * 
 */

this.parseJumpSymbols = function(command_lines) {
    
    // parse through 'command_lines' and, for each one that is a jump symbole
    //  create an object: symbol, target, where target is the line it references
    let symbols = [];

    // get all symbols from lines, add to MEM_SYMBOLS

    let line_count = 0;
    let new_commands = [];

    command_lines.forEach((line) => {
        if (line.includes('(')) { // handles case where line is a symbol identification
            let i1 = line.indexOf('(');
            let i2 = line.indexOf(')');
            symbol = line.slice(i1 + 1, i2);

            // append index of line to symbol lines 
            this.LINE_SYMBOLS[symbol] = line_count;
            return;
        } else { // normal lines
            line_count++;
            new_commands.push(line);
            return;
        }
    });

    return new_commands;

}


/** Function to return first open memory address 
 * 
 * INTERFACE 
 * 
 * Expects: Nothing
 * Returns: The first available register in Memory after 15
 * 
 * 
 * 
 */

 this.getOpenRegister = function() {
    
    let new_reg;

    for (let i=16; i< this.MEM_SYMBOLS['SCREEN']; i++) {
        if (Object.values(this.MEM_SYMBOLS).includes(i)) {
            continue;
        } else {
            new_reg = i;
            break
        }
    }   
    
    //  // get last 10 used registers
    // let used_registers = Object.values(this.MEM_SYMBOLS);
    // used_registers = used_registers.filter((val) => {
    //     // get a list of the 
    //     if (Number(val) < Number(this.MEM_SYMBOLS['SCREEN'])) {
    //         return Number(val);
    //     }
    // }).sort((a, b) => {
    //     // make sure it is sorted, ascending
    //     if(a < b) {
    //         return;
    //     }
    // });



    // let new_reg = used_registers[used_registers.length - 1] + 1;

    // if (new_reg >  this.MEM_SYMBOLS['SCREEN']) { // condition that i is greater than the value of SCREEN, in that case you are out of memory
    //   throw new Error(`Sorry, the memory address ${this.MEM_SYMBOLS['SCREEN']} is allocaed for the screen. If you have tried to assign to it, then you are out of memory.`);
    // }

    // return one larger than the last element
    return new_reg;
 }
}


module.exports = parseTools;
