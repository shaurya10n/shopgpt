import { describe, expect, it } from 'vitest'
import { parseAmazonPrice, normalizeAmazonProduct } from './amazonClient.js'
import {
  parsePriceFromText,
  refineProducts,
  withinPrice,
} from './productRefine.js'

describe('parseAmazonPrice', () => {
  it('parses currency strings', () => {
    expect(parseAmazonPrice('$1,299.99')).toBe(1299.99)
    expect(parseAmazonPrice('199.00')).toBe(199)
  })

  it('returns null for empty values', () => {
    expect(parseAmazonPrice(null)).toBeNull()
    expect(parseAmazonPrice('')).toBeNull()
  })
})

describe('normalizeAmazonProduct', () => {
  it('maps RapidAPI fields into the app schema', () => {
    const product = normalizeAmazonProduct({
      asin: 'B00TEST',
      product_title: 'Test Headphones',
      product_price: '$49.99',
      product_photo: 'https://example.com/img.jpg',
      product_url: 'https://www.amazon.com/dp/B00TEST',
      product_star_rating: '4.5',
      product_num_ratings: 100,
      product_byline: 'Electronics',
    })

    expect(product).toMatchObject({
      id: 'B00TEST',
      title: 'Test Headphones',
      price: 49.99,
      productUrl: 'https://www.amazon.com/dp/B00TEST',
      rating: 4.5,
      source: 'Amazon',
    })
  })
})

describe('parsePriceFromText', () => {
  it('parses under / below as exclusive max', () => {
    expect(parsePriceFromText('gaming monitor under $800')).toEqual({
      minPrice: null,
      maxPrice: 800,
      maxExclusive: true,
    })
  })

  it('parses between ranges', () => {
    expect(parsePriceFromText('headphones between 50 and 150')).toEqual({
      minPrice: 50,
      maxPrice: 150,
      maxExclusive: false,
    })
  })
})

describe('refineProducts', () => {
  const catalog = [
    {
      id: 'cheap',
      title: 'Acer 21.5 Monitor',
      price: 599,
      category: 'electronics',
      description: 'Full HD IPS monitor',
    },
    {
      id: 'expensive',
      title: 'Samsung 49-Inch Curved Gaming Monitor',
      price: 999.99,
      category: 'electronics',
      description: '144Hz gaming monitor',
    },
    {
      id: 'other',
      title: 'Wireless Mouse',
      price: 25,
      category: 'electronics',
      description: 'Bluetooth mouse',
    },
  ]

  it('drops products over an under-max price constraint', () => {
    const result = refineProducts(
      catalog,
      { maxPrice: 800, requiredTerms: ['monitor'], optionalTerms: ['gaming'] },
      'gaming monitor under 800',
    )

    expect(result.map((p) => p.id)).toEqual(['cheap'])
    expect(withinPrice(catalog[1], { maxPrice: 800, maxExclusive: true })).toBe(
      false,
    )
  })

  it('keeps price-valid items even when optional modifiers are missing', () => {
    const result = refineProducts(
      catalog,
      { maxPrice: 800, requiredTerms: ['monitor', 'gaming'], optionalTerms: [] },
      'gaming monitor under 800',
    )

    expect(result.map((p) => p.id)).toEqual(['cheap'])
  })
})
