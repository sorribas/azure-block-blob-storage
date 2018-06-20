var azure = require('azure-storage')
var concat = require('concat-stream')
var once = require('once')
var stream = require('stream')
var from = require('from2')

module.exports = azureBlob

function azureBlob (opts) {
  var that = {}
  var containerName = opts.containerName
  var blobs = azure.createBlobService(opts.connectionString)
  
  that.put = function (key, content, cb) {
    blobs.createContainerIfNotExists(containerName, oncontainer)

    function oncontainer(err, result, response){
      if(err) return cb(err)
      blobs.createBlockBlobFromText(containerName, key, content, oncreateblob)
    }

    function oncreateblob (err, result, response) {
      if (err) return console.log(err)
      cb(null, result, response)
    }
  }

  that.get = function (key, cb) {
    cb = once(cb || function () {})
    blobs.getBlobToStream(containerName, key, concat(ondata), function (err) {
      if (err) return cb(err)
    })

    function ondata (data) {
      cb(null, data)
    }
  }

  that.del = function (key, cb) {
    blobs.deleteBlob(containerName, key, cb)
  }

  that.createReadStream = function (key) {
    var strm = new stream.PassThrough

    var reading = false
    var oldread = strm._read
    strm._read = function () {
      if (!reading) {
        blobs.getBlobToStream(containerName, key, strm, function () {})
        reading = true
      }

      oldread.apply(this, arguments)
    }

    return strm
  }

  that.createWriteStream = function (key) {
    return blobs.createWriteStreamToBlockBlob(containerName, key, function () {})
  }

  that.rename = function (src, dest, cb) {
    blobs.startCopyBlob(blobs.getUrl(containerName, src), containerName, dest, oncopy)

    function oncopy (err) {
      if (err) return cb(err)
      that.del(src, cb)
    }
  }

  that.stat = function (key, cb) {
    cb = cb || function() {}
    blobs.getBlobProperties(containerName, key, function (err, data) {
      if (err) return cb(err)
      cb(null, {
        size: data.contentLength,
        modified: data.lastModified
      })
    })
  }

  that.list = function (opts) {
    opts = opts || {}
    var strm = from.obj(read)
    var buf = []
    var token = null
    var lastSegment = false
    var count = 0
    var prefix = opts.prefix || null

    return strm

    function read (size, cb) {
      if (!buf.length) {
        if (lastSegment) return cb(null, null)
        var listBlobsOptions = {}
        if (opts.limit) listBlobsOptions.maxResults = opts.limit
        return blobs.listBlobsSegmentedWithPrefix(containerName, prefix, token, listBlobsOptions, onsegment)
      }
      nextItem()

      function onsegment (err, segment) {
        if (err) return cb(err)

        token = segment.continuationToken
        if (!token) lastSegment = true
        if (lastSegment && !segment.entries.length) return cb(null, null)
        buf = segment.entries.map(function (entry) {
          return {
            key: entry.name,
            size: Number(entry.contentLength),
            modified: entry.lastModified
          }
        })

        nextItem()
      }

      function nextItem () {
        if (count++ === opts.limit) return cb(null, null)
        cb(null, buf.shift())
      }
    }
  }

  return that
}
