'use strict'

var Language = require('@google-cloud/language');
var Storage = require('@google-cloud/storage');

// Your Google Cloud Platform project ID
const projectId = 'smartnotepad-156308';
const text = 'Google, headquartered in Mountain View, unveiled the new Android phone at the Consumer Electronic Show.  Sundar Pichai said in his keynote that users love their new Android phones.';

analyzeSyntaxOfText(text);

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
  languageClient.detectSyntax(text)
    .then((results) => {
      const syntax = results[0];
      //console.log(results);
      console.log('Tags:');
      syntax.forEach((part) => console.log(part.tag));

      //return syntax;
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

      console.log('Tags:');
      syntax.forEach((part) => console.log(part.tag));

      return syntax;
    });
}
// [END language_syntax_file]
