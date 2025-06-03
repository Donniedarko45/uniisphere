 # 🗄️ Database Operations Guide - Uniisphere

## Quick Reference for Database Management

---

## 🛠 Prisma Commands

### Setup & Migrations
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply a new migration
npx prisma migrate dev --name add-new-feature

# Apply pending migrations (production)
npx prisma migrate deploy

# Reset database (development only - will delete all data!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Pull current database schema into Prisma schema
npx prisma db pull

# Push schema changes without creating migration
npx prisma db push
```

### Database Inspection
```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Validate Prisma schema
npx prisma validate

# Format Prisma schema file
npx prisma format
```

---

## 📊 Common Database Queries

### User Operations

#### Find User by Email
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    posts: true,
    experiences: true,
    connections1: true,
    connections2: true
  }
});
```

#### Update User Profile
```typescript
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: {
    firstName: 'John',
    lastName: 'Doe',
    About: 'Updated bio',
    Skills: ['JavaScript', 'TypeScript'],
    experiences: {
      create: {
        title: 'Software Developer',
        organizationName: 'Tech Corp',
        startDate: new Date('2023-01-01'),
        experienceType: 'work'
      }
    }
  }
});
```

#### Search Users
```typescript
const users = await prisma.user.findMany({
  where: {
    OR: [
      { firstName: { contains: searchTerm, mode: 'insensitive' } },
      { lastName: { contains: searchTerm, mode: 'insensitive' } },
      { username: { contains: searchTerm, mode: 'insensitive' } }
    ]
  },
  select: {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
    profilePictureUrl: true
  }
});
```

### Post Operations

#### Create Post with Media
```typescript
const post = await prisma.post.create({
  data: {
    content: 'My new post!',
    mediaUrl: ['url1', 'url2'],
    userId: userId,
    visibility: 'public',
    tags: ['javascript', 'coding'],
    location: 'San Francisco, CA'
  },
  include: {
    user: {
      select: {
        username: true,
        profilePictureUrl: true
      }
    },
    _count: {
      select: {
        Likes: true,
        Comments: true
      }
    }
  }
});
```

#### Get User Feed
```typescript
// Get connections first
const connections = await prisma.connection.findMany({
  where: {
    OR: [{ userId1: userId }, { userId2: userId }],
    status: 'accepted'
  }
});

const connectedUserIds = connections.map(conn =>
  conn.userId1 === userId ? conn.userId2 : conn.userId1
);

// Get posts from connections and self
const feedPosts = await prisma.post.findMany({
  where: {
    userId: { in: [...connectedUserIds, userId] },
    visibility: { in: ['public', 'connections'] }
  },
  include: {
    user: {
      select: {
        username: true,
        profilePictureUrl: true
      }
    },
    Likes: {
      where: { userId: userId },
      select: { id: true }
    },
    _count: {
      select: {
        Likes: true,
        Comments: true
      }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 20
});
```

#### Like/Unlike Post
```typescript
// Check if already liked
const existingLike = await prisma.likes.findFirst({
  where: { postId, userId }
});

if (existingLike) {
  // Unlike
  await prisma.likes.delete({
    where: { id: existingLike.id }
  });
} else {
  // Like
  await prisma.likes.create({
    data: { postId, userId }
  });
}
```

### Connection Operations

#### Send Connection Request
```typescript
const connection = await prisma.connection.create({
  data: {
    userId1: senderId,
    userId2: receiverId,
    status: 'pending'
  }
});
```

#### Get User Connections
```typescript
const connections = await prisma.connection.findMany({
  where: {
    OR: [{ userId1: userId }, { userId2: userId }],
    status: 'accepted'
  },
  include: {
    user1: {
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true
      }
    },
    user2: {
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true
      }
    }
  }
});

// Transform to get the "other" user
const transformedConnections = connections.map(conn => ({
  id: conn.id,
  status: conn.status,
  createdAt: conn.createdAt,
  otherUser: conn.userId1 === userId ? conn.user2 : conn.user1
}));
```

### Story Operations

#### Get Active Stories
```typescript
const stories = await prisma.story.findMany({
  where: {
    userId: { in: connectedUserIds },
    expiresAt: { gt: new Date() }
  },
  include: {
    user: {
      select: {
        id: true,
        username: true,
        profilePictureUrl: true
      }
    },
    views: {
      select: { userId: true }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

#### Clean Expired Stories
```typescript
const deletedStories = await prisma.story.deleteMany({
  where: {
    expiresAt: { lt: new Date() }
  }
});
```

### Message Operations

#### Get Conversation
```typescript
const messages = await prisma.message.findMany({
  where: {
    OR: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId }
    ]
  },
  include: {
    sender: {
      select: {
        username: true,
        profilePictureUrl: true
      }
    }
  },
  orderBy: { createdAt: 'asc' }
});
```

#### Get All Conversations
```typescript
const conversations = await prisma.message.findMany({
  where: {
    OR: [{ senderId: userId }, { receiverId: userId }]
  },
  distinct: ['senderId', 'receiverId'],
  include: {
    sender: {
      select: {
        id: true,
        username: true,
        profilePictureUrl: true
      }
    },
    receiver: {
      select: {
        id: true,
        username: true,
        profilePictureUrl: true
      }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

---

## 🔧 Database Maintenance

### Cleanup Operations

#### Delete Expired Stories (Cron Job)
```typescript
export const cleanupExpiredStories = async () => {
  const result = await prisma.story.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
  console.log(`Deleted ${result.count} expired stories`);
};
```

#### Delete Unused Media Files
```typescript
export const cleanupUnusedMedia = async () => {
  // Find cloudinary media not referenced by any posts/stories/profiles
  const unusedMedia = await prisma.cloudinaryMedia.findMany({
    where: {
      AND: [
        { url: { notIn: await getUsedMediaUrls() } }
      ]
    }
  });

  // Delete from Cloudinary and database
  for (const media of unusedMedia) {
    try {
      await cloudinary.uploader.destroy(media.publicId);
      await prisma.cloudinaryMedia.delete({
        where: { id: media.id }
      });
    } catch (error) {
      console.error(`Failed to delete media ${media.id}:`, error);
    }
  }
};
```

### Data Analytics Queries

#### User Activity Stats
```typescript
const userStats = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    _count: {
      select: {
        posts: true,
        stories: true,
        connections1: true,
        connections2: true,
        sentMessages: true,
        receivedMessages: true
      }
    }
  }
});
```

#### Popular Posts
```typescript
const popularPosts = await prisma.post.findMany({
  include: {
    _count: {
      select: {
        Likes: true,
        Comments: true
      }
    },
    user: {
      select: {
        username: true,
        profilePictureUrl: true
      }
    }
  },
  orderBy: [
    { Likes: { _count: 'desc' } },
    { Comments: { _count: 'desc' } }
  ],
  take: 10
});
```

#### Active Users
```typescript
const activeUsers = await prisma.user.findMany({
  where: {
    OR: [
      { posts: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
      { stories: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
      { sentMessages: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } }
    ]
  },
  select: {
    id: true,
    username: true,
    firstName: true,
    lastName: true
  }
});
```

---

## 🚨 Emergency Operations

### Backup Database
```bash
# PostgreSQL backup
pg_dump -h localhost -U username -d uniisphere > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -h localhost -U username -d uniisphere < backup_file.sql
```

### Reset User Password (Admin Operation)
```typescript
import bcrypt from 'bcrypt';

const resetUserPassword = async (email: string, newPassword: string) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { email },
    data: { 
      password: hashedPassword,
      emailVerified: true // Ensure they can login
    }
  });
  
  console.log(`Password reset for user: ${email}`);
};
```

### Delete User Account (GDPR Compliance)
```typescript
const deleteUserAccount = async (userId: string) => {
  // Use transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    // Delete user's content
    await tx.post.deleteMany({ where: { userId } });
    await tx.story.deleteMany({ where: { userId } });
    await tx.message.deleteMany({ 
      where: { OR: [{ senderId: userId }, { receiverId: userId }] } 
    });
    
    // Delete connections
    await tx.connection.deleteMany({
      where: { OR: [{ userId1: userId }, { userId2: userId }] }
    });
    
    // Delete activities
    await tx.userActivity.deleteMany({ where: { userId } });
    
    // Finally delete user
    await tx.user.delete({ where: { id: userId } });
  });
  
  console.log(`User account ${userId} deleted successfully`);
};
```

---

## 📈 Performance Optimization

### Database Indexes
```sql
-- Add indexes for better query performance
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_post_user_id ON "Post"("userId");
CREATE INDEX idx_post_created_at ON "Post"("createdAt" DESC);
CREATE INDEX idx_connection_users ON "Connection"("userId1", "userId2");
CREATE INDEX idx_message_conversation ON "Message"("senderId", "receiverId");
CREATE INDEX idx_story_expires ON "Story"("expiresAt");
```

### Query Optimization

#### Efficient Pagination
```typescript
const getPaginatedPosts = async (cursor?: string, take: number = 20) => {
  return await prisma.post.findMany({
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          username: true,
          profilePictureUrl: true
        }
      },
      _count: {
        select: {
          Likes: true,
          Comments: true
        }
      }
    }
  });
};
```

#### Batch Operations
```typescript
const batchUpdateUsers = async (updates: Array<{id: string, data: any}>) => {
  const transactions = updates.map(update =>
    prisma.user.update({
      where: { id: update.id },
      data: update.data
    })
  );
  
  await prisma.$transaction(transactions);
};
```

---

## 🔄 Database Migrations Examples

### Adding New Column
```prisma
// In schema.prisma
model User {
  // ... existing fields
  lastActiveAt DateTime?
  isVerified   Boolean   @default(false)
}
```

```bash
# Create migration
npx prisma migrate dev --name add-user-activity-fields
```

### Creating New Table
```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // 'like', 'comment', 'connection_request', etc.
  content   String
  read      Boolean  @default(false)
  targetId  String?  // ID of the related post, user, etc.
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("notifications")
}
```

### Data Migration Script
```typescript
// scripts/migrate-user-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserData() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: user.createdAt, // Set initial value
        isVerified: user.emailVerified || false
      }
    });
  }
  
  console.log(`Migrated ${users.length} users`);
}

migrateUserData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 🛡️ Security Considerations

### Data Sanitization
```typescript
const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};
```

### Rate Limiting Queries
```typescript
const checkUserActionLimit = async (userId: string, action: string, timeWindow: number, maxActions: number) => {
  const since = new Date(Date.now() - timeWindow);
  
  const actionCount = await prisma.userActivity.count({
    where: {
      userId,
      activityType: action,
      createdAt: { gte: since }
    }
  });
  
  return actionCount < maxActions;
};
```

---

## 📝 Best Practices

1. **Always use transactions for related operations**
2. **Include proper error handling for database operations**
3. **Use select to limit returned fields**
4. **Implement proper pagination for large datasets**
5. **Regular database backups**
6. **Monitor query performance**
7. **Use database indexes strategically**
8. **Validate input data before database operations**
9. **Handle database connection errors gracefully**
10. **Use connection pooling in production**

---

## 🔍 Debugging Database Issues

### Check Database Connection
```typescript
async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection: OK');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}
```

### Log Slow Queries
```typescript
// Add to Prisma client initialization
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' }
  ]
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Log queries taking more than 1 second
    console.log('Slow query detected:', {
      query: e.query,
      duration: e.duration,
      params: e.params
    });
  }
});
```

---

**🎯 Key Takeaways:**
- Always backup before major changes
- Use transactions for data consistency
- Monitor query performance regularly
- Implement proper error handling
- Keep your schema organized and documented
- Use migrations for all schema changes
- Test database operations thoroughly