import { defineConfig } from "orval";

export default defineConfig({
  studify: {
    input: {
      target: "../backend/docs/openapi.yaml",
      filters: {
        mode: "exclude",
        tags: ["Static", "Monitoring"],
      },
    },
    output: {
      mode: "tags-split",
      target: "src/shared/api/generated/endpoints",
      schemas: "src/shared/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      // Keep generated code in the project style so diffs stay readable.
      formatter: "oxfmt",
      override: {
        mutator: {
          path: "src/shared/api/fetcher.ts",
          name: "fetcher",
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
        query: {
          useSuspenseQuery: true,
          useInvalidate: true,
        },
      },
    },
  },
});
