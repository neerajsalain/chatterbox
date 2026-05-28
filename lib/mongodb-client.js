import { MongoClient, ServerApiVersion } from 'mongodb'

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let clientPromise

const uri = process.env.MONGODB_URI

if (!uri) {
  // During `next build` static analysis MONGODB_URI isn't available.
  // A rejected Promise is safe here — it only rejects when actually awaited at request time,
  // which never happens in a correctly configured deployment.
  clientPromise = Promise.reject(
    new Error('MONGODB_URI environment variable is not defined')
  )
  clientPromise.catch(() => {}) // Suppress unhandled rejection warning at module level
} else if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  const client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
