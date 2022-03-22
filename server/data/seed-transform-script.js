const csv = require('fast-csv')
const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream')
const cuid = require('cuid')
const avro = require('avro-js')

// const record = []
const seedFilePath = path.join(__dirname, 'seed.csv')

const csvOptions = { headers: true, ignoreEmpty: true, trim: true }
const seedStream = csv.parseFile(seedFilePath.toString(), { ...csvOptions })
  .transform(data => {
    // record.push(data)

    return { ...data, timestamp_key: cuid() }
  })
const parser = avro.parse({
  name: 'Message',
  type: 'record',
  fields: [
    { name: 'uuid', type: 'string', logicalType: 'uuid' },
    { name: 'author', type: 'string' },
    { name: 'message', type: 'string' },
    { name: 'likes', type: 'string' },
  ],
})

const formatStream = csv.format(csvOptions)
const outStream = fs.createWriteStream(path.join(__dirname, 'output.csv'))

const start = Date.now()
pipeline(seedStream, formatStream, outStream, () => {
  console.log(`Elapsed time : ${Date.now() - start} ms`)
  // const parsed = record.map(r => parser.toBuffer(r))
  // parsed.forEach(i => console.log(i.byteLength))
})


