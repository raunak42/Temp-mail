import { hash } from "bcryptjs";

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: pnpm hash-password "your-password"');
    process.exit(1);
  }

  const hashed = await hash(password, 12);
  console.log(hashed);
}

void main();
