import { generateItemCode } from '../src/lib/itemCode';

async function main() {
  const code1 = await generateItemCode();
  const code2 = await generateItemCode();

  console.log(`Code 1: ${code1}`);
  console.log(`Code 2: ${code2}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
