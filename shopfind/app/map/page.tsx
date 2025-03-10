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

// define types for our data
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

// set the mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN // ensure this is set in your environment

export default function MapPage() {
  // get search parameters from the url
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSearchQuery = searchParams.get("search") || ""

  // state variables for managing search and data
  const [search, setSearch] = useState(initialSearchQuery)
  const [userLocation, setUserLocation] = useState<[number, number]>([-0.09, 51.505]) // default to london coordinates
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productStores, setProductStores] = useState<ProductStore[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [resultsFound, setResultsFound] = useState(true)

  // map references
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  // get user's location using geolocation api
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]) // mapbox uses [lng, lat]
        },
        () => {
          console.log("unable to retrieve your location")
        },
      )
    }
  }, [])

  // load mock data for demonstration
  useEffect(() => {
    setStores(mockStores)
    setProducts(mockProducts)
    setProductStores(mockProductStores)
  }, [])

  // initialize the map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [userLocation[0], userLocation[1]],
      zoom: 13,
    })

    // add navigation controls to the map
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    // clean up the map on component unmount
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [userLocation[0], userLocation[1]])

  // update map center when user location changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [userLocation[0], userLocation[1]],
        zoom: 13,
        essential: true,
      })
    }
  }, [userLocation])

  // handle search when url parameter changes
  useEffect(() => {
    if (initialSearchQuery) {
      handleSearch(initialSearchQuery)
    }
  }, [initialSearchQuery])

  // update markers when stores change
  useEffect(() => {
    // clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    if (!map.current) return

    // add new markers for each store
    stores.forEach((store) => {
      const storeProducts = findProductInStore(store.id)

      // create popup content for the store
      const popupContent = document.createElement("div")
      popupContent.className = "popup-content"

      const storeName = document.createElement("h3")
      storeName.className = "store-name"
      storeName.textContent = store.name
      popupContent.appendChild(storeName)

      const storeAddress = document.createElement("p")
      storeAddress.className = "store-address"
      storeAddress.textContent = store.address
      popupContent.appendChild(storeAddress)

      const productsContainer = document.createElement("div")
      productsContainer.className = "products-container"

      storeProducts.forEach((product) => {
        if (!product) return

        const productDiv = document.createElement("div")
        productDiv.className = "product-div"

        const productHeader = document.createElement("div")
        productHeader.className = "product-header"

        const productName = document.createElement("span")
        productName.className = "product-name"
        productName.textContent = product.name ?? ""

        const productPrice = document.createElement("span")
        productPrice.className = "product-price"
        productPrice.textContent = `$${product.price.toFixed(2)}`

        productHeader.appendChild(productName)
        productHeader.appendChild(productPrice)
        productDiv.appendChild(productHeader)

        // add product image placeholder
        const imgContainer = document.createElement("div")
        imgContainer.className = "img-container"
        imgContainer.style.backgroundImage = `url(${product.image || "/placeholder.svg"})`

        productDiv.appendChild(imgContainer)
        productsContainer.appendChild(productDiv)
      })

      popupContent.appendChild(productsContainer)

      // create a popup for the marker
      const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent)

      // create and add the marker to the map
      const marker = new mapboxgl.Marker()
        .setLngLat([store.lng, store.lat])
        .setPopup(popup)
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [stores, search])

  // search function to filter products
  const handleSearch = (query: string) => {
    setIsLoading(true)

    // simulate api call delay
    setTimeout(() => {
      const filteredProducts = mockProducts.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()),
      )

      if (filteredProducts.length > 0) {
        setResultsFound(true)
        const productIds = filteredProducts.map((p) => p.id)

        // find stores that carry these products
        const relevantProductStores = mockProductStores.filter((ps) => productIds.includes(ps.productId) && ps.inStock)

        // filter stores that have these products
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

  // handle form submission for search
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/map?search=${encodeURIComponent(search)}`)
  }

  // find products available in a specific store
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

    // filter by search query if present
    if (search) {
      return storeProducts.filter((product) => product?.name?.toLowerCase().includes(search.toLowerCase()))
    }

    return storeProducts
  }

  // Update the navigation links to highlight the current tab
  const navLinkClass = "text-sm font-medium hover:text-primary";
  const currentNavLinkClass = "text-sm font-medium text-primary";

  // Add the handleProductClick function
  const handleProductClick = (store: Store) => {
    if (map.current) {
      map.current.flyTo({
        center: [store.lng, store.lat],
        zoom: 15,
        essential: true,
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">

      {/* header with logo and navigation links */}
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 py-4">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ShopFind</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className={router.pathname === "/" ? currentNavLinkClass : navLinkClass}>
              Home
            </Link>
            <Link href="/map" className={router.pathname === "/map" ? currentNavLinkClass : navLinkClass}>
              Find Products
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        
        {/* sidebar with search bar and results */}
        <div className="w-full md:w-1/3 p-3 pt-0 border-r h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="sticky top-0 bg-white z-10 p-4">
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
            <h2 className="text-lg font-semibold">
                {stores.length} {stores.length === 1 ? "Store" : "Stores"} Found
              </h2>
          </div>

          { /* handles loading the results and displaying them in cards, once again using the radix ui library ones */ }
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
                            <div 
                              key={product?.id} 
                              className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded"
                              onClick={() => handleProductClick(store)}
                            >
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

        {/* map container, which was defined above */}
        <div className="flex-1 h-[calc(100vh-4rem)]">
          <div ref={mapContainer} className="h-full w-full" />
        </div>
      </main>
    </div>
  )
}

// mock data for demonstration purposes
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
    description: "Fast-charging usb-c smartphone charger",
  },
  {
    id: 5,
    name: "Boba",
    category: "Food & Drink",
    price: 9.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "For the boba lovers",
  },
  {
    id: 6,
    name: "Protein Powder",
    category: "Health & Wellness",
    price: 29.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "we go jim",
  },
  {
    id: 7,
    name: "Apple Watch",
    category: "Electronics",
    price: 599.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Apple's overpriced watch",
  },
  {
    id: 8,
    name: "Water Bottle",
    category: "Food & Drink",
    price: 24.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Water bottle with a built-in filter",
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

