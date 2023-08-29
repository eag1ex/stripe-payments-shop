const readline = require('readline');
const fs = require('fs');

const testCaseNameRegex = /(?<='|")(.*)(?='|")/
const testCaseStartRegex = /\stest\(/;
const annotationsDescriptionRegex = /description\: /;
const annotationsStartRegex = /\stest\.info\(\)\.annotations\.push/;

const testFilesPath = './specs';
const rubric = require('../results/rubric.json');
const rubricItemIdsList = Object.keys(rubric.items);


let missingLogs = {
    testCases: [],
    learnerPrompts: [],
    helpTexts: []
};

/**
 ***********************************************************************************************
 *   CORE LOGIC
 * 1. Get the list of milestone spec files from the spec files folder
 * 2. Then scan the Rubric file for missing items & populate the missing items log 
 * 3. For each file, scan for missing items and populate missing log list
 * 4. Once the list of logs are populated, display corresponding messages in the console
 ***********************************************************************************************
 */

(function() {
    const specFilesList = getSpecFileNames(testFilesPath);

    validateRubricContents();
    scanForMissingItems(specFilesList);
    displayMessagesInConsole();
})();

/**
 ******************
 * HELPER FUNCTIONS
 ******************
 */

// use the file content string array to generate missing items log
function generateMissingItemLog(fileName) 
{

    const fileContentList = readFileIntoArray(`${testFilesPath}/${fileName}`);
       
    let index;
    
    for (index = 0; index < fileContentList.length; index++) 
    {        
        const lineContent = fileContentList[index];   

        if (testCaseStartRegex.test(lineContent))
        {
            const matchedRegexArray = lineContent.match(testCaseNameRegex);
            const testCaseName = matchedRegexArray[0];
            const testCaseId = testCaseName.split(':')[1];

            // since we know there is a 
            // missing entry in the rubric
            // there is no need to scan further 
            if (!rubricItemIdsList.includes(testCaseId)) 
            {
                missingLogs.testCases.push(`MISSING RUBRIC ITEM: Test Case "${testCaseName}" located in file "${fileName}" does not have a corresponding entry in the Rubric file`);
            }
            else
            {
                index ++;
                let currentLineContent = fileContentList[index];                 
                let nextLineContent = fileContentList[index + 1];

                // simple look ahead based condition for checking the end of the current TC
                // if next line contains start of a new TC then end search for annotations
                while (nextLineContent && !testCaseStartRegex.test(nextLineContent))
                {
                    if (annotationsStartRegex.test(currentLineContent))
                    {                            
                        // read next line(s) until description is found
                        while (!annotationsDescriptionRegex.test(currentLineContent))
                        {
                            index ++;
                            currentLineContent = fileContentList[index];
                        }

                        const helpTextKey = extractHelptextKey(currentLineContent);
                        
                        if (
                            typeof(rubric.items[testCaseId].helptext) !== 'object' || 
                            !rubric.items[testCaseId].helptext[helpTextKey] || 
                            rubric.items[testCaseId].helptext[helpTextKey] == ''
                        ) 
                        {
                            missingLogs.helpTexts.push(`MISSING HELPTEXT: Rubric Item ${testCaseId} must have a helptext object with a value for the hint "${helpTextKey}"`);
                        }                                                         
                    }
                    index ++;   
                    currentLineContent = fileContentList[index];
                    nextLineContent = fileContentList[index + 1];                                
                }
            }                                     
        }
    }
}

// extracts helptext key from the annotation
function extractHelptextKey(currentLineString) 
{
    let helpTextKey = currentLineString;

    // if the entire annotation object with 
    // the type and the description is in
    // the same line, then extract description
    if (currentLineString.includes('type:')) {
        helpTextKey = helpTextKey.split(',')[1];
    }

    // if the entire annotation is in same line
    // like so:`test.info().annotations.push({})`,
    // then remove parenthesis & extract description
    if (currentLineString.includes('})')) {
        helpTextKey = helpTextKey.replace(/\}\).*/, '');
    }

    // extracting the value of the description key
    helpTextKey = helpTextKey.split(':')[1].trim();

    if (helpTextKey.includes(`'`)) {
        helpTextKey = helpTextKey.replace(/\'/g,'',);
    }
    else if (helpTextKey.includes(`"`)) {
        helpTextKey = helpTextKey.replace(/\"/g,'',);
    }

    return helpTextKey;
}

// validates the rubric contents
function validateRubricContents() 
{
    rubricItemIdsList.forEach(itemId => {
        if (rubric.items[itemId].learner_prompt == "") 
        {
            missingLogs.learnerPrompts.push(`MISSING PROMPT: Rubric Item ${itemId} is missing a "learner_prompt" value`);
        }
    
        if (rubric.items[itemId].helptext == "") 
        {
            missingLogs.helpTexts.push(`MISSING HELPTEXT: Rubric Item ${itemId} is missing a "helptext" value`);
        }
    
        if (typeof(rubric.items[itemId].helptext) == 'object' && (rubric.items[itemId].helptext.default === '' || !rubric.items[itemId].helptext.default)) 
        {
            missingLogs.helpTexts.push(`MISSING HELPTEXT: Rubric Item ${itemId} does not have the default helptext entered`);
        }
    });
}

// display messages in console based on missing logs list
function displayMessagesInConsole()
{
    if (missingLogs.testCases) {
        messageLogger(missingLogs.testCases);
    }
    if (missingLogs.learnerPrompts) {
        messageLogger(missingLogs.learnerPrompts);
    }
    if (missingLogs.helpTexts) {
        messageLogger(missingLogs.helpTexts);
    }
    if (!missingLogs.testCases.length && !missingLogs.learnerPrompts.length && !missingLogs.helpTexts.length) 
    {
        console.log('All test cases have complete rubric items.');
    }
}

// takes a list of files and calls `generateMissingItemLog` fn on each file
function scanForMissingItems(listOfFiles)
{
    listOfFiles.forEach(file => {
        generateMissingItemLog(file);
    });
}

// opens a file, reads its lines into an array and returns it
function readFileIntoArray(filePath)
{
    return fs.readFileSync(filePath, {encoding: 'utf8'}).split('\n').filter(line => {if (line !== '') return line });
} 

// logs list of messages
function messageLogger(listOfMessages) 
{
    listOfMessages.map(message => console.log(message));
}

function getSpecFileNames(filePath)
{
    return fs.readdirSync(filePath).filter(specName => {return specName != 'smoke.spec.ts';});
}