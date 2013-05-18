#BoxspringJS

A toolkit for cross-platform development of CouchDB Applications.

From the command line on the server, use BoxspringJS and Node.js to develop content aggregation tools to drive 
CouchDB map/reduce engine. 
BoxspringJS provides methods for queuing bulk http requests when downloading data and wraps 
CouchDB's bulk loading interface with a queueing mechanism for reliably bulk loading 
vast numbers of documents without over-taxing network resources.

From the browser, BoxspringJS provides uniform access to evented query/result objects. A single
query can request millions of rows of data without over-running the resources of the browser.
By specifying <code>page-size</code> and <code>cache-size</code> parameters users can request an initial 
block of data and display it while the browser asynchronously fetches additional data upto the 
requested cache limit. Built-in <code>page-next</code> and <code>page-previous</code> methods
facilitate easy page forward and page back functionality. Evented query/result objects are
equally available to server-side execution in Node.js.

BoxpsringJS augments CouchDB's design document with a <code>header</code> section to define
labels for keys and columns and their mappings to key fields and document properties in the
view definition. BoxspringJS uses this header information to wrap CouchDB response objects
with methods for easy iteration over collections of rows, and to access keys/column 
values by their labels.

BoxspringJS provides a uniform interface to Google Visualization library. Evented query/result
objects are transformed in to Google Table objects where they can be rendered into 
spreadsheets, line charts, heat maps, etcetera.  
