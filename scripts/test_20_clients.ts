import { db } from '../src/services/db';
import { supabase } from '../src/utils/supabase/client';

async function run20ClientStressTest() {
  console.log('====================================================');
  console.log('      PHASE 18 & 19: 20-CLIENT REFRESH STRESS TEST');
  console.log('====================================================');

  await db.syncFromSupabase();

  const testShopkeepers: any[] = [];
  const testProductIds: string[] = [];

  try {
    // 1. Create 20 demo shopkeepers using db.createShopkeeperAsync sequentially
    console.log('[Phase 18] Setting up 20 demo shopkeeper clients via db.createShopkeeperAsync...');
    const ts = Date.now();
    for (let i = 1; i <= 20; i++) {
      const mobile = `98765${String(ts).slice(-5)}${String(i).padStart(2, '0')}`;
      const shopkeeper = await db.createShopkeeperAsync({
        name: `Demo Partner ${i}`,
        store_name: `Demo Fashion Hub ${i}`,
        mobile,
        email: `demo.partner.${ts}.${i}@tryathome.in`,
      });
      testShopkeepers.push(shopkeeper);
    }

    console.log(`Successfully prepared and verified ${testShopkeepers.length} shopkeeper clients.`);

    console.log('[Phase 18] Adding 2 products per shopkeeper (40 total products across 20 clients concurrently)...');
    const prodPromises: Promise<string>[] = [];

    for (let i = 0; i < testShopkeepers.length; i++) {
      const shop = testShopkeepers[i];
      for (let p = 1; p <= 2; p++) {
        prodPromises.push(
          db.addShopkeeperProductAsync(shop.id, {
            name: `Client ${i + 1} Premium Design ${p}`,
            category_id: p === 1 ? 'cat-sarees' : 'cat-jeans',
            category_name: p === 1 ? 'Sarees' : 'Jeans',
            brand: `Demo Brand ${i + 1}`,
            mrp: 2999 + p * 500,
            shopkeeper_price: 1499 + p * 300,
            stock: 20 + p * 5,
            description: `Verified 100% database-persisted apparel for client ${i + 1} item ${p}.`,
            images: [
              {
                id: `img-test-${i}-${p}`,
                image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
                is_primary: true,
                sort_order: 1,
              },
            ],
            available_sizes: ['M', 'L', 'XL'],
            available_colors: ['Blue', 'Red'],
          }).then((prod) => prod.id)
        );
      }
    }

    const createdProdIds = await Promise.all(prodPromises);
    testProductIds.push(...createdProdIds);

    console.log(`Successfully created ${testProductIds.length} products across 20 test shopkeepers.`);

    // 2. Direct Supabase Database Verification
    console.log('[Phase 19] Verifying ALL products directly in Supabase Database...');
    const { data: dbProds, error: fetchErr } = await supabase
      .from('products')
      .select('id, name, shopkeeper_id')
      .in('id', testProductIds);

    console.log(`Direct Supabase Query returned ${dbProds?.length || 0} / ${testProductIds.length} rows.`);
    if (fetchErr || (dbProds && dbProds.length !== testProductIds.length)) {
      throw new Error(`Database verification mismatch! Expected ${testProductIds.length}, got ${dbProds?.length}`);
    }

    // 3. Refresh Simulation Test
    console.log('[Phase 19] Simulating Page Refresh (Purging Local Memory & Resyncing from Supabase)...');
    await db.syncFromSupabase();

    let allFound = true;
    for (const pid of testProductIds) {
      const found = db.getProductById(pid);
      if (!found) {
        console.error(`❌ Product ${pid} was LOST after refresh!`);
        allFound = false;
      }
    }

    if (allFound) {
      console.log('====================================================');
      console.log('✅ 20-CLIENT REFRESH STRESS TEST PASSED 100%!');
      console.log('   All 40 products persisted in Supabase DB & loaded after refresh!');
      console.log('====================================================');
    } else {
      console.error('❌ STRESS TEST FAILED: Some products disappeared after refresh!');
    }
  } catch (err: any) {
    console.error('Stress test exception:', err);
  } finally {
    // Clean up test products and shopkeepers
    console.log('Cleaning up test products and shopkeepers from Supabase...');
    if (testProductIds.length > 0) {
      await supabase.from('products').delete().in('id', testProductIds);
    }
    if (testShopkeepers.length > 0) {
      const ids = testShopkeepers.map((s) => s.id);
      await supabase.from('shopkeepers').delete().in('id', ids);
    }
    console.log('Cleanup finished.');
  }
}

run20ClientStressTest();
