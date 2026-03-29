import { PrismaClient, type ItemStatus, type UserRole } from '@prisma/client';
import { subDays } from 'date-fns';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

const adminSeed = {
  email: 'admin@nufv.edu',
  username: 'admin',
  password: 'admin123',
  firstName: 'System',
  lastName: 'Administrator',
  role: 'ADMIN' as UserRole,
};

const sampleUsers = [
  {
    email: 'maria.cruz@nufv.edu',
    username: 'mcruz',
    password: 'password123',
    firstName: 'Maria',
    lastName: 'Cruz',
    role: 'USER' as UserRole,
  },
  {
    email: 'john.reyes@nufv.edu',
    username: 'jreyes',
    password: 'password123',
    firstName: 'John',
    lastName: 'Reyes',
    role: 'USER' as UserRole,
  },
  {
    email: 'anne.santos@nufv.edu',
    username: 'asantos',
    password: 'password123',
    firstName: 'Anne',
    lastName: 'Santos',
    role: 'USER' as UserRole,
  },
];

const settings = [
  { key: 'site_name', value: 'NUFV Lost and Found' },
  { key: 'max_file_size', value: '5242880' },
  { key: 'item_retention_days', value: '30' },
  { key: 'admin_email', value: 'admin@nufv.edu' },
];

async function upsertUser(user: {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}) {
  const password = await hashPassword(user.password);

  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      username: user.username,
      password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: true,
    },
    create: {
      email: user.email,
      username: user.username,
      password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: true,
    },
  });
}

async function main() {
  const admin = await upsertUser(adminSeed);
  const users = await Promise.all(sampleUsers.map(upsertUser));
  const reporters = [admin, ...users];

  await Promise.all(
    settings.map((setting) =>
      prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      }),
    ),
  );

  await prisma.auditLog.deleteMany();
  await prisma.item.deleteMany();

  const sampleItems: Array<{
    itemName: string;
    description: string;
    category: string;
    location: string;
    status: ItemStatus;
    reporterId: string;
    claimerId?: string | null;
    claimedAt?: Date | null;
    dateReported: Date;
    imageUrl?: string;
    contactInfo?: string;
    dueDate?: Date | null;
    isOverdue?: boolean;
    isDisposed?: boolean;
    disposalDate?: Date | null;
  }> = [
    {
      itemName: 'Black Samsung Phone',
      description: 'Found near the main gate with a cracked case.',
      category: 'Electronics',
      location: 'Main Gate',
      status: 'PENDING',
      reporterId: admin.id,
      dateReported: subDays(new Date(), 2),
      imageUrl: '/images/banner2.jpg',
      contactInfo: 'Security Office',
      dueDate: subDays(new Date(), -7),
    },
    {
      itemName: 'Blue Jansport Backpack',
      description: 'Contains notebooks and a calculator.',
      category: 'Bags',
      location: 'Library 2nd Floor',
      status: 'PENDING',
      reporterId: users[0].id,
      dateReported: subDays(new Date(), 5),
      contactInfo: 'Library Desk',
    },
    {
      itemName: 'Silver House Keys',
      description: 'Three keys with a small basketball keychain.',
      category: 'Keys',
      location: 'Gym Entrance',
      status: 'CLAIMED',
      reporterId: users[1].id,
      claimerId: users[2].id,
      claimedAt: subDays(new Date(), 1),
      dateReported: subDays(new Date(), 8),
      contactInfo: 'PE Department',
    },
    {
      itemName: 'Brown Wallet',
      description: 'Wallet with school ID and some cash.',
      category: 'Wallet with Cash',
      location: 'Cafeteria',
      status: 'RETURNED',
      reporterId: users[2].id,
      claimerId: users[1].id,
      claimedAt: subDays(new Date(), 3),
      dateReported: subDays(new Date(), 9),
      contactInfo: 'Student Affairs',
    },
    {
      itemName: 'White PE Uniform Jacket',
      description: 'Marked with initials J.R.',
      category: 'Clothing',
      location: 'Bleachers',
      status: 'DISPOSED',
      reporterId: admin.id,
      dateReported: subDays(new Date(), 45),
      isDisposed: true,
      disposalDate: subDays(new Date(), 10),
    },
    {
      itemName: 'Red Scientific Calculator',
      description: 'Casio calculator with protective cover.',
      category: 'School Supplies',
      location: 'Room 304',
      status: 'PENDING',
      reporterId: users[0].id,
      dateReported: subDays(new Date(), 4),
      contactInfo: 'Academic Office',
      dueDate: subDays(new Date(), 1),
      isOverdue: true,
    },
    {
      itemName: 'Gold Bracelet',
      description: 'Thin bracelet found near the guidance office.',
      category: 'Jewelry',
      location: 'Guidance Office',
      status: 'PENDING',
      reporterId: users[1].id,
      dateReported: subDays(new Date(), 6),
      contactInfo: 'Guidance Office',
    },
    {
      itemName: 'Green Water Bottle',
      description: 'Insulated bottle with NUFV sticker.',
      category: 'Personal Item',
      location: 'Student Lounge',
      status: 'PENDING',
      reporterId: users[2].id,
      dateReported: subDays(new Date(), 1),
      contactInfo: 'Lost and Found Office',
    },
    {
      itemName: 'Physics Textbook',
      description: 'College physics textbook with notes inside.',
      category: 'Books',
      location: 'Science Lab',
      status: 'CLAIMED',
      reporterId: admin.id,
      claimerId: users[0].id,
      claimedAt: subDays(new Date(), 2),
      dateReported: subDays(new Date(), 12),
      contactInfo: 'Science Department',
    },
    {
      itemName: 'School ID Lace',
      description: 'Blue and gold lace without ID card attached.',
      category: 'Accessories',
      location: 'Registrar Hallway',
      status: 'PENDING',
      reporterId: users[1].id,
      dateReported: subDays(new Date(), 7),
      contactInfo: 'Registrar Office',
    },
  ];

  for (const item of sampleItems) {
    await prisma.item.create({
      data: {
        itemName: item.itemName,
        description: item.description,
        category: item.category,
        location: item.location,
        status: item.status,
        reporterId: item.reporterId,
        claimerId: item.claimerId,
        claimedAt: item.claimedAt,
        dateReported: item.dateReported,
        imageUrl: item.imageUrl,
        contactInfo: item.contactInfo,
        dueDate: item.dueDate,
        isOverdue: item.isOverdue ?? false,
        isDisposed: item.isDisposed ?? false,
        disposalDate: item.disposalDate,
      },
    });
  }

  console.log('Seed complete.');
  console.log('Admin login: admin@nufv.edu / admin123');
  console.log(`Created ${sampleItems.length} sample items and ${reporters.length} users.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
