# Type Conversion Feature

## Overview

PrestaShop API returns all data as strings in JSON format, even for numbers and booleans. This creates issues when using the data in n8n workflows:

**Before type conversion**:
```json
{
  "id": "123",           // String instead of number
  "active": "1",         // String instead of boolean  
  "price": "29.99",      // String instead of number
  "quantity": "100"      // String instead of number
}
```

**After type conversion**:
```json
{
  "id": 123,             // Number ✓
  "active": true,        // Boolean ✓
  "price": 29.99,        // Number ✓
  "quantity": 100        // Number ✓
}
```

## How It Works

### 1. Schema-Based Conversion

The node uses PrestaShop's own schema definitions to determine the correct type for each field:

- PrestaShop exposes field types via `?schema=synopsis` endpoint
- We extract type information (`isUnsignedId`, `isBool`, `isPrice`, etc.)
- We convert values based on these official types

### 2. Type Mapping

| PrestaShop Format | JavaScript Type | Example |
|-------------------|-----------------|---------|
| `isUnsignedId`, `isInt` | `number` | `"123"` → `123` |
| `isBool` | `boolean` | `"1"` → `true`, `"0"` → `false` |
| `isPrice`, `isFloat` | `number` | `"29.99"` → `29.99` |
| `isString`, `isReference` | `string` | `"ABC123"` → `"ABC123"` |

### 3. When Conversion Applies

Type conversion is **automatically applied** for these operations:
- ✅ **List all** - All items in the list
- ✅ **Get by ID** - Single item retrieved
- ✅ **Search with filters** - All matching items

Type conversion is **NOT applied** for:
- ❌ **Create** - Sends XML with string values
- ❌ **Update** - Sends XML with string values
- ❌ **Delete** - No response body
- ❌ **Raw Mode** - Returns raw XML/JSON as-is

## Setup

### Step 1: Fetch PrestaShop Schemas

Run this command once to fetch all schemas from your PrestaShop instance:

```bash
npm run fetch-schemas -- https://your-site.com/api YOUR_API_KEY
```

Or with environment variables:

```bash
export PRESTASHOP_API_URL=https://your-site.com/api
export PRESTASHOP_API_KEY=YOUR_API_KEY
npm run fetch-schemas
```

This generates `nodes/PrestaShop8/resourceSchemas.ts` with all field definitions.

### Step 2: Rebuild

```bash
npm run build
```

### Step 3: Restart n8n

Restart your n8n instance to load the updated node.

## Benefits

### 1. Correct Calculations

**Before** (strings):
```javascript
// ❌ String concatenation instead of addition
{{ $json.quantity + 10 }}  // "10010" instead of 110
```

**After** (numbers):
```javascript
// ✅ Proper math operations
{{ $json.quantity + 10 }}  // 110 ✓
```

### 2. Proper Conditionals

**Before** (strings):
```javascript
// ❌ String comparison
{{ $json.active == "1" }}  // Must compare as string
```

**After** (booleans):
```javascript
// ✅ Boolean logic
{{ $json.active }}  // Direct boolean check
```

### 3. Better Type Safety

**Before**:
- IF node requires string comparisons: `{{ $json.quantity > "50" }}`
- Math node fails with string inputs
- Switch node needs manual type conversion

**After**:
- All nodes work with proper types
- No manual conversion needed
- Predictable behavior

## Examples

### Example 1: Math Operations

**Search products with stock > 50**:

```javascript
// With type conversion ✅
{{ $json.quantity > 50 }}  // Works directly

// Calculate total value
{{ $json.quantity * $json.price }}  // Correct multiplication
```

### Example 2: Boolean Filters

**Filter active products**:

```javascript
// With type conversion ✅
.filter(product => product.active)  // Direct boolean check

// Without (would need)
.filter(product => product.active === "1")  // String comparison
```

### Example 3: Aggregations

**Calculate total inventory value**:

```javascript
// With type conversion ✅
{{
  $items("Search Products")
    .map(item => item.json.quantity * item.json.price)
    .reduce((sum, value) => sum + value, 0)
}}
// Works perfectly with numbers
```

## Technical Details

### Conversion Function

```typescript
function convertFieldValue(value: any, fieldInfo: FieldSchema): any {
  switch (fieldInfo.type) {
    case 'number':
      return Number(value);
    
    case 'boolean':
      if (value === '1' || value === 1) return true;
      if (value === '0' || value === 0) return false;
      return Boolean(value);
    
    case 'string':
    default:
      return String(value);
  }
}
```

### Safety

- **No false positives**: Only converts fields defined in PrestaShop schema
- **Preserves unknowns**: Fields not in schema stay as-is
- **Handles nulls**: `null` and `undefined` are preserved
- **Smart string detection**: Reference IDs like `"REF123"` stay as strings (because PrestaShop defines them as `isReference`)

### Performance

- **Zero API calls**: Schemas are embedded at compile time
- **Fast conversion**: Simple type casting, no heavy parsing
- **Minimal overhead**: Only converts what's in the schema

## Maintenance

### Updating Schemas

When to re-fetch schemas:
- After PrestaShop upgrade
- When adding custom fields
- When installing modules that modify resources

Simply run:
```bash
npm run fetch-schemas -- <API_URL> <API_KEY>
npm run build
```

### Adding Custom Resources

If you have custom PrestaShop resources:

1. Add resource name to `RESOURCES` array in `scripts/fetch-prestashop-schemas.js`
2. Run `npm run fetch-schemas`
3. Schemas will be automatically included

## Troubleshooting

### "Schema not found for resource"

The resource hasn't been fetched. Run:
```bash
npm run fetch-schemas
```

### "Conversion not working"

Check that:
1. Schemas are populated in `resourceSchemas.ts`
2. You've rebuilt: `npm run build`
3. n8n has been restarted
4. You're not in Raw Mode (conversion is disabled in Raw Mode)

### "Wrong type for field"

The schema might be outdated. Re-fetch:
```bash
npm run fetch-schemas
```

## Future Enhancements

Potential improvements:
- [ ] Auto-completion for field names in Create/Update operations
- [ ] Field validation based on `maxSize` and `required` attributes
- [ ] Type hints in n8n UI for field selection
- [ ] Multilang field handling
- [ ] Date parsing to Date objects

## Summary

✅ **Automatic** - No manual configuration needed after schema fetch  
✅ **Safe** - Based on official PrestaShop schemas  
✅ **Fast** - No runtime API calls  
✅ **Complete** - Works for all 31 resources  
✅ **Accurate** - No false positives, preserves string IDs  

This feature makes the PrestaShop8 node behave like first-class n8n nodes with proper typing!
