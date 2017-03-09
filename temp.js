'use strict'

var Language = require('@google-cloud/language');
var Storage = require('@google-cloud/storage');

// Google Cloud Plaform project ID
const projectId = 'smartnotepad-156308';

const testString = 'President Obama is giving a speech at the White House.'

// returns the token based on name of entity
function findToken(entity, tokenArray){
  var name = entity.name;
  for(var i in tokenArray){
    if(tokenArray[i].text.content == name){
      return tokenArray[i];
    }
  }
  return -1;
}

// returns node and all dependent tokens
function dependentTokens(node, tokenArray) {
  var dependentTokens = [];
  var nodeIndex = tokenArray.indexOf(node);
  for(var i in tokenArray){
    if(tokenArray[i].dependencyEdge.headTokenIndex == nodeIndex){
      dependentTokens.push(tokenArray[i]);
    }
  }
  dependentTokens.push(node);
  return dependentTokens;
}

// returns last word in multi-word entity
function splitEntity(entity, tokenArray){
  var string = entity.name;
  while(string.indexOf(" ") != -1){
    var indexOfSpace = string.indexOf(" ");
    string = string.slice(indexOfSpace+1);
  }
  for(var i in tokenArray){
    if(tokenArray[i].text.content == string){
      return tokenArray[i];
    }
  }
  return entity;
}

// remove answer tokens from tokenArray
function removeTokens(tokenArray, entityToRemove){
  // split entityToRemove for multiple words
  // find all dependentTokens
  // remove
}

// parse notes and create questions
function parse(text) { // FIXME: add callback
  var promises = [];
  var questions = [];
  const syntax = analyzeSyntaxOfText(text);
  const entities = analyzeEntitiesOfText(text);
  // Google API returns results asychronously
  // Global Promises used to make them sychronous
  promises.push(syntax);
  promises.push(entities);
  Promise.all(promises).then(function(results){
    var tokenArray = results[0].tokens;
    var entityArray = results[1].entities;
    for(var index in entityArray){
      var entity = entityArray[index];
      if (entity.name.indexOf(" ") == -1){
        var tokensToRemove = dependentTokens(findToken(entity, tokenArray), tokenArray);
      }
      else {
        var token = splitEntity(entity, tokenArray);
        var tokensToRemove = dependentTokens(token, tokenArray);
      }
      console.log(tokensToRemove);
    }
  });
}

// [START language_syntax_string]
function analyzeSyntaxOfText (text) {
  // Instantiates a client
  const languageClient = Language({
      projectId: projectId,
      keyFilename: 'smartnotepad-a4b570c72ce1.json'
  });

  // Instantiates a Document, representing the provided text
  const document = languageClient.document({
    // The document text, e.g. "Hello, world!"
    content: text
  });

  // Detects syntax in the document
  return languageClient.detectSyntax(text)
    .then((results) => {
      const syntax = results[1];
      //console.log('Tags:');
      //parse(syntax);
      //syntax.forEach((part) => console.log(part.text, part.dependencyEdge));

      return syntax;
    });
}
// [END langauge_synatax_string]

// [START language_entities_string]
function analyzeEntitiesOfText (text) {
    const languageClient = Language({
        projectId: projectId,
        keyFilename: 'smartnotepad-a4b570c72ce1.json'
    });
    const document = languageClient.document({
      // The document text, e.g. "Hello, world!"
      content: text
    });
    return languageClient.detectEntities(text)
    .then((results) => {
        const entities = results[1];
        return entities;
    });
}
// [END language_entities_string]

// [START language_syntax_file]
function analyzeSyntaxInFile (bucketName, fileName) {
  // Instantiates clients
  const language = Language();
  const storage = Storage();

  // The bucket where the file resides, e.g. "my-bucket"
  const bucket = storage.bucket(bucketName);
  // The text file to analyze, e.g. "file.txt"
  const file = bucket.file(fileName);

  // Instantiates a Document, representing a text file in Cloud Storage
  const document = language.document({
    // The GCS file
    content: file
  });

  // Detects syntax in the document
  return document.detectSyntax()
    .then((results) => {
      const syntax = results[0];
      return syntax;
    });
}
// [END language_syntax_file]

// read notes from file 
// fs.readFileSync('input.txt').toString().split('\n').forEach(function (line) {
//   parse(line, function(results){
//     console.log("Input: "+ line);
//     for(var key in results[0]){
//         console.log("Questions: " + key);
//         console.log("Answer: " +results[0][key].name);
//     }
//   });
// });

parse(testString); // for testing