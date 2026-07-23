import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals.map(config => ({
    ...config,
    rules: {
      ...config.rules,
      // localStorage 복원 패턴에서 useEffect 내 setState 허용
      'react-hooks/set-state-in-effect': 'off',
    },
  })),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
