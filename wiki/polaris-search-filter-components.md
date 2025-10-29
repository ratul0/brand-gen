# Search and Filter Components in Polaris

This guide covers the best Polaris components for implementing search and filter functionality in Shopify App Home applications.

## 🔍 Primary Search Component: `s-search-field`

The **SearchField** component is purpose-built for search functionality:

### Example Usage
```html
<s-search-field
  placeholder="Search products..."
  label="Search products"
  labelAccessibilityVisibility="exclusive"
  value=""
  onInput={(event) => handleSearch(event.target.value)}
/>
```

### Key Features
- Visual search styling with built-in search icon
- Clear button functionality for easy reset
- Optimized for capturing search terms
- Proper accessibility support out of the box
- Real-time input events for dynamic search

### Events
- `onInput`: Triggered on each keystroke
- `onChange`: Triggered when field loses focus
- `onFocus`: Triggered when field is focused
- `onBlur`: Triggered when field loses focus

## 📊 Filter Components

### 1. Text Field with Icon (Table Search)

Use TextField with search icon for filtering within tables:

```html
<s-text-field
  label="Search puzzles"
  labelAccessibilityVisibility="exclusive"
  icon="search"
  placeholder="Searching all puzzles"
  value={searchTerm}
  onChange={handleTableSearch}
/>
```

### 2. Choice List for Multiple Options

Perfect for filter selections with multiple options:

```html
<s-choice-list label="Filter by status" name="status-filter">
  <s-choice value="active" selected={selectedStatus === 'active'}>
    Active
  </s-choice>
  <s-choice value="draft" selected={selectedStatus === 'draft'}>
    Draft
  </s-choice>
  <s-choice value="archived" selected={selectedStatus === 'archived'}>
    Archived
  </s-choice>
</s-choice-list>
```

### 3. Select for Dropdown Filters

For single-select filter options:

```html
<s-select
  label="Category"
  placeholder="Select category"
  value={selectedCategory}
  onChange={handleCategoryChange}
>
  <option value="all">All categories</option>
  <option value="electronics">Electronics</option>
  <option value="clothing">Clothing</option>
  <option value="books">Books</option>
</s-select>
```

### 4. Checkbox for Boolean Filters

For toggle-based filters:

```html
<s-checkbox
  label="Show in-stock items only"
  checked={showInStockOnly}
  onChange={handleInStockToggle}
/>
```

## 🎯 Complete Implementation Pattern

Based on the **Index Table** pattern, here's the best approach for combining search and filters:

```html
<s-section padding="none" accessibilityLabel="Products table section">
  <s-table>
    <!-- Filters slot with search and filter controls -->
    <s-grid slot="filters" gap="small-200" gridTemplateColumns="1fr auto auto">
      <!-- Search input -->
      <s-text-field
        label="Search products"
        labelAccessibilityVisibility="exclusive"
        icon="search"
        placeholder="Search products..."
        value={searchQuery}
        onChange={handleSearchChange}
      />

      <!-- Filter button -->
      <s-button
        icon="filter"
        variant="secondary"
        accessibilityLabel="Filters"
        commandFor="filter-popover"
      />

      <!-- Sort button -->
      <s-button
        icon="sort"
        variant="secondary"
        accessibilityLabel="Sort"
        commandFor="sort-popover"
      />
    </s-grid>

    <!-- Filter popover -->
    <s-popover id="filter-popover">
      <s-stack gap="none">
        <s-box padding="small">
          <s-choice-list label="Status" name="status">
            <s-choice value="all" selected>Status</s-choice>
            <s-choice value="active">Active</s-choice>
            <s-choice value="draft">Draft</s-choice>
          </s-choice-list>
        </s-box>
        <s-divider />
        <s-box padding="small">
          <s-select label="Category" name="category">
            <option value="all">All</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
          </s-select>
        </s-box>
      </s-stack>
    </s-popover>

    <!-- Sort popover -->
    <s-popover id="sort-popover">
      <s-stack gap="none">
        <s-box padding="small">
          <s-choice-list label="Sort by" name="sort-by">
            <s-choice value="name" selected>Name</s-choice>
            <s-choice value="price">Price</s-choice>
            <s-choice value="created">Created</s-choice>
          </s-choice-list>
        </s-box>
        <s-divider />
        <s-box padding="small">
          <s-choice-list label="Order" name="order">
            <s-choice value="asc" selected>A-Z</s-choice>
            <s-choice value="desc">Z-A</s-choice>
          </s-choice-list>
        </s-box>
      </s-stack>
    </s-popover>

    <!-- Table headers -->
    <s-table-header-row>
      <s-table-header listSlot="primary">Product</s-table-header>
      <s-table-header format="numeric">Price</s-table-header>
      <s-table-header>Created</s-table-header>
      <s-table-header listSlot="secondary">Status</s-table-header>
    </s-table-header-row>

    <!-- Table content -->
    <s-table-body>
      {/* Render filtered and sorted data here */}
    </s-table-body>
  </s-table>
</s-section>
```

## 🛠️ Advanced Filter Patterns

### 1. Range Filters (Price, Date, etc.)

```html
<s-stack gap="small">
  <s-number-field
    label="Min price"
    placeholder="0"
    value={minPrice}
    onChange={handleMinPriceChange}
  />
  <s-number-field
    label="Max price"
    placeholder="1000"
    value={maxPrice}
    onChange={handleMaxPriceChange}
  />
</s-stack>
```

### 2. Tag/Chip Filters

```html
<s-stack direction="inline" gap="small" wrap>
  <s-clickable-chip
    removable
    onClick={() => removeTag('electronics')}
  >
    Electronics
  </s-clickable-chip>
  <s-clickable-chip
    removable
    onClick={() => removeTag('new')}
  >
    New
  </s-clickable-chip>
</s-stack>
```

### 3. Combined Filter States

```javascript
// Example state management for filters
const [filters, setFilters] = useState({
  search: '',
  status: 'all',
  category: 'all',
  inStockOnly: false,
  minPrice: '',
  maxPrice: '',
  sortBy: 'name',
  sortOrder: 'asc'
});

// Apply filters to data
const filteredData = useMemo(() => {
  return rawData.filter(item => {
    // Search filter
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }

    // Category filter
    if (filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }

    // Stock filter
    if (filters.inStockOnly && !item.inStock) {
      return false;
    }

    // Price range filter
    if (filters.minPrice && item.price < parseFloat(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && item.price > parseFloat(filters.maxPrice)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Sort logic
    const aValue = a[filters.sortBy];
    const bValue = b[filters.sortBy];

    if (filters.sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });
}, [rawData, filters]);
```

## 📱 Mobile-Responsive Considerations

1. **Filter Drawer**: Use a modal or drawer for complex filters on mobile
2. **Simplified Layout**: Stack search and filter controls vertically on small screens
3. **Touch-Friendly**: Ensure buttons and controls have adequate touch targets

## 🎨 Best Practices

1. **Clear Visual Hierarchy**: Separate search from filters visually
2. **Instant Feedback**: Apply filters immediately without page refresh when possible
3. **Reset Options**: Provide clear ways to reset individual filters or all filters
4. **Filter Counts**: Show number of active filters
5. **No Dead Ends**: Ensure filters don't result in empty states without guidance
6. **Performance**: Debounce search input to avoid excessive re-renders

## 📚 Related Documentation

- [Index Table Pattern](https://shopify.dev/docs/api/app-home/patterns/compositions/index-table)
- [Table Component](https://shopify.dev/docs/api/app-home/polaris-web-components/structure/table)
- [SearchField Component](https://shopify.dev/docs/api/pos-ui-extensions/latest/polaris-web-components/forms/searchfield)
- [TextField Component](https://shopify.dev/docs/api/app-home/polaris-web-components/forms/textfield)

## 🔗 Quick Reference

| Component | Use Case | Key Props |
|-----------|----------|------------|
| `s-search-field` | Primary search | `placeholder`, `value`, `onInput` |
| `s-text-field` + `icon="search"` | Table search | `icon`, `placeholder`, `onChange` |
| `s-choice-list` | Multiple selections | `multiple`, `selected`, `onChange` |
| `s-select` | Dropdown filter | `value`, `onChange` |
| `s-checkbox` | Boolean filters | `checked`, `onChange` |
| `s-popover` | Filter container | `id`, placement |
| `s-button` | Filter triggers | `icon`, `commandFor` |
| `s-table` slot="filters" | Filter container | N/A |