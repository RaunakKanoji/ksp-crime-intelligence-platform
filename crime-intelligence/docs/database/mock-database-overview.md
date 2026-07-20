# KSP mock database overview

The development data provider is a server-side deterministic in-memory database. It is intentionally separate from the legacy Catalyst adapter and is selected through `DATA_PROVIDER=mock` (the default when the variable is absent).

The application flow is:

```text
page/component -> API route or server service -> repository contract -> mock repository -> singleton mock database
```

The browser never receives the complete database. API routes return paginated records or map/dashboard DTOs. Every seeded record carries `isSyntheticData: true`, and the shell displays a development-only synthetic-data banner.

The singleton is initialized once per server process and can be reset through the development-only mock controls. `MOCK_DATABASE_REFERENCE_DATE` is not used; the supported variable is `MOCK_REFERENCE_DATE`.

## Provider switching

`src/data/provider.ts` is the only provider switch. The mock implementation is complete for the current development surface. The `neon` branch intentionally throws a typed unavailable error until a Neon repository implementation is added.

## Development commands

Start the app first, then run:

```sh
npm run mock:summary
npm run mock:validate
npm run mock:seed
npm run mock:reset
```

The commands call the local development API so they operate on the same singleton used by the application. `MOCK_DATABASE_BASE_URL` can point at another local development server.
