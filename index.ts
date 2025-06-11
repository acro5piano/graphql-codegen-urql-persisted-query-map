import { PluginFunction } from '@graphql-codegen/plugin-helpers'
import { visit, DocumentNode, Kind, OperationDefinitionNode } from 'graphql'
import { stringifyDocument } from '@urql/core'
import { createHash } from 'node:crypto'

/**
 * Always add __typename to each SelectionSet,
 * except for root Query and Mutation selection sets.
 * Credit: https://github.com/valu-digital/graphql-codegen-persisted-query-ids/blob/master/src/index.ts#L37
 */
function addTypenameToDocument(doc: DocumentNode): DocumentNode {
  return visit(doc, {
    SelectionSet: {
      enter(node, _key, parent) {
        // Don't add __typename to OperationDefinitions.
        if (
          parent &&
          (parent as OperationDefinitionNode).kind === 'OperationDefinition'
        ) {
          return
        }

        // No changes if no selections.
        const { selections } = node
        if (!selections || selections.length === 0) {
          return
        }

        const hasTypename = node.selections.some(
          (selection) =>
            selection.kind === Kind.FIELD &&
            selection.name.value === '__typename',
        )
        if (hasTypename) {
          return
        }

        // Create and return a new SelectionSet with a __typename Field.
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
    },
  })
}

/**
 * Returns a SHA256 hash.
 */
function sha256(str: string): string {
  return createHash('sha256').update(str).digest('hex')
}

export const plugin: PluginFunction = (_schema, documents, _config) => {
  // For each document, build a hash:query object
  const result: Record<string, string> = {}

  for (const doc of documents) {
    if (!doc.document) continue
    // Add __typename to AST
    const fixedDoc = addTypenameToDocument(doc.document)
    // Generate a URQL-compatible query string using print
    const queryStr = stringifyDocument(fixedDoc)
    // If not empty, save as a hash:query pair
    if (queryStr) {
      const hash = sha256(queryStr)
      result[hash] = queryStr
    }
  }

  // Output as a JSON object
  return JSON.stringify(result, null, 2)
}
