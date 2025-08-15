import { prisma } from "@/lib/prisma/prismaClient";

const basicAmenities = [
  { name: "Parking", description: "Free parking available", icon: "🅿️" },
  { name: "Restrooms", description: "Clean restroom facilities", icon: "🚻" },
  { name: "WiFi", description: "Free wireless internet", icon: "📶" },
  { name: "Air Conditioning", description: "Climate controlled environment", icon: "❄️" },
  { name: "Lighting", description: "Professional sports lighting", icon: "💡" },
  { name: "Drinking Water", description: "Water dispensers available", icon: "💧" },
  { name: "First Aid", description: "First aid kit and medical assistance", icon: "🏥" },
  { name: "Equipment Rental", description: "Sports equipment available for rent", icon: "🏓" },
  { name: "Lockers", description: "Secure storage lockers", icon: "🗄️" },
  { name: "Shower Facilities", description: "Clean shower and changing rooms", icon: "🚿" },
  { name: "Seating Area", description: "Spectator seating available", icon: "💺" },
  { name: "Canteen", description: "Food and beverages available", icon: "🍽️" },
  { name: "Pro Shop", description: "Sports goods and accessories", icon: "🏪" },
  { name: "CCTV Security", description: "24/7 security monitoring", icon: "📹" },
  { name: "Wheelchair Access", description: "Accessibility for disabled persons", icon: "♿" },
];

export async function seedAmenities() {
  try {
    console.log('Seeding amenities...');
    
    for (const amenity of basicAmenities) {
      await prisma.amenity.upsert({
        where: { name: amenity.name },
        update: {},
        create: amenity,
      });
    }
    
    console.log('Amenities seeded successfully!');
  } catch (error) {
    console.error('Error seeding amenities:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedAmenities()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
