import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../database/drizzle";
import { users } from "../database/schema";

const SUPERADMIN_EMAIL = "jorge.rubio.rev@gmail.com";
const SUPERADMIN_NAME = "Jorge Rubio";
const DEFAULT_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD ?? "ChangeMe123!";

async function main() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, SUPERADMIN_EMAIL))
    .limit(1);

  if (existing) {
    if (!existing.isSuperadmin) {
      await db
        .update(users)
        .set({
          isSuperadmin: true,
          recordUpdatedTimesTamp: new Date(),
          recordModifiedBy: "seed-superadmin",
        })
        .where(eq(users.id, existing.id));
      console.log(`Promoted ${SUPERADMIN_EMAIL} to superadmin`);
    } else {
      console.log(`Superadmin ${SUPERADMIN_EMAIL} already exists`);
    }
    return;
  }

  const passwordHash = await hash(DEFAULT_PASSWORD, 12);

  await db.insert(users).values({
    email: SUPERADMIN_EMAIL,
    name: SUPERADMIN_NAME,
    passwordHash,
    isSuperadmin: true,
    recordCreatedBy: "seed-superadmin",
  });

  console.log(`Created superadmin ${SUPERADMIN_EMAIL}`);
  console.log(`Initial password: ${DEFAULT_PASSWORD}`);
  console.log("Change it on first sign-in.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
