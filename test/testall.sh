#!/bin/bash
echo Objects
node objects.js | grep 'not ok'
echo Test1
node test1.js | grep 'not ok'
echo Test2
node test2.js | grep 'not ok'
echo Test3
node test3.js | grep 'not ok'
echo Test4
node test4.js | grep 'not ok'
