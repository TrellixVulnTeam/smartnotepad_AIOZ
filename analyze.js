'use strict'

var Language = require('@google-cloud/language');
var Storage = require('@google-cloud/storage');

// Your Google Cloud Platform project ID
const projectId = 'smartnotepad-156308';
const text = 'davis is writing code.';

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

function remove(item, array){
    //console.log(item);
    var index = array.indexOf(item);
    array.splice(index, 1);
    //return array;
}



function removeTokens(tokenArray, entity){
    var answer = {};
    var tempTokens = tokenArray;
    var string = "";
    var toRemove = [];

    for (var tokens = tempTokens.length -1; tokens >= 0; tokens--){
        string = tempTokens[tokens].text.content;

        if(entity.name.includes(string)){

            var temp = dependentTokens(tempTokens[tokens], tokenArray);
            if(tempTokens[tokens].dependencyEdge.label == "ROOT"){
                continue;
            }
            for (var key in temp){
                if (!temp[key].length == 0) {
                    for (var t in temp[key]) {
                        toRemove.push(temp[key][t]);
                    }
                }
            }

            toRemove.push(tempTokens[tokens]);
            answer[JSON.stringify(entity)] = toRemove;
        }
    }
    for (var i in toRemove) {
        var index = tempTokens.indexOf(toRemove[i]);
            //console.log(index, toRemove[i].text.content);
            if (index >=0)
                tempTokens.splice(index, 1);
    }
    //console.log(tempTokens);
    // for(var key in answer){
    //     console.log(key, answer[key]);
    // }
    return tempTokens;

}


function aux(retString, removed, flag){
    for(var item = removed.length-1; item >= 0; item--){
        if(removed[item].dependencyEdge.label == "AUX"){
            retString += (removed[item].text.content + " ");
            //console.log(removed);
            remove(removed[item], removed);
            flag = 1;
        }
    }
    if (flag == 0) {
        retString += "did ";
    }
    if(flag == 2){
        for(var item = removed.length-1; item >= 0; item--){
            if(removed[item].dependencyEdge.label == "ROOT"){
                retString += (removed[item].text.content + " ");
                remove(removed[item], removed);
                flag = 1;
            }
        }
    }
    var newLemma;
    for(var item in removed){
        if(removed[item].dependencyEdge.label == "ROOT" && flag == 0){
            newLemma = removed[item].lemma;
            // removed.splice(item, 1);
            retString += (newLemma + " ");
        }
        else
        {
            retString += (removed[item].text.content + " ");
        }
    }
    retString = retString.slice(0, -4);
    retString += "?";
    return retString;
}


function inversion(entity, removed, original){
    var answer = {};
    //console.log(original)
    var retString = "";
    var flag = 0;
    var index;

    for(var node in original){
        var label = original[node].dependencyEdge.label;
        var text = original[node].text.content;
        if((label == "ROOT") && (text == "is" || text == "do" || text == "have" ||
            text == "has" || text == "had" || text == "does" || text == "did"))
            {
                flag = 2;
                //console.log(text, flag);
                //index = original.indexOf(original[node]);
            }
    }

    if(entity.type == "PERSON"){
        retString += "Who ";
        retString = aux(retString, removed, flag);

    }
    else if (entity.type == "LOCATION"){
        var flag = 0;
        var string = "";
        //console.log(removed);

        for (var tokens = original.length -1; tokens >= 0; tokens--){
            string = original[tokens].text.content;
            if(entity.name.includes(string)){
                if (original[tokens].dependencyEdge.label == "NSUBJ") {
                    retString += "Who ";
                    flag = 1;

                }
            }
        }
        if (flag == 1) {
            for(var item in removed){
                retString += (removed[item].text.content + " ");
            }
        }
        if (flag == 0) {
            retString += "Where ";
            retString = aux(retString, removed, flag);
        }
        // retString += "Where ";
        // retString = aux(retString, removed);
    }
    else if(entity.type == "EVENT"){
        //what question
        retString += "What ";
        retString = aux(retString, removed, flag);
    }
    else if(entity.type == "ORGANIZATION"){
        //what question
        retString += "Which organization ";
        retString = aux(retString, removed, flag);
    }
    else if(entity.type == "OTHER"){
        //what question
        retString += "What ";
        retString = aux(retString, removed, flag);
    }
    else if(entity.type == "CONSUMER_GOOD"){
        //what question
        retString += "What consumer good ";
        retString = aux(retString, removed, flag);
    }
    else if(entity.type == "MEDIA"){
        //what question
        retString += "What ";
        retString = aux(retString, removed, flag);
    }
    console.log(retString);
    answer[retString] = entity;
    //console.log(answer);
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
        //console.log(results[0]);
        for(var entity in ArrayOfEntities){
             var tempEntity = ArrayOfEntities[entity];
             var tempToken = tokens.slice(0);
             var removed = removeTokens(tempToken, tempEntity);
             inversion(tempEntity, removed, tokens);
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
      return syntax;
    });
}
// [END language_syntax_file]
