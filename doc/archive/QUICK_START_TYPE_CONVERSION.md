# Quick Start: Type Conversion

## 🚀 Enable Type Conversion in 3 Steps

### Step 1: Fetch PrestaShop Schemas

Run this command **once** with your PrestaShop credentials:

```bash
npm run fetch-schemas -- https://your-prestashop.com/api YOUR_API_KEY
```

**Or with environment variables:**
```bash
export PRESTASHOP_API_URL=https://your-prestashop.com/api
export PRESTASHOP_API_KEY=YOUR_API_KEY
npm run fetch-schemas
```

**What it does:**
- Connects to your PrestaShop API
- Fetches field types for all 31 resources
- Generates `resourceSchemas.ts` with type definitions

**Expected output:**
```
📥 Fetching schemas for all resources...
  products... ✅ (87 fields)
  categories... ✅ (45 fields)
  stock_availables... ✅ (15 fields)
  ...
✅ Generated: nodes/PrestaShop8/resourceSchemas.ts
```

### Step 2: Build the Project

```bash
npm run build
```

This compiles TypeScript and includes the schemas in the node.

### Step 3: Restart n8n

```bash
# If using n8n locally
n8n restart

# If using npm installation
npm install /path/to/n8n-nodes-prestashop8
n8n restart
```

## ✅ That's It!

Type conversion is now **automatically active** for:
- ✅ List all operations
- ✅ Get by ID operations
- ✅ Search with filters operations

## 🧪 Test It

### Quick Test Workflow in n8n

1. **Add PrestaShop8 node**
2. **Configure**:
   - Operation: `Search`
   - Resource: `Products`
   - Filter: `active = 1`
3. **Add Function node** after it
4. **Code**:
   ```javascript
   // Test type conversion
   const item = $input.first().json;
   
   return {
     // These operations only work with correct types!
     doubleQuantity: item.quantity * 2,        // Math
     isActive: item.active === true,           // Boolean
     priceAbove20: item.price > 20,            // Comparison
     totalValue: item.quantity * item.price,   // Calculation
   };
   ```
5. **Execute** ✓

**Before type conversion**: This would fail or give wrong results  
**After type conversion**: Works perfectly!

## 📊 What Changed?

### Before (PrestaShop API Raw Response)
```json
{
  "id": "123",
  "quantity": "100",
  "price": "29.99",
  "active": "1"
}
```

### After (With Type Conversion)
```json
{
  "id": 123,
  "quantity": 100,
  "price": 29.99,
  "active": true
}
```

## 💡 Common Use Cases

### Use Case 1: Filter Products by Price

```javascript
// In Function node or IF node
{{ $json.price > 50 }}  // Works directly!
```

### Use Case 2: Calculate Total Value

```javascript
// In Function node
return items.map(item => ({
  product: item.json.name,
  totalValue: item.json.quantity * item.json.price
}));
```

### Use Case 3: Check Active Status

```javascript
// In IF node
{{ $json.active }}  // Direct boolean check
```

### Use Case 4: Aggregate Data

```javascript
// Calculate total inventory value
const total = $items("Search Products")
  .map(item => item.json.quantity * item.json.price)
  .reduce((sum, val) => sum + val, 0);

return { totalInventoryValue: total };
```

## 🔍 Verify It's Working

Run the test script:

```bash
node test-type-conversion.js
```

Expected:
```
✅ id: number
✅ price: number
✅ active: boolean
✅ quantity: number
✅ reference: string
🎉 Tous les tests sont passés!
```

## ⚙️ Configuration

**No configuration needed!** Type conversion is:
- ✅ Automatic
- ✅ Always active (for List/Get/Search)
- ✅ Based on official PrestaShop schemas
- ✅ Safe (no false positives)

## 🔄 Update Schemas

If you upgrade PrestaShop or add custom fields:

```bash
npm run fetch-schemas -- <API_URL> <API_KEY>
npm run build
# Reinstall and restart n8n
```

## 📚 Learn More

- **Full documentation**: `TYPE_CONVERSION.md`
- **Implementation details**: `IMPLEMENTATION_SUMMARY.md`
- **Script documentation**: `scripts/README.md`

## ❓ Troubleshooting

**Q: Types still showing as strings**
- ✅ Did you run `fetch-schemas`?
- ✅ Did you run `npm run build`?
- ✅ Did you restart n8n?
- ✅ Are you in Raw Mode? (type conversion disabled in Raw Mode)

**Q: Schema fetch fails**
- ✅ Check API URL (should end with `/api`)
- ✅ Verify API key permissions
- ✅ Ensure API is accessible

**Q: Some fields not converted**
- ✅ Field might not be in PrestaShop schema
- ✅ Unknown fields are kept as-is (safe default)
- ✅ Re-fetch schemas if you added custom fields

## 🎉 Enjoy Proper Types!

Your PrestaShop data now works seamlessly with all n8n nodes:
- ✅ IF node - Boolean conditions
- ✅ Switch node - Numeric comparisons
- ✅ Math node - Calculations
- ✅ Function node - JavaScript operations
- ✅ And all other nodes!

No more manual type conversion needed! 🚀
