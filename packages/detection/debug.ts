import { detectPII } from './src/pipeline';
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types';
import { RegexTier } from './src/tiers/regex/regexTier';

async function main() {
  const regex = new RegexTier();
  const res = await regex.run('My Aadhaar number is 7592 2902 8107', DEFAULT_PII_CONFIG);
  console.log('REGEX ONLY:', res);

  const res2 = await detectPII('My Aadhaar number is 7592 2902 8107', DEFAULT_PII_CONFIG);
  console.log('PIPELINE:', res2);
}
main();
