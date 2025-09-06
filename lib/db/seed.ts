// lib/seed.ts
import { db } from './drizzle';
import {
  users,
  organizations,
  organizationMembers,
  recordings,
  recordingResults,
  feedbackMarkers,
} from './schema';

async function seed() {
  console.log('Starting seed process...');

  // Clear existing data
  await db.delete(feedbackMarkers);
  await db.delete(organizationMembers);
  await db.delete(recordings);
  await db.delete(recordingResults);
  await db.delete(organizations);
  await db.delete(users);

  await seedUsers();
  await seedOrganizations();
  await seedRecordings();

  console.log('Seed process completed successfully.');
}

async function seedUsers() {
  console.log('Seeding users...');

  const insertedUsers = await db.insert(users).values([
    {
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah@crescendai.com',
      username: 'sarah_piano',
      emailVerified: new Date(),
      image: 'https://images.unsplash.com/photo-1494790108755-2616c2d3d066?w=400&h=400&fit=crop&crop=face',
    },
    {
      firstName: 'Michael',
      lastName: 'Torres',
      email: 'michael@crescendai.com',
      username: 'pianomike',
      emailVerified: new Date(),
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    },
    {
      firstName: 'Emma',
      lastName: 'Johnson',
      email: 'emma@crescendai.com',
      username: 'emma_keys',
      emailVerified: new Date(),
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    },
    {
      firstName: 'David',
      lastName: 'Kim',
      email: 'david@crescendai.com',
      username: 'david_classical',
      emailVerified: new Date(),
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    },
  ]).returning();

  console.log(`Created ${insertedUsers.length} users`);
  return insertedUsers;
}

async function seedOrganizations() {
  console.log('Seeding organizations...');

  const allUsers = await db.select().from(users);

  // Create personal organizations for each user
  for (const user of allUsers) {
    const [personalOrg] = await db
      .insert(organizations)
      .values({
        name: `${user.username}'s Organization`,
        slug: user.username,
        description: `Personal organization for ${user.firstName} ${user.lastName}`,
        isPersonal: true,
        ownerId: user.id,
      })
      .returning();

    // Add user as admin of their personal organization
    await db.insert(organizationMembers).values({
      organizationId: personalOrg.id,
      userId: user.id,
      role: 'admin',
    });

    console.log(`Created personal organization for ${user.username}`);
  }

  // Create a shared organization (CrescendAI Studio)
  const sarahUser = allUsers.find(u => u.username === 'sarah_piano');
  if (sarahUser) {
    const [studioOrg] = await db
      .insert(organizations)
      .values({
        name: 'CrescendAI Studio',
        slug: 'crescendai-studio',
        description: 'Professional piano learning and practice studio',
        isPersonal: false,
        ownerId: sarahUser.id,
      })
      .returning();

    // Add all users to CrescendAI Studio organization with different roles
    for (const user of allUsers) {
      await db.insert(organizationMembers).values({
        organizationId: studioOrg.id,
        userId: user.id,
        role: user.username === 'sarah_piano' || user.username === 'david_classical' ? 'admin' : 'member',
      });
    }

    console.log('Created CrescendAI Studio organization with members');
  }
}

async function seedRecordings() {
  console.log('Seeding recordings...');

  const studioOrg = await db.query.organizations.findFirst({
    where: (org, { eq }) => eq(org.slug, 'crescendai-studio'),
  });

  const sarahUser = await db.query.users.findFirst({
    where: (user, { eq }) => eq(user.username, 'sarah_piano'),
  });

  const michaelUser = await db.query.users.findFirst({
    where: (user, { eq }) => eq(user.username, 'pianomike'),
  });

  const emmaUser = await db.query.users.findFirst({
    where: (user, { eq }) => eq(user.username, 'emma_keys'),
  });

  if (studioOrg && sarahUser && michaelUser && emmaUser) {
    // Create piano performance recording results
    const [chopin_result] = await db
      .insert(recordingResults)
      .values({
        result: Buffer.from(JSON.stringify({
          duration: 60,
          tempo: 120,
          key: 'C_major',
          piece: 'Chopin Nocturne Op.9 No.1',
          analysisComplete: true
        })).toString('base64'),
        audioUrl: '/audio/chopin-nocturne-demo.mp3',
      })
      .returning();

    const [beethoven_result] = await db
      .insert(recordingResults)
      .values({
        result: Buffer.from(JSON.stringify({
          duration: 60,
          tempo: 100,
          key: 'C_minor',
          piece: 'Beethoven Moonlight Sonata',
          analysisComplete: true
        })).toString('base64'),
        audioUrl: '/audio/moonlight-demo.mp3',
      })
      .returning();

    // Create piano recordings with different states
    const pianoRecordings = await db
      .insert(recordings)
      .values([
        {
          name: 'Chopin Nocturne Op.9 No.1 - Practice Session',
          state: 'processed',
          organizationId: studioOrg.id,
          createdBy: sarahUser.id,
          resultId: chopin_result.id,
          createdAt: new Date('2025-01-15T10:00:00'),
          updatedAt: new Date('2025-01-15T10:05:00'),
        },
        {
          name: 'Beethoven Moonlight Sonata - Mvt 1',
          state: 'processed',
          organizationId: studioOrg.id,
          createdBy: michaelUser.id,
          resultId: beethoven_result.id,
          createdAt: new Date('2025-01-16T14:30:00'),
          updatedAt: new Date('2025-01-16T14:35:00'),
        },
        {
          name: 'Bach Invention No.13 - Work in Progress',
          state: 'processing',
          organizationId: studioOrg.id,
          createdBy: emmaUser.id,
          resultId: null,
          createdAt: new Date('2025-01-17T09:15:00'),
          updatedAt: new Date('2025-01-17T09:15:00'),
        },
        {
          name: 'Mozart K.331 - First Movement',
          state: 'queued',
          organizationId: studioOrg.id,
          createdBy: sarahUser.id,
          resultId: null,
          createdAt: new Date('2025-01-17T16:45:00'),
          updatedAt: new Date('2025-01-17T16:45:00'),
        },
      ])
      .returning();

    console.log(`Created ${pianoRecordings.length} piano recordings`);

    // Add detailed feedback markers for the first recording (Chopin Nocturne)
    await seedFeedbackMarkers(pianoRecordings[0].id);
    
    // Add feedback markers for the second recording (Beethoven)  
    await seedFeedbackMarkers(pianoRecordings[1].id);
  }

  // Create recordings in personal organizations
  const sarahPersonalOrg = await db.query.organizations.findFirst({
    where: (org, { eq, and }) => and(eq(org.slug, 'sarah_piano'), eq(org.isPersonal, true)),
  });

  if (sarahPersonalOrg && sarahUser) {
    const [personalResult] = await db
      .insert(recordingResults)
      .values({
        result: Buffer.from(JSON.stringify({
          duration: 60,
          piece: 'Debussy Clair de Lune',
          analysisComplete: true
        })).toString('base64'),
        audioUrl: '/audio/clair-de-lune-demo.mp3',
      })
      .returning();

    const [personalRecording] = await db.insert(recordings).values({
      name: 'Debussy Clair de Lune - Personal Practice',
      state: 'processed',
      organizationId: sarahPersonalOrg.id,
      createdBy: sarahUser.id,
      resultId: personalResult.id,
    }).returning();

    // Add feedback markers for personal recording
    await seedFeedbackMarkers(personalRecording.id);

    console.log('Created personal recording for Sarah');
  }
}

async function seedFeedbackMarkers(recordingId: number) {
  console.log(`Seeding feedback markers for recording ${recordingId}...`);

  const feedbackDimensions = [
    'rhythm_accuracy',
    'tempo_consistency', 
    'pitch_accuracy',
    'dynamics_control',
    'articulation',
    'phrasing',
    'finger_independence',
    'hand_coordination',
    'pedaling_technique',
    'musical_expression',
    'timing_precision',
    'note_clarity',
    'voicing_balance',
    'rubato_usage',
    'emotional_connection'
  ];

  // Generate feedback markers at 3-second intervals (20 total for 60 seconds)
  const markers = [];
  for (let timestamp = 3; timestamp <= 60; timestamp += 3) {
    // Randomly select 1-3 dimensions to provide feedback for at this timestamp
    const numFeedback = Math.floor(Math.random() * 3) + 1;
    const selectedDimensions = feedbackDimensions
      .sort(() => 0.5 - Math.random())
      .slice(0, numFeedback);

    for (const dimension of selectedDimensions) {
      // Generate realistic scores (-1.0 to 1.0, with slight bias toward positive)
      const score = (Math.random() - 0.3) * 2;
      const normalizedScore = Math.max(-1, Math.min(1, score));
      const severity = normalizedScore >= 0 ? 'positive' : 'negative';

      const feedbackTexts = {
        positive: [
          `Excellent ${dimension.replace(/_/g, ' ')} demonstrated here. Your technique shows clear improvement.`,
          `Strong performance in ${dimension.replace(/_/g, ' ')}. Keep up this level of precision.`,
          `Very good ${dimension.replace(/_/g, ' ')}. Your practice is showing results.`,
          `Nice work on ${dimension.replace(/_/g, ' ')}. This section flows beautifully.`,
          `Solid ${dimension.replace(/_/g, ' ')} technique. You're developing good muscle memory.`
        ],
        negative: [
          `${dimension.replace(/_/g, ' ')} needs attention. Try practicing this passage more slowly.`,
          `Work on ${dimension.replace(/_/g, ' ')} here. Consider breaking this into smaller sections.`,
          `${dimension.replace(/_/g, ' ')} could be improved. Focus on relaxation and control.`,
          `Pay attention to ${dimension.replace(/_/g, ' ')}. Use a metronome to develop consistency.`,
          `${dimension.replace(/_/g, ' ')} requires refinement. Practice with deliberate finger motion.`
        ]
      };

      const feedbackText = feedbackTexts[severity][Math.floor(Math.random() * feedbackTexts[severity].length)];

      markers.push({
        recordingId,
        timestamp,
        dimension,
        score: normalizedScore.toFixed(2),
        feedbackText,
        severity,
      });
    }
  }

  // Insert all feedback markers
  await db.insert(feedbackMarkers).values(markers);
  console.log(`Created ${markers.length} feedback markers for recording ${recordingId}`);
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
