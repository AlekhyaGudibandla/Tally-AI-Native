import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: 'demo-org-1' },
    update: {
      name: 'Ledger AI Technologies Pvt Ltd',
    },
    create: {
      id: 'demo-org-1',
      name: 'Ledger AI Technologies Pvt Ltd',
      pan: 'ABCDE1234F',
      gstin: '27ABCDE1234F1Z5',
      financialYear: '2026-2027',
      industry: 'Software & Financial Technology',
    },
  });

  // 2. Create Branch
  await prisma.branch.upsert({
    where: { id: 'demo-branch-1' },
    update: {},
    create: {
      id: 'demo-branch-1',
      organizationId: org.id,
      name: 'Head Office',
      address: '123 Business District',
      state: 'Maharashtra',
    },
  });

  // 3. Create Admin Users (Ledger AI)
  await prisma.user.upsert({
    where: { email: 'admin@ledgerai.com' },
    update: {},
    create: {
      email: 'admin@ledgerai.com',
      name: 'Admin User',
      role: 'OWNER',
      organizationId: org.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@vahi.com' },
    update: {},
    create: {
      email: 'admin@vahi.com',
      name: 'Admin User',
      role: 'OWNER',
      organizationId: org.id,
    },
  });

  // 4. Create Ledger Groups
  const assetsGroup = await prisma.ledgerGroup.upsert({
    where: { id: 'group-assets' },
    update: {},
    create: { id: 'group-assets', name: 'Current Assets', nature: 'ASSET' },
  });

  const liabilitiesGroup = await prisma.ledgerGroup.upsert({
    where: { id: 'group-liabilities' },
    update: {},
    create: { id: 'group-liabilities', name: 'Current Liabilities', nature: 'LIABILITY' },
  });

  const revenueGroup = await prisma.ledgerGroup.upsert({
    where: { id: 'group-revenue' },
    update: {},
    create: { id: 'group-revenue', name: 'Direct Revenue', nature: 'REVENUE' },
  });

  const expensesGroup = await prisma.ledgerGroup.upsert({
    where: { id: 'group-expenses' },
    update: {},
    create: { id: 'group-expenses', name: 'Indirect Expenses', nature: 'EXPENSE' },
  });

  // 5. Create Accounts
  await prisma.account.upsert({
    where: { id: 'acc-hdfc' },
    update: {},
    create: {
      id: 'acc-hdfc',
      organizationId: org.id,
      groupId: assetsGroup.id,
      name: 'HDFC Bank Account',
      balance: 100000, // Seed initial balance
    },
  });

  await prisma.account.upsert({
    where: { id: 'acc-sales' },
    update: {},
    create: {
      id: 'acc-sales',
      organizationId: org.id,
      groupId: revenueGroup.id,
      name: 'Sales Account',
      balance: 0,
    },
  });

  await prisma.account.upsert({
    where: { id: 'acc-cloud' },
    update: {},
    create: {
      id: 'acc-cloud',
      organizationId: org.id,
      groupId: expensesGroup.id,
      name: 'Cloud Infrastructure',
      balance: 0,
    },
  });

  await prisma.account.upsert({
    where: { id: 'acc-purchase' },
    update: {},
    create: {
      id: 'acc-purchase',
      organizationId: org.id,
      groupId: expensesGroup.id,
      name: 'Purchase Account',
      balance: 0,
    },
  });

  await prisma.account.upsert({
    where: { id: 'acc-input-cgst' },
    update: {},
    create: {
      id: 'acc-input-cgst',
      organizationId: org.id,
      groupId: assetsGroup.id,
      name: 'Input CGST',
      balance: 0,
    },
  });

  await prisma.account.upsert({
    where: { id: 'acc-input-sgst' },
    update: {},
    create: {
      id: 'acc-input-sgst',
      organizationId: org.id,
      groupId: assetsGroup.id,
      name: 'Input SGST',
      balance: 0,
    },
  });

  // Sundry Creditors group
  await prisma.ledgerGroup.upsert({
    where: { id: 'group-creditors' },
    update: {},
    create: {
      id: 'group-creditors',
      name: 'Sundry Creditors',
      nature: 'LIABILITY',
      parentId: liabilitiesGroup.id,
    },
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
