const http = require('http')
const url = require('url')
const MongoClient = require('mongodb').MongoClient
const uri = 'mongodb://localhost:27017'
const ObjectId = require('mongodb').ObjectID
const PORT = process.env.PORT || 3000

const handlers = {}
const database = {}
let db;

database.create = (newbie, callback) => {
  db.collection('newbies').insertOne(newbie, (err, result) => {
    if(!err && result) {
      callback(null, result)
    } 
    else {
      callback(err)
    }
  })

}

database.read = (newbieId, callback) => {
  const id = new ObjectID(newbieId)
  db.collection.findOne({_id: id}, (err, result) => {
    if(!err && result) {
      callback(null, result)
    } 
    else {
      callback(err)
    }
  })
}


database.update = () => {}

database.delete = () => {}


handlers.newbies = (parsedReq, res) => {
  const acceptMethods = ['get', 'post', 'put', 'delete']

  if(acceptMethods.includes(parsedReq.method)) {
    handlers._newbies[parsedReq.method](parsedReq, res)
  }
  else {
    res.writeHead(400)
    res.end("Not an accepted method")
  }

}

handlers._newbies = {}

handlers._newbies.get = (parsedReq, res) => {
  const newbieId = parsedReq.queryStringObject.id
  database.read(newbieId, (err, result) => {
     if(!err && result) {
      res.end(JSON.stringify(result))
    }
    else {
      res.end(err)
    }
  })
}

handlers._newbies.post = (parsedReq, res) => {
  const newbie = JSON.parse(parsedReq.body)
  
  database.create(newbie, (err, result) => {
    if(!err && result) {
      res.end(JSON.stringify(result.ops[0]))
    }
    else {
      res.end(err)
    }
  }) 
  
}

handlers._newbies.put = (parsedReq, res) => {
  res.end('PUT')
}

handlers._newbies.delete = (parsedReq, res) => {
  res.end('DELETE')
}


handlers.notFound = (parsedReq, res) => {
  res.writeHead(404)
  res.end('Route with this name not found, ooops')
}

const router = {
  newbies: handlers.newbies
}

const server = http.createServer((req, res) => {
  
  const parsedReq = {}

  //Parsing url to get info
  parsedReq.parsedUrl = url.parse(req.url, true)

  //Attaching all to parsedReq object
  parsedReq.path = parsedReq.parsedUrl.pathname
  parsedReq.trimmedPath = parsedReq.parsedUrl.path.replace(/^\/+|\/+$/g, '')
  parsedReq.method = req.method.toLowerCase()
  parsedReq.headers = req.headers
  parsedReq.queryStringObject = parsedReq.parsedUrl.query
  
  let body = []

  console.log(parsedReq.parsedUrl.query)

  req.on('data', (chunk) => {
    body.push(chunk)
  })

  req.on('end', () => {
    body = Buffer.concat(body).toString()
    parsedReq.body = body

    const  routeHandler = typeof(router[parsedReq.trimmedPath]) !== 'undefined' ? router[parsedReq.trimmedPath] : handlers.notFound

    routeHandler(parsedReq, res)

  })
})



MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
  if(err) {
    return `Error occurred during connection to ${uri}`
  }
  console.log('Successfully connected to mongodb')
  db = client.db('node_newbies')
})

server.listen(PORT, () => console.log(`Server running port on ${PORT}`))