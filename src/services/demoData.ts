import { Category, Product, ProductImage } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-jeans',
    name: 'Jeans',
    slug: 'jeans',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 1,
    description: 'Premium stretch, slim fit, tapered, and relaxed denims',
  },
  {
    id: 'cat-tshirts',
    name: 'T-Shirts',
    slug: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 2,
    description: '100% combed cotton, oversized, round neck & polo tees',
  },
  {
    id: 'cat-shirts',
    name: 'Shirts',
    slug: 'shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 3,
    description: 'Casual, formal oxford, linen, checked & party shirts',
  },
  {
    id: 'cat-pants',
    name: 'Pants & Trousers',
    slug: 'pants-trousers',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 4,
    description: 'Cotton stretch chinos, formal pleated trousers & cargo pants',
  },
  {
    id: 'cat-leggings',
    name: 'Leggings',
    slug: 'leggings',
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 5,
    description: '4-way stretch ankle length, churidar & activewear leggings',
  },
  {
    id: 'cat-kurtis',
    name: 'Kurtis & Ethnic',
    slug: 'kurtis',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 6,
    description: 'Handcrafted anarkalis, straight cut, chikankari & festive kurtis',
  },
  {
    id: 'cat-dresses',
    name: 'Dresses',
    slug: 'dresses',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 7,
    description: 'Fit & flare, maxi, casual floral & evening party dresses',
  },
  {
    id: 'cat-kids',
    name: "Kids' Wear",
    slug: 'kids',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 8,
    description: 'Soft cotton sets, frocks, dungarees & playtime garments',
  },
  {
    id: 'cat-trackpants',
    name: 'Track Pants & Joggers',
    slug: 'track-pants',
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 9,
    description: 'Gym joggers, breathable track pants and loungewear',
  },
  {
    id: 'cat-jackets',
    name: 'Jackets & Hoodies',
    slug: 'jackets',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 10,
    description: 'Bomber jackets, fleece hoodies, windcheaters & blazers',
  },
  {
    id: 'cat-mens',
    name: "Men's Collection",
    slug: 'mens',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 11,
    description: "Complete Men's Wardrobe - Casuals, Formals & Streetwear",
  },
  {
    id: 'cat-womens',
    name: "Women's Collection",
    slug: 'womens',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 12,
    description: "Western & Ethnic wear crafted for Indian aesthetics",
  },
  {
    id: 'cat-shorts',
    name: 'Shorts',
    slug: 'shorts',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 13,
    description: 'Chino shorts, denim cut-offs and running shorts',
  },
  {
    id: 'cat-innerwear',
    name: 'Innerwear & Loungewear',
    slug: 'innerwear',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 14,
    description: 'Cotton vests, trunks, briefs and seamless essentials',
  },
  {
    id: 'cat-accessories',
    name: 'Fashion Accessories',
    slug: 'fashion-accessories',
    image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&q=80',
    status: 'ACTIVE',
    sort_order: 15,
    description: 'Leather belts, caps, socks, scarves and wallets',
  },
];

// Helper to create multi-image galleries for products
const makeImages = (urls: string[]): ProductImage[] => {
  return urls.map((url, idx) => ({
    id: `img-${Math.random().toString(36).substring(2, 9)}`,
    image_url: url,
    sort_order: idx + 1,
    is_primary: idx === 0,
    caption: idx === 0 ? 'Front View' : idx === 1 ? 'Back View' : idx === 2 ? 'Side Profile' : idx === 3 ? 'Fabric Detail' : 'Model Shot',
  }));
};

// Generates ~20 products per major category
export const generateDemoProducts = (): Product[] => {
  const products: Product[] = [];
  let idCounter = 1;

  // Category: Jeans (20 products)
  const jeansData = [
    {
      name: "Men's Urban Slim Fit Washed Blue Denim",
      brand: "TRYatHOME Originals",
      gender: "Men" as const,
      mrp: 2499,
      price: 999,
      rating: 4.4,
      reviews: 328,
      stock: 45,
      colors: ["Washed Blue", "Dark Indigo", "Light Blue"],
      sizes: ["30", "32", "34", "36", "38"],
      tags: ["Trending", "Bestseller", "Stretch"],
      images: [
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
        "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=80",
        "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&q=80",
      ],
      desc: "Engineered with 98% cotton and 2% elastane for maximum comfort and flex. Features a mid-rise waist, 5 pockets, and subtle distressed whiskers.",
      specs: {
        "Fabric": "98% Cotton, 2% Elastane",
        "Fit": "Slim Fit",
        "Waist Rise": "Mid Rise",
        "Length": "Regular",
        "Wash Care": "Machine wash cold with like colors",
        "Origin": "Made in India",
      }
    },
    {
      name: "Women's High-Rise Relaxed Mom Fit Jeans",
      brand: "DenimCo Studio",
      gender: "Women" as const,
      mrp: 2799,
      price: 1199,
      rating: 4.6,
      reviews: 512,
      stock: 32,
      colors: ["Vintage Blue", "Ice Blue", "Jet Black"],
      sizes: ["26", "28", "30", "32", "34"],
      tags: ["New Arrival", "Trending", "Cotton"],
      images: [
        "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80",
        "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
      ],
      desc: "Authentic 90s vintage silhouette with a flattering high-rise contour waist and comfortable relaxed leg through the hip and thigh.",
      specs: {
        "Fabric": "100% Breathable Cotton",
        "Fit": "Relaxed Mom Fit",
        "Waist Rise": "High Rise",
        "Length": "Ankle Length",
        "Wash Care": "Cold wash inside out",
        "Origin": "Made in India",
      }
    },
    {
      name: "Men's Jet Black Tapered Stretch Denim",
      brand: "TRYatHOME Originals",
      gender: "Men" as const,
      mrp: 2299,
      price: 849,
      rating: 4.3,
      reviews: 210,
      stock: 60,
      colors: ["Jet Black", "Charcoal Grey"],
      sizes: ["30", "32", "34", "36"],
      tags: ["Must Have", "Everyday Essential"],
      images: [
        "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=80",
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
        "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&q=80",
      ],
      desc: "Deep sulfur-dyed jet black finish that does not fade quickly. Soft peach finish touch and clean modern tapered cuff.",
      specs: {
        "Fabric": "Cotton Blend with Lycra",
        "Fit": "Tapered Fit",
        "Waist Rise": "Mid Rise",
        "Length": "Regular",
        "Wash Care": "Gentle Machine Wash",
        "Origin": "Made in India",
      }
    },
    {
      name: "Women's Wide Leg Retro Blue Jeans",
      brand: "Urban Stitch",
      gender: "Women" as const,
      mrp: 2999,
      price: 1299,
      rating: 4.5,
      reviews: 189,
      stock: 28,
      colors: ["Classic Blue", "Off White", "Grey"],
      sizes: ["26", "28", "30", "32"],
      tags: ["Streetwear", "Chic"],
      images: [
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
        "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80",
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
        "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=80",
      ],
      desc: "Flared silhouette starting at the upper thigh, offering a comfortable, breezy, and effortlessly runway-ready everyday look.",
      specs: {
        "Fabric": "Non-stretch Rigid Cotton",
        "Fit": "Wide Leg Flared",
        "Waist Rise": "High Rise",
        "Length": "Full Length",
        "Wash Care": "Machine Wash Cold",
        "Origin": "Made in India",
      }
    }
  ];

  // Populate Jeans up to 20 products
  const jeanStyles = [
    "Distressed Knee Slash Blue Jeans",
    "Carrot Fit Dark Wash Denim",
    "Super Skinny Feather Touch Jeans",
    "Raw Indigo Selvedge Finish Denim",
    "Bootcut 70s Classic Blue Jeans",
    "Acid Wash Grey Street Denim",
    "Clean Solid Navy Straight Fit Jeans",
    "Comfort Fit Regular Blue Denim",
    "Cargo Utility Multi-Pocket Jeans",
    "Ankle Crop Paperbag Waist Jeans",
    "Biker Ribbed Knee Indigo Jeans",
    "Pastel Tint Olive Khaki Denim",
    "Smokey Charcoal Faded Denim",
    "Double Pocket Slanted Seam Jeans",
    "Vintage Stonewash Light Blue Jeans",
    "Relaxed Slouchy Drawstring Denim"
  ];

  jeansData.forEach((item, idx) => {
    const sku = `ST1-JNS-${String(idCounter).padStart(4, '0')}`;
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const discount = Math.round(((item.mrp - item.price) / item.mrp) * 100);
    products.push({
      id: `prod-${idCounter}`,
      sku,
      name: item.name,
      slug,
      category_id: 'cat-jeans',
      category_name: 'Jeans',
      gender: item.gender,
      description: item.desc,
      brand: item.brand,
      mrp: item.mrp,
      selling_price: item.price,
      discount_percentage: discount,
      stock: item.stock,
      status: 'Published',
      rating: item.rating,
      rating_count: item.reviews,
      sizes: item.sizes,
      colors: item.colors,
      tags: item.tags,
      specifications: item.specs,
      images: makeImages(item.images),
      created_at: new Date(Date.now() - (idCounter * 3600000)).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
    });
    idCounter++;
  });

  jeanStyles.forEach((styleName, idx) => {
    const isWomen = idx % 2 === 1;
    const mrp = 1999 + ((idx * 150) % 1200);
    const price = Math.round(mrp * 0.45);
    const sku = `ST1-JNS-${String(idCounter).padStart(4, '0')}`;
    const slug = styleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const discount = Math.round(((mrp - price) / mrp) * 100);
    products.push({
      id: `prod-${idCounter}`,
      sku,
      name: `${isWomen ? "Women's" : "Men's"} ${styleName}`,
      slug,
      category_id: 'cat-jeans',
      category_name: 'Jeans',
      gender: isWomen ? 'Women' : 'Men',
      description: `Premium durable denim tailored specifically for everyday Indian climate. Designed with reinforced stitching, branded brass rivets, and smooth YKK zipper.`,
      brand: idx % 3 === 0 ? "TRYatHOME Originals" : idx % 3 === 1 ? "DenimCo Studio" : "Urban Stitch",
      mrp,
      selling_price: price,
      discount_percentage: discount,
      stock: 25 + (idx * 3) % 40,
      status: 'Published',
      rating: Number((4.1 + ((idx % 8) / 10)).toFixed(1)),
      rating_count: 85 + (idx * 24),
      sizes: isWomen ? ["26", "28", "30", "32", "34"] : ["30", "32", "34", "36", "38"],
      colors: ["Indigo", "Washed Blue", "Black"],
      tags: ["Top Rated", "Stretch Denim"],
      specifications: {
        "Fabric": "98% Cotton, 2% Spandex",
        "Fit": isWomen ? "Slim High-Rise" : "Regular Tapered",
        "Pockets": "5 Pocket Styling",
        "Wash Care": "Machine Wash cold",
        "Origin": "India"
      },
      images: makeImages([
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
        "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&q=80",
        "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&q=80",
      ]),
      created_at: new Date(Date.now() - (idCounter * 3600000)).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
    });
    idCounter++;
  });

  // Category: T-Shirts (20 products)
  const tshirtNames = [
    "Pure Cotton Heavyweight Oversized Graphic Tee",
    "Classic Solid Round Neck Supima Cotton T-Shirt",
    "Waffle Knit Textured Half Sleeve Henley Tee",
    "Premium Ribbed Polo Collar Knit T-Shirt",
    "Acid Wash Vintage Streetwear Boxy Fit Tee",
    "Typographic Back-Print Drop Shoulder Cotton Tee",
    "Striped Yarn Dyed Nautical Crewneck T-Shirt",
    "Minimalist Chest Embroidered Casual Tee",
    "High Neck Mock Collar Half Sleeve Tee",
    "Colorblock Retro Athletic Dry-Fit Tee",
    "Essential Daily Pack Cotton Crew Tee",
    "Organic Bamboo Cotton Breathable Soft Tee",
    "Washed Olive Green Oversized Grunge Tee",
    "Lavender Dream Embroidered Blossom T-Shirt",
    "Solid Slim Fit V-Neck Stretch Cotton T-Shirt",
    "Tie-Dye Swirl Summer Festival Boxy Tee",
    "Contrast Raglan Sleeve Baseball Jersey Tee",
    "Gym Muscle Fit Breathable Mesh Panel Tee",
    "Pocket Crew Casual Weekend Cotton T-Shirt",
    "Monochrome Bold Typography Streetwear Tee"
  ];

  const tshirtImages = [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80",
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
  ];

  tshirtNames.forEach((tName, idx) => {
    const isWomen = idx % 3 === 1;
    const mrp = 999 + ((idx * 80) % 900);
    const price = Math.round(mrp * 0.42);
    const sku = `ST1-TSH-${String(idCounter).padStart(4, '0')}`;
    const slug = tName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const discount = Math.round(((mrp - price) / mrp) * 100);
    products.push({
      id: `prod-${idCounter}`,
      sku,
      name: `${isWomen ? "Women's" : "Men's"} ${tName}`,
      slug,
      category_id: 'cat-tshirts',
      category_name: 'T-Shirts',
      gender: isWomen ? 'Women' : 'Men',
      description: `Crafted from 100% bio-washed combed cotton with 220 GSM density. Pre-shrunk fabric ensures no color bleeding and long-lasting collar shape after repeated washes.`,
      brand: idx % 2 === 0 ? "TRYatHOME Originals" : "StreetVibe India",
      mrp,
      selling_price: price,
      discount_percentage: discount,
      stock: 40 + (idx * 5) % 50,
      status: 'Published',
      rating: Number((4.2 + ((idx % 7) / 10)).toFixed(1)),
      rating_count: 140 + (idx * 35),
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["White", "Black", "Sage Green", "Charcoal", "Navy"],
      tags: ["Hot Seller", "100% Cotton", "Super Soft"],
      specifications: {
        "Fabric": "100% Bio-Washed Combed Cotton (220 GSM)",
        "Neck": idx % 4 === 0 ? "Polo Collar" : "Round Crew Neck",
        "Sleeve": "Half Sleeves",
        "Fit": idx % 2 === 0 ? "Oversized Drop Shoulder" : "Regular Fit",
        "Wash Care": "Machine wash with gentle liquid detergent",
        "Origin": "India"
      },
      images: makeImages(tshirtImages),
      created_at: new Date(Date.now() - (idCounter * 3600000)).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
    });
    idCounter++;
  });

  // Category: Shirts (20 products)
  const shirtNames = [
    "Pure Linen Mandarin Collar Casual Shirt",
    "Wrinkle-Resistant Oxford Cotton Formal Shirt",
    "Heritage Tartan Plaid Flannel Button-Down Shirt",
    "Hawaiian Botanical Floral Resort Vacation Shirt",
    "Satin Finish Slim Fit Party Wear Black Shirt",
    "Denim Chambray Double Pocket Workwear Shirt",
    "Micro Houndstooth Business Executive Shirt",
    "Cuban Camp Collar Breezy Summer Casual Shirt",
    "Vertical Bengal Stripe Casual Cotton Shirt",
    "Corduroy Overshirt with Chest Flap Pockets",
    "Textured Dobby Weave Semi-Formal White Shirt",
    "Pastel Peach Soft Washed Cotton Shirt",
    "Checked Twill Casual Relaxed Fit Shirt",
    "Spread Collar Royal Navy Executive Formal Shirt",
    "Geometric Print Bohemian Rayon Resort Shirt",
    "Sage Green Poplin Minimalist Casual Shirt",
    "Fleece Lined Winter Checked Lumberjack Shirt",
    "Grandad Collar Slub Cotton Casual Kurta Shirt",
    "Classic Light Blue Business Twill Shirt",
    "Printed Silk Blend Festive Contemporary Shirt"
  ];

  const shirtImages = [
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80",
    "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80",
  ];

  shirtNames.forEach((sName, idx) => {
    const mrp = 1799 + ((idx * 120) % 1500);
    const price = Math.round(mrp * 0.44);
    const sku = `ST1-SHT-${String(idCounter).padStart(4, '0')}`;
    const slug = sName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const discount = Math.round(((mrp - price) / mrp) * 100);
    products.push({
      id: `prod-${idCounter}`,
      sku,
      name: `Men's ${sName}`,
      slug,
      category_id: 'cat-shirts',
      category_name: 'Shirts',
      gender: 'Men',
      description: `Tailored with precision using high-grade yarn counts. Reinforced collar interlining, unbreakable horn-look buttons, and curved hem for tucked or untucked styling.`,
      brand: idx % 2 === 0 ? "TRYatHOME Classic" : "Heritage Stitch",
      mrp,
      selling_price: price,
      discount_percentage: discount,
      stock: 35 + (idx * 4) % 45,
      status: 'Published',
      rating: Number((4.3 + ((idx % 6) / 10)).toFixed(1)),
      rating_count: 98 + (idx * 18),
      sizes: ["38", "40", "42", "44", "46"],
      colors: ["White", "Sky Blue", "Olive", "Navy", "Burgundy"],
      tags: ["Executive", "Smart Casual", "Best Fabric"],
      specifications: {
        "Fabric": idx % 3 === 0 ? "100% Pure Linen" : "Giza Cotton Blend",
        "Fit": "Slim Contemporary Fit",
        "Collar": idx % 2 === 0 ? "Spread Collar" : "Mandarin Chinese Collar",
        "Hemline": "Curved Shirt Hem",
        "Wash Care": "Gentle Machine Wash, Iron at medium temp",
        "Origin": "India"
      },
      images: makeImages(shirtImages),
      created_at: new Date(Date.now() - (idCounter * 3600000)).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
    });
    idCounter++;
  });

  // Category: Pants & Trousers (20 products)
  const pantNames = [
    "Stretch Twill Smart Casual Chino Pants",
    "Formal Wrinkle-Free Pleated Formal Trousers",
    "6-Pocket Tactical Cargo Pants with Cuffs",
    "Super Soft Italian Fit Cotton Trousers",
    "High-Waist Wide-Leg Crepe Tailored Trousers",
    "Drawstring Elastic Waist Relaxed Linen Pants",
    "Ankle Length Slim Fit Cropped Trousers",
    "Fine Ribbed Corduroy Autumn Trousers",
    "Glen Plaid Check British Style Trousers",
    "Tapered Tech-Chino Water Repellent Pants",
    "Women's Straight Leg Office Formal Pants",
    "Pleated Gurkha Waistband Heritage Trousers",
    "Stretch Cotton Sateen Formal Trousers",
    "Loose Slouchy Utility Carpenter Pants",
    "Pencil Fit High-Rise Business Trousers",
    "Flat Front Tailored Wool-Blend Trousers",
    "Modern Commuter Pants with Flex Waist",
    "Culottes Relaxed Cropped Palazzo Pants",
    "Double Pleated Vintage Khakis",
    "Tailored Cigarette Pants with Belt Loops"
  ];

  const pantImages = [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80",
    "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
  ];

  pantNames.forEach((pName, idx) => {
    const isWomen = idx % 3 === 1 || pName.includes("Women");
    const mrp = 1999 + ((idx * 110) % 1200);
    const price = Math.round(mrp * 0.46);
    const sku = `ST1-PNT-${String(idCounter).padStart(4, '0')}`;
    const slug = pName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const discount = Math.round(((mrp - price) / mrp) * 100);
    products.push({
      id: `prod-${idCounter}`,
      sku,
      name: pName,
      slug,
      category_id: 'cat-pants',
      category_name: 'Pants & Trousers',
      gender: isWomen ? 'Women' : 'Men',
      description: `Constructed from four-way stretch dynamic cotton twill that adapts to body motion. Hidden waistband gripper keeps shirts tucked seamlessly.`,
      brand: "TRYatHOME Formal & Casual",
      mrp,
      selling_price: price,
      discount_percentage: discount,
      stock: 30 + (idx * 3) % 40,
      status: 'Published',
      rating: Number((4.2 + ((idx % 7) / 10)).toFixed(1)),
      rating_count: 76 + (idx * 12),
      sizes: isWomen ? ["28", "30", "32", "34"] : ["30", "32", "34", "36", "38"],
      colors: ["Khaki", "Navy Blue", "Olive Green", "Charcoal", "Beige"],
      tags: ["Formal", "Chinos", "Stretchable"],
      specifications: {
        "Fabric": "97% Cotton, 3% Elastane",
        "Waistband": "Semi-elastic internal flex band",
        "Pockets": "2 Slant Front, 2 Welt Back pockets",
        "Rise": "Mid-Rise",
        "Origin": "India"
      },
      images: makeImages(pantImages),
      created_at: new Date(Date.now() - (idCounter * 3600000)).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
    });
    idCounter++;
  });

  // Category: Leggings (20 products)
  const leggingNames = [
    "Ultra Soft 4-Way Stretch Ankle Length Leggings",
    "High Waist Tummy-Tuck Compression Leggings",
    "Traditional Cotton Churidar Leggings with Gathered Ankle",
    "Seamless Ribbed Yoga & Active Workout Leggings",
    "Fleece Lined Thermal Winter Warm Leggings",
    "Floral Block Printed Modal Cotton Leggings",
    "Shimmer Metallic Party Wear Stretch Leggings",
    "Side Mesh Pocket Athletic Running Tights",
    "Bio-Washed 100% Organic Lycra Daily Leggings",
    "Ankle Cutout Lattice Detail Chic Leggings",
    "Capri 3/4th Length Summer Cotton Leggings",
    "Tie & Dye Gradient Activewear Leggings",
    "Velvet Touch Cozy Loungewear Leggings",
    "Maternity Over-The-Belly Support Leggings",
    "Faux Leather Matte Finish Biker Leggings",
    "Ethnic Zari Border Festive Churidar Leggings",
    "Camo Printed High-Waisted Workout Tights",
    "Pastel Blush Seamless Ribbed Leggings",
    "Two-Tone Sport Stripe Compression Tights",
    "Everyday Cotton Rich 4-Pack Leggings Set"
  ];

  const leggingImages = [
    "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    "https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=800&q=80",
    "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
  ];

  leggingNames.forEach((lName, idx) => {
    const mrp = 799 + ((idx * 60) % 800);
    const price = Math.round(mrp * 0.45);
    const sku = `ST1-LEG-${String(idCounter).padStart(4, '0')}`;
    const slug = lName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const discount = Math.round(((mrp - price) / mrp) * 100);
    products.push({
      id: `prod-${idCounter}`,
      sku,
      name: `Women's ${lName}`,
      slug,
      category_id: 'cat-leggings',
      category_name: 'Leggings',
      gender: 'Women',
      description: `Made with 95% combed cotton and 5% Spandex. Feather-light, non-see-through fabric with reinforced gusset that retains shape without sagging at knees.`,
      brand: "TRYatHOME Comfort Wear",
      mrp,
      selling_price: price,
      discount_percentage: discount,
      stock: 50 + (idx * 5) % 60,
      status: 'Published',
      rating: Number((4.3 + ((idx % 6) / 10)).toFixed(1)),
      rating_count: 220 + (idx * 28),
      sizes: ["Free Size (28-36)", "Plus Size (36-44)"],
      colors: ["Black", "White", "Maroon", "Royal Blue", "Beige", "Rani Pink"],
      tags: ["Super Soft", "Churidar & Ankle", "Non-Transparent"],
      specifications: {
        "Fabric": "95% Cotton, 5% Lycra",
        "Length": idx % 3 === 0 ? "Churidar (Gathered)" : "Ankle Length (36 inch)",
        "Transparency": "100% Opaque Non-See-Through",
        "Waistband": "Soft Elastic waistband, no roll-down",
        "Origin": "India"
      },
      images: makeImages(leggingImages),
      created_at: new Date(Date.now() - (idCounter * 3600000)).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
    });
    idCounter++;
  });

  // Category: Kurtis & Ethnic (20 products)
  const kurtiNames = [
    "Lucknowi Handcrafted Chikankari Pure Georgette Kurti",
    "Floral Block Printed A-Line Cotton Flared Kurti",
    "Royal Velvet Embroidered Festive Anarkali Kurta",
    "Straight Cut Indigo Dabu Print Daily Kurti with Pockets",
    "Angrakha Tie-Up Yoke Layered Festive Kurti",
    "Mirror Work Embellished Rayon Straight Kurti",
    "Bandhani Printed Bandhej Festive Kurta Set",
    "Chanderi Silk Golden Zari Border Festive Kurti",
    "Khadi Cotton Handloom Sleeveless Summer Kurti",
    "Kalamkari Block Print Flared Kurti with Tassels",
    "Pastel Mint Green Threadwork Straight Fit Kurti",
    "Tiered Ruffle Sleeve Boho Fusion Ethnic Kurti",
    "Jaipuri Sanganeri Print Front Slit Kurta",
    "Gota Patti Embellished Sharara Kurti Set",
    "Denim Slub Casual Kurti with Collar & Buttons",
    "Ajrakh Organic Natural Dye Bohemian Kurti",
    "Embroidered Yoke Silk Blend Festive Tunic",
    "Mandarin Collar Office Wear Straight Cotton Kurti",
    "Leheriya Print Vibrant Rajasthan Festive Kurti",
    "Asymmetric Hemline Contemporary Indo-Western Kurti"
  ];

  const kurtiImages = [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80",
    "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80",
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80",
  ];

  kurtiNames.forEach((kName, idx) => {
    const mrp = 1599 + ((idx * 130) % 1800);
    const price = Math.round(mrp * 0.42);
    const sku = `ST1-KRT-${String(idCounter).padStart(4, '0')}`;
    const slug = kName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const discount = Math.round(((mrp - price) / mrp) * 100);
    products.push({
      id: `prod-${idCounter}`,
      sku,
      name: kName,
      slug,
      category_id: 'cat-kurtis',
      category_name: 'Kurtis & Ethnic',
      gender: 'Women',
      description: `Celebrates timeless Indian craft and contemporary silhouettes. Lightweight, breathable, and vibrant color-fast dyes ideal for festivals, office, or everyday elegance.`,
      brand: "TRYatHOME Heritage Loom",
      mrp,
      selling_price: price,
      discount_percentage: discount,
      stock: 25 + (idx * 4) % 35,
      status: 'Published',
      rating: Number((4.4 + ((idx % 5) / 10)).toFixed(1)),
      rating_count: 165 + (idx * 22),
      sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
      colors: ["Mustard Yellow", "Teal Blue", "Rust Orange", "Maroon", "Bottle Green"],
      tags: ["Festive", "Ethnic", "Chikankari", "Handcrafted"],
      specifications: {
        "Fabric": idx % 3 === 0 ? "Pure Georgette with slip" : "100% Breathable Cotton",
        "Length": "Calf Length (44 inch)",
        "Sleeve": "3/4th Sleeves with border work",
        "Neck": "Round Neck with Notched Yoke",
        "Wash Care": "Dry Clean first wash, then gentle hand wash",
        "Origin": "Jaipur & Lucknow, India"
      },
      images: makeImages(kurtiImages),
      created_at: new Date(Date.now() - (idCounter * 3600000)).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
    });
    idCounter++;
  });

  // Category: Dresses (20 products)
  const dressNames = [
    "Floral Chiffon Wrap Midi Dress with Flounce Hem",
    "Classic Little Black Sleeveless Cocktail Dress",
    "Bohemian Tiered Maxi Beach Vacation Dress",
    "Cotton Poplin Fit & Flare Summer Day Dress",
    "Emerald Ribbed Knit Bodycon Party Dress",
    "Vintage Polka Dot Button-Down Shirt Dress",
    "Romantic Lace Inset Slip Midi Evening Dress",
    "Smocked Bodice Puff Sleeve Cottagecore Dress",
    "Square Neck Linen Blend A-Line Minimal Dress",
    "Satin Cowl Neck Elegant Cocktail Slip Dress",
    "Sweater Knit Ribbed Long Sleeve Winter Dress",
    "Off-Shoulder Bardot Ruffle Vacation Dress",
    "Pastel Floral Babydoll Mini Dress",
    "Denim Dungaree Pinafore Casual Layered Dress",
    "Belted Safari Utility Cotton Canvas Dress",
    "Abstract Art Print Georgette Pleated Dress",
    "Colorblocked High-Low Hem Cocktail Dress",
    "Drawstring Waist T-Shirt Casual Day Dress",
    "Velvet Surplice Neckline Holiday Party Dress",
    "Embroidered Eyelet Lace White Sun Dress"
  ];

  const dressImages = [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80",
  ];

  dressNames.forEach((dName, idx) => {
    const mrp = 2199 + ((idx * 140) % 1800);
    const price = Math.round(mrp * 0.44);
    const sku = `ST1-DRS-${String(idCounter).padStart(4, '0')}`;
    const slug = dName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const discount = Math.round(((mrp - price) / mrp) * 100);
    products.push({
      id: `prod-${idCounter}`,
      sku,
      name: `Women's ${dName}`,
      slug,
      category_id: 'cat-dresses',
      category_name: 'Dresses',
      gender: 'Women',
      description: `Chic and versatile design crafted with flowing fabrics that drape gracefully. Lined interior prevents transparency while maintaining airy comfort.`,
      brand: "TRYatHOME Glamour",
      mrp,
      selling_price: price,
      discount_percentage: discount,
      stock: 22 + (idx * 3) % 30,
      status: 'Published',
      rating: Number((4.3 + ((idx % 6) / 10)).toFixed(1)),
      rating_count: 110 + (idx * 16),
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Emerald Green", "Burgundy", "Navy", "Blush Pink", "Floral Print"],
      tags: ["Trending", "Party Wear", "Vacation Ready"],
      specifications: {
        "Fabric": idx % 2 === 0 ? "Poly Georgette with lining" : "100% Breathable Cotton",
        "Length": idx % 3 === 0 ? "Maxi (Ankle Length)" : "Midi (Knee Length)",
        "Closure": "Concealed Side Zipper",
        "Lining": "Attached Soft Voile Lining",
        "Origin": "India"
      },
      images: makeImages(dressImages),
      created_at: new Date(Date.now() - (idCounter * 3600000)).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
    });
    idCounter++;
  });

  // Category: Kids' Wear (20 products)
  const kidsNames = [
    "Boys Polo T-Shirt & Chino Shorts 2-Piece Set",
    "Girls Floral Embroidered Cotton Party Frock",
    "Unisex Denim Dungarees with Striped Tee Set",
    "Toddler Soft Organic Cotton Animal Print Romper",
    "Boys Superhero Graphic Cotton Half-Sleeve Tee",
    "Girls Tiered Ruffle Tulle Birthday Princess Dress",
    "Kids Warm Fleece Hooded Zipper Sweatshirt",
    "Boys Elastic Waist Comfort Fit Denim Jeans",
    "Girls Sequin Embellished Festive Kurta & Sharara",
    "Kids Breathable Active Tracksuit 2-Piece Set",
    "Boys Checked Cotton Casual Shirt with Bowtie",
    "Girls Pastel Butterfly Print Cotton Sun Dress",
    "Toddler Soft Knit Sleepsuit & Cap Set",
    "Kids Colorblocked Windbreaker Sports Jacket",
    "Boys Cargo Jogger Pants with Drawstring",
    "Girls Denim Jacket with Floral Back Patch",
    "Kids Pure Cotton 3-Pack Graphic Tees",
    "Boys Traditional Kurta Pajama with Nehru Jacket",
    "Girls Ankle Length Cotton Printed Leggings 2-Pack",
    "Kids Plush Fleece Animal Ear Bathrobe"
  ];

  const kidsImages = [
    "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80",
    "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80",
    "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&q=80",
    "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80",
  ];

  kidsNames.forEach((kName, idx) => {
    const mrp = 1199 + ((idx * 70) % 900);
    const price = Math.round(mrp * 0.45);
    const sku = `ST1-KID-${String(idCounter).padStart(4, '0')}`;
    const slug = kName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const discount = Math.round(((mrp - price) / mrp) * 100);
    products.push({
      id: `prod-${idCounter}`,
      sku,
      name: kName,
      slug,
      category_id: 'cat-kids',
      category_name: "Kids' Wear",
      gender: 'Kids',
      description: `Designed for active play with 100% skin-safe, hypoallergenic combed cotton. Tagless necklines, non-pinch elastic waistbands, and double-stitched seams.`,
      brand: "TRYatHOME Junior",
      mrp,
      selling_price: price,
      discount_percentage: discount,
      stock: 45 + (idx * 4) % 40,
      status: 'Published',
      rating: Number((4.5 + ((idx % 4) / 10)).toFixed(1)),
      rating_count: 85 + (idx * 14),
      sizes: ["2-3 Yrs", "4-5 Yrs", "6-7 Yrs", "8-9 Yrs", "10-12 Yrs"],
      colors: ["Multi-color", "Sky Blue", "Candy Pink", "Yellow", "Navy"],
      tags: ["100% Skin Safe", "Hypoallergenic", "Kid Friendly"],
      specifications: {
        "Fabric": "100% GOTS Certified Organic Cotton",
        "Fasteners": "Nickel-Free Snap Buttons",
        "Wash Care": "Machine wash warm with baby-safe soap",
        "Origin": "India"
      },
      images: makeImages(kidsImages),
      created_at: new Date(Date.now() - (idCounter * 3600000)).toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
    });
    idCounter++;
  });

  return products;
};
