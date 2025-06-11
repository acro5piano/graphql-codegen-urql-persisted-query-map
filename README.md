# graphql-codegen-urql-persisted-query-map

A GraphQL Codegen plugin that generates a mapping of SHA256 hashes to query strings, compatible with URQL persisted queries.

## Features

- Adds `__typename` to all nested selection sets (except root Query/Mutation).
- Outputs a JSON object mapping SHA256 hashes to query strings.
- Designed for use with [URQL](https://formidable.com/open-source/urql/) and persisted queries.
- Written in TypeScript

## Installation

```bash
npm add -D graphql-codegen-urql-persisted-query-map
```

## Usage

Integrate this plugin with your GraphQL Codegen configuration to generate a persisted query map for your URQL client.

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  // ...
  generates: {
    'persisted-queries.json': {
      plugins: ['graphql-codegen-urql-persisted-query-map'],
    },
  },
}
```

This plugin automatically adds `__typename` to all selection sets except for root `Query` and `Mutation` operations, ensuring compatibility with URQL's caching and normalization.

## Development

- Requires Node.js and pnpm
- Main logic is in `index.ts`.

## License

MIT
