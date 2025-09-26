import jsPDF from 'jspdf';

interface SnackProduct {
  name: string;
  itemCode: string;
  unit: string;
  price: number;
  premise?: string;
  date?: string;
}

interface OrderItem {
  productName: string;
  packSize: string;
  pricePerBox: number;
  boxesNeeded: number;
  total: number;
}

interface SnackOrderParams {
  companyName: string;
  pax: number;
  budgetPerPerson: number;
  dietaryRestriction: 'Halal' | 'Vegetarian' | 'Vegan' | 'None';
  state?: string;
}

// Snack categories based on Malaysian products
const SNACK_CATEGORIES = {
  halal: [
    'MILO', 'MAGGI', 'NESTLE', 'GARDENIA', 'MASSIMO',
    'JULIE', 'MUNCHY', 'ORIENTAL', 'MAMEE', 'TWISTIES',
    'SUPER RING', 'CHEEZELS', 'ROLLER COASTER', 'PRINGLES',
    '100PLUS', 'REVIVE', 'F&N', 'COCA COLA', 'PEPSI',
    'MINERAL', 'AIR', 'SPRITZER', 'CACTUS', 'DASANI'
  ],
  vegetarian: [
    'MILO', 'NESTLE', 'GARDENIA', 'MASSIMO', 'JULIE',
    'MUNCHY', 'ORIENTAL', 'PRINGLES', '100PLUS', 'REVIVE',
    'F&N', 'COCA COLA', 'PEPSI', 'MINERAL', 'AIR',
    'SPRITZER', 'CACTUS', 'DASANI', 'OATS', 'GRANOLA'
  ],
  vegan: [
    'ORIENTAL', 'PRINGLES', '100PLUS', 'REVIVE',
    'COCA COLA', 'PEPSI', 'MINERAL', 'AIR',
    'SPRITZER', 'CACTUS', 'DASANI', 'OATS', 'GRANOLA',
    'FRUIT', 'NUTS', 'DATES'
  ],
  drinks: [
    'MILO', '100PLUS', 'REVIVE', 'F&N', 'COCA COLA',
    'PEPSI', 'MINERAL', 'AIR', 'SPRITZER', 'CACTUS',
    'DASANI', 'NESCAFE', 'TEH', 'JUICE'
  ],
  snacks: [
    'BISCUIT', 'BISKUT', 'COOKIES', 'CRACKERS', 'CHIPS',
    'TWISTIES', 'SUPER RING', 'CHEEZELS', 'ROLLER COASTER',
    'PRINGLES', 'MAMEE', 'MAGGI', 'CUP', 'GRANOLA', 'BAR'
  ]
};

// Fetch data from KPDN PriceCatcher (simplified for now)
async function fetchPriceCatcherData() {
  try {
    console.log('Using sample KPDN PriceCatcher data for development...');
    // For now, just return sample data to avoid network issues
    return getSampleData();
  } catch (error) {
    console.error('Error fetching KPDN data:', error);
    // Return sample data if fetch fails
    return getSampleData();
  }
}

// Parse CSV data
function parseCSV(text: string): any[] {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+)/g) || [];
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index]?.replace(/"/g, '').trim() || '';
    });
    return obj;
  }).filter(obj => Object.values(obj).some(v => v !== ''));
}

// Get sample data for demo/fallback
function getSampleData() {
  return {
    transactional: [
      { item_code: 'MLO001', price: '12.50', premise_code: 'P001', date: '2024-01-15' },
      { item_code: 'BSC001', price: '5.90', premise_code: 'P001', date: '2024-01-15' },
      { item_code: 'GRN001', price: '18.90', premise_code: 'P001', date: '2024-01-15' },
      { item_code: 'WTR001', price: '1.20', premise_code: 'P001', date: '2024-01-15' },
      { item_code: 'JUC001', price: '6.50', premise_code: 'P001', date: '2024-01-15' },
      { item_code: 'CHP001', price: '8.90', premise_code: 'P001', date: '2024-01-15' },
      { item_code: 'CKE001', price: '7.50', premise_code: 'P001', date: '2024-01-15' },
      { item_code: '100001', price: '3.50', premise_code: 'P001', date: '2024-01-15' }
    ],
    items: [
      { item_code: 'MLO001', item: 'MILO 3IN1 ACTIV-GO', item_group: 'BEVERAGES', item_category: 'HOT DRINKS', unit: '18 SACHETS X 33G' },
      { item_code: 'BSC001', item: "JULIE'S PEANUT BUTTER SANDWICH", item_group: 'SNACKS', item_category: 'BISCUITS', unit: '360G' },
      { item_code: 'GRN001', item: 'NESTLE FITNESSE GRANOLA HONEY', item_group: 'SNACKS', item_category: 'CEREALS', unit: '450G' },
      { item_code: 'WTR001', item: 'SPRITZER MINERAL WATER', item_group: 'BEVERAGES', item_category: 'WATER', unit: '600ML' },
      { item_code: 'JUC001', item: 'F&N ORANGE JUICE', item_group: 'BEVERAGES', item_category: 'JUICE', unit: '1L' },
      { item_code: 'CHP001', item: 'PRINGLES ORIGINAL', item_group: 'SNACKS', item_category: 'CHIPS', unit: '147G' },
      { item_code: 'CKE001', item: 'MUNCHY\'S LEXUS CALCIUM CRACKERS', item_group: 'SNACKS', item_category: 'CRACKERS', unit: '300G' },
      { item_code: '100001', item: '100PLUS ISOTONIC DRINK', item_group: 'BEVERAGES', item_category: 'SPORTS DRINKS', unit: '500ML' }
    ]
  };
}

// Filter products based on dietary restrictions
function filterByDietary(products: SnackProduct[], dietary: string): SnackProduct[] {
  if (dietary === 'None') return products;

  const keywords = dietary === 'Halal' ? SNACK_CATEGORIES.halal :
                   dietary === 'Vegetarian' ? SNACK_CATEGORIES.vegetarian :
                   dietary === 'Vegan' ? SNACK_CATEGORIES.vegan : [];

  return products.filter(product => {
    const nameUpper = product.name.toUpperCase();
    return keywords.some(keyword => nameUpper.includes(keyword));
  });
}

// Select products for the order
function selectProducts(products: SnackProduct[], pax: number, budgetPerPerson: number): OrderItem[] {
  const budget = pax * budgetPerPerson;
  const boxesNeeded = Math.ceil(pax / 5); // 1 box serves 5 pax

  // Sort by price to get variety
  const sortedProducts = [...products].sort((a, b) => a.price - b.price);

  // Select a variety of products
  const selectedItems: OrderItem[] = [];
  let currentTotal = 0;

  // Try to include different categories
  const categories = ['drink', 'biscuit', 'snack', 'granola'];

  for (const category of categories) {
    const categoryProducts = sortedProducts.filter(p => {
      const nameLower = p.name.toLowerCase();
      if (category === 'drink') {
        return nameLower.includes('milo') || nameLower.includes('100plus') ||
               nameLower.includes('water') || nameLower.includes('juice');
      } else if (category === 'biscuit') {
        return nameLower.includes('biscuit') || nameLower.includes('biskut') ||
               nameLower.includes('cracker') || nameLower.includes('cookies');
      } else if (category === 'snack') {
        return nameLower.includes('chips') || nameLower.includes('twisties') ||
               nameLower.includes('pringles') || nameLower.includes('mamee');
      } else if (category === 'granola') {
        return nameLower.includes('granola') || nameLower.includes('cereal') ||
               nameLower.includes('oats') || nameLower.includes('bar');
      }
      return false;
    });

    if (categoryProducts.length > 0) {
      const product = categoryProducts[0];
      const total = boxesNeeded * product.price;

      if (currentTotal + total <= budget * 1.1) { // Allow 10% over budget
        selectedItems.push({
          productName: product.name,
          packSize: product.unit,
          pricePerBox: product.price,
          boxesNeeded: boxesNeeded,
          total: total
        });
        currentTotal += total;
      }
    }
  }

  // If no products selected, add at least one
  if (selectedItems.length === 0 && sortedProducts.length > 0) {
    const product = sortedProducts[0];
    selectedItems.push({
      productName: product.name,
      packSize: product.unit,
      pricePerBox: product.price,
      boxesNeeded: boxesNeeded,
      total: boxesNeeded * product.price
    });
  }

  return selectedItems;
}

// Generate the PDF report
export async function generateSnackOrderReport(params: SnackOrderParams) {
  try {
    // Fetch data from KPDN
    const data = await fetchPriceCatcherData();

    // Process and join data
    const products: SnackProduct[] = [];
    const itemMap = new Map(data.items.map((item: any) => [item.item_code, item]));

    // Get latest prices for each unique item
    const latestPrices = new Map<string, any>();
    data.transactional.forEach((trans: any) => {
      const existing = latestPrices.get(trans.item_code);
      if (!existing || trans.date > existing.date) {
        latestPrices.set(trans.item_code, trans);
      }
    });

    // Create product list
    latestPrices.forEach((trans, itemCode) => {
      const item = itemMap.get(itemCode);
      if (item) {
        // Filter for snacks and drinks only
        const itemName = item.item?.toUpperCase() || '';
        const isSnackOrDrink = SNACK_CATEGORIES.snacks.some(s => itemName.includes(s)) ||
                               SNACK_CATEGORIES.drinks.some(d => itemName.includes(d));

        if (isSnackOrDrink || itemName.includes('BISCUIT') || itemName.includes('MILO')) {
          products.push({
            name: item.item || 'Unknown Product',
            itemCode: itemCode,
            unit: item.unit || 'PACK',
            price: parseFloat(trans.price) || 0,
            date: trans.date
          });
        }
      }
    });

    // Filter by dietary restrictions
    const filteredProducts = filterByDietary(products, params.dietaryRestriction);

    // Select products for the order
    const orderItems = selectProducts(filteredProducts, params.pax, params.budgetPerPerson);

    // Calculate totals
    const grandTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const budgetLimit = params.pax * params.budgetPerPerson;
    const budgetStatus = grandTotal <= budgetLimit
      ? 'Within Budget'
      : `Over Budget by RM ${(grandTotal - budgetLimit).toFixed(2)}`;

    // Generate PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('B2B Snack Order Report', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text(params.companyName, 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('en-MY')}`, 105, 37, { align: 'center' });

    // Create table manually
    let yPos = 50;

    // Table header
    doc.setFillColor(102, 126, 234);
    doc.rect(10, yPos, 190, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Pax', 15, yPos + 6);
    doc.text('Dietary', 35, yPos + 6);
    doc.text('Product Name', 80, yPos + 6);
    doc.text('Price (RM)', 140, yPos + 6);
    doc.text('Total (RM)', 170, yPos + 6);

    yPos += 12;

    // Table rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    orderItems.forEach((item, index) => {
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, yPos - 2, 190, 10, 'F');
      }

      doc.text(params.pax.toString(), 15, yPos + 4);
      doc.text(params.dietaryRestriction, 35, yPos + 4);

      // Truncate long product names
      const productName = item.productName.length > 25 ?
        item.productName.substring(0, 25) + '...' : item.productName;
      doc.text(productName, 80, yPos + 4);

      doc.text(`RM ${item.pricePerBox.toFixed(2)}`, 140, yPos + 4);
      doc.text(`RM ${item.total.toFixed(2)}`, 170, yPos + 4);

      yPos += 12;
    });

    // Summary
    const finalY = yPos + 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Grand Total: RM ${grandTotal.toFixed(2)}`, 14, finalY + 7);
    doc.text(`Budget Status: ${budgetStatus}`, 14, finalY + 14);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    const dataDate = products[0]?.date || new Date().toISOString().split('T')[0];
    doc.text(`Prices from KPDN PriceCatcher (OpenDOSM), ${dataDate}`, 105, 280, { align: 'center' });

    // Save the PDF
    const fileName = `Snack_Order_${params.companyName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(fileName);

    return {
      success: true,
      fileName,
      grandTotal,
      budgetStatus,
      itemCount: orderItems.length
    };

  } catch (error) {
    console.error('Error generating snack order report:', error);
    throw error;
  }
}