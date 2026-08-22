import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const albums = await prisma.galleryAlbum.findMany({
    where: { deletedAt: null },
    include: { items: { where: { deletedAt: null } } }
  });
  console.log("Albums count:", albums.length);
  console.log(JSON.stringify(albums, null, 2));

  const items = await prisma.galleryItem.findMany({
    where: { deletedAt: null }
  });
  console.log("Total Items count:", items.length);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
