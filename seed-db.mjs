import mysql from 'mysql2/promise.js';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL properly
const dbUrl = process.env.DATABASE_URL;
const urlObj = new URL(dbUrl);
const pool = mysql.createPool({
  connectionLimit: 5,
  host: urlObj.hostname,
  user: urlObj.username,
  password: urlObj.password,
  database: urlObj.pathname.slice(1),
  waitForConnections: true,
  enableKeepAlive: true,
  ssl: {},
});

// Realistic UK property data
const properties = [
  // High Momentum (events within 7 days + offer activity)
  {
    address: '42 The Crescent',
    addressPartial: '42 The Crescent, Taunton',
    city: 'Taunton',
    postcode: 'TA1 3PQ',
    type: 's',
    status: 'under_offer',
    price: 385000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1250,
    description: 'Charming semi-detached Victorian property with period features, modern kitchen, and spacious garden.',
    latitude: 51.0126,
    longitude: -3.1054,
    videoUrl: 'https://example.com/videos/property-42-crescent.mp4',
    momentum: 'high',
  },
  {
    address: '15 Manor Lane',
    addressPartial: '15 Manor Lane, Bridgwater',
    city: 'Bridgwater',
    postcode: 'TA6 3DQ',
    type: 'd',
    status: 'active',
    price: 525000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 1850,
    description: 'Executive detached home with modern extensions, gym, and heated pool. Premium location.',
    latitude: 51.1289,
    longitude: -2.9915,
    videoUrl: 'https://example.com/videos/property-manor-lane.mp4',
    momentum: 'high',
  },
  {
    address: '8 Riverside Court',
    addressPartial: '8 Riverside Court, Exeter',
    city: 'Exeter',
    postcode: 'EX2 5AQ',
    type: 'f',
    status: 'active',
    price: 285000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 850,
    description: 'Modern riverside apartment with balcony, secure parking, and access to leisure facilities.',
    latitude: 50.7184,
    longitude: -3.5339,
    videoUrl: 'https://example.com/videos/property-riverside.mp4',
    momentum: 'high',
  },

  // Rising Interest (recent activity, building momentum)
  {
    address: '27 Oak Street',
    addressPartial: '27 Oak Street, Yeovil',
    city: 'Yeovil',
    postcode: 'BA20 1PQ',
    type: 't',
    status: 'active',
    price: 245000,
    bedrooms: 3,
    bathrooms: 1,
    squareFeet: 1050,
    description: 'Traditional terraced house with original features, newly refurbished kitchen, and enclosed garden.',
    latitude: 50.9433,
    longitude: -2.6412,
    videoUrl: 'https://example.com/videos/property-oak-street.mp4',
    momentum: 'rising',
  },
  {
    address: '33 Clifton Road',
    addressPartial: '33 Clifton Road, Dorchester',
    city: 'Dorchester',
    postcode: 'DT1 1QQ',
    type: 's',
    status: 'active',
    price: 395000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1300,
    description: 'Spacious semi-detached with dual aspect, updated bathroom, and mature garden with patio.',
    latitude: 50.8097,
    longitude: -2.4375,
    videoUrl: 'https://example.com/videos/property-clifton.mp4',
    momentum: 'rising',
  },
  {
    address: '12 Elm Avenue',
    addressPartial: '12 Elm Avenue, Weymouth',
    city: 'Weymouth',
    postcode: 'DT4 8QQ',
    type: 'o',
    status: 'active',
    price: 325000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1100,
    description: 'Single-storey bungalow with sea views, modern amenities, and low-maintenance garden.',
    latitude: 50.6094,
    longitude: -2.4597,
    videoUrl: 'https://example.com/videos/property-elm-avenue.mp4',
    momentum: 'rising',
  },

  // Stable (consistent interest, no recent changes)
  {
    address: '19 Church Lane',
    addressPartial: '19 Church Lane, Tiverton',
    city: 'Tiverton',
    postcode: 'EX16 4PQ',
    type: 'd',
    status: 'active',
    price: 450000,
    bedrooms: 4,
    bathrooms: 2,
    squareFeet: 1600,
    description: 'Period detached property with character, converted barn studio, and substantial grounds.',
    latitude: 50.8817,
    longitude: -3.4833,
    videoUrl: 'https://example.com/videos/property-church-lane.mp4',
    momentum: 'stable',
  },
  {
    address: '7 Station Road',
    addressPartial: '7 Station Road, Axminster',
    city: 'Axminster',
    postcode: 'EX13 5PQ',
    type: 't',
    status: 'active',
    price: 265000,
    bedrooms: 3,
    bathrooms: 1,
    squareFeet: 1100,
    description: 'Charming Victorian terraced house with period charm, recently updated systems.',
    latitude: 50.7614,
    longitude: -3.0028,
    videoUrl: 'https://example.com/videos/property-station-road.mp4',
    momentum: 'stable',
  },
  {
    address: '24 High Street',
    addressPartial: '24 High Street, Sidmouth',
    city: 'Sidmouth',
    postcode: 'EX10 8LQ',
    type: 'f',
    status: 'active',
    price: 295000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 900,
    description: 'Elegant period conversion flat with high ceilings, town centre location, parking included.',
    latitude: 50.6824,
    longitude: -3.2406,
    videoUrl: 'https://example.com/videos/property-high-street.mp4',
    momentum: 'stable',
  },

  // Cooling (no recent activity, interest waning)
  {
    address: '5 Hillside Close',
    addressPartial: '5 Hillside Close, Chard',
    city: 'Chard',
    postcode: 'TA20 1PQ',
    type: 's',
    status: 'active',
    price: 275000,
    bedrooms: 3,
    bathrooms: 1,
    squareFeet: 1150,
    description: 'Modern semi-detached with open-plan living, fitted kitchen, and landscaped garden.',
    latitude: 50.8667,
    longitude: -2.9667,
    videoUrl: 'https://example.com/videos/property-hillside.mp4',
    momentum: 'cooling',
  },
  {
    address: '11 Meadow View',
    addressPartial: '11 Meadow View, Seaton',
    city: 'Seaton',
    postcode: 'EX12 2QQ',
    type: 'o',
    status: 'active',
    price: 310000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1050,
    description: 'Comfortable bungalow with updated utilities, accessible layout, and quiet location.',
    latitude: 50.7092,
    longitude: -3.0903,
    videoUrl: 'https://example.com/videos/property-meadow.mp4',
    momentum: 'cooling',
  },
  {
    address: '29 Beacon Hill',
    addressPartial: '29 Beacon Hill, Colyton',
    city: 'Colyton',
    postcode: 'EX24 6PQ',
    type: 'd',
    status: 'active',
    price: 475000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 1750,
    description: 'Impressive detached home with views, extensive gardens, and annexe potential.',
    latitude: 50.7614,
    longitude: -3.1456,
    videoUrl: 'https://example.com/videos/property-beacon.mp4',
    momentum: 'cooling',
  },

  // Special cases
  {
    address: '16 Valley Road',
    addressPartial: '16 Valley Road, Honiton',
    city: 'Honiton',
    postcode: 'EX14 1PQ',
    type: 't',
    status: 'back_on_market',
    price: 255000,
    bedrooms: 3,
    bathrooms: 1,
    squareFeet: 1100,
    description: 'Attractive terraced property with potential, now back on market after offer fell through.',
    latitude: 50.7614,
    longitude: -3.2028,
    videoUrl: 'https://example.com/videos/property-valley.mp4',
    momentum: 'cooling',
  },
  {
    address: '38 Westfield Drive',
    addressPartial: '38 Westfield Drive, Dawlish',
    city: 'Dawlish',
    postcode: 'EX8 2QQ',
    type: 's',
    status: 'sold',
    price: 365000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1250,
    description: 'Sold - Lovely semi-detached with sea views, recently completed sale.',
    latitude: 50.5717,
    longitude: -3.4828,
    videoUrl: 'https://example.com/videos/property-westfield.mp4',
    momentum: 'sold',
  },
];

// Timeline events for each property
const getTimelineEvents = (propertyId, momentum) => {
  const now = new Date();
  const events = [];

  if (momentum === 'high') {
    // Recent launch + viewing + offer
    events.push({
      propertyId,
      type: 'launched',
      title: 'Property Launched',
      description: 'Property listed on Valory',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'First viewing scheduled',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'Second viewing scheduled',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    });
    events.push({
      propertyId,
      type: 'viewing_milestone',
      title: '5th Viewing',
      description: 'Property has reached 5 viewings',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
    });
    events.push({
      propertyId,
      type: 'offer_received',
      title: 'Offer Received',
      description: 'Strong offer received at asking price',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
    });
  } else if (momentum === 'rising') {
    // Moderate recent activity
    events.push({
      propertyId,
      type: 'launched',
      title: 'Property Launched',
      description: 'Property listed on Valory',
      timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'First viewing scheduled',
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'Second viewing scheduled',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'Third viewing scheduled',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    });
    events.push({
      propertyId,
      type: 'media_uploaded',
      title: 'New Media Uploaded',
      description: 'Additional photos and video added',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    });
  } else if (momentum === 'stable') {
    // Older activity, steady interest
    events.push({
      propertyId,
      type: 'launched',
      title: 'Property Launched',
      description: 'Property listed on Valory',
      timestamp: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'First viewing scheduled',
      timestamp: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'Second viewing scheduled',
      timestamp: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'Third viewing scheduled',
      timestamp: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_milestone',
      title: '5th Viewing',
      description: 'Property has reached 5 viewings',
      timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
  } else if (momentum === 'cooling') {
    // Old activity, interest waning
    events.push({
      propertyId,
      type: 'launched',
      title: 'Property Launched',
      description: 'Property listed on Valory',
      timestamp: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'First viewing scheduled',
      timestamp: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'Second viewing scheduled',
      timestamp: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    });
    events.push({
      propertyId,
      type: 'price_adjusted',
      title: 'Price Adjusted',
      description: 'Price reduced to attract interest',
      timestamp: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
    });
  } else if (momentum === 'back_on_market') {
    // Fell through, back on market
    events.push({
      propertyId,
      type: 'launched',
      title: 'Property Launched',
      description: 'Property listed on Valory',
      timestamp: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'First viewing scheduled',
      timestamp: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000), // 55 days ago
    });
    events.push({
      propertyId,
      type: 'offer_received',
      title: 'Offer Received',
      description: 'Offer received and accepted',
      timestamp: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    });
    events.push({
      propertyId,
      type: 'offer_accepted',
      title: 'Under Offer',
      description: 'Property under offer',
      timestamp: new Date(now.getTime() - 44 * 24 * 60 * 60 * 1000), // 44 days ago
    });
    events.push({
      propertyId,
      type: 'offer_fallen_through',
      title: 'Offer Fell Through',
      description: 'Offer fell through during conveyancing',
      timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    });
    events.push({
      propertyId,
      type: 'back_on_market',
      title: 'Back on Market',
      description: 'Property relisted after offer fell through',
      timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    });
  } else if (momentum === 'sold') {
    // Sold
    events.push({
      propertyId,
      type: 'launched',
      title: 'Property Launched',
      description: 'Property listed on Valory',
      timestamp: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_booked',
      title: 'Viewing Booked',
      description: 'First viewing scheduled',
      timestamp: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000), // 85 days ago
    });
    events.push({
      propertyId,
      type: 'viewing_milestone',
      title: '10th Viewing',
      description: 'Property has reached 10 viewings',
      timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    });
    events.push({
      propertyId,
      type: 'offer_received',
      title: 'Offer Received',
      description: 'Strong offer received',
      timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    });
    events.push({
      propertyId,
      type: 'offer_accepted',
      title: 'Under Offer',
      description: 'Property under offer',
      timestamp: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000), // 19 days ago
    });
    events.push({
      propertyId,
      type: 'sold',
      title: 'Sold',
      description: 'Property sold successfully',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    });
  }

  return events;
};

async function seedDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log('Starting database seeding...');

    // Insert properties
    for (const prop of properties) {
      const query = `
        INSERT INTO properties (
          address, city, postcode, propertyType, status, price, 
          bedrooms, bathrooms, squareFeet, description, latitude, longitude, 
          ownerId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const [result] = await connection.execute(query, [
        prop.address,
        prop.city,
        prop.postcode,
        prop.type,
        prop.status,
        prop.price,
        prop.bedrooms,
        prop.bathrooms,
        prop.squareFeet,
        prop.description,
        prop.latitude,
        prop.longitude,
        1, // ownerId = 1 (admin user)
      ]);

      const propertyId = result.insertId;
      console.log(`✓ Created property: ${prop.address} (ID: ${propertyId})`);

      // Insert timeline events
      const events = getTimelineEvents(propertyId, prop.momentum);
      for (const event of events) {
        const eventQuery = `
          INSERT INTO property_timeline_events (
            propertyId, type, title, description, timestamp, createdAt
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `;

        await connection.execute(eventQuery, [
          event.propertyId,
          event.type,
          event.title,
          event.description,
          event.timestamp,
        ]);
      }

      console.log(`  └─ Added ${events.length} timeline events`);
    }

    console.log('\n✓ Database seeding completed successfully!');
    console.log(`✓ Created 15 properties with comprehensive timeline events`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedDatabase().catch(console.error);
