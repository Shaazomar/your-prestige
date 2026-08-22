import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const showrooms = await prisma.showroom.findMany({
    where: { deletedAt: null }
  });
  console.log("Current active showrooms:");
  console.log(JSON.stringify(showrooms, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
