const fs = require('fs');
let content = fs.readFileSync('web/src/core/dev/utils/factorySeed.ts', 'utf8');

const regex = /restaurantDocs\.push\(\{[\s\S]*?isOpen: template\.isOpen,/m;
console.log('Regex match:', regex.test(content));

const replacement = `        const IMAGE_POOL = [
          '1568901346375-23c9450c58cd',
          '1550547660-d9450f859349',
          '1576521925361-2c5a9dc42c92',
          '1555396273-367ea4eb4db5',
          '1466978913421-dad2ebd01d17',
          '1604908176997-4318b3e0cfe6',
        ];
        const BANNER_POOL = [
          '1570521944256-e7a1ff3c4d46',
          '1552566626-52f8b828add9',
          '1517248135467-4c7edcad34c4',
          '1498654896293-37aacf113fd9',
        ];
        const imgId = IMAGE_POOL[restaurantIds.length % IMAGE_POOL.length];
        const bannerId = BANNER_POOL[restaurantIds.length % BANNER_POOL.length];

        restaurantDocs.push({
          _id: rid,
          name: template.name,
          description: \`\${template.name} - serving the finest \${template.cuisine.join(' & ')} cuisine in \${city}.\`,
          cuisine: template.cuisine,
          address: randomStreetAddress(city),
          city,
          rating: clampRating(baseRating),
          totalRatings: template.scenario === 'underperformer' ? randomInt(80, 200) : randomInt(150, 500),
          priceRange: template.priceRange,
          imageUrl: \`https://images.unsplash.com/photo-\${imgId}?w=800\`,
          coverImageUrl: \`https://images.unsplash.com/photo-\${bannerId}?w=1200\`,
          image: \`https://images.unsplash.com/photo-\${imgId}?w=800\`,
          bannerImage: \`https://images.unsplash.com/photo-\${bannerId}?w=1200\`,
          isOpen: template.isOpen,`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('web/src/core/dev/utils/factorySeed.ts', content);
  console.log('Replaced successfully');
}
