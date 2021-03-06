var tape = require('tape')
var path = require('path')
var each = require('stream-each')

run('azure-blobs', require('./')({containerName: 'mycontainer'}))

function run (name, st) {
  tape(name + ': delete all', function (t) {
    each(st.list(), function (data, next) {
      st.del(data.key, next)
    }, function () {
      st.list()
        .on('data', function (dta) {
          console.log('DATA', dta)
          t.fail('should be empty')
        })
        .on('end', function () {
          t.end()
        })
    })
  })

  tape(name + ': get non existing', function (t) {
    st.get('nope', function (err) {
      t.ok(err, 'should error')
      t.end()
    })
  })

  tape(name + ': put and get', function (t) {
    t.plan(6)

    st.put('hello', Buffer.from('world'), function (err) {
      t.error(err, 'no error')
      st.get('hello', function (err, buf) {
        t.error(err, 'no error')
        t.same(buf, Buffer.from('world'))
      })
    })

    st.put('world', Buffer.from('hi'), function (err) {
      t.error(err, 'no error')
      st.get('world', function (err, buf) {
        t.error(err, 'no error')
        t.same(buf, Buffer.from('hi'))
      })
    })
  })

  tape(name + ': list', function (t) {
    var expected = [
      {key: 'hello', size: 5},
      {key: 'world', size: 2}
    ]

    st.list()
      .on('data', function (data) {
        var next = expected.shift()
        t.same(data.key, next.key)
        t.same(data.size, next.size)
        t.ok(data.modified, 'has date')
      })
      .on('end', function () {
        t.same(expected.length, 0)
        t.end()
      })
  })

  tape(name + ': list limit', function (t) {
    var expected = [
      {key: 'hello', size: 5}
    ]

    st.list({limit: 1})
      .on('data', function (data) {
        var next = expected.shift()
        t.same(data.key, next.key)
        t.same(data.size, next.size)
        t.ok(data.modified, 'has date')
      })
      .on('end', function () {
        t.same(expected.length, 0)
        t.end()
      })
  })

  tape.skip(name + ': list marker', function (t) {
    var expected = [
      {key: 'world', size: 2}
    ]

    st.list({marker: 'hello'})
      .on('data', function (data) {
        var next = expected.shift()
        t.same(data.key, next.key)
        t.same(data.size, next.size)
        t.ok(data.modified, 'has date')
      })
      .on('end', function () {
        t.same(expected.length, 0)
        t.end()
      })
  })

  tape(name + ': rename', function (t) {
    t.plan(4)

    st.rename('world', 'foo/bar/baz', function (err) {
      t.error(err, 'no error')
      st.get('world', function (err) {
        t.ok(err, 'should error')
      })
      st.get('foo/bar/baz', function (err, data) {
        t.error(err, 'no error')
        t.same(data, Buffer.from('hi'))
      })
    })
  })

  tape(name + ': read/write stream', function (t) {
    var ws = st.createWriteStream('hello')
    for (var i = 0; i < 512; i++) ws.write(Buffer.alloc(1024))
    ws.end(function () {
      setTimeout(function () {
        var rs = st.createReadStream('hello')
        var buffer = []
        rs.on('data', data => buffer.push(data))
        rs.on('end', function () {
          t.same(Buffer.concat(buffer), Buffer.alloc(512 * 1024))
          t.end()
        })

      }, 7000)
      
    })
  })

  tape(name + ': del', function (t) {
    st.del('hello', function (err) {
      t.error(err, 'no error')
      st.del('foo/bar/baz', function (err) {
        t.error(err, 'no error')
        st.list()
          .on('data', function (data) {
            t.fail('should be empty')
          })
          .on('end', function () {
            t.end()
          })
      })
    })
  })
}
