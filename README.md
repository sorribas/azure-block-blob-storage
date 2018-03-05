# azure-block-blob-storage

Small module wrapper for the AWS sdk that allows you to easily use azure.

```
npm install azure-block-blob-storage 
```

## Usage

``` js
var azure = require('azure-block-blob-storage')({
  containerName: 'my-container'
  connectionString: '...'
})

azure.put('hello', 'world', function () {
  azure.get('hello', console.log)
})
```

Or if you want use the file system locally instead

``` js
var azure = require('azure-block-blob-storage')('my-bucket', {
  type: 'fs' // will store the data in ./my-bucket
})

// azure has the same api
```

## API

#### `var azure = azurestorage(bucket, [options])`

Make a new storage instance. Options include:


#### `azure.put(key, value, [callback])`

Write a new value.

#### `azure.get(key, callback)`

Read a value out

#### `azure.del(key, [callback])`

Delete a value

#### `azure.createReadStream(key, options)`

Create a readable stream to a key.

#### `azure.createWriteStream(key, options)`

Create a writeable stream to a key. Options include

``` js
{
  length: sizeOfStream, // required
}
```

#### `azure.rename(src, dest, [callback])`

Rename a folder/file

#### `azure.stat(key, callback)`

Return stat info about a key. The returned object looks like this:

``` js
{
  size: sizeOfValue,
  modified: lastModifiedDate
}
```

#### `var stream = azure.list([options])`

Create a list stream. Each data emitted looks like this

``` js
{
  key: 'value/key', // the value key
  size: 24, // how many bytes
  modified: Date() // when was it modified last?
}
```

Options include:

``` js
{
  prefix: 'foo', // only list keys under foo
  limit: 14 // only return this many
}
```

## License

MIT
