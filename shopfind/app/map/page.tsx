"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Search, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

// Define types for our data
interface Store {
  id: number
  name: string
  address: string
  lat: number
  lng: number
}

interface Product {
  id: number
  name: string
  category: string
  price: number
  image: string
  description: string
}

interface ProductStore {
  storeId: number
  productId: number
  price: number
  inStock: boolean
}

// Set your Mapbox access token here
// In a real application, this should be an environment variable
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

export default function MapPage() {
  // Get search params from URL
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchQuery = searchParams.get("search") || ""

  // States
  const [search, setSearch] = useState(searchQuery)
  const [userLocation, setUserLocation] = useState<[number, number]>([-0.09, 51.505]) // Default to London (lng, lat for Mapbox)
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productStores, setProductStores] = useState<ProductStore[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [resultsFound, setResultsFound] = useState(true)

  // Map refs
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]) // Note: Mapbox uses [lng, lat]
        },
        () => {
          console.log("Unable to retrieve your location")
        },
      )
    }
  }, [])

  // Load mock data
  useEffect(() => {
    // Mock data for demo purposes
    setStores(mockStores)
    setProducts(mockProducts)
    setProductStores(mockProductStores)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [userLocation[0], userLocation[1]],
      zoom: 13,
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [userLocation[0], userLocation[1]])

  // Update map center when user location changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [userLocation[0], userLocation[1]],
        zoom: 13,
        essential: true,
      })
    }
  }, [userLocation])

  // Handle search when URL param changes
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery)
    }
  }, [searchQuery])

  // Update markers when stores change
  useEffect(() => {
    // Clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    if (!map.current) return

    // Add new markers
    stores.forEach((store) => {
      const storeProducts = findProductInStore(store.id)

      // Create popup content
      const popupContent = document.createElement("div")
      popupContent.className = "w-48 p-2"

      const storeName = document.createElement("h3")
      storeName.className = "font-semibold text-base"
      storeName.textContent = store.name
      popupContent.appendChild(storeName)

      const storeAddress = document.createElement("p")
      storeAddress.className = "text-xs text-gray-500 mb-2"
      storeAddress.textContent = store.address
      popupContent.appendChild(storeAddress)

      const productsContainer = document.createElement("div")
      productsContainer.className = "space-y-2 mt-2 max-h-40 overflow-y-auto"

      storeProducts.forEach((product) => {
        if (!product) return

        const productDiv = document.createElement("div")
        productDiv.className = "flex flex-col"

        const productHeader = document.createElement("div")
        productHeader.className = "flex justify-between items-center mb-1"

        const productName = document.createElement("span")
        productName.className = "text-sm font-medium"
        productName.textContent = product.name

        const productPrice = document.createElement("span")
        productPrice.className = "text-sm"
        productPrice.textContent = `$${product.price.toFixed(2)}`

        productHeader.appendChild(productName)
        productHeader.appendChild(productPrice)
        productDiv.appendChild(productHeader)

        // Add product image placeholder
        const imgContainer = document.createElement("div")
        imgContainer.className = "h-16 w-full bg-gray-200 rounded"
        imgContainer.style.backgroundImage = `url(${product.image || "/placeholder.svg"})`
        imgContainer.style.backgroundSize = "cover"
        imgContainer.style.backgroundPosition = "center"

        productDiv.appendChild(imgContainer)
        productsContainer.appendChild(productDiv)
      })

      popupContent.appendChild(productsContainer)

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent)

      // Create marker
      const marker = new mapboxgl.Marker()
        .setLngLat([store.lng, store.lat])
        .setPopup(popup)
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [stores, search])

  // Search function
  const handleSearch = (query: string) => {
    setIsLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      const filteredProducts = mockProducts.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()),
      )

      if (filteredProducts.length > 0) {
        setResultsFound(true)
        const productIds = filteredProducts.map((p) => p.id)

        // Find stores that carry these products
        const relevantProductStores = mockProductStores.filter((ps) => productIds.includes(ps.productId) && ps.inStock)

        // Filter stores that have these products
        const storeIds = [...new Set(relevantProductStores.map((ps) => ps.storeId))]
        const filteredStores = mockStores.filter((store) => storeIds.includes(store.id))

        setStores(filteredStores)
      } else {
        setResultsFound(false)
        setStores([])
      }

      setIsLoading(false)
    }, 500)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/map?search=${encodeURIComponent(search)}`)
  }

  // Find product in a store
  const findProductInStore = (storeId: number) => {
    const storeProducts = mockProductStores
      .filter((ps) => ps.storeId === storeId && ps.inStock)
      .map((ps) => {
        const product = mockProducts.find((p) => p.id === ps.productId)
        return {
          ...product,
          price: ps.price,
        }
      })

    // Filter by search query if present
    if (search) {
      return storeProducts.filter((product) => product?.name.toLowerCase().includes(search.toLowerCase()))
    }

    return storeProducts
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 py-4">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ShopFind</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium">
              Home
            </Link>
            <Link href="/map" className="text-sm font-medium">
              Find Products
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 p-4 border-r">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for products..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full mt-2">
              Find Products
            </Button>
          </form>

          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !resultsFound ? (
            <div className="text-center my-8">
              <p className="text-muted-foreground">No products found matching "{search}"</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          ) : stores.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {stores.length} {stores.length === 1 ? "Store" : "Stores"} Found
              </h2>

              {stores.map((store) => {
                const storeProducts = findProductInStore(store.id)
                return (
                  <Card key={store.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{store.name}</h3>
                      <p className="text-sm text-muted-foreground">{store.address}</p>
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">Available Products:</h4>
                        <div className="space-y-2">
                          {storeProducts.map((product) => (
                            <div key={product?.id} className="flex items-center justify-between">
                              <span className="text-sm">{product?.name}</span>
                              <span className="text-sm font-medium">${product?.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className="flex-1 h-[calc(100vh-4rem)]">
          <div ref={mapContainer} className="h-full w-full" />
        </div>
      </main>
    </div>
  )
}

// Mock data
const mockStores: Store[] = [
  { id: 1, name: "TechWorld", address: "1234 El Camino Real, Santa Clara, CA", lat: 42.420971, lng: -83.136139 },
  { id: 2, name: "SportsMart", address: "5675 Great America Pkwy, Santa Clara, CA", lat: 37.3595, lng: -121.9800 },
  { id: 3, name: "HomeGoods", address: "1000 E El Camino Real, Santa Clara, CA", lat: 37.3614, lng: -121.9275 },
  { id: 4, name: "ElectroHub", address: "1500 S Bascom Ave, Santa Clara, CA", lat: 37.3120, lng: -121.9477 },
  { id: 5, name: "FashionPlace", address: "2000 N 1st St, Santa Clara, CA", lat: 37.3874, lng: -121.9454 },
  { id: 6, name: "HealthMart", address: "3000 Mission College Blvd, Santa Clara, CA", lat: 37.3896, lng: -121.9785 },
]

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 79.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "High-quality wireless headphones with noise cancellation",
  },
  {
    id: 2,
    name: "Running Shoes",
    category: "Sports & Outdoors",
    price: 89.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Comfortable running shoes with excellent support",
  },
  {
    id: 3,
    name: "Coffee Maker",
    category: "Home & Kitchen",
    price: 49.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Programmable coffee maker with thermal carafe",
  },
  {
    id: 4,
    name: "Smartphone Charger",
    category: "Electronics",
    price: 14.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Fast-charging USB-C smartphone charger",
  },
  {
    id: 5,
    name: "Backpack",
    category: "Fashion",
    price: 39.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Durable backpack with multiple compartments",
  },
  {
    id: 6,
    name: "Protein Powder",
    category: "Health & Wellness",
    price: 29.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Premium whey protein powder for muscle recovery",
  },
  {
    id: 7,
    name: "Smart Watch",
    category: "Electronics",
    price: 199.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Feature-rich smartwatch with health monitoring",
  },
  {
    id: 8,
    name: "Yoga Mat",
    category: "Sports & Outdoors",
    price: 24.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Non-slip yoga mat with carrying strap",
  },
]

const mockProductStores: ProductStore[] = [
  { storeId: 1, productId: 1, price: 79.99, inStock: true },
  { storeId: 1, productId: 4, price: 14.99, inStock: true },
  { storeId: 1, productId: 7, price: 199.99, inStock: true },
  { storeId: 2, productId: 2, price: 89.99, inStock: true },
  { storeId: 2, productId: 5, price: 39.99, inStock: true },
  { storeId: 2, productId: 8, price: 24.99, inStock: true },
  { storeId: 3, productId: 3, price: 49.99, inStock: true },
  { storeId: 3, productId: 5, price: 42.99, inStock: true },
  { storeId: 4, productId: 1, price: 74.99, inStock: true },
  { storeId: 4, productId: 4, price: 12.99, inStock: true },
  { storeId: 4, productId: 7, price: 189.99, inStock: true },
  { storeId: 5, productId: 5, price: 38.99, inStock: true },
  { storeId: 5, productId: 2, price: 94.99, inStock: true },
  { storeId: 6, productId: 6, price: 29.99, inStock: true },
  { storeId: 6, productId: 8, price: 22.99, inStock: true },
]

