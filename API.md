##API Reference

__boxspring([name, [options]])__

Create a new database object. <code>name</code> is a string for the name of the database on the server. <em>Note: Creating a database object does not create the database on the server. For that you must call the <code>save</code> method of the database object.</em>

        var mydb = boxspring('my-db');
        
The following <code>options</code> can be supplied to initialize the database object:

<table>
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>id</td>
    <td>String</td>
    <td>System generated</td>
    <td>Unique id for this database object</td>
  </tr>
    <tr>
    <td>index</td>
    <td>String</td>
    <td>"Index"</td>
    <td>The default map/reduce view for this database</td>
  </tr>
    <tr>
    <td>designName</td>
    <td>String</td>
    <td>"_design/default"</td>
    <td>The name of the design document describing map/reduce views to use for this session. Note: If this design document is not already existing on the server, you will have to save it to the server first.</td>
    <tr>
    <td>maker</td>
    <td>Function</td>
    <td></td>
    <td>A function that returns a design document object</td>
  </tr>
    <tr>
    <td>authorization</td>
    <td>Function</td>
    <td></td>
    <td>A callback function with authentication status</td>
  </tr>
</table>

###BoxspringJS Modules

* [Database methods](https://github.com/rranauro/boxspringjs/blob/master/db.md)
* [Document methods](https://github.com/rranauro/boxspringjs/blob/master/doc.md)
* [Bulk methods](https://github.com/rranauro/boxspringjs/blob/master/bulk.md)
* [Design methods](https://github.com/rranauro/boxspringjs/blob/master/design.md)
* [Query/Result methods](https://github.com/rranauro/boxspringjs/blob/master/query.md)
* [Rows/Row/Cell methods](https://github.com/rranauro/boxspringjs/blob/master/rows.md)
* [Display methods](https://github.com/rranauro/boxspringjs/blob/master/display.md)
* [List methods](https://github.com/rranauro/boxspringjs/blob/master/list.md)

###Library Modules

* [Queue object](https://github.com/rranauro/boxspringjs/blob/master/db.md)
* [Tree object](https://github.com/rranauro/boxspringjs/blob/master/db.md)
* [Hash object](https://github.com/rranauro/boxspringjs/blob/master/db.md)
* [File I/O object](https://github.com/rranauro/boxspringjs/blob/master/db.md)
* [ObjTree object](https://github.com/rranauro/boxspringjs/blob/master/db.md)


