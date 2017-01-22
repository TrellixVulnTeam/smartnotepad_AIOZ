'use strict'

var Language = require('@google-cloud/language');
var Storage = require('@google-cloud/storage');

// Your Google Cloud Platform project ID
const projectId = 'smartnotepad-156308';
const text = 'President Obama is speaking at the White House.';

parse(text);

function dependentTokens(node, tokenArray){
    var dependentTokens = {};
    var index = tokenArray.indexOf(node);
    var tempArray = []
    for(var i in tokenArray){
        if(tokenArray[i].dependencyEdge.headTokenIndex == index){
            tempArray.push(tokenArray[i]);
            //dependentTokens[index].push(tokenArray[i].text.content);
        }
        dependentTokens[index] = tempArray;
    }

    return dependentTokens;
}

function removeTokens(tokenArray, entity){
    var tempTokens = tokenArray;
    var string = "";
    var toRemove = [];

    for (var tokens = tempTokens.length -1; tokens >= 0; tokens--){
        string = tempTokens[tokens].text.content;

        //console.log(string);
        if(entity.name.includes(string)){
            //console.log(string);
            var temp = dependentTokens(tempTokens[tokens], tokenArray);
            //console.log(temp);
            for (var key in temp){
                if (!temp[key].length == 0) {
                    //console.log(temp[key]);
                    for (var t in temp[key]) {
                        toRemove.push(temp[key][t]);
                    }
                    //console.log(toRemove);
                }
            }
            toRemove.push(tempTokens[tokens]);
            //var index = tempTokens.indexOf(tempTokens[tokens]);
            //tempTokens.splice(index, 1);
        }
    }
    for (var i in toRemove) {
        var index = tempTokens.indexOf(toRemove[i]);
        tempTokens.splice(index, 1);
    }
    //console.log(tempTokens);
    return tempTokens;
}

function whInversion(entity, removed, original){
    var retString = "";
    if(entity.type == "PERSON"){
        retString += "Who ";
    }
    else if (entity.type == "LOCATION"){
        retString += "Where ";
    }
    else if(entity.type == "EVENT"){
        //what question
        retString += "What ";
    }
    else if(entity.type == "ORGANIZATION"){
        //what question
        retString += "What ";
    }
    else if(entity.type == "OTHER"){
        //what question
        retString += "What ";
    }
    else if(entity.type == "PRODUCTS"){
        //what question
        retString += "What ";
    }
    else if(entity.type == "MEDIA"){
        //what question
        retString += "What ";
    }
    for (var token in removed) {
        retString += (removed[token].text.content + " ");
    }
    console.log(retString);
}

function parse(text){
    var promises = [];
    const syntax = analyzeSyntaxOfText(text);
    const entities = analyzeEntitiesOfText(text);
    promises.push(syntax);
    promises.push(entities);
    Promise.all(promises).then(function(results){
        var answer = results[0];
        var temp = results[1];
        var ArrayOfEntities = temp.entities;
        var tokens = results[0].tokens;
        for(var entity in ArrayOfEntities){
             var tempEntity = ArrayOfEntities[entity];
             var tempToken = tokens.slice(0);
             var removed = removeTokens(tempToken, tempEntity);
             whInversion(tempEntity, removed, tokens);
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

// [END language_syntax_string]

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
      //console.log(results);
      //console.log('Tags:');
      //syntax.forEach((part) => console.log(part.tag));

      return syntax;
    });
}
// [END language_syntax_file]
