const express = require('express');
const fs = require('fs');
const app = express();
const morgan = require('morgan');
const filename = './items.json';
var id, items;
readFile();

app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function(request, response, next) {
  let item = request.body;
  if (['GET', 'DELETE'].includes(request.method)) {
    return next();
  }

  if (item && (item.name === undefined || item.name.length === 0)) {
    let err = new Error('Item must have a name');
    err.status = 400;
    return next(err);
  }
  if (item && (item.price === undefined || isNaN(Number(item.price)))) {
    let err = new Error('Item must have a price');
    err.status = 400;
    return next(err);
  }

  return next();
});

app.get('/items', function(request, response, next) {
  return response.json(items);
});

app.use('/items/:itemId', function(request, response, next) {
  let itemIndex = items.findIndex(item => item.id == request.params.itemId);
  if (itemIndex === -1) {
    let err = new Error('No item with that id exists');
    err.status = 404;
    return next(err);
  }
  request.item = items[itemIndex];
  request.index = itemIndex;
  return next();
});

app.get('/items/:itemId', function(request, response, next) {
  return response.json(request.item);
});

app.post('/items', function(request, response, next) {
  let item = request.body;
  item.id = ++id;
  items.push(item);
  let writeResults = writeFile();
  if (writeResults !== true) {
    next(writeResults);
  }
  return response.json(items);
});

app.patch('/items/:itemId', function(request, response, next) {
  request.item['name'] = request.body.name;
  request.item['price'] = request.body.price;
  let writeResults = writeFile();
  if (writeResults !== true) {
    next(writeResults);
  }
  return response.json(request.item);
});

app.delete('/items/:itemId', function(request, response, next) {
  items.splice(request.index, 1);
  let writeResults = writeFile();
  if (writeResults !== true) {
    next(writeResults);
  }
  return response.json(request.item);
});

function writeFile() {
  try {
    fs.writeFileSync(`${filename}`, JSON.stringify(items), 'utf8');
    return true;
  } catch (error) {
    readFile();
    console.error(error);
    throw error;
  }
}

function readFile() {
  try {
    items = JSON.parse(fs.readFileSync(`${filename}`), 'utf8');
    id = items[items.length - 1].id;
  } catch (error) {
    items = [];
    id = 0;
    throw error;
  }
}

app.use(function(err, request, response, next) {
  let status = err.status || 500;
  return response.status(status).json({
    error: {
      message: err.message,
      status: status
    }
  });
});

app.listen(3000, () => console.log('Listening now on 3000'));
