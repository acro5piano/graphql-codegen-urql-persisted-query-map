"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const graphql_1 = require("graphql");
const core_1 = require("@urql/core");
const node_crypto_1 = require("node:crypto");
/**
 * Always add __typename to each SelectionSet.
 */
function addTypenameToSelectionSets(doc) {
    return (0, graphql_1.visit)(doc, {
        SelectionSet(node) {
            const hasTypename = node.selections.some((selection) => selection.kind === graphql_1.Kind.FIELD &&
                selection.name.value === '__typename');
            if (hasTypename)
                return node;
            return Object.assign(Object.assign({}, node), { selections: [
                    ...node.selections,
                    {
                        kind: graphql_1.Kind.FIELD,
                        name: { kind: graphql_1.Kind.NAME, value: '__typename' },
                    },
                ] });
        },
    });
}
/**
 * Returns a SHA256 hash.
 */
function sha256(str) {
    return (0, node_crypto_1.createHash)('sha256').update(str).digest('hex');
}
const plugin = (schema, documents, config) => {
    // For each document
    const result = [];
    for (const doc of documents) {
        if (!doc.document)
            continue;
        // Add __typename to AST
        const fixedDoc = addTypenameToSelectionSets(doc.document);
        // Generate a URQL-compatible query string using print
        const queryStr = (0, core_1.stringifyDocument)(fixedDoc).trim();
        // If not empty, save as a pair
        if (queryStr) {
            const hash = sha256(queryStr);
            result.push({ hash, query: queryStr });
        }
    }
    // Output in JSON Lines format
    return result
        .map(({ hash, query }) => JSON.stringify({ hash, query }))
        .join('\n');
};
exports.plugin = plugin;
