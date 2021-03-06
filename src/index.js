import { parse as parseCST } from './cst/parse.js'
import { Document as YAMLDocument } from './doc/Document.js'
import { Schema } from './doc/Schema.js'
import { YAMLSemanticError } from './errors.js'
import { defaultOptions, scalarOptions } from './options.js'
import { warn } from './warnings.js'

function createNode(value, wrapScalars = true, tag) {
  if (tag === undefined && typeof wrapScalars === 'string') {
    tag = wrapScalars
    wrapScalars = true
  }
  const options = Object.assign(
    {},
    YAMLDocument.defaults[defaultOptions.version],
    defaultOptions
  )
  const schema = new Schema(options)
  return schema.createNode(value, wrapScalars, tag)
}

class Document extends YAMLDocument {
  constructor(options) {
    super(Object.assign({}, defaultOptions, options))
  }
}

function parseAllDocuments(src, options) {
  const stream = []
  let prev
  for (const cstDoc of parseCST(src)) {
    const doc = new Document(options)
    doc.parse(cstDoc, prev)
    stream.push(doc)
    prev = doc
  }
  return stream
}

function parseDocument(src, options) {
  const cst = parseCST(src)
  const doc = new Document(options).parse(cst[0])
  if (cst.length > 1) {
    const errMsg =
      'Source contains multiple documents; please use YAML.parseAllDocuments()'
    doc.errors.unshift(new YAMLSemanticError(cst[1], errMsg))
  }
  return doc
}

function parse(src, options) {
  const doc = parseDocument(src, options)
  doc.warnings.forEach(warning => warn(warning))
  if (doc.errors.length > 0) throw doc.errors[0]
  return doc.toJSON()
}

function stringify(value, options) {
  const doc = new Document(options)
  doc.contents = value
  return String(doc)
}

export const YAML = {
  createNode,
  defaultOptions,
  Document,
  parse,
  parseAllDocuments,
  parseCST,
  parseDocument,
  scalarOptions,
  stringify
}
