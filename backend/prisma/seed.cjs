const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function upsertUser({ email, password, firstName, lastName, role }) {
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, firstName, lastName, role },
    create: { email, passwordHash, firstName, lastName, role }
  });
}

async function upsertBook(book) {
  return prisma.book.upsert({
    where: { isbn: book.isbn },
    update: book,
    create: book
  });
}

async function main() {
  console.log("Seeding started...");

  // Users
  await upsertUser({
    email: "admin@library.local",
    password: "Admin123!",
    firstName: "Admin",
    lastName: "Library",
    role: "ADMIN"
  });

  const userSeeds = [
    ["anna.kowalska@library.local", "Anna", "Kowalska"],
    ["jan.nowak@library.local", "Jan", "Nowak"],
    ["ola.zielinska@library.local", "Ola", "Zielińska"],
    ["piotr.wisniewski@library.local", "Piotr", "Wiśniewski"],
    ["kasia.wojcik@library.local", "Kasia", "Wójcik"]
  ];

  for (const [email, firstName, lastName] of userSeeds) {
    await upsertUser({
      email,
      password: "Password123!",
      firstName,
      lastName,
      role: "USER"
    });
  }

  // Books
  const titles = [
    "Clean Code",
    "The Pragmatic Programmer",
    "Domain-Driven Design",
    "Refactoring",
    "You Don't Know JS",
    "JavaScript: The Good Parts",
    "Patterns of Enterprise Application Architecture",
    "Designing Data-Intensive Applications",
    "Effective TypeScript",
    "Working Effectively with Legacy Code"
  ];
  const authors = [
    "Robert C. Martin",
    "Andrew Hunt",
    "Eric Evans",
    "Martin Fowler",
    "Kyle Simpson",
    "Douglas Crockford",
    "Martin Fowler",
    "Martin Kleppmann",
    "Dan Vanderkam",
    "Michael Feathers"
  ];

  const booksToCreate = [];
  for (let i = 0; i < 30; i += 1) {
    const idx = i % titles.length;
    const isbn = `978-1-4028-${String(1000 + i).padStart(4, "0")}-${(i % 9) + 1}`;
    booksToCreate.push({
      title: `${titles[idx]} (${i + 1})`,
      author: authors[idx] ?? "Unknown",
      isbn,
      publishedYear: 2000 + (i % 25),
      copiesTotal: 3,
      copiesAvailable: 3
    });
  }

  for (const b of booksToCreate) {
    await upsertBook(b);
  }

  // Loans (kilka aktywnych + kilka zwróconych)
  const users = await prisma.user.findMany({ where: { role: "USER" } });
  const books = await prisma.book.findMany();

  const availableByBookId = new Map(books.map((b) => [b.id, b.copiesAvailable]));
  const now = new Date();

  const loansToCreate = [];

  for (let i = 0; i < 10; i += 1) {
    const user = sample(users);
    const book = sample(books);

    if (!user || !book) break;

    const isActive = i < 5; // 5 aktywnych, 5 zwróconych
    const remaining = availableByBookId.get(book.id) ?? 0;

    if (isActive && remaining <= 0) {
      continue;
    }

    if (isActive) {
      availableByBookId.set(book.id, remaining - 1);
    }

    loansToCreate.push({
      userId: user.id,
      bookId: book.id,
      borrowedAt: addDays(now, -(i + 1)),
      dueDate: addDays(now, 14),
      returnedAt: isActive ? null : addDays(now, -2)
    });
  }

  await prisma.$transaction(async (tx) => {
    if (loansToCreate.length > 0) {
      await tx.loan.createMany({ data: loansToCreate });
    }

    // Skoryguj copiesAvailable zgodnie z mapą
    for (const [bookId, copiesAvailable] of availableByBookId.entries()) {
      await tx.book.update({
        where: { id: bookId },
        data: { copiesAvailable }
      });
    }
  });

  console.log("Seeding finished.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });