import { PluginFunction } from '@graphql-codegen/plugin-helpers'
import { visit, DocumentNode, SelectionSetNode, Kind } from 'graphql'
import { stringifyDocument } from '@urql/core'
import { createHash } from 'node:crypto'

/**
 * Always add __typename to each SelectionSet.
 */
function addTypenameToSelectionSets(doc: DocumentNode): DocumentNode {
  return visit(doc, {
    SelectionSet(node: SelectionSetNode) {
      const hasTypename = node.selections.some(
        (selection) =>
          selection.kind === Kind.FIELD &&
          selection.name.value === '__typename',
      )
      if (hasTypename) return node
      return {
        ...node,
        selections: [
          ...node.selections,
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: '__typename' },
          },
        ],
      }
    },
  })
}

/**
 * Returns a SHA256 hash.
 */
function sha256(str: string): string {
  return createHash('sha256').update(str).digest('hex')
}

export const plugin: PluginFunction = (schema, documents, config) => {
  // For each document
  const result: { hash: string; query: string }[] = []

  for (const doc of documents) {
    if (!doc.document) continue
    // Add __typename to AST
    const fixedDoc = addTypenameToSelectionSets(doc.document)
    // Generate a URQL-compatible query string using print
    const queryStr = stringifyDocument(fixedDoc).trim()
    // If not empty, save as a pair
    if (queryStr) {
      const hash = sha256(queryStr)
      result.push({ hash, query: queryStr })
    }
  }

  // Output in JSON Lines format
  return result
    .map(({ hash, query }) => JSON.stringify({ hash, query }))
    .join('\n')
}
