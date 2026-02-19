
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  const botUser = await db.user.findFirst({
    where: {
      email: "bot@studybot.ai"
    }
  });

  console.log("Bot User:", botUser);

  if (botUser) {
    console.log("Image URL:", botUser.imageUrl);
  } else {
    console.log("Bot user not found");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
