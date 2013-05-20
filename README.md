#BoxspringJS

A toolkit for cross-platform development of CouchDB Applications.

##Overview

From the command line on the server, use BoxspringJS and Node.js to develop content aggregation tools to drive CouchDB map/reduce engine. BoxspringJS provides methods for queuing bulk http requests when downloading data and wraps CouchDB's bulk loading interface with a queueing mechanism for reliably bulk loading vast numbers of documents without over-taxing network resources.

From the browser, BoxspringJS provides uniform access to evented query/result objects. A single query can request millions of rows of data without over-running the resources of the browser. By specifying <code>page-size</code> and <code>cache-size</code> parameters users can request an initial block of data and display it while the browser asynchronously fetches additional data up-to the requested cache limit. Built-in <code>page-next</code> and <code>page-previous</code> methods facilitate easy page forward and page back functionality. Evented query/result objects are
equally available to server-side execution in Node.js.

BoxpsringJS augments CouchDB's design document with a <code>header</code> section to define labels for keys and columns and their mappings to key fields and document properties in the view definition. BoxspringJS uses this header information to wrap CouchDB response objects with methods for easy iteration over collections of rows, and to access keys/column values by their labels.

BoxspringJS provides a uniform interface to Google Visualization library. Evented query/result objects are transformed in to Google Table objects where they can be rendered into spreadsheets, line charts, heat maps, etcetera.  

####Example
    // initialize a new database object
    var mydb = boxspring('my-db');
    
    // create it on the server
    mydb.save(function(err, response) {
    
      if (err) {
        return console.log('error creating database: ' + mydb.name, err);
      }
      
      // create a new document object
      var mydoc = mydb.doc('my-doc');
      
      // add some content to the document
      mydoc.extend({'resources': 'some-data'});
      
      // save the document to the database on the server
      mydoc.save(function(err, response) {
      
        if (err) {
          return console.log('error creating document', err);
        }
        
        // change the content of the document
        mydoc.extend({'resources': 'revised-data'})
        
          // mydoc object keeps track of the document revision
          .update(function(err, response) {
            
            if (err) {
              return console.log('error updating document', err);
            }
            
            console.log('successfully updated ' + mydoc.docId();
            mydoc.remove(function(err, response) {
              if (err) {
                return console.log('unable to remove', mydoc.docId(), err);
              }
                
              // try to open the document just removed
              mydoc.open(function(err, response) {
              
                // expect a 404 document not found error
                if (!err) {
                  return console.log('expected open to fail', mydoc.docId(), err);
                }
                if (response.code === 404) {
                  console.log('successfully removed ' + mydoc.docId();
                }
              } 
            }
          }
        }
      }
      
##[BoxspringJS Complete API Reference]()

##Install

##License


        
     


    
